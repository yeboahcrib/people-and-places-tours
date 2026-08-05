import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const functionSource = await readFile(new URL('../functions/api/inquiry.js', import.meta.url), 'utf8');
const functionModule = await import(`data:text/javascript;base64,${Buffer.from(functionSource).toString('base64')}`);
const {onRequest} = functionModule;

const endpoint = 'https://people-and-places.pages.dev/api/inquiry';

const request = (body, options = {}) => new Request(endpoint, {
  method: options.method || 'POST',
  headers: {
    'Content-Type': options.contentType || 'application/json',
    Origin: options.origin || 'https://people-and-places.pages.dev',
  },
  body: options.method === 'GET' ? undefined : JSON.stringify(body),
});

const invoke = (body, options = {}, env = {}) => onRequest({
  request: request(body, options),
  env,
});

let response = await invoke({}, {method: 'GET'});
assert.equal(response.status, 405);

response = await invoke({'first-name': 'Ada', 'last-name': 'Guest', email: 'not-an-email'});
assert.equal(response.status, 400);

response = await invoke({
  'first-name': 'Bot',
  'last-name': 'Submission',
  email: 'bot@example.com',
  'company-website': 'https://spam.example',
});
assert.equal(response.status, 200);

response = await invoke({'first-name': 'Ada', 'last-name': 'Guest', email: 'ada@example.com'});
assert.equal(response.status, 503);

response = await invoke(
  {'first-name': 'Ada', 'last-name': 'Guest', email: 'ada@example.com'},
  {origin: 'https://untrusted.example'},
  {ALLOWED_ORIGINS: 'https://approved.example'},
);
assert.equal(response.status, 403);

const originalFetch = globalThis.fetch;
let providerRequest;
globalThis.fetch = async (url, init) => {
  providerRequest = {url, init};
  return new Response(JSON.stringify({id: 'email_123'}), {status: 200});
};

try {
  response = await invoke({
    'first-name': 'Ada',
    'last-name': 'Guest',
    email: 'ada@example.com',
    'tour-name': 'Cape Coast <script>alert(1)</script>',
    message: '<img src=x onerror=alert(1)>',
  }, {}, {
    RESEND_API_KEY: 'test-key',
    INQUIRY_TO_EMAIL: 'team@example.com',
    INQUIRY_FROM_EMAIL: 'website@example.com',
  });
} finally {
  globalThis.fetch = originalFetch;
}

assert.equal(response.status, 200);
assert.equal(providerRequest.url, 'https://api.resend.com/emails');
const email = JSON.parse(providerRequest.init.body);
assert.equal(email.reply_to, 'ada@example.com');
assert(!email.html.includes('<script>'));
assert(!email.html.includes('<img src=x'));
assert(email.html.includes('&lt;script&gt;'));

console.log('Inquiry function tests passed.');
