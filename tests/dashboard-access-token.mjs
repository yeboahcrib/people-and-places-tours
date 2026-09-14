// A real Cloudflare Access token, really signed, for the dashboard suites.
//
// The signature check is the whole door. Stubbing it out would leave tests that
// pass whether or not the lock works, so a key pair is generated here, its
// public half is served as Access would serve it, and tokens are genuinely
// signed — or genuinely not.

export async function accessFixture() {
  const keyPair = await crypto.subtle.generateKey(
    {name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256'},
    true, ['sign', 'verify'],
  );
  const publicJwk = {...await crypto.subtle.exportKey('jwk', keyPair.publicKey), kid: 'test-key'};
  const TEAM = 'people-and-places.cloudflareaccess.com';
  const AUD = 'test-audience-tag';

  const b64url = bytes => btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const encode = value => b64url(new TextEncoder().encode(JSON.stringify(value)));

  async function token(claims = {}, {alg = 'RS256', sign = true, kid = 'test-key'} = {}) {
    const now = Math.floor(Date.now() / 1000);
    const head = encode({alg, kid, typ: 'JWT'});
    const body = encode({aud: [AUD], iss: `https://${TEAM}`, email: 'owner@example.com', iat: now, exp: now + 600, ...claims});
    if (!sign) return `${head}.${body}.${b64url(new Uint8Array(256))}`;
    const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keyPair.privateKey, new TextEncoder().encode(`${head}.${body}`));
    return `${head}.${body}.${b64url(signature)}`;
  }

  // Serves the public key as Access would, and fails the suite if the
  // Function ever reaches for anything else on the network.
  function installCerts() {
    const realFetch = globalThis.fetch;
    globalThis.fetch = async resource => {
      if (String(resource) !== `https://${TEAM}/cdn-cgi/access/certs`) {
        throw new Error(`unexpected outbound request: ${resource}`);
      }
      return new Response(JSON.stringify({keys: [publicJwk]}), {status: 200});
    };
    return () => { globalThis.fetch = realFetch; };
  }

  // Every way in that is not a valid token issued to us.
  async function refusals() {
    const now = Math.floor(Date.now() / 1000);
    return [
      ['no configuration', await token(), {}],
      ['no token at all', null, null],
      ['a malformed token', 'not-a-jwt', null],
      ['an unsigned token', await token({}, {sign: false}), null],
      ['alg: none', await token({}, {alg: 'none', sign: false}), null],
      ['an unknown signing key', await token({}, {kid: 'some-other-key'}), null],
      ['a token for another audience', await token({aud: ['someone-elses-tag']}), null],
      ['a token from another issuer', await token({iss: 'https://attacker.cloudflareaccess.com'}), null],
      ['an expired token', await token({exp: now - 60}), null],
    ];
  }

  return {env: {ACCESS_TEAM_DOMAIN: TEAM, ACCESS_AUD: AUD}, token, installCerts, refusals};
}

/* A D1 stand-in that answers like the real thing: it reads the column list out
   of each SELECT and returns only those columns, so a test of what the
   Function exposes is a test of what it asked for. */
export function projectingDb(rows) {
  const statements = [];
  const project = (row, columns) => Object.fromEntries(columns.map(column => [column, row[column] ?? '']));
  return {
    statements,
    prepare(sql) {
      const statement = {
        sql, args: [],
        bind(...args) { statement.args = args; return statement; },
        async all() {
          const columns = sql.match(/^SELECT\s+(.+?)\s+FROM/is)[1].split(',').map(name => name.trim());
          let selected = rows;
          if (/WHERE reference IN/.test(sql)) selected = rows.filter(row => statement.args.includes(row.reference));
          else if (/WHERE reference = \?/.test(sql)) selected = rows.filter(row => row.reference === statement.args[0]);
          selected = [...selected].sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
          const limit = sql.match(/LIMIT (\d+)/);
          if (limit) selected = selected.slice(0, Number(limit[1]));
          return {results: selected.map(row => project(row, columns))};
        },
      };
      statements.push(statement);
      return statement;
    },
  };
}
