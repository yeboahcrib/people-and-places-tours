/* Cloudflare Access, verified by the Functions that serve the dashboard.
 *
 * Access sits in front of the route and this verifies what it issued. Both
 * halves are needed: Access alone can be bypassed by anything that reaches the
 * Function by another path, and a header check alone trusts a header anyone
 * can send.
 *
 * It fails closed. No configuration, no header, a signature that does not
 * verify, an audience that is not ours, an expiry that has passed — every one
 * of them is a refusal. A dashboard that opens to the public when
 * misconfigured is worse than one that opens to nobody.
 *
 * Shared by /api/dashboard and /api/dashboard/enquiry so there is one door,
 * not two that could drift apart.
 */

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

export async function identityFromAccess(request, env) {
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

  let verified = false;
  try {
    const key = await crypto.subtle.importKey(
      'jwk', jwk, {name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256'}, false, ['verify'],
    );
    const signed = new TextEncoder().encode(`${headerPart}.${payloadPart}`);
    verified = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', key, base64UrlToBytes(signaturePart), signed,
    );
  } catch { return {ok: false, reason: 'bad-signature'}; }
  if (!verified) return {ok: false, reason: 'bad-signature'};

  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(audience)) return {ok: false, reason: 'wrong-audience'};
  if (claims.iss !== `https://${teamDomain}`) return {ok: false, reason: 'wrong-issuer'};

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== 'number' || claims.exp <= now) return {ok: false, reason: 'expired'};
  if (typeof claims.nbf === 'number' && claims.nbf > now + 60) return {ok: false, reason: 'not-yet-valid'};

  return {ok: true, email: claims.email || ''};
}

export const privateHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
  'X-Robots-Tag': 'noindex, nofollow',
};

export const json = (status, body) => new Response(JSON.stringify(body), {status, headers: privateHeaders});

// One refusal for every reason. The reason is logged, never returned: a caller
// learns only that it was refused, which is all it is entitled to know.
export function refuse(identity, route) {
  console.warn('Dashboard request refused', {route, reason: identity.reason});
  return json(401, {error: 'This dashboard is private.'});
}
