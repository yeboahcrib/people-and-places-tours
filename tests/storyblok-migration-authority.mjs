import assert from 'node:assert/strict';
import {
  STORYBLOK_TOUR_AUTHORITY,
  authorityFor,
  isAuthoritative,
} from '../scripts/storyblok-migration-authority.mjs';
import {
  STORYBLOK_STANDARD_TOUR_REGISTRY,
  STORYBLOK_MULTI_DAY_REGISTRY,
  loadStoryblokStandardTours,
  loadStoryblokMultiDayTours,
} from '../scripts/storyblok-tour-source.mjs';
import {STORYBLOK_MODES, assessStoryblokFallback} from '../scripts/storyblok-fallback-policy.mjs';
import {makeStory} from './helpers/storyblok-tour-fixtures.mjs';

const {production, migration} = STORYBLOK_MODES;

// --- The registry covers the catalogue exactly, and nothing more.
const registrySlugs = [
  ...STORYBLOK_STANDARD_TOUR_REGISTRY.map(e => e.slug),
  ...STORYBLOK_MULTI_DAY_REGISTRY.map(e => e.slug),
].sort();
assert.deepEqual(Object.keys(STORYBLOK_TOUR_AUTHORITY).sort(), registrySlugs,
  'the authority registry must name every migrated product and no others');
assert.equal(registrySlugs.length, 13);
for (const value of Object.values(STORYBLOK_TOUR_AUTHORITY)) {
  assert(['authoritative', 'pending'].includes(value), 'only two states are allowed');
}

// The three asset-blocked products stay pending. A Storyblok draft existing is
// not grounds for promotion, which is exactly why this file is written by hand.
for (const slug of ['accra-food', 'volta-community', 'just-go-ghana']) {
  assert.equal(authorityFor(slug), 'pending', `${slug} is asset-blocked and must stay pending`);
}
assert.equal(Object.values(STORYBLOK_TOUR_AUTHORITY).filter(v => v === 'authoritative').length, 10);
// An unknown slug must never be treated as owned by Storyblok.
assert.equal(authorityFor('not-a-tour'), 'pending');
assert.equal(isAuthoritative('cape-coast'), true);

// --- Fixtures.
const env = {
  STORYBLOK_STANDARD_TOURS_ENABLED: 'true',
  STORYBLOK_MULTI_DAY_ENABLED: 'true',
  STORYBLOK_REGION: 'eu',
  STORYBLOK_PREVIEW_API_TOKEN: 'test-token',
};
const base = STORYBLOK_STANDARD_TOUR_REGISTRY.map((entry, index) => ({
  slug: entry.slug,
  title: 'COMMITTED ' + entry.slug,
  detailUrl: entry.slug + '.html',
  image: 'assets/' + entry.slug + '.jpg',
  price: '$999 STALE',
  packageOrder: index,
}));

/** Answer per slug: 'ok' | 'missing' | 'hidden' | 'broken' | number (HTTP status). */
const responder = plan => async request => {
  const fullSlug = new URL(request).pathname.replace('/v2/cdn/stories/', '');
  const entry = [...STORYBLOK_STANDARD_TOUR_REGISTRY, ...STORYBLOK_MULTI_DAY_REGISTRY]
    .find(e => e.fullSlug === fullSlug);
  const how = plan[entry?.slug] ?? 'ok';
  if (typeof how === 'number') return new Response('', {status: how});
  if (how === 'missing') return new Response('', {status: 404});
  // Distinct display orders: identical ones collide and the loader drops both,
  // which would mask whatever the scenario is actually testing.
  const order = [...STORYBLOK_STANDARD_TOUR_REGISTRY, ...STORYBLOK_MULTI_DAY_REGISTRY]
    .findIndex(e => e.slug === entry.slug) + 1;
  const contentOverrides = {displayOrder: order,
    ...(how === 'hidden' ? {published: false} : {}),
    ...(how === 'broken' ? {card_image: undefined, hero_image: undefined} : {})};
  const story = makeStory(entry.slug, {fullSlug: entry.fullSlug, contentOverrides});
  return new Response(JSON.stringify({story}), {status: 200});
};

const load = (plan, opts = {}) => loadStoryblokStandardTours({
  baseTours: base, env, logger: {warn(){}}, fetchImpl: responder(plan), ...opts,
});
const slugsIn = result => result.tours.map(t => t.slug);

// 1. authoritative + published story exists -> Storyblok applies.
{
  const r = await load({}, {authoritativeDelivery: true});
  assert.equal(r.sourcesBySlug['cape-coast'], 'applied');
  assert(slugsIn(r).includes('cape-coast'));
  assert.equal(r.tours.find(t => t.slug === 'cape-coast').title, 'cape-coast from Storyblok');
}

// 2. authoritative + published story missing -> withdrawn, and NO stale fallback.
//    This is the defect Phase 3H found: the card used to come back from tours.js.
{
  const r = await load({'cape-coast': 'missing'}, {authoritativeDelivery: true});
  assert.equal(r.sourcesBySlug['cape-coast'], 'withdrawn');
  assert(!slugsIn(r).includes('cape-coast'),
    'a withdrawn authoritative tour must leave the catalogue, not fall back');
  assert(!r.tours.some(t => t.title === 'COMMITTED cape-coast'),
    'the committed copy of a withdrawn tour must not be rendered');
  assert(!r.tours.some(t => t.price === '$999 STALE' && t.slug === 'cape-coast'));
}

// 3. pending + published story missing -> fallback, reported as not yet migrated.
{
  const r = await load({'accra-food': 'missing'}, {authoritativeDelivery: true});
  assert.equal(r.sourcesBySlug['accra-food'], 'pending-not-migrated');
  assert(slugsIn(r).includes('accra-food'), 'a pending tour keeps its committed fallback');
  assert.equal(r.tours.find(t => t.slug === 'accra-food').title, 'COMMITTED accra-food');
  const verdict = assessStoryblokFallback({sourcesBySlug: r.sourcesBySlug, mode: production});
  assert.notEqual(verdict.status, 'fail', 'a pending migration is not a systemic failure');
}

// 4. pending + valid story -> applies where the delivery semantics permit.
{
  const r = await load({}, {authoritativeDelivery: true});
  assert.equal(r.sourcesBySlug['accra-food'], 'applied',
    'a pending tour with a valid story still applies; pending governs absence, not content');
  const m = await load({});
  assert.equal(m.sourcesBySlug['accra-food'], 'applied', 'and the same holds in migration mode');
}

// 5. authoritative + editor visibility OFF -> suppressed, no fallback resurrection.
{
  const r = await load({'kumasi': 'hidden'}, {authoritativeDelivery: true});
  assert.equal(r.sourcesBySlug['kumasi'], 'editorial-suppressed');
  assert(!slugsIn(r).includes('kumasi'),
    'an intentionally hidden tour must not be replaced by the committed copy');
  const verdict = assessStoryblokFallback({sourcesBySlug: r.sourcesBySlug, mode: production});
  assert(verdict.withdrawn.includes('kumasi'));
  assert.notEqual(verdict.status, 'fail', 'suppression is editorial, not a build failure');
}

// 6. One authoritative tour withdrawn -> the others carry on.
{
  const r = await load({'volta': 'missing'}, {authoritativeDelivery: true});
  assert.equal(r.sourcesBySlug['volta'], 'withdrawn');
  assert.equal(slugsIn(r).length, base.length - 1, 'exactly one record leaves the catalogue');
  for (const slug of ['cape-coast', 'kumasi', 'aburi', 'batik-workshop']) {
    assert.equal(r.sourcesBySlug[slug], 'applied', `${slug} must be unaffected`);
    assert(slugsIn(r).includes(slug));
  }
}

// 7. The asset-blocked products stay fallback-safe: they fail the content gate,
//    and being pending means that keeps their committed content rather than
//    removing them.
{
  const r = await load({'accra-food': 'broken', 'volta-community': 'broken'}, {authoritativeDelivery: true});
  for (const slug of ['accra-food', 'volta-community']) {
    assert.equal(r.sourcesBySlug[slug], 'invalid-content');
    assert(slugsIn(r).includes(slug), `${slug} is asset-blocked and must keep its fallback`);
  }
  assert.equal(slugsIn(r).length, base.length, 'no record leaves the catalogue');
}

// 8. Systemic transport failure still uses the 7-of-13 production threshold.
{
  const failing = STORYBLOK_STANDARD_TOUR_REGISTRY.slice(0, 7).map(e => e.slug);
  const plan = Object.fromEntries(failing.map(slug => [slug, 503]));
  const r = await load(plan, {authoritativeDelivery: true});
  const sources = {...r.sourcesBySlug, 'just-go-ghana': 'applied'};
  assert.equal(assessStoryblokFallback({sourcesBySlug: sources, mode: production}).status, 'fail');
  const six = Object.fromEntries(failing.slice(0, 6).map(slug => [slug, 503]));
  const r6 = await load(six, {authoritativeDelivery: true});
  assert.equal(assessStoryblokFallback({
    sourcesBySlug: {...r6.sourcesBySlug, 'just-go-ghana': 'applied'}, mode: production,
  }).status, 'warn', 'six of thirteen is still controlled fallback');
}

// 9. Credential and configuration errors still fail production immediately.
{
  const r = await load({'cape-coast': 401}, {authoritativeDelivery: true});
  assert.equal(r.sourcesBySlug['cape-coast'], 'unauthorized');
  const verdict = assessStoryblokFallback({sourcesBySlug: r.sourcesBySlug, mode: production});
  assert.equal(verdict.status, 'fail');
  assert.equal(verdict.credentialFailure, true);
  const noToken = await load({}, {
    authoritativeDelivery: true, env: {...env, STORYBLOK_PREVIEW_API_TOKEN: ''},
  });
  assert.equal(noToken.sourcesBySlug['cape-coast'], 'missing-configuration');
  assert.equal(assessStoryblokFallback({
    sourcesBySlug: noToken.sourcesBySlug, mode: production,
  }).status, 'fail');
}

// --- Migration mode must not be disturbed. Pending tours stay testable, and
//     nothing is ever removed from the catalogue during migration work.
{
  for (const plan of [{'cape-coast': 'missing'}, {'kumasi': 'hidden'}, {'volta': 'missing'}]) {
    const r = await load(plan);
    assert.equal(slugsIn(r).length, base.length,
      'migration builds must never drop a record: ' + JSON.stringify(plan));
    assert.equal(assessStoryblokFallback({sourcesBySlug: r.sourcesBySlug, mode: migration}).status, 'warn');
  }
  const missing = await load({'cape-coast': 'missing'});
  assert.equal(missing.sourcesBySlug['cape-coast'], 'missing-story',
    'migration keeps its existing vocabulary');
}

// --- The one multi-day record follows the same rules, and is pending.
{
  const mdBase = [{slug: 'just-go-ghana', title: 'COMMITTED just-go-ghana', detailUrl: 'just-go-ghana.html', image: 'assets/j.jpg', packageOrder: 0}];
  const r = await loadStoryblokMultiDayTours({
    baseTours: mdBase, env, logger: {warn(){}},
    fetchImpl: responder({'just-go-ghana': 'missing'}), authoritativeDelivery: true,
  });
  assert.equal(r.sourcesBySlug['just-go-ghana'], 'pending-not-migrated');
  assert.equal(r.tours.length, 1, 'Just Go Ghana is pending and keeps its fallback');
}

// --- Delivery separation: which content, read with which credential.
// Authoritative delivery must never read draft content, and must never accept
// the Preview token — crossing those is how unpublished content reaches the
// public site.
{
  const seen = [];
  const spy = async request => {
    const url = new URL(request);
    seen.push({version: url.searchParams.get('version'), token: url.searchParams.get('token')});
    return new Response('', {status: 404});
  };
  const credentials = {
    STORYBLOK_STANDARD_TOURS_ENABLED: 'true',
    STORYBLOK_REGION: 'eu',
    STORYBLOK_PREVIEW_API_TOKEN: 'preview-secret',
    STORYBLOK_PUBLIC_API_TOKEN: 'public-secret',
  };

  await loadStoryblokStandardTours({
    baseTours: base, env: credentials, logger: {warn(){}}, fetchImpl: spy,
    authoritativeDelivery: true,
    contentVersion: production.contentVersion,
    tokenEnvVar: production.tokenEnvVar,
  });
  assert(seen.length > 0, 'the spy must have seen requests');
  for (const call of seen) {
    assert.equal(call.version, 'published', 'authoritative delivery must request published content');
    assert.equal(call.token, 'public-secret', 'authoritative delivery must use the Public token');
    assert.notEqual(call.token, 'preview-secret', 'the Preview token must never serve authoritative delivery');
  }

  // Migration delivery keeps draft and the Preview token.
  seen.length = 0;
  await loadStoryblokStandardTours({
    baseTours: base, env: credentials, logger: {warn(){}}, fetchImpl: spy,
    contentVersion: migration.contentVersion,
    tokenEnvVar: migration.tokenEnvVar,
  });
  for (const call of seen) {
    assert.equal(call.version, 'draft');
    assert.equal(call.token, 'preview-secret');
  }

  // And the default, with nothing specified, stays on the migration pair.
  seen.length = 0;
  await loadStoryblokStandardTours({
    baseTours: base, env: credentials, logger: {warn(){}}, fetchImpl: spy,
  });
  assert.equal(seen[0].version, 'draft', 'the default must remain draft');
  assert.equal(seen[0].token, 'preview-secret', 'the default must remain the Preview token');

  // Authoritative delivery without a Public token is a configuration failure,
  // not a silent downgrade to the Preview credential.
  const noPublic = await loadStoryblokStandardTours({
    baseTours: base, logger: {warn(){}}, fetchImpl: spy,
    env: {...credentials, STORYBLOK_PUBLIC_API_TOKEN: ''},
    authoritativeDelivery: true,
    contentVersion: production.contentVersion,
    tokenEnvVar: production.tokenEnvVar,
  });
  assert.equal(noPublic.sourcesBySlug['cape-coast'], 'missing-configuration',
    'a missing Public token must not fall back to the Preview token');
}

console.log('Storyblok migration-authority and withdrawal tests passed.');
