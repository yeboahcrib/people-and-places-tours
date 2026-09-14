import {identityFromAccess, json, refuse} from '../../../src/dashboard/access.mjs';
import {DETAIL_COLUMNS, describeEnquiry} from '../../../src/dashboard/analytics.mjs';

/* One enquiry, in full: GET /api/dashboard/enquiry?reference=PP-XXXXXX.
 *
 * Behind the same Access check as the figures. It answers for one reference
 * at a time and nothing broader — no listing, no search, no range — so the
 * only way to read a record is to already know which one, which the dashboard
 * does because it is showing that enquiry's row. */

const REFERENCE = /^PP-[A-Z0-9]{4,12}$/;

export async function onRequest({request, env}) {
  if (request.method !== 'GET') return json(405, {error: 'Method not allowed.'});

  const identity = await identityFromAccess(request, env);
  if (!identity.ok) return refuse(identity, 'enquiry');

  if (!env.DB || typeof env.DB.prepare !== 'function') {
    return json(503, {error: 'Enquiry storage is not configured for this deployment.'});
  }

  const reference = String(new URL(request.url).searchParams.get('reference') || '').trim().toUpperCase();
  if (!REFERENCE.test(reference)) return json(400, {error: 'That is not an enquiry reference.'});

  try {
    const {results} = await env.DB
      .prepare(`SELECT ${DETAIL_COLUMNS.join(', ')} FROM enquiries WHERE reference = ? ORDER BY created_at DESC LIMIT 2`)
      .bind(reference)
      .all();
    const rows = results || [];
    if (!rows.length) return json(404, {error: 'No enquiry has that reference.'});
    // References are random, not unique by constraint. If two ever collide the
    // newest is shown and the drawer says so, rather than silently picking one.
    return json(200, {enquiry: describeEnquiry(rows[0]), sharedReference: rows.length > 1});
  } catch (error) {
    console.error('Enquiry detail query failed', {message: error?.message});
    return json(500, {error: 'This enquiry could not be read.'});
  }
}
