import assert from 'node:assert/strict';
import {
  STORYBLOK_MODES,
  STORYBLOK_TOTAL_PRODUCTS,
  assessStoryblokFallback,
  resolveStoryblokMode,
  systemicThresholdFor,
  storyblokTokenFor,
} from '../scripts/storyblok-fallback-policy.mjs';

const {migration, production} = STORYBLOK_MODES;

// --- Modes.
assert.equal(resolveStoryblokMode({}).id, 'migration',
  'the migration mode is what runs today and must be the default');
assert.equal(resolveStoryblokMode({STORYBLOK_CONTENT_MODE: '  '}).id, 'migration');
assert.equal(migration.contentVersion, 'draft');
assert.equal(migration.tokenEnvVar, 'STORYBLOK_PREVIEW_API_TOKEN');

// Production delivery is activatable now that its credential exists and its
// semantics are tested — but it is never reached by accident. It has to be
// asked for by name, and the default stays on migration.
assert.equal(production.active, true);
assert.equal(production.contentVersion, 'published');
assert.equal(production.tokenEnvVar, 'STORYBLOK_PUBLIC_API_TOKEN');
assert.equal(resolveStoryblokMode({STORYBLOK_CONTENT_MODE: 'production'}).id, 'production',
  'production delivery runs when it is asked for by name');
assert.equal(resolveStoryblokMode({}).id, 'migration',
  'and never by default — reaching it takes a deliberate variable');
assert.throws(() => resolveStoryblokMode({STORYBLOK_CONTENT_MODE: 'preview'}), /Unknown/);

// --- Credential separation. Each mode reads only its own variable, so a
// Preview token can never satisfy production delivery.
const bothTokens = {
  STORYBLOK_PREVIEW_API_TOKEN: 'preview-secret',
  STORYBLOK_PUBLIC_API_TOKEN: 'public-secret',
};
assert.equal(storyblokTokenFor(migration, bothTokens), 'preview-secret');
assert.equal(storyblokTokenFor(production, bothTokens), 'public-secret');
assert.equal(storyblokTokenFor(production, {STORYBLOK_PREVIEW_API_TOKEN: 'preview-secret'}), '',
  'a preview token must not be accepted as a production credential');
assert.equal(storyblokTokenFor(migration, {STORYBLOK_PREVIEW_API_TOKEN: '   '}), '');

// --- Classification.
const sources = (...pairs) => Object.fromEntries(pairs);
const slugs = (count, source, offset = 0) =>
  Array.from({length: count}, (_, i) => ['tour-' + (i + offset), source]);

assert.equal(assessStoryblokFallback({sourcesBySlug: {}}).status, 'inactive');
assert.equal(assessStoryblokFallback({
  sourcesBySlug: sources(...slugs(13, 'disabled')),
}).status, 'inactive', 'a switched-off integration is not a failure');

const allApplied = assessStoryblokFallback({sourcesBySlug: sources(...slugs(13, 'applied'))});
assert.equal(allApplied.status, 'ok');
assert.equal(allApplied.applied.length, STORYBLOK_TOTAL_PRODUCTS);

// One bad record is per-record isolation doing its job, not a reason to stop.
const oneBad = assessStoryblokFallback({
  sourcesBySlug: sources(...slugs(12, 'applied'), ['tour-13', 'unavailable']),
});
assert.equal(oneBad.status, 'warn');
assert.deepEqual(oneBad.transport, ['tour-13']);
assert.match(oneBad.message, /12 of 13/);

// A record the content gate rejected also warns, and is reported separately
// from an unreachable one: they need different fixes.
const gated = assessStoryblokFallback({
  sourcesBySlug: sources(...slugs(12, 'applied'), ['tour-13', 'invalid-content']),
});
assert.equal(gated.status, 'warn');
assert.deepEqual(gated.content, ['tour-13']);
assert.equal(gated.transport.length, 0);
assert.match(gated.message, /content gate/);
// --- Migration mode is fallback-friendly and never stops a build.
// This mode exists to validate records one at a time. Failing it because most of
// the handful enabled so far were unreachable would punish its own workflow.
for (const failures of [1, 6, 7, 12, 13]) {
  const r = assessStoryblokFallback({
    sourcesBySlug: sources(...slugs(failures, 'unavailable'), ...slugs(13 - failures, 'applied', 100)),
    mode: migration,
  });
  assert.equal(r.status, 'warn',
    `migration mode must warn, never fail, on ${failures} technical failures`);
  assert.equal(r.enforced, false);
  assert.match(r.message, /Migration builds do not fail/);
}
// Even a total outage only warns here, and still names every affected record so
// it reaches the build log and health diagnostics.
const migrationOutage = assessStoryblokFallback({
  sourcesBySlug: sources(...slugs(13, 'unavailable')), mode: migration,
});
assert.equal(migrationOutage.status, 'warn');
assert.equal(migrationOutage.transport.length, 13);

// --- Production mode: a majority of 13 is 7.
assert.equal(systemicThresholdFor(13), 7, 'seven is a majority of the 13-product catalogue');
assert.equal(systemicThresholdFor(STORYBLOK_TOTAL_PRODUCTS), 7);
// The rule is a majority, not half. At 13 the two happen to agree, so pin an
// even count where they do not: half of 12 is 6, but a majority of 12 is 7.
assert.equal(systemicThresholdFor(12), 7, 'a majority of 12 is 7, not 6');
assert.equal(systemicThresholdFor(14), 8, 'a majority of 14 is 8');
assert.equal(assessStoryblokFallback({
  sourcesBySlug: sources(...slugs(6, 'unavailable'), ...slugs(6, 'applied', 100)),
  mode: production,
}).status, 'warn', 'an even split is not a majority and must not fail the build');

for (const failures of [0, 1, 3, 6]) {
  const r = assessStoryblokFallback({
    sourcesBySlug: sources(...slugs(failures, 'unavailable'), ...slugs(13 - failures, 'applied', 100)),
    mode: production,
  });
  assert.equal(r.status, failures === 0 ? 'ok' : 'warn',
    `${failures} of 13 is controlled fallback, not a systemic failure`);
}
for (const failures of [7, 8, 13]) {
  const r = assessStoryblokFallback({
    sourcesBySlug: sources(...slugs(failures, 'unavailable'), ...slugs(13 - failures, 'applied', 100)),
    mode: production,
  });
  assert.equal(r.status, 'fail', `${failures} of 13 is a majority and must fail the build`);
  assert.equal(r.threshold, 7);
  assert.match(r.message, /majority/);
}

// --- A bad credential fails production immediately, at any count.
// Waiting for seven records would be waiting for a foregone conclusion.
for (const source of ['unauthorized', 'missing-configuration', 'unsupported-region']) {
  const single = assessStoryblokFallback({
    sourcesBySlug: sources(...slugs(1, source), ...slugs(12, 'applied', 100)),
    mode: production,
  });
  assert.equal(single.status, 'fail',
    `${source} must fail production delivery without waiting for a threshold`);
  assert.equal(single.credentialFailure, true);
  assert(single.transport.length < 7, 'it must fail below the systemic threshold, not because of it');
  assert.match(single.message, /does not wait for a record threshold/);

  // The same condition must never stop a migration build.
  const inMigration = assessStoryblokFallback({
    sourcesBySlug: sources(...slugs(1, source), ...slugs(12, 'applied', 100)),
    mode: migration,
  });
  assert.notEqual(inMigration.status, 'fail',
    `${source} must not fail a migration build`);
}

// A missing token in production fails even though no record was ever attempted.
const noToken = assessStoryblokFallback({
  sourcesBySlug: sources(...slugs(13, 'missing-configuration')), mode: production,
});
assert.equal(noToken.status, 'fail');
assert.equal(noToken.attempted, 0, 'no request was made, and it still fails');
// In migration the same state is simply "not configured yet".
assert.equal(assessStoryblokFallback({
  sourcesBySlug: sources(...slugs(13, 'missing-configuration')), mode: migration,
}).status, 'inactive');

// A switched-off integration is not a credential failure in either mode.
for (const mode of [migration, production]) {
  assert.equal(assessStoryblokFallback({
    sourcesBySlug: sources(...slugs(13, 'disabled')), mode,
  }).status, 'inactive', 'a disabled integration is not a failure');
}

// --- Editorial problems are never systemic, in either mode.
// Thirteen tours failing the content gate is thirteen editorial fixes, each
// already isolated. Stopping the build would help nobody.
for (const mode of [migration, production]) {
  for (const source of ['invalid-content', 'duplicate-slug', 'duplicate-display-order']) {
    const r = assessStoryblokFallback({sourcesBySlug: sources(...slugs(13, source)), mode});
    assert.equal(r.status, 'warn',
      `${source} across the whole catalogue must warn, not fail (${mode.id})`);
    assert.equal(r.transport.length, 0, `${source} must not count as a transport failure`);
  }
}

// --- The asymmetry between the modes.
const absent = sources(...slugs(12, 'applied'), ['withdrawn-tour', 'missing-story']);

// Mid-migration, a story that does not exist yet has not been withdrawn. The
// committed copy is the right thing to ship for it.
const duringMigration = assessStoryblokFallback({sourcesBySlug: absent, mode: migration});
assert.equal(duringMigration.status, 'warn');
assert.deepEqual(duringMigration.missing, ['withdrawn-tour']);
assert.deepEqual(duringMigration.withdrawn, []);
assert.match(duringMigration.message, /not yet migrated/);

// Under production delivery the same absence is an editor unpublishing a tour.
// Falling back would put it straight back on the site, which is the one thing
// an intentional hide must never do.
const inProduction = assessStoryblokFallback({sourcesBySlug: absent, mode: production});
assert.deepEqual(inProduction.withdrawn, ['withdrawn-tour'],
  'an unpublished story is a withdrawal, not a gap to fill from the committed copy');
assert.deepEqual(inProduction.missing, []);
assert.equal(inProduction.status, 'ok',
  'a deliberate withdrawal is not a build problem');

// --- No message may carry a credential. The credential-failure message names
// the environment variable to check, which is exactly where a value could slip in.
const credentialReport = assessStoryblokFallback({
  sourcesBySlug: sources(...slugs(1, 'unauthorized'), ...slugs(12, 'applied', 100)),
  mode: production,
});
assert.match(credentialReport.message, /STORYBLOK_PUBLIC_API_TOKEN/,
  'the message should name the variable to check');
for (const report of [
  oneBad, gated, duringMigration, inProduction, allApplied, credentialReport,
  migrationOutage, noToken,
]) {
  for (const forbidden of ['secret', 'preview-secret', 'public-secret']) {
    assert(!report.message.includes(forbidden), 'policy messages must never quote a token');
  }
}

console.log('Storyblok fallback policy tests passed.');
