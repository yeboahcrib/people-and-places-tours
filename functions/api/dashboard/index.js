import {identityFromAccess, json, refuse} from '../../../src/dashboard/access.mjs';
import {ANALYTIC_COLUMNS, buildFigures, parseFilters} from '../../../src/dashboard/analytics.mjs';

/* Enquiry figures for the internal dashboard: GET /api/dashboard.
 *
 * The browser never touches D1. The figures are counted here, from columns
 * that carry nothing personal, and sent as numbers. The only personal detail
 * this endpoint returns is the name on each enquiry in the recent list — read
 * in a second, bounded query for just those references — because somebody has
 * to be able to recognise the enquiry they are about to open.
 *
 * Email, phone, the message and children's ages are never selected here. One
 * enquiry's full record is served only by /api/dashboard/enquiry, and only
 * when somebody opens it. */

export async function onRequest({request, env}) {
  if (request.method !== 'GET') return json(405, {error: 'Method not allowed.'});

  const identity = await identityFromAccess(request, env);
  if (!identity.ok) return refuse(identity, 'figures');

  if (!env.DB || typeof env.DB.prepare !== 'function') {
    return json(503, {error: 'Enquiry storage is not configured for this deployment.'});
  }

  try {
    const filters = parseFilters(new URL(request.url).searchParams);
    const {results} = await env.DB
      .prepare(`SELECT ${ANALYTIC_COLUMNS.join(', ')} FROM enquiries ORDER BY created_at DESC`)
      .all();
    const figures = buildFigures(results || [], filters, new Date());

    const references = [...new Set(figures.recent.items.map(item => item.reference).filter(Boolean))];
    if (references.length) {
      const names = await env.DB
        .prepare(`SELECT reference, created_at, first_name, last_name FROM enquiries WHERE reference IN (${references.map(() => '?').join(', ')})`)
        .bind(...references)
        .all();
      const byRecord = new Map((names.results || []).map(row => [
        `${row.reference}|${row.created_at}`,
        [row.first_name, row.last_name].map(part => String(part || '').trim()).filter(Boolean).join(' '),
      ]));
      for (const item of figures.recent.items) item.name = byRecord.get(`${item.reference}|${item.createdAt}`) || '';
    }

    return json(200, figures);
  } catch (error) {
    console.error('Dashboard query failed', {message: error?.message});
    return json(500, {error: 'Figures could not be read.'});
  }
}
