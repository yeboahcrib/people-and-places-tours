import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const functionSource = await readFile(new URL('../functions/api/inquiry.js', import.meta.url), 'utf8');
const functionModule = await import(`data:text/javascript;base64,${Buffer.from(functionSource).toString('base64')}`);
const {onRequest} = functionModule;

const endpoint = 'https://people-and-places.pages.dev/api/inquiry';

const request = (body, options = {}) => {
  const headers = {'Content-Type': options.contentType || 'application/json'};
  // `originless: true` models a non-browser client; anything else keeps the
  // header a real browser would always send on a POST.
  if (!options.originless) headers.Origin = options.origin || 'https://people-and-places.pages.dev';
  return new Request(endpoint, {
    method: options.method || 'POST',
    headers,
    body: options.method === 'GET' ? undefined : JSON.stringify(body),
  });
};

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

// Origin hardening: a client that sends no Origin at all is refused rather
// than exempted from the allow-list.
response = await invoke(
  {'first-name': 'Ada', 'last-name': 'Guest', email: 'ada@example.com'},
  {originless: true},
  {ALLOWED_ORIGINS: 'https://approved.example'},
);
assert.equal(response.status, 403);

// ── Turnstile ──
const delivery = {
  RESEND_API_KEY: 'test-key',
  INQUIRY_TO_EMAIL: 'team@example.com',
  INQUIRY_FROM_EMAIL: 'website@example.com',
};
const guest = {'first-name': 'Ada', 'last-name': 'Guest', email: 'ada@example.com'};
const withTurnstile = {...delivery, TURNSTILE_SECRET_KEY: 'secret-key'};

const stubFetch = handler => {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  return () => { globalThis.fetch = original; };
};
const siteverify = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

// Configured but no token supplied.
let restore = stubFetch(async () => new Response(JSON.stringify({success: true}), {status: 200}));
try {
  response = await invoke(guest, {}, withTurnstile);
} finally { restore(); }
assert.equal(response.status, 403);

// Configured, token rejected by Cloudflare.
let verifiedToken;
let sentEmail = false;
restore = stubFetch(async (url, init) => {
  if (String(url) === siteverify) {
    verifiedToken = init.body.get('response');
    return new Response(JSON.stringify({success: false, 'error-codes': ['invalid-input-response']}), {status: 200});
  }
  sentEmail = true;
  return new Response(JSON.stringify({id: 'email_123'}), {status: 200});
});
try {
  response = await invoke({...guest, 'cf-turnstile-response': 'bad-token'}, {}, withTurnstile);
} finally { restore(); }
assert.equal(response.status, 403);
assert.equal(verifiedToken, 'bad-token');
assert(!sentEmail, 'a rejected challenge must not send an email');

// Configured, token accepted.
restore = stubFetch(async url => new Response(
  JSON.stringify(String(url) === siteverify ? {success: true} : {id: 'email_123'}),
  {status: 200},
));
try {
  response = await invoke({...guest, 'cf-turnstile-response': 'good-token'}, {}, withTurnstile);
} finally { restore(); }
assert.equal(response.status, 200);

// A verification outage must fail closed, not wave traffic through.
restore = stubFetch(async url => {
  if (String(url) === siteverify) throw new Error('network down');
  return new Response(JSON.stringify({id: 'email_123'}), {status: 200});
});
try {
  response = await invoke({...guest, 'cf-turnstile-response': 'good-token'}, {}, withTurnstile);
} finally { restore(); }
assert.equal(response.status, 403);

// The honeypot short-circuits before verification, so bots cost us no
// siteverify calls at all.
let siteverifyCalls = 0;
restore = stubFetch(async url => {
  if (String(url) === siteverify) siteverifyCalls += 1;
  return new Response(JSON.stringify({success: true}), {status: 200});
});
try {
  response = await invoke({...guest, 'company-website': 'https://spam.example'}, {}, withTurnstile);
} finally { restore(); }
assert.equal(response.status, 200);
assert.equal(siteverifyCalls, 0);

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

// The booking reference is read aloud down a phone line, so its shape is a
// promise to guests rather than an implementation detail. Guard all three
// properties: the brand prefix, the fixed length, and — the one most likely to
// be undone by someone "simplifying" the alphabet later — the absence of the
// character pairs people mishear.
const {reference} = JSON.parse(await response.clone().text());
assert.match(reference, /^PP-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/,
  `booking reference should look like PP-K7M2QX, got ${reference}`);
assert(!/[0O1IL]/.test(reference.slice(3)),
  `booking reference must avoid look-alike characters, got ${reference}`);

// It must also be the string the guest sees in the email, or the reference they
// quote will not match anything the team can find.
assert(email.html.includes(reference), 'email should carry the guest-facing reference');
assert(email.text.includes(reference), 'plain-text email should carry the reference too');

// The idempotency key is deliberately NOT the guest reference: it guards
// against a duplicate send, so it must stay a full UUID even though the
// reference beside it is short.
assert.match(providerRequest.init.headers['Idempotency-Key'],
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  'idempotency key must remain a UUID, separate from the short reference');

console.log('Inquiry function tests passed.');
