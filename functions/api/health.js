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
  const body = {
    status: ready ? 'ok' : 'degraded',
    service: 'people-and-places-inquiry',
    revision: env.CF_PAGES_COMMIT_SHA || 'unknown',
    checks: {
      deliveryConfigured: ready,
    },
  };

  return json(ready ? 200 : 503, request.method === 'HEAD' ? {} : body);
}
