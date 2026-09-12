import assert from 'node:assert/strict';

const {onRequest, normaliseCountry} = await import('../functions/api/dashboard.js');

const url = 'https://peopleplacesgh.com/api/dashboard';

/* ── A real Access token, really signed ───────────────────────────────────
   The signature check is the whole door. Stubbing it out would leave a test
   that passes whether or not the lock works, so a key pair is generated here,
   its public half is served as Access would serve it, and the tokens below are
   genuinely signed — or genuinely not. */

const keyPair = await crypto.subtle.generateKey(
  {name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256'},
  true, ['sign', 'verify'],
);
const publicJwk = {...await crypto.subtle.exportKey('jwk', keyPair.publicKey), kid: 'test-key'};

const TEAM = 'people-and-places.cloudflareaccess.com';
const AUD = 'test-audience-tag';
const env = {ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD};

const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const encode = value => b64url(new TextEncoder().encode(JSON.stringify(value)));

async function token(claims = {}, {alg = 'RS256', sign = true, kid = 'test-key'} = {}) {
  const now = Math.floor(Date.now() / 1000);
  const head = encode({alg, kid, typ: 'JWT'});
  const body = encode({
    aud: [AUD], iss: `https://${TEAM}`, email: 'owner@example.com',
    iat: now, exp: now + 600, ...claims,
  });
  if (!sign) return `${head}.${body}.${b64url(new Uint8Array(256))}`;
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', keyPair.privateKey, new TextEncoder().encode(`${head}.${body}`),
  );
  return `${head}.${body}.${b64url(signature)}`;
}

const request = (jwt, method = 'GET') => new Request(url, {
  method,
  headers: jwt ? {'Cf-Access-Jwt-Assertion': jwt} : {},
});

/* ── A database that answers the seven statements the Function issues ───── */

const COUNTRY_ROWS = [
  {country: 'GH', count: 3},          // written since the selector shipped
  {country: 'Ghana', count: 2},       // typed, before it
  {country: 'US', count: 4},
  {country: 'United States', count: 1},
  {country: 'USA', count: 1},         // and the shape people actually type
  {country: 'Wakanda', count: 1},     // not a country, and not silently dropped
  {country: '', count: 1},
];
const TOUR_ROWS = [
  {tour_interest: 'cape-coast', tour_name: 'Cape Coast Ancestral Tour', count: 5},
  {tour_interest: 'just-go-ghana', tour_name: 'Just Go Ghana', count: 7},
  {tour_interest: '', tour_name: '', count: 1},
];
const MONTH_ROWS = [{month: '2026-07', count: 2}, {month: '2026-08', count: 5}, {month: '2026-09', count: 6}];
const SIZE_ROWS = [{group_size: '1-2', count: 4}, {group_size: '3-5', count: 6}, {group_size: '', count: 3}];
const RECENT_ROWS = [{
  created_at: '2026-09-11T20:42:40.770Z', reference: 'PP-3ED8JU',
  first_name: 'Albert', last_name: 'Mensah', country: 'GH',
  tour_interest: 'accra-city', tour_name: 'Accra After Dark Food Tour',
  group_size: '3-5', travel_date: '2027-02-01', contact_method: 'whatsapp', status: 'new',
  // Present in the table, and deliberately never selected by the Function.
}];

const stubDb = () => {
  const statements = [];
  return {
    statements,
    prepare(sql) {
      const statement = {sql, args: null, bind(...args) { statement.args = args; return statement; }};
      statements.push(statement);
      return statement;
    },
    async batch(prepared) {
      return prepared.map(({sql}) => {
        if (/COUNT\(\*\) AS total FROM enquiries WHERE/.test(sql)) return {results: [{total: 6}]};
        if (/COUNT\(\*\) AS total FROM enquiries/.test(sql)) return {results: [{total: 13}]};
        if (/GROUP BY country/.test(sql)) return {results: COUNTRY_ROWS};
        if (/GROUP BY tour_interest/.test(sql)) return {results: TOUR_ROWS};
        if (/GROUP BY month/.test(sql)) return {results: MONTH_ROWS};
        if (/GROUP BY group_size/.test(sql)) return {results: SIZE_ROWS};
        if (/ORDER BY created_at DESC/.test(sql)) return {results: RECENT_ROWS};
        throw new Error(`unexpected statement: ${sql}`);
      });
    },
  };
};

const authorised = () => ({...env, DB: stubDb()});

/* ── The door ─────────────────────────────────────────────────────────── */

let response = await onRequest({request: request(await token(), 'POST'), env: authorised()});
assert.equal(response.status, 405, 'only GET reads figures');

// Every way in that is not a valid token issued to us.
const refusals = [
  ['no configuration', await token(), {DB: stubDb()}],
  ['no token at all', null, authorised()],
  ['a malformed token', 'not-a-jwt', authorised()],
  ['an unsigned token', await token({}, {sign: false}), authorised()],
  ['alg: none', await token({}, {alg: 'none', sign: false}), authorised()],
  ['an unknown signing key', await token({}, {kid: 'some-other-key'}), authorised()],
  ['a token for another audience', await token({aud: ['someone-elses-tag']}), authorised()],
  ['a token from another issuer', await token({iss: 'https://attacker.cloudflareaccess.com'}), authorised()],
  ['an expired token', await token({exp: Math.floor(Date.now() / 1000) - 60}), authorised()],
];

const realFetch = globalThis.fetch;
globalThis.fetch = async resource => {
  assert.match(String(resource), new RegExp(`^https://${TEAM}/cdn-cgi/access/certs$`),
    'the only outbound request may be for Access public keys');
  return new Response(JSON.stringify({keys: [publicJwk]}), {status: 200});
};

try {
  for (const [label, jwt, environment] of refusals) {
    response = await onRequest({request: request(jwt), env: environment});
    assert.equal(response.status, 401, `${label} must be refused`);
    const body = await response.json();
    assert.equal(body.error, 'This dashboard is private.');
    // A refusal that explains itself teaches somebody how to get in.
    assert.equal(Object.keys(body).length, 1, 'a refusal must not say why');
  }

  // No database bound is a deployment fault, not an authorisation one, and it
  // is only ever reported to somebody already through the door.
  response = await onRequest({request: request(await token()), env: {...env}});
  assert.equal(response.status, 503);

  /* ── The figures ──────────────────────────────────────────────────────── */

  const db = stubDb();
  response = await onRequest({request: request(await token()), env: {...env, DB: db}});
  assert.equal(response.status, 200);
  const data = await response.json();

  /* The guarantee is that personal detail is never *selected*, not that it is
     filtered out afterwards — so it is the statements that have to be checked.
     Shaping the response by hand would pass this even if the query dragged
     every column back into the Worker. */
  const issued = db.statements.map(statement => statement.sql).join('\n');
  assert(!/\bSELECT\s+\*/i.test(issued), 'no statement may select every column');
  for (const column of ['email', 'phone', 'message']) {
    assert(!new RegExp(`\\b${column}\\b`).test(issued),
      `no statement may name the ${column} column`);
  }
  assert.match(issued, /LIMIT 25/, 'the recent list is bounded');

  assert.equal(data.summary.total, 13);
  assert.equal(data.summary.thisMonth, 6);

  // The whole point of normalising: five ways of writing two countries.
  const ghana = data.countries.find(entry => entry.label === 'Ghana');
  const usa = data.countries.find(entry => entry.label === 'United States');
  assert.equal(ghana.count, 5, '"GH" and "Ghana" are one country');
  assert.equal(usa.count, 6, '"US", "United States" and "USA" are one country');
  assert.equal(data.summary.topCountry, 'United States');

  // What could not be resolved keeps its own name and is still counted.
  assert.equal(data.countries.find(entry => entry.label === 'Wakanda')?.count, 1,
    'an unrecognised country must be shown, not folded into another or dropped');
  assert.equal(data.countries.find(entry => entry.label === 'Not provided')?.count, 1);

  // Nothing is lost in the merge.
  assert.equal(data.countries.reduce((sum, entry) => sum + entry.count, 0),
    COUNTRY_ROWS.reduce((sum, row) => sum + row.count, 0),
    'normalising must not change how many enquiries there are');

  assert.equal(data.summary.topTour, 'Just Go Ghana');
  assert.deepEqual(data.months.map(entry => entry.month), ['2026-07', '2026-08', '2026-09'],
    'a timeline stays in time order');

  assert.equal(data.groupSizes.find(entry => entry.label === '3-5').count, 6);
  assert.equal(data.groupSizes.find(entry => entry.label === 'Not specified').count, 3);

  /* ── What must never leave the server ─────────────────────────────────── */

  const serialised = JSON.stringify(data);
  for (const forbidden of ['email', 'phone', 'message', '@', '+233']) {
    assert(!serialised.includes(forbidden),
      `the dashboard payload must not carry ${forbidden}`);
  }
  assert.deepEqual(Object.keys(data.recent[0]).sort(), [
    'contactMethod', 'country', 'createdAt', 'groupSize', 'name',
    'reference', 'status', 'tour', 'travelDate',
  ], 'the recent list carries only what operations needs');
  assert.equal(data.recent[0].country, 'Ghana', 'a stored code is read back as a country');
} finally {
  globalThis.fetch = realFetch;
}

/* ── Normalisation, directly ──────────────────────────────────────────── */

assert.deepEqual(normaliseCountry('GH'), {code: 'GH', label: 'Ghana', resolved: true});
assert.deepEqual(normaliseCountry('Ghana'), {code: 'GH', label: 'Ghana', resolved: true});
assert.deepEqual(normaliseCountry('  ghana '), {code: 'GH', label: 'Ghana', resolved: true});
assert.deepEqual(normaliseCountry('USA'), {code: 'US', label: 'United States', resolved: true});
assert.deepEqual(normaliseCountry('U.K.'), {code: 'GB', label: 'United Kingdom', resolved: true});
assert.deepEqual(normaliseCountry('the netherlands'), {code: 'NL', label: 'Netherlands', resolved: true});
assert.equal(normaliseCountry('Nowhere').resolved, false);
assert.equal(normaliseCountry('').label, 'Not provided');

console.log('Dashboard function tests passed.');
