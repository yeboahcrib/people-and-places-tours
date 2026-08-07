const MAX_BODY_BYTES = 32_000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const limits = {
  'first-name': 80,
  'last-name': 80,
  email: 254,
  phone: 40,
  'tour-interest': 100,
  'tour-name': 200,
  'group-size': 30,
  'travel-date': 10,
  country: 100,
  message: 5000,
  source: 100,
};

const responseHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const json = (status, body) => new Response(JSON.stringify(body), {
  status,
  headers: responseHeaders,
});

const clean = (value, max) => String(value ?? '').trim().slice(0, max);

const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));

function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin');
  // Browsers always send Origin on a cross-site or same-site POST, and this
  // endpoint is only ever called by fetch() from our own pages. A request
  // without one is therefore not a browser following our form — treat the
  // missing header as a failed check rather than an exemption from it.
  if (!origin) return false;

  const configured = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  return origin === new URL(request.url).origin || configured.includes(origin);
}

// Turnstile runs inline on our own page and never navigates the visitor to a
// challenge hosted elsewhere, which is the whole reason for preferring it to
// the CAPTCHA interstitial the FormSubmit fallback can show.
// Whether this deployment can actually verify a human. When it cannot, the
// honeypot is the only bot defence left and has to stay switched on.
const isTurnstileConfigured = env => Boolean(env.TURNSTILE_SECRET_KEY);

async function passedTurnstile(token, request, env) {
  const secret = env.TURNSTILE_SECRET_KEY;
  // Not configured (local dev, early previews): the honeypot, origin check and
  // field limits still apply. /api/health reports this so the gap is visible
  // rather than silent.
  if (!secret) return true;
  if (!token) return false;

  const form = new FormData();
  form.append('secret', secret);
  form.append('response', token);
  const clientIp = request.headers.get('CF-Connecting-IP');
  if (clientIp) form.append('remoteip', clientIp);

  try {
    const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: form,
    });
    if (!verification.ok) return false;
    const result = await verification.json();
    return result.success === true;
  } catch {
    // A verification outage must not silently let unverified traffic through.
    return false;
  }
}

function normalizePayload(input) {
  return Object.fromEntries(
    Object.entries(limits).map(([field, max]) => [field, clean(input[field], max)]),
  );
}

function validate(payload) {
  if (!payload['first-name'] || !payload['last-name']) return 'Please provide your first and last name.';
  if (!EMAIL_PATTERN.test(payload.email)) return 'Please provide a valid email address.';
  if (payload['travel-date'] && !/^\d{4}-\d{2}-\d{2}$/.test(payload['travel-date'])) return 'Please provide a valid travel date.';
  return null;
}

// A booking reference that can be read aloud: "PP-K7M2QX".
//
// The alphabet omits 0, O, 1, I and L because those are the characters most
// often misheard or mistyped when a reference is read over the phone or copied
// by hand.
//
// Thirty-one characters to the power of six is roughly 890 million
// combinations, far beyond what this company will issue. Uniqueness that
// matters for delivery is handled by the idempotency key, not by this.
const REFERENCE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

function bookingReference() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let out = '';
  for (const byte of bytes) {
    // Reject the top of the byte range so every character stays equally
    // likely; 248 is the largest multiple of 31 that fits in a byte.
    if (byte >= 248) continue;
    out += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length];
    if (out.length === 6) break;
  }
  // Rejection can, very rarely, leave us short. Top up rather than return a
  // stubby reference.
  while (out.length < 6) {
    out += REFERENCE_ALPHABET[Math.floor(Math.random() * REFERENCE_ALPHABET.length)];
  }
  return `PP-${out}`;
}

function inquiryText(payload, requestId) {
  return [
    `Inquiry reference: ${requestId}`,
    `Name: ${payload['first-name']} ${payload['last-name']}`,
    `Email: ${payload.email}`,
    `Phone / WhatsApp: ${payload.phone || 'Not provided'}`,
    `Tour: ${payload['tour-name'] || payload['tour-interest'] || 'Not selected'}`,
    `Group size: ${payload['group-size'] || 'Not provided'}`,
    `Preferred date: ${payload['travel-date'] || 'Not provided'}`,
    `Country: ${payload.country || 'Not provided'}`,
    `Source: ${payload.source || 'Website inquiry'}`,
    '',
    'Message:',
    payload.message || 'No additional message.',
  ].join('\n');
}

function inquiryHtml(payload, requestId) {
  const row = (label, value) => `<tr><th align="left" style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(label)}</th><td style="padding:8px;border-bottom:1px solid #ddd">${escapeHtml(value || 'Not provided')}</td></tr>`;
  return `
    <h1>New People &amp; Places tour inquiry</h1>
    <p><strong>Inquiry reference:</strong> ${escapeHtml(requestId)}</p>
    <table style="border-collapse:collapse">
      ${row('Name', `${payload['first-name']} ${payload['last-name']}`)}
      ${row('Email', payload.email)}
      ${row('Phone / WhatsApp', payload.phone)}
      ${row('Tour', payload['tour-name'] || payload['tour-interest'])}
      ${row('Group size', payload['group-size'])}
      ${row('Preferred date', payload['travel-date'])}
      ${row('Country', payload.country)}
      ${row('Source', payload.source || 'Website inquiry')}
    </table>
    <h2>Message</h2>
    <p style="white-space:pre-wrap">${escapeHtml(payload.message || 'No additional message.')}</p>
  `;
}

async function handlePost({request, env}) {
  if (!allowedOrigin(request, env)) return json(403, {error: 'Request origin is not allowed.'});

  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return json(415, {error: 'Expected a JSON request.'});
  }

  const declaredLength = Number(request.headers.get('Content-Length') || 0);
  if (declaredLength > MAX_BODY_BYTES) return json(413, {error: 'Inquiry is too large.'});

  let input;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
      return json(413, {error: 'Inquiry is too large.'});
    }
    input = JSON.parse(raw);
  } catch {
    return json(400, {error: 'Inquiry could not be read.'});
  }

  // Verified before any real work: a token that fails here should cost us
  // nothing beyond the check itself.
  const turnstileVerified = await passedTurnstile(clean(input['cf-turnstile-response'], 2048), request, env);
  if (!turnstileVerified) {
    return json(403, {error: 'We could not confirm this was submitted by a person. Please reload the page and try again.'});
  }

  // The honeypot applies only when Turnstile could not verify the request —
  // that is, on a deployment with no secret configured.
  //
  // It must not run before Turnstile. Browsers autofill hidden fields, and a
  // field named `company-website` is filled from a saved profile by some
  // browsers, so an unconditional check discards genuine enquiries: the
  // visitor sees success, nothing is delivered, and no error is recorded.
  // Turnstile is a far stronger signal than a hidden input, so once it has
  // confirmed a human a filled trap indicates autofill rather than a bot.
  if (!isTurnstileConfigured(env) && clean(input['company-website'], 200)) {
    // Return a normal success response so a bot does not learn how the filter
    // works.
    return json(200, {ok: true});
  }

  const payload = normalizePayload(input);
  const validationError = validate(payload);
  if (validationError) return json(400, {error: validationError});

  if (!env.RESEND_API_KEY || !env.INQUIRY_TO_EMAIL || !env.INQUIRY_FROM_EMAIL) {
    return json(503, {error: 'Inquiry delivery is not configured.'});
  }

  // Two identifiers, because they have opposing requirements.
  //
  // requestId is the idempotency key. It is never shown, and a repeat would
  // make Resend treat a second genuine enquiry as a duplicate and drop it, so
  // it stays a full UUID.
  //
  // reference is quoted by guests over the phone, so it optimises for being
  // read aloud instead. A collision there is harmless.
  const requestId = crypto.randomUUID();
  const reference = bookingReference();
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': requestId,
    },
    body: JSON.stringify({
      from: env.INQUIRY_FROM_EMAIL,
      to: [env.INQUIRY_TO_EMAIL],
      reply_to: payload.email,
      subject: `Tour inquiry: ${payload['tour-name'] || payload['tour-interest'] || 'General request'}`,
      // The email carries the guest-facing reference, not the internal id —
      // it has to be the string they will quote back when they reply.
      text: inquiryText(payload, reference),
      html: inquiryHtml(payload, reference),
    }),
  });

  if (!emailResponse.ok) {
    // Do not expose provider details or customer data to the browser.
    return json(502, {error: 'Inquiry delivery could not be confirmed.'});
  }

  return json(200, {ok: true, reference});
}

export function onRequest(context) {
  if (context.request.method !== 'POST') {
    return json(405, {error: 'Method not allowed.'});
  }
  return handlePost(context);
}
