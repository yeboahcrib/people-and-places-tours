import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = await readFile(new URL('../functions/api/health.js', import.meta.url), 'utf8');
const {onRequest} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const url = 'https://people-and-places.pages.dev/api/health';

let response = await onRequest({request: new Request(url), env: {}});
assert.equal(response.status, 503);
assert.equal((await response.json()).status, 'degraded');

const configuredEnv = {
  RESEND_API_KEY: 'test-key',
  INQUIRY_TO_EMAIL: 'team@example.com',
  INQUIRY_FROM_EMAIL: 'website@example.com',
  CF_PAGES_COMMIT_SHA: 'abc123',
};

response = await onRequest({request: new Request(url), env: configuredEnv});
assert.equal(response.status, 200);
const body = await response.json();
assert.equal(body.status, 'ok');
assert.equal(body.revision, 'abc123');
assert.equal(body.checks.deliveryConfigured, true);

response = await onRequest({request: new Request(url, {method: 'POST'}), env: configuredEnv});
assert.equal(response.status, 405);

/* ── Storage readiness ─────────────────────────────────────────────────────
   A binding proves a database is attached, not that it can take an enquiry.
   These two answers are reported separately, and neither may change `ready`:
   an enquiry that cannot be stored still reaches the team by email. */

// Reads the schema catalogue and nothing else. If this double is ever asked
// for a row, the test fails rather than quietly passing.
const schemaDb = columns => ({
  queries: [],
  prepare(sql) {
    this.queries.push(sql);
    return {
      async all() {
        if (!/pragma_table_info/.test(sql)) throw new Error(`unexpected query: ${sql}`);
        return {results: columns.map(name => ({name}))};
      },
    };
  },
});

// The column list health checks against must match the one enquiries are
// written into. Drift between the two files is the whole risk here.
const inquirySource = await readFile(new URL('../functions/api/inquiry.js', import.meta.url), 'utf8');
const listOf = (text, name) => text
  .match(new RegExp(`const ${name} = \\[(.*?)\\];`, 's'))[1]
  .split(',').map(part => part.trim().replace(/^'|'$/g, '')).filter(Boolean);
const healthColumns = listOf(source, 'ENQUIRY_COLUMNS');
const inquiryColumns = listOf(inquirySource, 'ENQUIRY_COLUMNS');
assert.deepEqual(healthColumns, inquiryColumns,
  'health checks a different set of columns than enquiries are written into');

// No binding at all.
response = await onRequest({request: new Request(url), env: configuredEnv});
let checks = (await response.json()).checks;
assert.equal(response.status, 200, 'a missing database must not take health to 503');
assert.equal(checks.enquiryStorageConfigured, false);
assert.equal(checks.enquiryStorageReady, false);
assert.equal(checks.enquiryStorageReason, 'not-configured');

// Bound and fully migrated.
const goodDb = schemaDb(inquiryColumns);
response = await onRequest({request: new Request(url), env: {...configuredEnv, DB: goodDb}});
checks = (await response.json()).checks;
assert.equal(response.status, 200);
assert.equal(checks.enquiryStorageConfigured, true);
assert.equal(checks.enquiryStorageReady, true);
assert.equal(checks.enquiryStorageReason, undefined, 'a healthy database needs no explanation');
assert(goodDb.queries.every(sql => /pragma_table_info/.test(sql)),
  'the readiness check must read the schema catalogue, never an enquiry');

// Bound, but the migration never ran. This is the gap the check exists for:
// the binding looks fine and nothing is being stored.
response = await onRequest({request: new Request(url), env: {...configuredEnv, DB: schemaDb([])}});
checks = (await response.json()).checks;
assert.equal(response.status, 200, 'an unmigrated database must not take health to 503');
assert.equal(checks.enquiryStorageConfigured, true, 'the binding really is present');
assert.equal(checks.enquiryStorageReady, false, 'but nothing could be stored in it');
assert.equal(checks.enquiryStorageReason, 'table-missing');

// Bound, table present, but incomplete — a partial paste into the console.
response = await onRequest({
  request: new Request(url),
  env: {...configuredEnv, DB: schemaDb(inquiryColumns.filter(c => c !== 'country' && c !== 'message'))},
});
checks = (await response.json()).checks;
assert.equal(checks.enquiryStorageReady, false);
assert.equal(checks.enquiryStorageReason, 'columns-missing');
assert.deepEqual(checks.enquiryStorageMissingColumns, ['country', 'message'],
  'a partial table must name what is missing, not just fail');

// A database that errors must not take the endpoint down with it.
response = await onRequest({
  request: new Request(url),
  env: {...configuredEnv, DB: {prepare() { throw new Error('d1 unavailable'); }}},
});
checks = (await response.json()).checks;
assert.equal(response.status, 200);
assert.equal(checks.enquiryStorageReady, false);
assert.equal(checks.enquiryStorageReason, 'check-failed');

console.log('Inquiry health function tests passed.');
