import assert from 'node:assert/strict';
import {
  HOMEPAGE_STORY_SLUG,
  loadStoryblokHomepage,
  mapStoryblokHomepage,
} from '../scripts/storyblok-homepage-source.mjs';

const asset = (name, focus) => ({
  filename: `https://a.storyblok.com/f/294832753590557/1600x900/abc/${name}.jpg`,
  alt: `A photograph of ${name}`,
  ...(focus ? {focus} : {}),
});
const blok = (component, fields) => ({component, ...fields});

const content = (overrides = {}) => ({
  component: 'homepage',
  published: true,
  hero_headline: 'The People Make the Place.',
  hero_sub: 'Whether it is your first time in Ghana or your way back.',
  hero_image: asset('hero', '2736x1824:2737x1825'),
  hero_cta_label: 'See Ghana With Us',
  hero_cta_link: 'packages.html',
  founder_eyebrow: 'The Beginning of Our Story',
  founder_headline: 'Why We Started People & Places',
  founder_body: 'A story.',
  founder_trust_note: 'Hosting since 2021.',
  founder_cta_label: 'Read our full story',
  founder_cta_link: 'about.html',
  founders: [blok('home_founder', {name: 'Isaac Yeboah', preferred_name: 'Nana Yeboah', role: 'Co-founder', initials: 'IY'})],
  ways_eyebrow: 'Where Ghana Begins For You',
  ways_title: 'What Pulls You In?',
  ways_intro: 'Some come for the history.',
  pathways: [blok('home_pathway', {title: 'History & Memory', description: 'Cape Coast and Elmina.', link: 'packages.html?category=heritage', image: asset('pathway')})],
  ways_cta_label: 'Find Your Way Into Ghana',
  ways_cta_link: 'packages.html',
  moments_eyebrow: 'From Our Trips',
  moments_title: 'Ghana, As Our Guests Met It',
  moments_intro: 'Photographs from the days themselves.',
  moments: [blok('home_moment', {image: asset('moment'), caption: 'Assin Manso', shape: 'tall'})],
  reviews_eyebrow: 'Real Reviews',
  reviews_title_lines: 'What Our\nTravellers Say',
  reviews_intro: 'From people we have welcomed.',
  reviews_image: asset('reviews'),
  rating_value: '5.0',
  rating_source: 'Google',
  rating_count: '15',
  rating_link: 'https://www.google.com/search?q=People+%26+Places',
  trust_facts: [blok('home_trust_fact', {value: '300+', label: 'Guests Hosted'})],
  reviews: [blok('home_review', {quote: 'Warmth and joy.', author: 'Louis Cameron', source_label: 'Verified Google review', review_date: '2026-02-07', rating: '5'})],
  planning_eyebrow: 'How It Works',
  planning_title: 'Planning Your Trip',
  steps: [blok('home_step', {number: '01', title: 'Tell Us About Your Trip', description: 'Share your dates.', icon: 'search'})],
  invitation_eyebrow: 'Ready When You Are',
  invitation_headline: 'Ready to See Ghana?',
  invitation_body: 'Body copy.',
  invitation_reassurance: 'Reassurance.',
  invitation_trust_message: 'Trust.',
  invitation_cta_label: 'Start Planning',
  invitation_cta_link: 'contact.html',
  invitation_secondary_label: 'Chat on WhatsApp',
  invitation_secondary_link: 'https://wa.me/233503673473',
  ...overrides,
});
const story = (overrides = {}) => ({slug: 'homepage', content: content(overrides)});

// --- A complete story maps onto the shape the renderer already consumes.
{
  const m = mapStoryblokHomepage(story());
  assert(m && !m.hidden, 'a complete story must map');
  assert.deepEqual(Object.keys(m).sort(), [
    'finalInvitation', 'founderStory', 'hero', 'planningProcess',
    'reviewsAndTrust', 'tripMoments', 'waysToExperience',
  ], 'the adapter must fill exactly the seven sections the renderer knows');
  assert.equal(m.hero.headline, 'The People Make the Place.');
  assert.deepEqual(m.hero.cta, {label: 'See Ghana With Us', href: 'packages.html'});
  assert.deepEqual(m.reviewsAndTrust.titleLines, ['What Our', 'Travellers Say']);
  assert.equal(m.reviewsAndTrust.ratingSummary.count, 15, 'a Storyblok number field arrives as a string');
  assert.equal(m.reviewsAndTrust.items[0].rating, 5);
  assert.equal(m.tripMoments.moments[0].shape, 'tall');
  assert.equal(m.planningProcess.steps[0].icon, 'search');
}

// --- Photographs are requested at the size they are shown, and carry the focal point.
{
  const m = mapStoryblokHomepage(story());
  assert.match(m.hero.image.src, /\/m\/1920x1080\//, 'the hero is requested at its display size');
  assert.match(m.hero.image.src, /filters:focal\(2736x1824:2737x1825\)/, 'the focal point must survive');
  assert.match(m.hero.image.src, /quality\(80\)/);
  assert.equal(m.hero.image.alt, 'A photograph of hero');
  // A photograph without alt text is not publishable, so its section falls back.
  assert.equal(mapStoryblokHomepage(story({hero_image: {filename: asset('hero').filename}})), undefined,
    'a hero photograph with no alt text must not ship');
}

// --- The content gate. Each of these keeps the current homepage.
const rejects = {
  'no headline': {hero_headline: ''},
  'no hero photograph': {hero_image: {}},
  'a photograph from another host': {hero_image: {filename: 'https://example.com/x.jpg', alt: 'x'}},
  'no ways to experience': {pathways: []},
  'no trip moments': {moments: []},
  'no planning steps': {steps: []},
  'no founders': {founders: []},
};
for (const [name, override] of Object.entries(rejects)) {
  assert.equal(mapStoryblokHomepage(story(override)), undefined, `${name} must fall back`);
}
assert.equal(mapStoryblokHomepage({content: {component: 'tour'}}), undefined, 'another component must not map');
assert.equal(mapStoryblokHomepage(undefined), undefined);

// --- The editor's switch is read before the content gate, so turning the page
//     off is reported as a decision rather than as broken content.
{
  const off = mapStoryblokHomepage(story({published: false, hero_headline: ''}));
  assert.deepEqual(off, {hidden: true}, 'visibility off must report suppression, not invalid content');
}

// --- Loading, and every path back to the current homepage.
const base = {hero: {headline: 'Committed headline'}, sectionOrder: [{key: 'hero'}]};
const env = {STORYBLOK_HOMEPAGE_ENABLED: 'true', STORYBLOK_REGION: 'eu', STORYBLOK_PREVIEW_API_TOKEN: 'preview-secret'};
const respond = body => async () => new Response(JSON.stringify(body), {status: 200});
const load = (opts = {}) => loadStoryblokHomepage({baseContent: base, env, logger: {warn() {}}, ...opts});

{
  const ok = await load({fetchImpl: respond({story: story()})});
  assert.equal(ok.source, 'applied');
  assert.equal(ok.content.hero.headline, 'The People Make the Place.');
  assert.deepEqual(ok.content.sectionOrder, base.sectionOrder,
    'anything the model does not cover must survive the merge untouched');
}
for (const [name, opts, expected] of [
  ['switched off', {env: {...env, STORYBLOK_HOMEPAGE_ENABLED: 'false'}}, 'disabled'],
  ['no token', {env: {...env, STORYBLOK_PREVIEW_API_TOKEN: ''}}, 'missing-configuration'],
  ['wrong region', {env: {...env, STORYBLOK_REGION: 'us'}}, 'unsupported-region'],
  ['story missing', {fetchImpl: async () => new Response('', {status: 404})}, 'missing-story'],
  ['credential rejected', {fetchImpl: async () => new Response('', {status: 401})}, 'unauthorized'],
  ['content gate failed', {fetchImpl: respond({story: story({pathways: []})})}, 'invalid-content'],
  ['editor switched it off', {fetchImpl: respond({story: story({published: false})})}, 'editorial-suppressed'],
]) {
  const r = await load({fetchImpl: respond({story: story()}), ...opts});
  assert.equal(r.source, expected, `${name} -> ${expected}`);
  assert.equal(r.content, base, `${name} must return the current homepage untouched`);
}
{
  // An unreachable host surfaces as a throw from the shared loader; the homepage
  // must survive it rather than the build failing.
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
  assert.notEqual(seen[0].t, 'preview-secret', 'the preview token must never serve published delivery');
}
assert.equal(HOMEPAGE_STORY_SLUG, 'homepage');

console.log('Storyblok homepage contract tests passed.');
