import assert from 'node:assert/strict';
import {
  ABOUT_STORY_SLUG,
  loadStoryblokAbout,
  mapStoryblokAbout,
} from '../scripts/storyblok-about-source.mjs';

const blok = (component, fields) => ({component, ...fields});
const asset = (name, focus) => ({
  filename: `https://a.storyblok.com/f/294832753590557/700x850/abc/${name}.jpg`,
  alt: `A photograph of ${name}`,
  ...(focus ? {focus} : {}),
});

const content = (overrides = {}) => ({
  component: 'about_page',
  published: true,
  hero_title: 'The People Behind the Places',
  hero_subtitle: 'We grew up here.',
  story_eyebrow: 'How It Began',
  story_title: 'From Passion to Purpose',
  story_paragraphs: [blok('about_paragraph', {text: 'A first paragraph.'})],
  mission_eyebrow: 'Our Mission',
  mission_title: 'A Return, and a Welcome',
  mission_lede: 'A lede.',
  mission_body: 'A body.',
  mission_proof: [blok('about_mission_proof', {place: 'Cape Coast', craft: 'Heritage'})],
  difference_eyebrow: 'Why Choose Us',
  difference_title: 'The Difference Is Real',
  difference_intro: 'An intro.',
  difference_items: [blok('about_difference', {title: 'Local hosts', text: 'We live here.'})],
  team_eyebrow: 'The Team',
  team_title: 'Ghana-Founded, Ghana-Led',
  team_intro: 'An intro.',
  team_note: 'A note.',
  team: [blok('about_team_member', {name: 'Isaac Yeboah', role: 'Co-founder', bio: 'A bio.', photo: {}})],
  impact_stats: [blok('about_stat', {value: '300+', label: 'Guests Hosted'})],
  faqs: [blok('faq_item', {question: 'A question?', answer: 'An answer.'})],
  cta_eyebrow: 'Come and See',
  cta_title: 'Come and Meet Ghana With Us',
  ...overrides,
});
const story = (o = {}) => ({slug: 'about', content: content(o)});

// --- A complete story maps onto the shape the About injector already consumes.
{
  const m = mapStoryblokAbout(story());
  assert(m && !m.hidden);
  assert.equal(m.heroTitle, 'The People Behind the Places');
  assert.deepEqual(m.storyParagraphs, ['A first paragraph.']);
  assert.deepEqual(m.missionProof, [{place: 'Cape Coast', craft: 'Heritage'}]);
  assert.deepEqual(m.impactStats, [{value: '300+', label: 'Guests Hosted'}]);
  assert.deepEqual(m.faqs, [{question: 'A question?', answer: 'An answer.'}]);
  assert.equal(m.team[0].name, 'Isaac Yeboah');
  assert(!('photo' in m.team[0]), 'an empty photograph field must not become an empty photo object');
}

// --- Team photographs are optional, and unusable ones are dropped rather than shipped.
{
  const withPhoto = mapStoryblokAbout(story({
    team: [blok('about_team_member', {name: 'Isaac Yeboah', role: 'Co-founder', bio: 'A bio.', photo: asset('isaac', '350x425:351x426')})],
  }));
  assert.match(withPhoto.team[0].photo.src, /\/m\/700x850\//, 'a team photo is requested at its display size');
  assert.match(withPhoto.team[0].photo.src, /filters:focal\(350x425:351x426\)/);
  assert.equal(withPhoto.team[0].photo.alt, 'A photograph of isaac');

  const noAlt = mapStoryblokAbout(story({
    team: [blok('about_team_member', {name: 'Isaac Yeboah', photo: {filename: asset('isaac').filename}})],
  }));
  assert(!('photo' in noAlt.team[0]), 'a photograph without alt text must not ship');

  const foreign = mapStoryblokAbout(story({
    team: [blok('about_team_member', {name: 'Isaac Yeboah', photo: {filename: 'https://example.com/x.jpg', alt: 'x'}})],
  }));
  assert(!('photo' in foreign.team[0]), 'a photograph from another host must not ship');
}

// --- The content gate. Each of these keeps the current About page, because each
//     would otherwise render a visibly empty band.
for (const [name, override] of Object.entries({
  'no heading': {hero_title: ''},
  'no story paragraphs': {story_paragraphs: []},
  'no mission proof': {mission_proof: []},
  'no reasons': {difference_items: []},
  'no team': {team: []},
  'no impact figures': {impact_stats: []},
  'no questions': {faqs: []},
})) {
  assert.equal(mapStoryblokAbout(story(override)), undefined, `${name} must fall back`);
}
assert.equal(mapStoryblokAbout({content: {component: 'homepage'}}), undefined, 'another component must not map');
assert.equal(mapStoryblokAbout(undefined), undefined);

// --- The editor's switch is read before the content gate.
assert.deepEqual(mapStoryblokAbout(story({published: false, hero_title: ''})), {hidden: true});

// --- Loading, and every path back to the current About page.
const base = {heroTitle: 'Committed heading', somethingTheModelDoesNotCover: true};
const env = {STORYBLOK_ABOUT_ENABLED: 'true', STORYBLOK_REGION: 'eu', STORYBLOK_PREVIEW_API_TOKEN: 'preview-secret'};
const respond = body => async () => new Response(JSON.stringify(body), {status: 200});
const load = (opts = {}) => loadStoryblokAbout({baseContent: base, env, logger: {warn() {}}, ...opts});

{
  const ok = await load({fetchImpl: respond({story: story()})});
  assert.equal(ok.source, 'applied');
  assert.equal(ok.content.heroTitle, 'The People Behind the Places');
  assert.equal(ok.content.somethingTheModelDoesNotCover, true,
    'fields the model does not cover must survive the merge');
}
for (const [name, opts, expected] of [
  ['switched off', {env: {...env, STORYBLOK_ABOUT_ENABLED: 'false'}}, 'disabled'],
  ['no token', {env: {...env, STORYBLOK_PREVIEW_API_TOKEN: ''}}, 'missing-configuration'],
  ['wrong region', {env: {...env, STORYBLOK_REGION: 'us'}}, 'unsupported-region'],
  ['story missing', {fetchImpl: async () => new Response('', {status: 404})}, 'missing-story'],
  ['credential rejected', {fetchImpl: async () => new Response('', {status: 401})}, 'unauthorized'],
  ['content gate failed', {fetchImpl: respond({story: story({faqs: []})})}, 'invalid-content'],
  ['editor switched it off', {fetchImpl: respond({story: story({published: false})})}, 'editorial-suppressed'],
]) {
  const r = await load({fetchImpl: respond({story: story()}), ...opts});
  assert.equal(r.source, expected, `${name} -> ${expected}`);
  assert.equal(r.content, base, `${name} must return the current About page untouched`);
}
{
  const r = await load({fetchImpl: async () => { throw new TypeError('fetch failed'); }});
  assert.equal(r.source, 'unavailable');
  assert.equal(r.content, base);
}

// --- Delivery separation: published content is never read with a preview token.
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
assert.equal(ABOUT_STORY_SLUG, 'about');

console.log('Storyblok About page contract tests passed.');
