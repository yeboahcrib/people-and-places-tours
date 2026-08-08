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

// With no Turnstile secret configured the honeypot is the only bot defence, so
// a filled trap is discarded — with no reference, so the response tells a bot
// nothing.
response = await invoke({
  'first-name': 'Bot',
  'last-name': 'Submission',
  email: 'bot@example.com',
  'company-website': 'https://spam.example',
});
assert.equal(response.status, 200);
assert.equal(JSON.parse(await response.clone().text()).reference, undefined,
  'a discarded submission must not return a reference');

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
const validChallenge = {success: true, action: 'inquiry', hostname: 'people-and-places.pages.dev'};

// Configured but no token supplied.
let restore = stubFetch(async () => new Response(JSON.stringify(validChallenge), {status: 200}));
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
  JSON.stringify(String(url) === siteverify ? validChallenge : {id: 'email_123'}),
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

// Turnstile must be consulted before the honeypot. Short-circuiting on the
// trap first saves a siteverify call on obvious bots, but browsers autofill
// hidden fields, so it also discards genuine enquiries with no error raised.
// Once Turnstile has confirmed a human, a filled trap indicates autofill.
let siteverifyCalls = 0;
restore = stubFetch(async url => {
  if (String(url) === siteverify) siteverifyCalls += 1;
  return new Response(JSON.stringify(validChallenge), {status: 200});
});
try {
  response = await invoke(
    {...guest, 'cf-turnstile-response': 'good-token', 'company-website': 'https://spam.example'},
    {},
    withTurnstile,
  );
} finally { restore(); }
assert.equal(response.status, 200);
assert.equal(siteverifyCalls, 1, 'Turnstile must be consulted before the honeypot is allowed to discard anything');
assert.match(JSON.parse(await response.clone().text()).reference, /^PP-/,
  'a verified human must be delivered even with the honeypot filled, and get a real reference');

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
    country: 'United States',
    'tour-interest': 'cape-coast',
    'travel-date': '2027-04-10',
    'departure-date': '2027-04-17',
    'date-flexibility': 'yes',
    'traveling-with-children': 'yes',
    'children-age-ranges': '4–7',
    accommodation: 'family',
    'contact-method': 'email',
    'tour-name': 'Forged tour <script>alert(1)</script>',
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
assert(!email.html.includes('Forged tour'), 'browser-supplied tour names must not be trusted');
assert(email.html.includes('Cape Coast Ancestral Tour'));
assert(email.html.includes('United States'));
assert(email.html.includes('2027-04-17'));
assert(email.html.includes('4–7'));
assert(email.text.includes('Accommodation: family'));

// A verified human whose browser autofilled the hidden trap must still be
// delivered. Running the honeypot unconditionally discards the message before
// Turnstile is consulted, and the visitor sees success either way.
{
  const realFetch = globalThis.fetch;
  let sent = null;
  globalThis.fetch = async (url, init) => {
    if (String(url).includes('siteverify')) return new Response(JSON.stringify(validChallenge), {status: 200});
    sent = {url, init};
    return new Response(JSON.stringify({id: 'email_456'}), {status: 200});
  };
  let autofilled;
  try {
    autofilled = await invoke({
      'first-name': 'Ada',
      'last-name': 'Guest',
      email: 'ada@example.com',
      'cf-turnstile-response': 'a-valid-token',
      'company-website': 'Ada Travel Ltd',
    }, {}, {
      TURNSTILE_SECRET_KEY: 'secret',
      RESEND_API_KEY: 'test-key',
      INQUIRY_TO_EMAIL: 'team@example.com',
      INQUIRY_FROM_EMAIL: 'website@example.com',
    });
  } finally {
    globalThis.fetch = realFetch;
  }
  assert.equal(autofilled.status, 200);
  assert(sent, 'an autofilled honeypot must not stop the email being sent once Turnstile has passed');
  assert.match(JSON.parse(await autofilled.clone().text()).reference, /^PP-/,
    'a delivered enquiry must return a real reference, not fall back to "sent"');
}

// The booking reference is read aloud over the phone, so its shape is part of
// the contract with guests: the prefix, the fixed length, and the absence of
// characters that are commonly misheard.
const {reference} = JSON.parse(await response.clone().text());
assert.match(reference, /^PP-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{6}$/,
  `booking reference should look like PP-K7M2QX, got ${reference}`);
assert(!/[0O1IL]/.test(reference.slice(3)),
  `booking reference must avoid look-alike characters, got ${reference}`);

// It must also be the string the guest sees in the email, or the reference they
// quote will not match anything the team can find.
assert(email.html.includes(reference), 'email should carry the guest-facing reference');
assert(email.text.includes(reference), 'plain-text email should carry the reference too');

// The idempotency key is deliberately not the guest reference: it guards
// against duplicate sends and must stay a full UUID.
assert.match(providerRequest.init.headers['Idempotency-Key'],
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
  'idempotency key must remain a UUID, separate from the short reference');

// An uncertain network response can prompt a manual retry. Reusing the
// browser-generated UUID lets Resend suppress a duplicate delivery.
const retryId = '123e4567-e89b-42d3-a456-426614174000';
globalThis.fetch = async (_url, init) => {
  providerRequest = {init};
  return new Response(JSON.stringify({id: 'email_retry'}), {status: 200});
};
try {
  response = await invoke({...guest, 'client-submission-id': retryId}, {}, delivery);
} finally {
  globalThis.fetch = originalFetch;
}
assert.equal(response.status, 200);
assert.equal(providerRequest.init.headers['Idempotency-Key'], retryId);
response = await invoke({...guest, 'client-submission-id': 'not-a-uuid'});
assert.equal(response.status, 400);

// Malformed JSON shapes and forged structured values must be rejected with a
// controlled client error rather than reaching the provider or throwing 500.
for (const malformed of [null, [], 'text', 42]) {
  response = await invoke(malformed);
  assert.equal(response.status, 400);
}
response = await invoke({...guest, unexpected: 'field'});
assert.equal(response.status, 400);
response = await invoke({...guest, 'group-size': '999'});
assert.equal(response.status, 400);
response = await invoke({...guest, 'tour-interest': 'forged-tour'});
assert.equal(response.status, 400);
response = await invoke({...guest, 'travel-date': '2026-02-31'});
assert.equal(response.status, 400);
response = await invoke({...guest, 'departure-date': 'not-a-date'});
assert.equal(response.status, 400);
response = await invoke({...guest, 'travel-date': '2027-05-02', 'departure-date': '2027-05-01'});
assert.equal(response.status, 400);
response = await invoke({...guest, 'date-flexibility': 'sometimes'});
assert.equal(response.status, 400);
response = await invoke({...guest, accommodation: 'penthouse'});
assert.equal(response.status, 400);
response = await invoke({...guest, 'traveling-with-children': 'no', 'children-age-ranges': '10'});
assert.equal(response.status, 400);
response = await invoke({...guest, 'contact-method': 'whatsapp'});
assert.equal(response.status, 400);
response = await invoke({...guest, message: 'x'.repeat(5001)});
assert.equal(response.status, 400);

// A token from a different widget action or hostname is not valid for this
// form even when Cloudflare reports the token itself as successful.
for (const challenge of [
  {...validChallenge, action: 'login'},
  {...validChallenge, hostname: 'untrusted.example'},
]) {
  restore = stubFetch(async () => new Response(JSON.stringify(challenge), {status: 200}));
  try {
    response = await invoke({...guest, 'cf-turnstile-response': 'wrong-context'}, {}, withTurnstile);
  } finally { restore(); }
  assert.equal(response.status, 403);
}

// Provider network failures are mapped to a stable, non-disclosing response.
restore = stubFetch(async url => {
  if (String(url) === siteverify) return new Response(JSON.stringify(validChallenge), {status: 200});
  throw new Error('provider unavailable');
});
try {
  response = await invoke({...guest, 'cf-turnstile-response': 'good-token'}, {}, withTurnstile);
} finally { restore(); }
assert.equal(response.status, 502);
assert.deepEqual(await response.json(), {error: 'Inquiry delivery could not be confirmed.'});

console.log('Inquiry function tests passed.');
