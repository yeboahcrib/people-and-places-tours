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
 * A majority of the catalogue failing at the transport layer is not thirteen
 * coincidences; it is one outage. For the 13 products that means 7.
 *
 * Only production-authoritative delivery enforces this. Migration builds are
 * deliberately exempt — see the modes below.
 */
export const systemicThresholdFor = attempted => Math.floor(attempted / 2) + 1;

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
     * Migration builds are fallback-friendly on purpose. This mode exists to
     * validate records one at a time against draft content, so a technical
     * failure — however many records it hits — falls back per record, warns,
     * and shows up in health diagnostics. It never stops the build. Failing a
     * migration build because most of the handful of records enabled so far
     * were unreachable would punish the exact workflow this mode is for.
     */
    enforcesSystemicThreshold: false,
    failsOnAuthOrConfigFailure: false,
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
     * Production delivery is authoritative, so silence is not an option: a
     * majority of the catalogue failing means the site would ship as committed
     * content while reporting success.
     */
    enforcesSystemicThreshold: true,
    /*
     * A missing or rejected delivery credential, or a configuration the adapter
     * refuses to run, fails immediately. Waiting for the record threshold would
     * be waiting for a foregone conclusion — every record is going to fail the
     * same way, for the same reason, and it is not an outage but a deployment
     * mistake.
     */
    failsOnAuthOrConfigFailure: true,
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

/*
 * Deliberate editorial outcomes, not failures. The tour is gone from the
 * catalogue because someone decided it should be, and no fallback replaces it.
 */
const INTENTIONAL_REMOVAL = new Set(['withdrawn', 'editorial-suppressed']);

/* Expected mid-cutover: the tour is not migrated, and its fallback is correct. */
const PENDING_MIGRATION = 'pending-not-migrated';
const TRANSPORT_FAILURE = new Set(['unavailable', 'invalid-response', 'unauthorized']);

/*
 * Not enough records failed — the wrong credential, or a configuration the
 * adapter declined to run with. Production delivery stops on these outright.
 */
const AUTH_OR_CONFIG_FAILURE = new Set([
  'unauthorized', 'missing-configuration', 'unsupported-region',
]);
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
  const removed = attempted.filter(([, source]) => INTENTIONAL_REMOVAL.has(source)).map(([slug]) => slug);
  const pending = attempted.filter(([, source]) => source === PENDING_MIGRATION).map(([slug]) => slug);

  // Under authoritative delivery the adapter has already resolved absence into
  // a withdrawal or a pending migration, using the migration-authority
  // registry. `missing-story` only survives in migration mode, where draft
  // delivery cannot tell the two apart and falling back is always correct.
  const withdrawn = [...removed, ...(mode.absenceMeansWithdrawn ? absent : [])];
  const missing = [...pending, ...(mode.absenceMeansWithdrawn ? [] : absent)];

  const authOrConfig = entries
    .filter(([, source]) => AUTH_OR_CONFIG_FAILURE.has(source))
    .map(([slug]) => slug);

  const threshold = systemicThresholdFor(attempted.length);
  const systemic = mode.enforcesSystemicThreshold
    && attempted.length > 0
    && transport.length >= threshold;
  const credentialFailure = Boolean(mode.failsOnAuthOrConfigFailure) && authOrConfig.length > 0;
  const fellBack = [...transport, ...content, ...missing];

  let status = 'ok';
  if (credentialFailure) status = 'fail';
  else if (attempted.length === 0) status = 'inactive';
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
    authOrConfig,
    credentialFailure,
    enforced: Boolean(mode.enforcesSystemicThreshold),
    threshold,
    message: describe({
      status, mode, attempted: attempted.length, applied, transport, content, missing,
      threshold, authOrConfig, credentialFailure,
    }),
  };
}

function describe({
  status, mode, attempted, applied, transport, content, missing, threshold,
  authOrConfig, credentialFailure,
}) {
  if (credentialFailure) {
    return 'Storyblok rejected or was not given a usable ' + mode.contentVersion +
      ' credential for ' + authOrConfig.length + ' record(s): ' + authOrConfig.join(', ') +
      '. Production delivery does not wait for a record threshold on this — every record ' +
      'would fail the same way, for the same reason. Check ' + mode.tokenEnvVar +
      ' and the space region.';
  }
  if (status === 'inactive') return 'Storyblok was not asked for any record.';
  if (status === 'ok') return 'All ' + attempted + ' Storyblok records applied.';
  if (status === 'fail') {
    return 'Storyblok returned nothing usable for ' + transport.length + ' of ' + attempted +
      ' records, a majority (threshold ' + threshold + '): ' + transport.join(', ') +
      '. That is one outage, not ' + attempted + ' separate problems, and the site would ship ' +
      'as committed content without saying so. Refusing the build instead.';
  }
  const parts = [];
  // Separate the two, or a rejected token reads as a network problem and sends
  // whoever is debugging it to the wrong place entirely.
  const unreachable = transport.filter(slug => !authOrConfig.includes(slug));
  if (authOrConfig.length) {
    parts.push(authOrConfig.length + ' rejected the credential (' + authOrConfig.join(', ') + ')');
  }
  if (unreachable.length) parts.push(unreachable.length + ' unreachable (' + unreachable.join(', ') + ')');
  if (content.length) parts.push(content.length + ' rejected by the content gate (' + content.join(', ') + ')');
  if (missing.length) parts.push(missing.length + ' not yet migrated (' + missing.join(', ') + ')');
  const tail = mode.enforcesSystemicThreshold
    ? ''
    : ' Migration builds do not fail on technical failures; these records are on fallback by design.';
  return applied.length + ' of ' + attempted + ' Storyblok records applied; ' + parts.join(', ') +
    ' kept their committed fallback.' + tail;
}
