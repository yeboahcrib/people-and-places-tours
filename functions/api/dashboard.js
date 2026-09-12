import {COUNTRIES, countryName} from '../../src/data/countries.mjs';

/* Aggregated enquiry figures for the internal dashboard.
 *
 * Two rules shape this whole file.
 *
 * The browser never touches D1. Every figure is computed here and sent as
 * counts; the page receives no rows it did not need and no way to ask for
 * more. The binding exists only inside the Function, as it does for enquiries.
 *
 * And personal detail does not leave the server unless operations needs it.
 * Email, phone and the enquiry message are not selected by any query below —
 * not filtered out afterwards, not selected at all — so there is no path by
 * which they could reach the page. The recent list carries a name because
 * somebody has to be able to recognise the enquiry they are looking for.
 */

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};
const json = (status, body) => new Response(JSON.stringify(body), {status, headers});

/* ── Access ───────────────────────────────────────────────────────────────
   Cloudflare Access sits in front of the route and this verifies what it
   issued. Both halves are needed: Access alone can be bypassed by anything
   that reaches the Function by another path, and a header check alone trusts
   a header anyone can send.

   It fails closed. No configuration, no header, a signature that does not
   verify, an audience that is not ours, an expiry that has passed — every one
   of them is 401. A dashboard that opens to the public when misconfigured is
   worse than one that opens to nobody. */

const ACCESS_CERTS_TTL_MS = 60 * 60 * 1000;
let cachedCerts = null;

const base64UrlToBytes = value => {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/')
    .padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  return Uint8Array.from(atob(padded), character => character.charCodeAt(0));
};

async function accessKeys(teamDomain) {
  if (cachedCerts && cachedCerts.teamDomain === teamDomain && Date.now() < cachedCerts.expires) {
    return cachedCerts.keys;
  }
  const response = await fetch(`https://${teamDomain}/cdn-cgi/access/certs`, {
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`Access certs responded ${response.status}`);
  const {keys} = await response.json();
  cachedCerts = {teamDomain, keys, expires: Date.now() + ACCESS_CERTS_TTL_MS};
  return keys;
}

async function identityFromAccess(request, env) {
  const teamDomain = String(env.ACCESS_TEAM_DOMAIN || '').trim();
  const audience = String(env.ACCESS_AUD || '').trim();
  if (!teamDomain || !audience) return {ok: false, reason: 'not-configured'};

  const token = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!token) return {ok: false, reason: 'no-token'};

  const [headerPart, payloadPart, signaturePart] = token.split('.');
  if (!headerPart || !payloadPart || !signaturePart) return {ok: false, reason: 'malformed'};

  let header;
  let claims;
  try {
    header = JSON.parse(new TextDecoder().decode(base64UrlToBytes(headerPart)));
    claims = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payloadPart)));
  } catch { return {ok: false, reason: 'malformed'}; }

  // Only the algorithm Access actually signs with. Taking the algorithm from
  // the token itself is how "alg: none" gets accepted.
  if (header.alg !== 'RS256') return {ok: false, reason: 'unexpected-algorithm'};

  let keys;
  try { keys = await accessKeys(teamDomain); }
  catch { return {ok: false, reason: 'certs-unavailable'}; }

  const jwk = keys.find(key => key.kid === header.kid);
  if (!jwk) return {ok: false, reason: 'unknown-key'};

  const key = await crypto.subtle.importKey(
    'jwk', jwk, {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['verify'],
  );
  const signed = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
  const verified = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5', key, base64UrlToBytes(signaturePart), signed,
  );
  if (!verified) return {ok: false, reason: 'bad-signature'};

  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(audience)) return {ok: false, reason: 'wrong-audience'};
  if (claims.iss !== `https://${teamDomain}`) return {ok: false, reason: 'wrong-issuer'};

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== 'number' || claims.exp <= now) return {ok: false, reason: 'expired'};
  if (typeof claims.nbf === 'number' && claims.nbf > now + 60) return {ok: false, reason: 'not-yet-valid'};

  return {ok: true, email: claims.email || ''};
}

/* ── Country normalisation ────────────────────────────────────────────────
   Rows written before the selector hold whatever was typed; rows written
   since hold an ISO alpha-2 code. Both describe the same places, and a
   dashboard that showed "Ghana" and "GH" as two countries would be lying
   about its own data.

   They are reconciled when the figures are read and never in the table. The
   row is what somebody actually said, and rewriting history to tidy a chart
   is a bad trade. */

const NAME_TO_CODE = new Map(COUNTRIES.map(({code, name}) => [name.toLowerCase(), code]));

// How people write countries when nothing stops them. Every one of these was
// a plausible free-text answer to "country of residence".
const ALIASES = new Map(Object.entries({
  'usa': 'US', 'u.s.': 'US', 'u.s.a.': 'US', 'united states of america': 'US', 'america': 'US',
  'uk': 'GB', 'u.k.': 'GB', 'england': 'GB', 'scotland': 'GB', 'wales': 'GB',
  'britain': 'GB', 'great britain': 'GB', 'northern ireland': 'GB',
  'holland': 'NL', 'ivory coast': 'CI', 'cape verde islands': 'CV',
  'south korea': 'KR', 'north korea': 'KP', 'russia': 'RU', 'vietnam': 'VN',
  'uae': 'AE', 'emirates': 'AE', 'drc': 'CD', 'dr congo': 'CD',
  'czech republic': 'CZ', 'swaziland': 'SZ', 'burma': 'MM', 'macedonia': 'MK',
  'turkey': 'TR', 'cape verde': 'CV', 'east timor': 'TL',
}));

/**
 * One country value, as a code where that can be established honestly.
 *
 * Anything unrecognised keeps its own text and is reported as unresolved
 * rather than folded into a neighbour or dropped. A figure that quietly
 * discards what it could not classify is worse than one that admits to it.
 */
export function normaliseCountry(raw) {
  const value = String(raw || '').trim();
  if (!value) return {code: '', label: 'Not provided', resolved: false};

  const upper = value.toUpperCase();
  if (/^[A-Z]{2}$/.test(upper) && COUNTRIES.some(country => country.code === upper)) {
    return {code: upper, label: countryName(upper), resolved: true};
  }

  const key = value.toLowerCase().replace(/\s+/g, ' ');
  const code = NAME_TO_CODE.get(key) || ALIASES.get(key) || NAME_TO_CODE.get(key.replace(/^the /, ''));
  if (code) return {code, label: countryName(code), resolved: true};

  return {code: '', label: value, resolved: false};
}

/* ── Figures ──────────────────────────────────────────────────────────────
   Grouped in SQL, where the database is quick at it, then reconciled here,
   where the country mapping lives. The counts are small enough that the
   second pass costs nothing and reads far better than a CASE expression two
   hundred and fifty branches long. */

const RECENT_LIMIT = 25;

// Named one by one rather than with *, so adding a column to the table can
// never widen what this endpoint returns. Neither email nor phone is here.
const RECENT_COLUMNS = 'created_at, reference, first_name, last_name, country, '
  + 'tour_interest, tour_name, group_size, travel_date, contact_method, status';

const rowsOf = result => result?.results || [];

const tally = (entries) => {
  const totals = new Map();
  for (const {key, label, count} of entries) {
    const existing = totals.get(key);
    if (existing) existing.count += count;
    else totals.set(key, {key, label, count});
  }
  return [...totals.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
};

async function figures(db) {
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);

  const [totals, thisMonth, byCountry, byTour, byMonth, byGroupSize, recent] = await db.batch([
    db.prepare('SELECT COUNT(*) AS total FROM enquiries'),
    db.prepare('SELECT COUNT(*) AS total FROM enquiries WHERE created_at >= ?').bind(monthStart.toISOString()),
    db.prepare('SELECT country, COUNT(*) AS count FROM enquiries GROUP BY country'),
    db.prepare('SELECT tour_interest, tour_name, COUNT(*) AS count FROM enquiries GROUP BY tour_interest, tour_name'),
    db.prepare("SELECT substr(created_at, 1, 7) AS month, COUNT(*) AS count FROM enquiries GROUP BY month ORDER BY month"),
    db.prepare('SELECT group_size, COUNT(*) AS count FROM enquiries GROUP BY group_size'),
    db.prepare(`SELECT ${RECENT_COLUMNS} FROM enquiries ORDER BY created_at DESC LIMIT ${RECENT_LIMIT}`),
  ]);

  const countries = tally(rowsOf(byCountry).map(row => {
    const {code, label} = normaliseCountry(row.country);
    return {key: code || `raw:${label}`, label, count: Number(row.count)};
  }));

  const tours = tally(rowsOf(byTour).map(row => ({
    key: row.tour_interest || 'unspecified',
    // The name as it read on the day is stored beside the slug. Prefer it, so
    // a tour renamed since still reads as what the visitor chose.
    label: row.tour_name || row.tour_interest || 'Not specified',
    count: Number(row.count),
  })));

  const groupSizes = tally(rowsOf(byGroupSize).map(row => ({
    key: row.group_size || 'unspecified',
    label: row.group_size || 'Not specified',
    count: Number(row.count),
  })));

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      total: Number(rowsOf(totals)[0]?.total || 0),
      thisMonth: Number(rowsOf(thisMonth)[0]?.total || 0),
      topCountry: countries[0]?.label || null,
      topTour: tours[0]?.label || null,
    },
    countries,
    tours,
    groupSizes,
    // Left in chronological order: a timeline sorted by size is not a timeline.
    months: rowsOf(byMonth).map(row => ({month: row.month, count: Number(row.count)})),
    recent: rowsOf(recent).map(row => ({
      createdAt: row.created_at,
      reference: row.reference,
      name: [row.first_name, row.last_name].filter(Boolean).join(' '),
      country: normaliseCountry(row.country).label,
      tour: row.tour_name || row.tour_interest || '',
      groupSize: row.group_size || '',
      travelDate: row.travel_date || '',
      contactMethod: row.contact_method || '',
      status: row.status || '',
    })),
  };
}

export async function onRequest({request, env}) {
  if (request.method !== 'GET') return json(405, {error: 'Method not allowed.'});

  const identity = await identityFromAccess(request, env);
  if (!identity.ok) {
    // The reason is logged, never returned: a caller learns only that it was
    // refused, which is all it is entitled to know.
    console.warn('Dashboard request refused', {reason: identity.reason});
    return json(401, {error: 'This dashboard is private.'});
  }

  if (!env.DB || typeof env.DB.prepare !== 'function') {
    return json(503, {error: 'Enquiry storage is not configured for this deployment.'});
  }

  try {
    return json(200, await figures(env.DB));
  } catch (error) {
    console.error('Dashboard query failed', {message: error?.message});
    return json(500, {error: 'Figures could not be read.'});
  }
}
