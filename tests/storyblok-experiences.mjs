/**
 * The Experiences add-on photograph — the last picture Sanity still owned.
 *
 * The point of this adapter is that nothing about the page changes: the same
 * photograph, at the same size, with the same description, served from a
 * different host. So most of what follows checks that it either produces that
 * exactly or gets out of the way.
 */
import assert from 'node:assert/strict';
import {
  ADD_ON_SLOT,
  EXPERIENCES_STORY_SLUG,
  loadStoryblokExperiences,
  mapStoryblokExperiences,
} from '../scripts/storyblok-experiences-source.mjs';

const quiet = {warn() {}};
const env = {STORYBLOK_EXPERIENCES_ENABLED: 'true', STORYBLOK_PREVIEW_API_TOKEN: 'token', STORYBLOK_REGION: 'eu'};
const ALT = "A guest at the potter's wheel with a Ghanaian potter guiding her hands on the clay";
const FILE = 'https://a.storyblok.com/f/294832753590557/900x1125/61ed240efa/experiences-addon-potters-wheel.jpg';

const story = (overrides = {}) => ({
  content: {
    component: 'experiences_page',
    published: true,
    add_on_photo: {filename: FILE, alt: ALT},
    add_on_alt: ALT,
    ...overrides,
  },
});
const respondWith = s => async () =>
  new Response(JSON.stringify({story: s}), {status: 200, headers: {'Content-Type': 'application/json'}});

// The committed photo the page ships with, so "unchanged" is checkable.
const BASE = {experiencesAddOn: {src: 'assets/photos/addons-potters-wheel.jpg', alt: ALT,
  width: 900, height: 1125, placeholderState: 'approved', publicApprovalState: 'approved'}};

// ── Every failure path leaves the page's current picture alone ──
for (const [label, options] of [
  ['flag off', {env: {}}],
  ['no token', {env: {STORYBLOK_EXPERIENCES_ENABLED: 'true'}}],
  ['wrong region', {env: {...env, STORYBLOK_REGION: 'us'}}],
  ['network failure', {env, fetchImpl: async () => { throw new Error('down'); }}],
  ['switched off', {env, fetchImpl: respondWith(story({published: false}))}],
  ['wrong component', {env, fetchImpl: respondWith({content: {component: 'about_page', published: true}})}],
  ['no photo', {env, fetchImpl: respondWith(story({add_on_photo: null}))}],
  ['photo off another host', {env, fetchImpl: respondWith(story({add_on_photo: {filename: 'https://evil.example.com/x.jpg'}}))}],
  ['no description', {env, fetchImpl: respondWith(story({add_on_alt: '', add_on_photo: {filename: FILE, alt: ''}}))}],
]) {
  const {photos, source} = await loadStoryblokExperiences({basePhotos: BASE, logger: quiet, ...options});
  assert.notEqual(source, 'applied', `${label} must not report applied`);
  assert.deepEqual(photos, BASE, `${label} changed the photograph on the page`);
}

// ── The happy path ──
{
  const {photos, source} = await loadStoryblokExperiences({
    basePhotos: BASE, env, logger: quiet, fetchImpl: respondWith(story()),
  });
  assert.equal(source, 'applied');
  const photo = photos.experiencesAddOn;
  assert(photo.src.startsWith('https://a.storyblok.com/'), 'the photo is not served from the Storyblok EU host');
  assert(photo.src.includes(`/m/${ADD_ON_SLOT.width}x${ADD_ON_SLOT.height}/`),
    `the photo is not requested at the ${ADD_ON_SLOT.width}x${ADD_ON_SLOT.height} slot: ${photo.src}`);
  // Same description as the record it replaces. This is not decorative — it
  // shows a guest being taught, which is what the section is about.
  assert.equal(photo.alt, ALT);
  assert.equal(photo.width, BASE.experiencesAddOn.width);
  assert.equal(photo.height, BASE.experiencesAddOn.height);
  assert.equal(photo.placeholderState, 'approved');
  assert.equal(photo.publicApprovalState, 'approved');
}

// The hero has no Storyblok record and must survive untouched, so this is a
// merge and not a replacement.
{
  const withHero = {...BASE, experiencesHero: {src: 'assets/photos/hero.jpg', alt: '',
    placeholderState: 'approved', publicApprovalState: 'approved'}};
  const {photos} = await loadStoryblokExperiences({
    basePhotos: withHero, env, logger: quiet, fetchImpl: respondWith(story()),
  });
  assert.deepEqual(photos.experiencesHero, withHero.experiencesHero,
    'the Experiences hero was disturbed by the add-on migration');
  assert.notEqual(photos.experiencesAddOn.src, BASE.experiencesAddOn.src);
}

// The page's own description wins over the asset's, and an asset-only
// description still works.
assert.equal(mapStoryblokExperiences(story({add_on_alt: 'Page wins'})).experiencesAddOn.alt, 'Page wins');
assert.equal(
  mapStoryblokExperiences(story({add_on_alt: '', add_on_photo: {filename: FILE, alt: 'Asset alt'}}))
    .experiencesAddOn.alt, 'Asset alt');

assert.equal(EXPERIENCES_STORY_SLUG, 'experiences');
assert.deepEqual(mapStoryblokExperiences(story({published: false})), {hidden: true});
assert.equal(mapStoryblokExperiences({content: {component: 'tour', published: true}}), undefined);

console.log('Storyblok experiences photo contract tests passed.');
