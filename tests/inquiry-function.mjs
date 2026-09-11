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
  'booking-checksum': 'https://spam.example',
});
assert.equal(response.status, 200);
assert.equal(JSON.parse(await response.clone().text()).reference, undefined,
  'a discarded submission must not return a reference');

response = await invoke({'first-name': 'Ada', 'last-name': 'Guest', email: 'ada@example.com', country: 'United States'});
assert.equal(response.status, 503);

// Country is required by the validator, not only by the browser. A client that
// posts straight to this endpoint cannot create an enquiry without one.
response = await invoke(
  {'first-name': 'Ada', 'last-name': 'Guest', email: 'ada@example.com'},
  {}, {RESEND_API_KEY: 'k', INQUIRY_TO_EMAIL: 'to@example.com', INQUIRY_FROM_EMAIL: 'from@example.com'},
);
assert.equal(response.status, 400);
assert.equal((await response.json()).error, 'Please provide your country of residence.');

// Whitespace is not a country. clean() trims before the check, so this is
// refused rather than stored as a blank string.
response = await invoke(
  {'first-name': 'Ada', 'last-name': 'Guest', email: 'ada@example.com', country: '   '},
  {}, {RESEND_API_KEY: 'k', INQUIRY_TO_EMAIL: 'to@example.com', INQUIRY_FROM_EMAIL: 'from@example.com'},
);
assert.equal(response.status, 400);
assert.equal((await response.json()).error, 'Please provide your country of residence.');

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
// Country is required server-side as well as in the markup, so the baseline
// enquiry every later case builds on has to carry one.
const guest = {'first-name': 'Ada', 'last-name': 'Guest', email: 'ada@example.com', country: 'United States'};
const withTurnstile = {...delivery, TURNSTILE_SECRET_KEY: 'secret-key'};

const stubFetch = handler => {
  const original = globalThis.fetch;
  globalThis.fetch = handler;
  return () => { globalThis.fetch = original; };
};
const siteverify = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const validChallenge = {success: true, action: 'inquiry', hostname: 'people-and-places.pages.dev'};

// Configured, but no token supplied at all.
//
// This is a real person behind a content blocker, not an attacker: the widget
// never reached challenges.cloudflare.com, so it never minted anything to
// send. Refusing here refuses the visitor for their browser's choices. The
// enquiry is delivered and marked instead.
let sentUnverified;
let restore = stubFetch(async (url, init) => {
  if (String(url) === siteverify) return new Response(JSON.stringify(validChallenge), {status: 200});
  sentUnverified = JSON.parse(init.body);
  return new Response(JSON.stringify({id: 'email_123'}), {status: 200});
});
try {
  response = await invoke(guest, {}, withTurnstile);
} finally { restore(); }
assert.equal(response.status, 200, 'a blocked challenge must not cost the visitor their enquiry');
assert(sentUnverified, 'an unverified enquiry must still be delivered');
assert.match(sentUnverified.text, /Source: Website inquiry \(unverified\)/,
  'the email must say the visitor could not be verified');
assert.match(JSON.parse(await response.clone().text()).reference, /^PP-/);

// The honeypot is what guards that downgraded path, so it has to actually bite
// there. A filled trap with no token is discarded, and the response tells a bot
// nothing it could learn from.
let sentTrap = false;
restore = stubFetch(async url => {
  if (String(url) !== siteverify) sentTrap = true;
  return new Response(JSON.stringify(validChallenge), {status: 200});
});
try {
  response = await invoke({...guest, 'booking-checksum': 'https://spam.example'}, {}, withTurnstile);
} finally { restore(); }
assert.equal(response.status, 200);
assert(!sentTrap, 'a filled trap on the unverified path must not send an email');
assert.equal(JSON.parse(await response.clone().text()).reference, undefined,
  'a discarded submission must not return a reference');

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

// Configured, token accepted. The marking must stay off a verified enquiry —
// a flag that appears on everything says nothing about anything.
let sentVerified;
restore = stubFetch(async (url, init) => {
  if (String(url) === siteverify) return new Response(JSON.stringify(validChallenge), {status: 200});
  sentVerified = JSON.parse(init.body);
  return new Response(JSON.stringify({id: 'email_123'}), {status: 200});
});
try {
  response = await invoke({...guest, 'cf-turnstile-response': 'good-token'}, {}, withTurnstile);
} finally { restore(); }
assert.equal(response.status, 200);
assert.match(sentVerified.text, /Source: Website inquiry$/m);
assert.doesNotMatch(sentVerified.text, /unverified/,
  'a verified enquiry must not be marked as anything else');

// A verification outage is our fault, not the visitor's, and no client can
// provoke it — so it degrades to unverified rather than rejecting. The
// honeypot and the rate limit still apply.
let sentDuringOutage;
restore = stubFetch(async (url, init) => {
  if (String(url) === siteverify) throw new Error('network down');
  sentDuringOutage = JSON.parse(init.body);
  return new Response(JSON.stringify({id: 'email_123'}), {status: 200});
});
try {
  response = await invoke({...guest, 'cf-turnstile-response': 'good-token'}, {}, withTurnstile);
} finally { restore(); }
assert.equal(response.status, 200);
assert.match(sentDuringOutage.text, /Source: Website inquiry \(unverified\)/,
  'an enquiry taken during an outage must be marked as unverified');

// Siteverify answering with an error status is the same kind of fault.
restore = stubFetch(async url => {
  if (String(url) === siteverify) return new Response('upstream error', {status: 502});
  return new Response(JSON.stringify({id: 'email_123'}), {status: 200});
});
try {
  response = await invoke({...guest, 'cf-turnstile-response': 'good-token'}, {}, withTurnstile);
} finally { restore(); }
assert.equal(response.status, 200);

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
    {...guest, 'cf-turnstile-response': 'good-token', 'booking-checksum': 'https://spam.example'},
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
      country: 'United States',
      'cf-turnstile-response': 'a-valid-token',
      'booking-checksum': 'Ada Travel Ltd',
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

// ── Storing the enquiry ──
//
// The database is the last thing to happen and the least important thing to
// happen. These check that in both directions: that a row carries what the
// email carried, and that no failure of the database is ever allowed to change
// what the visitor is told.

const stubDb = (behaviour = {}) => {
  const calls = [];
  return {
    calls,
    prepare(sql) {
      const call = {sql, args: null};
      return {
        bind(...args) { call.args = args; return this; },
        async run() {
          calls.push(call);
          if (behaviour.throwOnRun) throw new Error(behaviour.throwOnRun);
          return {success: true};
        },
      };
    },
  };
};

const enquiry = {
  ...guest,
  phone: '+233 50 111 2222',
  country: 'United States',
  'tour-interest': 'cape-coast',
  'group-size': '3-5',
  'travel-date': '2027-04-17',
  'departure-date': '2027-04-24',
  'date-flexibility': 'yes',
  'traveling-with-children': 'yes',
  'children-age-ranges': '4-7',
  accommodation: 'family',
  'contact-method': 'whatsapp',
  message: 'We would like to bring my mother.',
};

const deliverThen = db => {
  const restore = stubFetch(async url => {
    if (String(url) === siteverify) return new Response(JSON.stringify(validChallenge), {status: 200});
    return new Response(JSON.stringify({id: 'email-1'}), {status: 200});
  });
  return {
    restore,
    env: {...withTurnstile, ...(db ? {DB: db} : {})},
  };
};

// A delivered enquiry is written once, with every field the email carried.
{
  const db = stubDb();
  const {restore, env} = deliverThen(db);
  try {
    response = await invoke({...enquiry, 'cf-turnstile-response': 'good-token'}, {}, env);
  } finally { restore(); }
  assert.equal(response.status, 200);
  const {reference} = await response.json();
  assert.equal(db.calls.length, 1, 'one delivered enquiry should write one row');

  const [call] = db.calls;
  assert(/INSERT INTO enquiries/.test(call.sql));
  assert(/ON CONFLICT\(id\) DO NOTHING/.test(call.sql),
    'a client retry must not be able to create a second row');
  // Column count and bound-value count must agree, or the insert silently
  // shifts every value one column to the left.
  const columns = call.sql.match(/\(([^)]*)\)\s+VALUES/)[1].split(',').length;
  assert.equal(columns, call.args.length, 'column list and bound values disagree');

  const [id, storedReference, createdAt, status, source, first, last, email,
         phone, country, tourInterest, tourName, groupSize, travelDate,
         departureDate, flexibility, withChildren, childAges, accommodation,
         contactMethod, message] = call.args;
  assert.match(id, /^[0-9a-f-]{36}$/, 'the row id should be the idempotency key');
  assert.equal(storedReference, reference, 'the row must carry the reference the guest was given');
  assert.match(createdAt, /^\d{4}-\d{2}-\d{2}T[\d:.]+Z$/, 'created_at should be ISO 8601 UTC');
  assert.equal(status, 'new');
  assert.equal(source, 'Website inquiry');
  assert.equal(first, 'Ada');
  assert.equal(last, 'Guest');
  assert.equal(email, 'ada@example.com');
  assert.equal(phone, '+233 50 111 2222');
  assert.equal(country, 'United States');
  assert.equal(tourInterest, 'cape-coast');
  // The display name is the server's, never the browser's.
  assert.equal(tourName, 'Cape Coast Ancestral Tour');
  assert.equal(groupSize, '3-5');
  assert.equal(travelDate, '2027-04-17');
  assert.equal(departureDate, '2027-04-24');
  assert.equal(flexibility, 'yes');
  assert.equal(withChildren, 'yes');
  assert.equal(childAges, '4-7');
  assert.equal(accommodation, 'family');
  assert.equal(contactMethod, 'whatsapp');
  assert.equal(message, 'We would like to bring my mother.');
}

// The same enquiry with no token reaches the database too, and carries the
// marking there as well as in the email. Storage is how enquiries are counted,
// so a downgraded one that looked identical in the table would quietly distort
// every figure later drawn from it.
{
  const db = stubDb();
  const {restore, env} = deliverThen(db);
  try {
    response = await invoke(enquiry, {}, env);
  } finally { restore(); }
  assert.equal(response.status, 200);
  assert.equal(db.calls.length, 1, 'an unverified enquiry is still an enquiry and is still stored');
  assert.equal(db.calls[0].args[4], 'Website inquiry (unverified)',
    'the stored row must record that the visitor could not be verified');
}

// A browser-supplied tour name must not reach the database, exactly as it must
// not reach the email.
{
  const db = stubDb();
  const {restore, env} = deliverThen(db);
  try {
    await invoke({...enquiry, 'tour-name': 'Forged tour', 'cf-turnstile-response': 'good-token'}, {}, env);
  } finally { restore(); }
  assert.equal(db.calls[0].args[11], 'Cape Coast Ancestral Tour');
}

// The failure that matters: the database is down, the email went out, and the
// visitor is told the same thing either way.
{
  const db = stubDb({throwOnRun: 'D1_ERROR: database is unavailable'});
  const {restore, env} = deliverThen(db);
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => errors.push(args);
  try {
    response = await invoke({...enquiry, 'cf-turnstile-response': 'good-token'}, {}, env);
  } finally { restore(); console.error = originalError; }
  assert.equal(response.status, 200, 'a database failure must not fail the enquiry');
  const body = await response.json();
  assert.equal(body.ok, true);
  assert.match(body.reference, /^PP-[0-9A-Z]{6}$/, 'the guest still gets their reference');
  assert.equal(errors.length, 1, 'a lost row must be logged exactly once');
  assert(String(errors[0][0]).includes('not to the database'));
  assert.equal(errors[0][1].reference, body.reference,
    'the log must carry the reference, so the row can be rebuilt from the email');
}

// No binding at all — a preview before the database is attached — is a normal
// state, not an error, and is not logged as one.
{
  const {restore, env} = deliverThen(null);
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => errors.push(args);
  try {
    response = await invoke({...enquiry, 'cf-turnstile-response': 'good-token'}, {}, env);
  } finally { restore(); console.error = originalError; }
  assert.equal(response.status, 200);
  assert.equal(errors.length, 0, 'an unconfigured database must not log an error on every enquiry');
}

// Nothing is written for an enquiry that was never delivered.
{
  const db = stubDb();
  const restore = stubFetch(async url => {
    if (String(url) === siteverify) return new Response(JSON.stringify(validChallenge), {status: 200});
    return new Response('rejected', {status: 422});
  });
  const originalError = console.error;
  console.error = () => {};
  try {
    response = await invoke({...enquiry, 'cf-turnstile-response': 'good-token'}, {}, {...withTurnstile, DB: db});
  } finally { restore(); console.error = originalError; }
  assert.equal(response.status, 502);
  assert.equal(db.calls.length, 0, 'an undelivered enquiry must not be recorded as one');
}

// A rejected challenge reaches neither the provider nor the database.
{
  const db = stubDb();
  const restore = stubFetch(async () => new Response(JSON.stringify({success: false}), {status: 200}));
  try {
    response = await invoke({...enquiry, 'cf-turnstile-response': 'bad'}, {}, {...withTurnstile, DB: db});
  } finally { restore(); }
  assert.equal(response.status, 403);
  assert.equal(db.calls.length, 0);
}

console.log('Inquiry function tests passed.');
