import assert from 'node:assert/strict';
import {
  loadStoryblokPolicy,
  mapStoryblokPolicy,
  policyStorySlug,
} from '../scripts/storyblok-policy-source.mjs';

const blok = (component, fields) => ({component, ...fields});
const item = (over = {}) => blok('policy_item', {term: 'A term', text: 'What it means.', ...over});
const section = (over = {}) => blok('policy_section', {heading: 'A heading', items: [item()], ...over});

const content = (over = {}) => ({
  component: 'policy_page',
  published: true,
  policy_type: 'cancellation',
  title: 'Cancellation & Refund Policy',
  last_updated: '2026-08-22',
  intro: 'At People & Places, we pride ourselves on curating immersive journeys.',
  sections: [section()],
  contact_intro: 'If you have any questions, or need to request a cancellation.',
  closing: 'By booking with People & Places, you acknowledge this policy.',
  ...over,
});
const story = (o = {}) => ({slug: 'cancellation', content: content(o)});

// --- A complete policy maps onto the shape the policy renderer consumes.
{
  const m = mapStoryblokPolicy(story(), 'cancellation');
  assert(m && !m.hidden);
  assert.equal(m.title, 'Cancellation & Refund Policy');
  assert.equal(m.lastUpdated, '2026-08-22');
  assert.deepEqual(m.sections[0].items, [{term: 'A term', text: 'What it means.'}]);
  assert.equal(m.closing, 'By booking with People & Places, you acknowledge this policy.');
  assert(!('intro' in m.sections[0]), 'a section without an introduction must not gain an empty one');
}

// --- Only two policies carry a closing paragraph; the others must not gain one.
{
  const m = mapStoryblokPolicy(story({closing: ''}), 'cancellation');
  assert(!('closing' in m), 'an empty closing must stay absent rather than becoming an empty paragraph');
}

// --- A link is only carried when both halves are present.
{
  const withLink = mapStoryblokPolicy(story({
    sections: [section({items: [item({link_label: 'Read the insurance requirements', link_href: 'travel-insurance.html'})]})],
  }), 'cancellation');
  assert.deepEqual(withLink.sections[0].items[0].link,
    {label: 'Read the insurance requirements', href: 'travel-insurance.html'});
  const halfLink = mapStoryblokPolicy(story({
    sections: [section({items: [item({link_label: 'Read this'})]})],
  }), 'cancellation');
  assert(!('link' in halfLink.sections[0].items[0]), 'a label with no address must not become a link');
}

// --- A document claiming to be a different policy is never published as this one.
assert.equal(mapStoryblokPolicy(story({policy_type: 'privacy'}), 'cancellation'), undefined,
  'a mismatched policy type must be refused rather than guessed at');
assert(mapStoryblokPolicy(story({policy_type: 'privacy'}), 'privacy'), 'and accepted for its own page');

// --- The gate is strict, because a policy with a hole in it is worse than an
//     older policy. Each of these keeps the current wording.
for (const [name, over] of Object.entries({
  'no title': {title: ''},
  'no date': {last_updated: ''},
  'no introduction': {intro: ''},
  'no contact line': {contact_intro: ''},
  'no sections': {sections: []},
  'a section with no heading': {sections: [section({heading: ''})]},
  'a section with no points': {sections: [section({items: []})]},
  'a point with no term': {sections: [section({items: [item({term: ''})]})]},
  'a point with no text': {sections: [section({items: [item({text: ''})]})]},
})) {
  assert.equal(mapStoryblokPolicy(story(over), 'cancellation'), undefined, `${name} must fall back`);
}

// --- A policy is never published shortened: if one section of several would be
//     dropped, the whole page keeps its current wording.
{
  const partial = mapStoryblokPolicy(story({
    sections: [section(), section({heading: 'Second', items: []})],
  }), 'cancellation');
  assert.equal(partial, undefined, 'dropping one section must fail the whole policy, not shorten it');
}

assert.equal(mapStoryblokPolicy({content: {component: 'about_page'}}, 'cancellation'), undefined);
assert.equal(mapStoryblokPolicy(undefined, 'cancellation'), undefined);
assert.deepEqual(mapStoryblokPolicy(story({published: false, title: ''}), 'cancellation'), {hidden: true});

// --- Loading, and every path back to the current wording.
const base = {title: 'Committed policy', sections: [{heading: 'Committed', items: []}]};
const env = {STORYBLOK_POLICIES_ENABLED: 'true', STORYBLOK_REGION: 'eu', STORYBLOK_PREVIEW_API_TOKEN: 'preview-secret'};
const respond = body => async () => new Response(JSON.stringify(body), {status: 200});
const load = (opts = {}) => loadStoryblokPolicy({
  policyType: 'cancellation', baseContent: base, env, logger: {warn() {}}, ...opts,
});

{
  const ok = await load({fetchImpl: respond({story: story()})});
  assert.equal(ok.source, 'applied');
  assert.equal(ok.content.title, 'Cancellation & Refund Policy');
  // Replaced whole. A policy must never be a blend of two documents.
  assert(!('sections' in base) || ok.content.sections !== base.sections);
  assert.equal(Object.keys(ok.content).some(k => !(k in mapStoryblokPolicy(story(), 'cancellation'))), false,
    'no key may survive from the previous document');
}
for (const [name, opts, expected] of [
  ['switched off', {env: {...env, STORYBLOK_POLICIES_ENABLED: 'false'}}, 'disabled'],
  ['no token', {env: {...env, STORYBLOK_PREVIEW_API_TOKEN: ''}}, 'missing-configuration'],
  ['wrong region', {env: {...env, STORYBLOK_REGION: 'us'}}, 'unsupported-region'],
  ['story missing', {fetchImpl: async () => new Response('', {status: 404})}, 'missing-story'],
  ['credential rejected', {fetchImpl: async () => new Response('', {status: 401})}, 'unauthorized'],
  ['content gate failed', {fetchImpl: respond({story: story({intro: ''})})}, 'invalid-content'],
  ['editor switched it off', {fetchImpl: respond({story: story({published: false})})}, 'editorial-suppressed'],
]) {
  const r = await load({fetchImpl: respond({story: story()}), ...opts});
  assert.equal(r.source, expected, `${name} -> ${expected}`);
  assert.equal(r.content, base, `${name} must keep the current wording untouched`);
}
{
  const r = await load({fetchImpl: async () => { throw new TypeError('fetch failed'); }});
  assert.equal(r.source, 'unavailable');
  assert.equal(r.content, base);
}

// --- Each policy is fetched from its own story, and pages are independent.
{
  const seen = [];
  for (const type of ['cancellation', 'insurance', 'privacy', 'terms', 'travel']) {
    await loadStoryblokPolicy({
      policyType: type, baseContent: base, env, logger: {warn() {}},
      fetchImpl: async url => { seen.push(new URL(url).pathname); return new Response('', {status: 404}); },
    });
  }
  assert.deepEqual(seen, [
    '/v2/cdn/stories/policies/cancellation', '/v2/cdn/stories/policies/insurance',
    '/v2/cdn/stories/policies/privacy', '/v2/cdn/stories/policies/terms',
    '/v2/cdn/stories/policies/travel',
  ]);
  assert.equal(policyStorySlug('privacy'), 'policies/privacy');
}

// --- Delivery separation.
{
  const seen = [];
  await load({
    contentVersion: 'published', tokenEnvVar: 'STORYBLOK_PUBLIC_API_TOKEN',
    env: {...env, STORYBLOK_PUBLIC_API_TOKEN: 'public-secret'},
    fetchImpl: async url => { const u = new URL(url); seen.push({v: u.searchParams.get('version'), t: u.searchParams.get('token')}); return new Response('', {status: 404}); },
  });
  assert.equal(seen[0].v, 'published');
  assert.equal(seen[0].t, 'public-secret');
  assert.notEqual(seen[0].t, 'preview-secret');
}

console.log('Storyblok policy contract tests passed.');
