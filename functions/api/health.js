const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const json = (status, body) => new Response(JSON.stringify(body), {status, headers});

export function onRequest({request, env}) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return json(405, {status: 'error', error: 'Method not allowed.'});
  }

  const configuration = {
    resendApiKey: Boolean(env.RESEND_API_KEY),
    inquiryRecipient: Boolean(env.INQUIRY_TO_EMAIL),
    inquirySender: Boolean(env.INQUIRY_FROM_EMAIL),
  };
  const ready = Object.values(configuration).every(Boolean);
  // Reported but deliberately not part of `ready`: without Turnstile the form
  // still delivers, so this must not take the endpoint to 503 on a preview.
  // It is surfaced so monitoring can catch a custom-domain cutover that went
  // out without bot protection. See docs/availability-and-monitoring-runbook.md.
  const botProtectionConfigured = Boolean(env.TURNSTILE_SECRET_KEY);
  // Also reported and also outside `ready`: without the database an enquiry
  // still reaches the team by email, so a missing binding must not take this
  // endpoint to 503. It is surfaced so a deployment that lost the binding is
  // visible before anyone notices the reporting has gone quiet.
  const enquiryStorageConfigured = Boolean(env.DB);
  const body = {
    status: ready ? 'ok' : 'degraded',
    service: 'people-and-places-inquiry',
    revision: env.CF_PAGES_COMMIT_SHA || 'unknown',
    checks: {
      deliveryConfigured: ready,
      botProtectionConfigured,
      enquiryStorageConfigured,
    },
  };

  return json(ready ? 200 : 503, request.method === 'HEAD' ? {} : body);
}
