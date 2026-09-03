/**
 * When it is right to ship committed content instead of CMS content, and when
 * shipping it silently is worse than stopping.
 *
 * Per-record isolation means a single bad tour falls back on its own and the
 * other twelve are unaffected. That is the behaviour we want, but it has a
 * failure mode: if Storyblok is unreachable, or a token is wrong, every record
 * falls back the same quiet way and the build succeeds with a site that is
 * entirely committed content. It looks fine. It is a month out of date.
 *
 * This module draws the line between the two, and states which credential and
 * which content version each delivery mode is allowed to use.
 */

/** Twelve standard tours plus the one multi-day trip. */
export const STORYBLOK_TOTAL_PRODUCTS = 13;

/**
 * Half the attempted records failing at the transport layer is not thirteen
 * coincidences; it is one outage. Two is the floor so a two-record test space
 * cannot trip the rule on a single failure.
 */
export const STORYBLOK_SYSTEMIC_FAILURE_RATIO = 0.5;
export const STORYBLOK_SYSTEMIC_FAILURE_FLOOR = 2;

export const STORYBLOK_MODES = {
  /**
   * Mode A — the migration, and what runs today. A Preview token reads draft
   * content so work in progress is visible before anyone publishes it.
   */
  migration: {
    id: 'migration',
    tokenEnvVar: 'STORYBLOK_PREVIEW_API_TOKEN',
    contentVersion: 'draft',
    active: true,
    /*
     * Draft returns a story whether or not it is published, so a story that is
     * absent has simply not been written yet. Thirteen products are being
     * migrated one at a time; falling back to the committed copy is the correct
     * answer for the ones not yet reached.
     */
    absenceMeansWithdrawn: false,
  },

  /**
   * Mode B — production delivery. Defined so the difference is explicit, and
   * deliberately not active: it needs its own credential, which does not exist
   * yet, and activating it is a separate decision from finishing the migration.
   */
  production: {
    id: 'production',
    tokenEnvVar: 'STORYBLOK_PUBLIC_API_TOKEN',
    contentVersion: 'published',
    active: false,
    /*
     * Published content hides an unpublished story, so absence is an editorial
     * act. This is the important asymmetry between the two modes: falling back
     * here would take a tour an editor deliberately withdrew and put it back on
     * the site from the committed copy. An intentional hide must remove the
     * card, never resurrect it.
     */
    absenceMeansWithdrawn: true,
  },
};

/**
 * Resolve the delivery mode. Defaults to the migration mode, and refuses to run
 * a mode that has not been activated rather than silently falling back to one
 * that has — a wrong mode reads the wrong content version with the wrong token.
 */
export function resolveStoryblokMode(env = process.env) {
  const requested = typeof env.STORYBLOK_CONTENT_MODE === 'string' && env.STORYBLOK_CONTENT_MODE.trim()
    ? env.STORYBLOK_CONTENT_MODE.trim()
    : 'migration';
  const mode = STORYBLOK_MODES[requested];
  if (!mode) {
    throw new Error(
      'Unknown STORYBLOK_CONTENT_MODE "' + requested + '". Expected one of: ' +
      Object.keys(STORYBLOK_MODES).join(', ') + '.');
  }
  if (!mode.active) {
    throw new Error(
      'Storyblok mode "' + mode.id + '" is defined but not activated. It requires ' +
      mode.tokenEnvVar + ' and serves ' + mode.contentVersion + ' content; activating it ' +
      'is a separate decision from the migration and has not been taken.');
  }
  return mode;
}

/**
 * Read only the credential the given mode is entitled to. A Preview token must
 * never satisfy production delivery, and vice versa: they carry different
 * access, and quietly accepting the wrong one is how draft content reaches the
 * public site.
 */
export function storyblokTokenFor(mode, env = process.env) {
  const value = env?.[mode.tokenEnvVar];
  return typeof value === 'string' && value.trim() ? value.trim() : '';
}

const NOT_ATTEMPTED = new Set([
  'not-applicable', 'disabled', 'missing-configuration', 'unsupported-region',
]);
const TRANSPORT_FAILURE = new Set(['unavailable', 'invalid-response']);
const CONTENT_FAILURE = new Set([
  'invalid-content', 'duplicate-slug', 'duplicate-display-order',
]);

/**
 * Classify one build's worth of per-record outcomes.
 *
 * Returns `inactive` when the integration was never asked to run, `ok` when
 * every attempted record applied, `warn` when some records fell back — which is
 * per-record isolation working — and `fail` when enough records failed at the
 * transport layer that the catalogue is effectively coming from the committed
 * copy rather than the CMS.
 */
export function assessStoryblokFallback({sourcesBySlug = {}, mode = STORYBLOK_MODES.migration} = {}) {
  const entries = Object.entries(sourcesBySlug);
  const attempted = entries.filter(([, source]) => !NOT_ATTEMPTED.has(source));
  const applied = attempted.filter(([, source]) => source === 'applied').map(([slug]) => slug);
  const transport = attempted.filter(([, source]) => TRANSPORT_FAILURE.has(source)).map(([slug]) => slug);
  const content = attempted.filter(([, source]) => CONTENT_FAILURE.has(source)).map(([slug]) => slug);
  const absent = attempted.filter(([, source]) => source === 'missing-story').map(([slug]) => slug);

  // In production delivery an absent story is a withdrawal, not a gap to paper
  // over, so it is neither a failure nor something to fall back from.
  const withdrawn = mode.absenceMeansWithdrawn ? absent : [];
  const missing = mode.absenceMeansWithdrawn ? [] : absent;

  const threshold = Math.max(
    STORYBLOK_SYSTEMIC_FAILURE_FLOOR,
    Math.ceil(attempted.length * STORYBLOK_SYSTEMIC_FAILURE_RATIO));
  const systemic = attempted.length > 0 && transport.length >= threshold;
  const fellBack = [...transport, ...content, ...missing];

  let status = 'ok';
  if (attempted.length === 0) status = 'inactive';
  else if (systemic) status = 'fail';
  else if (fellBack.length > 0) status = 'warn';

  return {
    status,
    mode: mode.id,
    attempted: attempted.length,
    applied,
    transport,
    content,
    missing,
    withdrawn,
    threshold,
    message: describe({status, attempted: attempted.length, applied, transport, content, missing, threshold}),
  };
}

function describe({status, attempted, applied, transport, content, missing, threshold}) {
  if (status === 'inactive') return 'Storyblok was not asked for any record.';
  if (status === 'ok') return 'All ' + attempted + ' Storyblok records applied.';
  if (status === 'fail') {
    return 'Storyblok returned nothing usable for ' + transport.length + ' of ' + attempted +
      ' records (threshold ' + threshold + '): ' + transport.join(', ') +
      '. That is an outage or a rejected credential, not thirteen separate problems, and the ' +
      'site would ship as committed content without saying so. Refusing the build instead.';
  }
  const parts = [];
  if (transport.length) parts.push(transport.length + ' unreachable (' + transport.join(', ') + ')');
  if (content.length) parts.push(content.length + ' rejected by the content gate (' + content.join(', ') + ')');
  if (missing.length) parts.push(missing.length + ' not yet in Storyblok (' + missing.join(', ') + ')');
  return applied.length + ' of ' + attempted + ' Storyblok records applied; ' + parts.join(', ') +
    ' kept their committed fallback.';
}
