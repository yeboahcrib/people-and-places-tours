import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const source = await readFile(new URL('../functions/api/health.js', import.meta.url), 'utf8');
const {onRequest} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const url = 'https://people-and-places.pages.dev/api/health';

let response = onRequest({request: new Request(url), env: {}});
assert.equal(response.status, 503);
assert.equal((await response.json()).status, 'degraded');

const configuredEnv = {
  RESEND_API_KEY: 'test-key',
  INQUIRY_TO_EMAIL: 'team@example.com',
  INQUIRY_FROM_EMAIL: 'website@example.com',
  CF_PAGES_COMMIT_SHA: 'abc123',
};

response = onRequest({request: new Request(url), env: configuredEnv});
assert.equal(response.status, 200);
const body = await response.json();
assert.equal(body.status, 'ok');
assert.equal(body.revision, 'abc123');
assert.equal(body.checks.deliveryConfigured, true);

response = onRequest({request: new Request(url, {method: 'POST'}), env: configuredEnv});
assert.equal(response.status, 405);

console.log('Inquiry health function tests passed.');
