const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const json = (status, body) => new Response(JSON.stringify(body), {status, headers});

/* The columns an enquiry is written into.
 *
 * Duplicated from the inquiry Function on purpose: a health check that
 * imported from it would couple the two, and this endpoint has to keep
 * answering when that one cannot. `tests/health-function.mjs` fails if the
 * two lists ever drift apart, which is the coupling that actually matters. */
const ENQUIRY_COLUMNS = [
  'id', 'reference', 'created_at', 'status', 'source',
  'first_name', 'last_name', 'email', 'phone', 'country',
  'tour_interest', 'tour_name', 'group_size', 'travel_date', 'departure_date',
  'date_flexibility', 'traveling_with_children', 'children_age_ranges',
  'accommodation', 'contact_method', 'message',
];

/**
 * Whether the bound database could actually accept an enquiry.
 *
 * A binding proves a database is attached, not that anything is in it. A
 * bound but unmigrated database delivers every enquiry by email and stores
 * none of them — the Function logs each failure, but nothing surfaces it, so
 * the first sign is reporting that has quietly gone empty.
 *
 * Read-only, and deliberately so: it reads the schema catalogue, never a row.
 * No enquiry is read, counted, or exposed by this endpoint.
 */
async function enquirySchemaState(env) {
  if (!env.DB || typeof env.DB.prepare !== 'function') return {ready: false, reason: 'not-configured'};
  try {
    const columns = await env.DB.prepare("SELECT name FROM pragma_table_info('enquiries')").all();
    const present = new Set((columns?.results || []).map(row => row.name));
    if (!present.size) return {ready: false, reason: 'table-missing'};
    const missing = ENQUIRY_COLUMNS.filter(column => !present.has(column));
    // Named, because "the table exists" and "the table can take an enquiry"
    // are different answers and only one of them is useful at 2am.
    if (missing.length) return {ready: false, reason: 'columns-missing', missing};
    return {ready: true};
  } catch (error) {
    return {ready: false, reason: 'check-failed', message: error?.message};
  }
}

export async function onRequest({request, env}) {
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
  // Reported beside the binding, never folded into `ready`. An enquiry that
  // cannot be stored still reaches the team by email, and taking this endpoint
  // to 503 over bookkeeping would page somebody about a working form.
  const schema = await enquirySchemaState(env);
  const body = {
    status: ready ? 'ok' : 'degraded',
    service: 'people-and-places-inquiry',
    revision: env.CF_PAGES_COMMIT_SHA || 'unknown',
    checks: {
      deliveryConfigured: ready,
      botProtectionConfigured,
      enquiryStorageConfigured,
      enquiryStorageReady: schema.ready,
      ...(schema.ready ? {} : {enquiryStorageReason: schema.reason}),
      ...(schema.missing ? {enquiryStorageMissingColumns: schema.missing} : {}),
    },
  };

  return json(ready ? 200 : 503, request.method === 'HEAD' ? {} : body);
}
