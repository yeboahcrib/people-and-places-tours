/**
 * The health report's shape, and the promises it makes to whoever reads it.
 *
 * Two separate contracts are checked here. The first is backward
 * compatibility: an external uptime monitor may already be watching the flat
 * fields, so every one of them must survive with its name and its meaning.
 * The second is that the derived view actually resolves the ambiguity it was
 * added for — a page reporting `sanity` while Storyblok is applied.
 *
 * The monitoring runbook lists what an operator has to be able to detect from
 * this file. Each of those is exercised against a deliberately broken build.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {describeSourceView} from '../scripts/health-source-view.mjs';

// ── The derived view, as a pure function ──

const base = {
  contentSource: 'sanity',
  homepageContentSource: 'sanity',
  aboutContentSource: 'sanity',
  bookingContentSource: 'sanity',
  policyContentSource: 'sanity',
  experienceContentSource: 'sanity',
  tourContentSource: 'sanity',
  storyblokHomepageSource: 'applied',
  storyblokAboutSource: 'applied',
  storyblokContactSource: 'applied',
  storyblokGlobalsSource: 'applied',
  storyblokPolicySources: {privacy: 'applied', terms: 'applied'},
  storyblokFallback: {mode: 'production', enforced: true, appliedCount: 10, attempted: 13},
};

{
  const view = describeSourceView(base);
  for (const area of ['homepage', 'about', 'contact', 'globals']) {
    assert.equal(view[area].effective, 'storyblok', `${area} did not report Storyblok as effective`);
    assert.equal(view[area].base, 'sanity', `${area} lost its base source`);
    assert.equal(view[area].storyblok, 'applied');
  }
  assert.equal(view.policies.effective, 'storyblok');
  assert.equal(view.policies.appliedCount, 2);
  assert.equal(view.policies.total, 2);
  assert.equal(view.tours.effective, 'mixed', '10 of 13 is neither fully Storyblok nor fully fallback');
  assert.equal(view.tours.fallbackCount, 3);
}

// Only a literal "applied" counts. Every other state means the base shipped,
// and reporting otherwise is the bug this file exists to prevent.
for (const state of ['disabled', 'missing-configuration', 'unavailable', 'unauthorized',
  'invalid-content', 'editorial-suppressed', 'missing-story', 'not-applicable', '', undefined]) {
  const view = describeSourceView({...base, storyblokHomepageSource: state});
  assert.equal(view.homepage.effective, 'sanity',
    `a homepage in state "${state}" was reported as shipping Storyblok`);
  assert.equal(view.homepage.storyblok, state, 'the adapter state must be passed through verbatim');
}

// Part-migrated groups must say so rather than round to either end.
{
  const partial = describeSourceView({...base,
    storyblokPolicySources: {privacy: 'applied', terms: 'invalid-content', travel: 'applied'}});
  assert.equal(partial.policies.effective, 'mixed');
  assert.equal(partial.policies.appliedCount, 2);
  assert.equal(partial.policies.total, 3);

  const none = describeSourceView({...base,
    storyblokPolicySources: {privacy: 'disabled', terms: 'disabled'}});
  assert.equal(none.policies.effective, 'sanity');
  assert.equal(none.policies.appliedCount, 0);
}

// Tours at the extremes, and with the flag off entirely.
{
  assert.equal(describeSourceView({...base,
    storyblokFallback: {...base.storyblokFallback, appliedCount: 13, attempted: 13}}).tours.effective, 'storyblok');
  assert.equal(describeSourceView({...base,
    storyblokFallback: {...base.storyblokFallback, appliedCount: 0, attempted: 13}}).tours.effective, 'sanity');
  const off = describeSourceView({...base, storyblokFallback: {mode: 'migration', attempted: 0, appliedCount: 0}});
  assert.equal(off.tours.effective, 'sanity');
  assert.equal(off.tours.fallbackCount, 0, 'a build that attempted nothing has nothing on fallback');
}

// The delivery mode is passed through, not assumed. A hardcoded 'production'
// would look correct on every production build and hide exactly the case an
// operator needs to see: a build that is still serving draft content.
for (const [mode, enforced] of [['migration', false], ['production', true]]) {
  const view = describeSourceView({...base, storyblokFallback: {...base.storyblokFallback, mode, enforced}});
  assert.equal(view.tours.mode, mode, `the view reported a delivery mode of its own instead of "${mode}"`);
  assert.equal(view.tours.enforced, enforced, 'the view did not pass through whether the threshold is enforced');
}

// A local build must never be described as Sanity-backed.
{
  const local = describeSourceView({...base, contentSource: 'local', homepageContentSource: 'local',
    storyblokHomepageSource: 'disabled'});
  assert.equal(local.homepage.effective, 'local');
  assert.equal(local.homepage.base, 'local');
}

// Experiences was never migrated; the view states that rather than leaving a gap.
assert.equal(describeSourceView(base).experiences.storyblok, 'not-migrated');

// ── The emitted file ──

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const health = JSON.parse(await readFile(`${projectRoot}dist/health.json`, 'utf8'));

// Backward compatibility: the flat contract an external monitor may watch.
const LEGACY_FIELDS = [
  'status', 'service', 'revision', 'builtAt', 'siteUrl', 'botProtection',
  'contentSource', 'tourContentSource', 'tourCount',
  'homepageContentSource', 'aboutContentSource', 'bookingContentSource',
  'policyContentSource', 'experienceContentSource',
  'storyblokStandardTourSources', 'storyblokStandardTourSummary',
  'storyblokMultiDaySources', 'storyblokMultiDaySummary',
  'storyblokHomepageSource', 'storyblokAboutSource', 'storyblokContactSource',
  'storyblokPolicySources', 'storyblokGlobalsSource', 'storyblokFallback',
];
for (const field of LEGACY_FIELDS) {
  assert(field in health, `health.json dropped the pre-existing field "${field}"`);
}
for (const field of ['contentSource', 'tourContentSource', 'homepageContentSource',
  'aboutContentSource', 'bookingContentSource', 'policyContentSource', 'experienceContentSource']) {
  assert(['local', 'sanity'].includes(health[field]),
    `${field} must keep its local/sanity contract, saw "${health[field]}"`);
}

// Tour diagnostics are preserved exactly: the derived view may summarise them
// but must never become the place they are defined.
const fallback = health.storyblokFallback;
for (const key of ['mode', 'status', 'enforced', 'attempted', 'appliedCount', 'transport',
  'content', 'missing', 'withdrawn', 'pendingMigration', 'authOrConfig', 'threshold', 'message']) {
  assert(key in fallback, `storyblokFallback lost its "${key}" diagnostic`);
}
assert(Number.isInteger(fallback.threshold) && fallback.threshold > 0, 'the systemic threshold is gone');
for (const key of ['transport', 'content', 'missing', 'withdrawn', 'authOrConfig']) {
  assert(Array.isArray(fallback[key]), `storyblokFallback.${key} must stay an array a monitor can length-check`);
}

// The derived view agrees with the fields it is derived from. If these ever
// disagree, the view is worse than useless — it is a second wrong answer.
const view = health.activeSources;
assert.equal(view.schema, 1);
for (const [area, storyblokField, baseField] of [
  ['homepage', 'storyblokHomepageSource', 'homepageContentSource'],
  ['about', 'storyblokAboutSource', 'aboutContentSource'],
  ['contact', 'storyblokContactSource', 'bookingContentSource'],
  ['globals', 'storyblokGlobalsSource', 'contentSource'],
]) {
  assert.equal(view[area].storyblok, health[storyblokField], `${area} disagrees with ${storyblokField}`);
  assert.equal(view[area].base, health[baseField], `${area} disagrees with ${baseField}`);
  assert.equal(view[area].effective,
    health[storyblokField] === 'applied' ? 'storyblok' : health[baseField],
    `${area} reports an effective source its own inputs do not support`);
}
assert.deepEqual(view.policies.storyblok, health.storyblokPolicySources);
assert.equal(view.tours.appliedCount, fallback.appliedCount);
assert.equal(view.tours.attempted, fallback.attempted);
assert.equal(view.tours.mode, fallback.mode);

// ── What the runbook requires an operator to be able to detect ──

// 1. Production mode off — visible in two places, neither of which is a guess.
assert(['migration', 'production'].includes(fallback.mode), 'the delivery mode is unreadable');
assert.equal(typeof fallback.enforced, 'boolean');
assert.equal(view.tours.mode, fallback.mode);
assert.equal(view.tours.enforced, fallback.enforced);

// 2. Applied/fallback changes — countable, not inferred from prose.
assert.equal(view.tours.appliedCount + view.tours.fallbackCount, view.tours.attempted,
  'the applied and fallback counts do not account for every attempted record');

// 3-5. Withdrawals, auth/config failures, transport failures — each its own
// array, so a monitor alerts on length rather than parsing `message`.
for (const key of ['withdrawn', 'authOrConfig', 'transport']) {
  assert(Array.isArray(fallback[key]), `${key} must be an array`);
}

// 6. Endpoint failure — the runbook's own signal.
assert.equal(health.status, 'ok');
assert.equal(health.service, 'people-and-places-website');
assert(!Number.isNaN(Date.parse(health.builtAt)), 'health.json has an unusable build time');

// Nothing secret ever reaches this file.
const serialised = JSON.stringify(health);
for (const secret of ['STORYBLOK_PREVIEW_API_TOKEN', 'STORYBLOK_MANAGEMENT_TOKEN',
  'TURNSTILE_SECRET_KEY', 'RESEND_API_KEY']) {
  assert(!serialised.includes(secret), `health.json mentions ${secret}`);
}
for (const value of [process.env.STORYBLOK_PREVIEW_API_TOKEN, process.env.STORYBLOK_PUBLIC_API_TOKEN,
  process.env.STORYBLOK_MANAGEMENT_TOKEN].filter(Boolean)) {
  assert(!serialised.includes(value), 'health.json contains a credential value');
}

console.log('Health report schema tests passed.');
