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
  if (!origin) return true;

  const configured = String(env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(value => value.trim())
    .filter(Boolean);

  return origin === new URL(request.url).origin || configured.includes(origin);
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

  // Bots commonly fill fields visually hidden from people. Return a normal
  // success response so the bot does not learn how the filter works.
  if (clean(input['company-website'], 200)) return json(200, {ok: true});

  const payload = normalizePayload(input);
  const validationError = validate(payload);
  if (validationError) return json(400, {error: validationError});

  if (!env.RESEND_API_KEY || !env.INQUIRY_TO_EMAIL || !env.INQUIRY_FROM_EMAIL) {
    return json(503, {error: 'Inquiry delivery is not configured.'});
  }

  const requestId = crypto.randomUUID();
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
      text: inquiryText(payload, requestId),
      html: inquiryHtml(payload, requestId),
    }),
  });

  if (!emailResponse.ok) {
    // Do not expose provider details or customer data to the browser.
    return json(502, {error: 'Inquiry delivery could not be confirmed.'});
  }

  return json(200, {ok: true, reference: requestId});
}

export function onRequest(context) {
  if (context.request.method !== 'POST') {
    return json(405, {error: 'Method not allowed.'});
  }
  return handlePost(context);
}
