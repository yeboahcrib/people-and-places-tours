import assert from 'node:assert/strict';
import {
  CONTACT_STORY_SLUG,
  loadStoryblokContact,
  mapStoryblokContact,
} from '../scripts/storyblok-contact-source.mjs';

const blok = (component, fields) => ({component, ...fields});
const content = (overrides = {}) => ({
  component: 'contact_page',
  published: true,
  eyebrow: 'Begin Your Journey',
  title: 'A few details. Then we plan it together.',
  intro: 'This is the start of a conversation.',
  hero_subtitle: 'Whether this will be your first time in Ghana.',
  step1_name: 'Your trip',
  step1_legend: 'Tell us about the experience',
  step1_help: 'Rough answers are fine.',
  next_label: 'Continue Your Journey',
  next_note: 'You are not committing to anything yet.',
  step2_name: 'How we reach you',
  step2_legend: 'How should our team reach you?',
  step2_help: 'Just enough to write back.',
  submit_label: "Let's Plan Together",
  submit_note: 'We usually reply within an hour.',
  privacy_note: 'We use these details only to reply.',
  alt_prompt: 'Would you rather just talk it through?',
  success_title: 'Your Ghana journey has started.',
  success_text: 'Someone will be in touch.',
  trust_points: [blok('contact_trust_point', {label: 'Ghana-based team', icon: 'pin'})],
  next_steps_title: 'What happens after you say hello?',
  next_steps_intro: 'A real person takes it from here.',
  next_steps: [blok('contact_next_step', {title: 'We read your note', description: 'Properly.'})],
  talk_title: 'Would you rather talk?',
  talk_text: 'Call or message us directly.',
  faqs: [blok('faq_item', {question: 'A question?', answer: 'An answer.'})],
  ...overrides,
});
const story = (o = {}) => ({slug: 'contact', content: content(o)});

// --- A complete story maps onto the copy shape the booking renderer consumes.
{
  const m = mapStoryblokContact(story());
  assert(m && !m.hidden);
  assert.equal(m.title, 'A few details. Then we plan it together.');
  assert.equal(m.submitLabel, "Let's Plan Together");
  assert.deepEqual(m.trustPoints, [{label: 'Ghana-based team', icon: 'pin'}]);
  assert.deepEqual(m.nextSteps, [{title: 'We read your note', description: 'Properly.'}]);
  assert.deepEqual(m.faqs, [{question: 'A question?', answer: 'An answer.'}]);

  // The model must carry copy and nothing else. Anything resembling a field
  // definition here would mean the CMS had reached into the form.
  const forbidden = ['fields', 'required', 'validation', 'action', 'method', 'turnstile', 'endpoint'];
  for (const key of Object.keys(m)) {
    assert(!forbidden.some(f => key.toLowerCase().includes(f)),
      `the contact model must not carry form structure, found "${key}"`);
  }
}

// --- Only icons the renderer can draw survive; anything else becomes the default
//     rather than rendering nothing.
{
  for (const icon of ['pin', 'clock', 'lock']) {
    const m = mapStoryblokContact(story({trust_points: [blok('contact_trust_point', {label: 'A point', icon})]}));
    assert.equal(m.trustPoints[0].icon, icon);
  }
  const odd = mapStoryblokContact(story({trust_points: [blok('contact_trust_point', {label: 'A point', icon: 'rocket'})]}));
  assert.equal(odd.trustPoints[0].icon, 'pin', 'an unknown icon falls back rather than drawing nothing');
}

// --- The content gate. Every control the visitor operates must keep its wording;
//     an empty button is worse than slightly older copy.
for (const key of ['title', 'step1_name', 'step1_legend', 'next_label',
  'step2_name', 'step2_legend', 'submit_label', 'success_title']) {
  assert.equal(mapStoryblokContact(story({[key]: ''})), undefined, `empty ${key} must fall back`);
}
for (const key of ['trust_points', 'next_steps', 'faqs']) {
  assert.equal(mapStoryblokContact(story({[key]: []})), undefined, `empty ${key} must fall back`);
}
assert.equal(mapStoryblokContact({content: {component: 'about_page'}}), undefined);
assert.equal(mapStoryblokContact(undefined), undefined);

// --- The editor's switch is read before the content gate.
assert.deepEqual(mapStoryblokContact(story({published: false, title: ''})), {hidden: true});

// --- Loading, and every path back to the current wording.
const base = {
  title: 'Committed heading',
  coverPhoto: {src: 'https://cdn.sanity.io/x.jpg'},
  primaryPhone: '+233 50 367 3473',
};
const env = {STORYBLOK_CONTACT_ENABLED: 'true', STORYBLOK_REGION: 'eu', STORYBLOK_PREVIEW_API_TOKEN: 'preview-secret'};
const respond = body => async () => new Response(JSON.stringify(body), {status: 200});
const load = (opts = {}) => loadStoryblokContact({baseContent: base, env, logger: {warn() {}}, ...opts});

{
  const ok = await load({fetchImpl: respond({story: story()})});
  assert.equal(ok.source, 'applied');
  assert.equal(ok.content.title, 'A few details. Then we plan it together.');
  // The page's photograph and the site-wide contact details are not part of this
  // model and must survive it untouched.
  assert.deepEqual(ok.content.coverPhoto, base.coverPhoto,
    'the contact hero photograph stays with its own source');
  assert.equal(ok.content.primaryPhone, base.primaryPhone);
}
for (const [name, opts, expected] of [
  ['switched off', {env: {...env, STORYBLOK_CONTACT_ENABLED: 'false'}}, 'disabled'],
  ['no token', {env: {...env, STORYBLOK_PREVIEW_API_TOKEN: ''}}, 'missing-configuration'],
  ['wrong region', {env: {...env, STORYBLOK_REGION: 'us'}}, 'unsupported-region'],
  ['story missing', {fetchImpl: async () => new Response('', {status: 404})}, 'missing-story'],
  ['credential rejected', {fetchImpl: async () => new Response('', {status: 401})}, 'unauthorized'],
  ['content gate failed', {fetchImpl: respond({story: story({submit_label: ''})})}, 'invalid-content'],
  ['editor switched it off', {fetchImpl: respond({story: story({published: false})})}, 'editorial-suppressed'],
]) {
  const r = await load({fetchImpl: respond({story: story()}), ...opts});
  assert.equal(r.source, expected, `${name} -> ${expected}`);
  assert.equal(r.content, base, `${name} must return the current wording untouched`);
}
{
  const r = await load({fetchImpl: async () => { throw new TypeError('fetch failed'); }});
  assert.equal(r.source, 'unavailable');
  assert.equal(r.content, base);
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
assert.equal(CONTACT_STORY_SLUG, 'contact');

console.log('Storyblok Contact copy contract tests passed.');
