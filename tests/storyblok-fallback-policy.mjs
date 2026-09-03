import assert from 'node:assert/strict';
import {
  STORYBLOK_MODES,
  STORYBLOK_TOTAL_PRODUCTS,
  assessStoryblokFallback,
  resolveStoryblokMode,
  storyblokTokenFor,
} from '../scripts/storyblok-fallback-policy.mjs';

const {migration, production} = STORYBLOK_MODES;

// --- Modes.
assert.equal(resolveStoryblokMode({}).id, 'migration',
  'the migration mode is what runs today and must be the default');
assert.equal(resolveStoryblokMode({STORYBLOK_CONTENT_MODE: '  '}).id, 'migration');
assert.equal(migration.contentVersion, 'draft');
assert.equal(migration.tokenEnvVar, 'STORYBLOK_PREVIEW_API_TOKEN');

// Production delivery is described, not switched on. Nothing may activate it by
// accident: that would serve a different content version with a credential that
// does not exist yet.
assert.equal(production.active, false);
assert.equal(production.contentVersion, 'published');
assert.equal(production.tokenEnvVar, 'STORYBLOK_PUBLIC_API_TOKEN');
assert.throws(() => resolveStoryblokMode({STORYBLOK_CONTENT_MODE: 'production'}),
  /defined but not activated/,
  'production delivery must refuse to run until it is deliberately activated');
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

// --- The systemic threshold. Half of what was attempted, floor of two.
const total = 13;
const threshold = Math.ceil(total * 0.5); // 7
const belowThreshold = assessStoryblokFallback({
  sourcesBySlug: sources(...slugs(threshold - 1, 'unavailable'), ...slugs(total - threshold + 1, 'applied', 100)),
});
assert.equal(belowThreshold.status, 'warn', `${threshold - 1} of 13 unreachable is still partial`);
const atThreshold = assessStoryblokFallback({
  sourcesBySlug: sources(...slugs(threshold, 'unavailable'), ...slugs(total - threshold, 'applied', 100)),
});
assert.equal(atThreshold.status, 'fail', `${threshold} of 13 unreachable is an outage`);
assert.equal(atThreshold.threshold, threshold);

// The case this rule exists for: nothing reachable at all still "succeeds"
// per-record, and would ship a site made entirely of committed content.
const outage = assessStoryblokFallback({sourcesBySlug: sources(...slugs(13, 'unavailable'))});
assert.equal(outage.status, 'fail');
assert.match(outage.message, /outage or a rejected credential/);

// A rejected token looks exactly like an outage from here, and must also stop.
assert.equal(assessStoryblokFallback({
  sourcesBySlug: sources(...slugs(13, 'invalid-response')),
}).status, 'fail');

// Two records is the floor, so a small space cannot fail on a single record.
assert.equal(assessStoryblokFallback({
  sourcesBySlug: sources(['a', 'unavailable'], ['b', 'applied']),
}).status, 'warn');
assert.equal(assessStoryblokFallback({
  sourcesBySlug: sources(['a', 'unavailable'], ['b', 'unavailable']),
}).status, 'fail');

// Content failures are never systemic: thirteen tours failing the gate is
// thirteen editorial problems, each with its own fix, and each already
// isolated. Stopping the build would help nobody.
assert.equal(assessStoryblokFallback({
  sourcesBySlug: sources(...slugs(13, 'invalid-content')),
}).status, 'warn');

// --- The asymmetry between the modes.
const absent = sources(...slugs(12, 'applied'), ['withdrawn-tour', 'missing-story']);

// Mid-migration, a story that does not exist yet has not been withdrawn. The
// committed copy is the right thing to ship for it.
const duringMigration = assessStoryblokFallback({sourcesBySlug: absent, mode: migration});
assert.equal(duringMigration.status, 'warn');
assert.deepEqual(duringMigration.missing, ['withdrawn-tour']);
assert.deepEqual(duringMigration.withdrawn, []);
assert.match(duringMigration.message, /not yet in Storyblok/);

// Under production delivery the same absence is an editor unpublishing a tour.
// Falling back would put it straight back on the site, which is the one thing
// an intentional hide must never do.
const inProduction = assessStoryblokFallback({sourcesBySlug: absent, mode: production});
assert.deepEqual(inProduction.withdrawn, ['withdrawn-tour'],
  'an unpublished story is a withdrawal, not a gap to fill from the committed copy');
assert.deepEqual(inProduction.missing, []);
assert.equal(inProduction.status, 'ok',
  'a deliberate withdrawal is not a build problem');

// --- No message may carry a credential.
for (const report of [oneBad, outage, gated, duringMigration, inProduction, allApplied]) {
  assert(!report.message.includes('secret'), 'policy messages must never quote a token');
}

console.log('Storyblok fallback policy tests passed.');
