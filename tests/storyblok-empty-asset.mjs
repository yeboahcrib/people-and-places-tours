/**
 * An empty Storyblok asset field means "no picture", not "a broken picture".
 *
 * Storyblok writes an unset asset as an object rather than as nothing:
 *
 *   {id: null, filename: "", alt: null, fieldtype: "asset", meta_data: {}}
 *
 * The Studio renders that as "+ Add Asset", so an editor looking at the field
 * is told it is empty — and it is. A truthiness check on the object disagrees,
 * reads it as a chosen picture, fails to validate it, and refuses the whole
 * tour for a hero image nobody set.
 *
 * That is what it cost when it happened: two migrated tours would not apply,
 * and the cause could not be cleared from the Studio, because the field the
 * editor would have to fix already looked empty. Hence this file.
 */
import assert from 'node:assert/strict';
import {mapStoryblokTour} from '../scripts/storyblok-tour-source.mjs';

/** Exactly what Storyblok stores for an asset field nobody has filled in. */
const EMPTY_ASSET = {
  id: null, alt: null, name: '', focus: null, title: null, source: null,
  filename: '', copyright: null, fieldtype: 'asset', meta_data: {},
};
const REAL_ASSET = {
  id: 1, filename: 'https://a.storyblok.com/f/294832753590557/c04f9d8b71/photo.jpg',
  alt: 'A guide pouring palm wine at a roadside distillery', focus: '',
};
const li = text => ({component: 'list_item', text});
const complete = () => ({
  component: 'tour', slug: 'volta-community', published: true, experience_type: 'day',
  name: 'Volta Community Tour', card_description: 'A day with the people who grow things.',
  duration: 'Full Day', starting_point: 'Accra, Ghana', overview: 'A day in the Volta Region.',
  price: '230', currency: 'USD', price_unit: 'Per Person', display_order: '13',
  destination: 'volta', categories: ['culture'], vibes: ['Culture'],
  locations: [li('Volta')], included: [li('Lunch')], excluded: [li('Flights')],
  good_to_know: [li('Bring a hat')],
  faqs: [{component: 'faq_item', question: 'How long?', answer: 'All day.'}],
  price_options: [], seo: [{component: 'seo', title: 'Volta', description: 'A day out.'}],
  minimum_guests: '1', maximum_guests: '12',
  gallery: [{component: 'gallery_item', image: REAL_ASSET, layout: 'automatic'}],
  card_image: REAL_ASSET,
});
const run = content => mapStoryblokTour({
  story: {slug: 'volta-community', full_slug: 'tours/day-short-experiences/volta-community', content},
  baseTour: {slug: 'volta-community', detailUrl: 'volta-community-tour.html'},
  expectedFullSlug: 'tours/day-short-experiences/volta-community',
});

// The record every other case is measured against.
assert(run(complete()), 'the complete fixture should map; the rest of this file means nothing otherwise');

// ── An untouched optional asset field must not block anything ──
for (const field of ['hero_image', 'social_image']) {
  const content = complete();
  if (field === 'social_image') content.seo[0].social_image = EMPTY_ASSET;
  else content[field] = EMPTY_ASSET;

  const mapped = run(content);
  assert(mapped, `an empty ${field} placeholder refused the tour — this is the Studio's "+ Add Asset" state`);
  if (field === 'hero_image') {
    // With no hero of its own the card photo is the hero, exactly as when the
    // field is absent entirely.
    const withoutField = complete();
    delete withoutField.hero_image;
    assert.deepEqual(mapped.heroImage, run(withoutField).heroImage,
      'an empty hero placeholder produced a different hero than no hero field at all');
  }
}

// null, undefined and the empty string are all "not set" too.
for (const empty of [null, undefined, '']) {
  const content = complete();
  content.hero_image = empty;
  assert(run(content), `hero_image set to ${JSON.stringify(empty)} refused the tour`);
}

// ── A genuinely broken asset must still be refused ──
// The fix must not become a way for an unusable picture to reach the page.
for (const [label, asset] of [
  ['a filename with no alt text', {...REAL_ASSET, alt: ''}],
  ['an asset from another host', {...REAL_ASSET, filename: 'https://images.example.com/x.jpg'}],
  ['a plain-http asset', {...REAL_ASSET, filename: 'http://a.storyblok.com/f/1/2/x.jpg'}],
]) {
  const content = complete();
  content.hero_image = asset;
  assert.equal(run(content), undefined, `${label} was accepted as a hero image`);
}

// The card photo is required, so an empty placeholder there still refuses —
// "no picture" is a valid state for a hero and an invalid one for a card.
{
  const content = complete();
  content.card_image = EMPTY_ASSET;
  assert.equal(run(content), undefined, 'a tour with no card photograph was published');
}

// A gallery entry pointing at an empty asset is a half-made block, not an
// absent one, so it stays refused.
{
  const content = complete();
  content.gallery = [{component: 'gallery_item', image: EMPTY_ASSET, layout: 'automatic'}];
  assert.equal(run(content), undefined, 'a gallery block with no picture in it was accepted');
}

console.log('Storyblok empty-asset contract tests passed.');
