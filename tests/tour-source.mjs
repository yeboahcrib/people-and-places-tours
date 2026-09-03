import assert from 'node:assert/strict';
import {loadTourContent} from '../scripts/tour-source.mjs';
import {
  STORYBLOK_STANDARD_TOUR_REGISTRY,
  isStoryblokEuAssetUrl,
  loadOneStory,
  loadStoryblokStandardTours,
  mapStoryblokTour,
  storyblokImageUrl,
} from '../scripts/storyblok-tour-source.mjs';
import {renderStoryblokStandardToursBrowserOverlay} from '../scripts/storyblok-tour-browser-overlay.mjs';
import {renderPackageTourCards} from '../scripts/render-tour-cards.mjs';
import {renderTourPage} from '../scripts/render-tour-page.mjs';

// Keep the established local/Sanity contract covered independently of the
// Storyblok migration. These fixtures deliberately do not overlap the
// Storyblok registry, so they also prove that unrelated sources stay local.
const localTours = [
  {slug: 'alpha', title: 'Old Alpha', detailUrl: 'alpha.html', image: 'assets/alpha.jpg', packageOrder: 0},
  {slug: 'beta', title: 'Beta', detailUrl: 'beta.html', image: 'assets/beta.jpg', packageOrder: 1},
  {slug: 'gamma', title: 'Gamma', detailUrl: 'gamma.html', image: 'assets/gamma.jpg', packageOrder: 2},
];

let loaded = await loadTourContent({localTours, env: {}});
assert.equal(loaded.source, 'local');
assert.equal(loaded.tours, localTours);

loaded = await loadTourContent({
  localTours,
  env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
  fetchImpl: async () => new Response(JSON.stringify({result: {
    tours: [
      {slug: {current: 'alpha'}, title: 'New Alpha', duration: '1 Day', price: 125, currency: 'USD', groupSizeMin: 1, groupSizeMax: 8, locations: ['Accra'], description: 'Updated.', categories: ['culture'], vibes: ['History']},
      {slug: {current: 'beta'}, title: 'Beta', duration: '2 Hours', price: 80, currency: 'USD'},
      {slug: {current: 'gamma'}, title: 'Gamma', duration: '3 Hours', price: 90, currency: 'USD'},
    ],
    featured: {items: [
      {order: 2, tour: {slug: {current: 'alpha'}}},
      {order: 1, tour: {slug: {current: 'beta'}}},
      {order: 3, tour: {slug: {current: 'gamma'}}},
    ]},
  }}), {status: 200, headers: {'Content-Type': 'application/json'}}),
});
assert.equal(loaded.source, 'sanity');
assert.equal(loaded.tours[0].title, 'New Alpha');
assert.equal(loaded.tours[0].price, '$125');
assert.equal(loaded.tours[0].groupSize, '1-8 People');
assert.equal(loaded.tours[0].image, 'assets/alpha.jpg');
assert.equal(loaded.tours[0].homeOrder, 2);

await assert.rejects(
  loadTourContent({
    localTours,
    env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
    fetchImpl: async () => new Response(JSON.stringify({result: {tours: [], featured: {items: []}}}), {status: 200}),
  }),
  /missing active tours/,
);

// A photo published in the Studio replaces the committed image, cropped around
// the focal point the editor dragged. This guards the existing Sanity source
// while the Storyblok adapter is introduced alongside it.
const withPhoto = cardPhoto => loadTourContent({
  localTours,
  env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
  fetchImpl: async () => new Response(JSON.stringify({result: {
    tours: [
      {slug: {current: 'alpha'}, title: 'Alpha', duration: '1 Day', price: 125, cardPhoto},
      {slug: {current: 'beta'}, title: 'Beta', duration: '2 Hours', price: 80},
      {slug: {current: 'gamma'}, title: 'Gamma', duration: '3 Hours', price: 90},
    ],
    featured: {items: [
      {order: 1, tour: {slug: {current: 'alpha'}}},
      {order: 2, tour: {slug: {current: 'beta'}}},
      {order: 3, tour: {slug: {current: 'gamma'}}},
    ]},
  }}), {status: 200, headers: {'Content-Type': 'application/json'}}),
});

const SANITY_IMAGE = 'https://cdn.sanity.io/images/p1/production/abc-4480x5600.jpg';
let alpha = (await withPhoto({src: SANITY_IMAGE, alt: 'Guests on the boat', hotspot: {x: 0.42, y: 0.3}})).tours[0];
assert.ok(alpha.image.startsWith(SANITY_IMAGE + '?'), 'card image should come from the Studio photo');
assert.match(alpha.image, /crop=focalpoint/);
assert.match(alpha.image, /fp-x=0\.4200/);
assert.match(alpha.image, /fp-y=0\.3000/);
assert.match(alpha.image, /w=1200&h=840|h=840&w=1200/);
assert.match(alpha.packageImage, /h=825/);
assert.match(alpha.packageImage, /fp-y=0\.3000/);
assert.equal(alpha.alt, 'Guests on the boat');
assert.equal(
  new URL(alpha.image).searchParams.get('fp-x'),
  new URL(alpha.packageImage).searchParams.get('fp-x'),
  'both existing Sanity card renditions must use the same focal point',
);

alpha = (await withPhoto({src: SANITY_IMAGE, alt: 'No focal point'})).tours[0];
assert.ok(alpha.image.includes('fit=crop'));
assert.ok(!alpha.image.includes('crop=focalpoint'), 'a missing Sanity focal point must centre crop');
assert.ok(!alpha.image.includes('fp-x'));

alpha = (await withPhoto(null)).tours[0];
assert.equal(alpha.image, 'assets/alpha.jpg', 'a tour with no approved photo keeps its committed image');
assert.equal(alpha.packageImage, undefined);

{
  const cover = 'https://cdn.sanity.io/images/p1/production/def-4000x2000.jpg';
  const load = (cardPhoto, coverPhoto) => loadTourContent({
    localTours,
    env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
    fetchImpl: async () => new Response(JSON.stringify({result: {
      tours: [
        {slug: {current: 'alpha'}, title: 'Alpha', duration: '1 Day', price: 125, cardPhoto, coverPhoto},
        {slug: {current: 'beta'}, title: 'Beta', duration: '2 Hours', price: 80},
        {slug: {current: 'gamma'}, title: 'Gamma', duration: '3 Hours', price: 90},
      ],
      featured: {items: [
        {order: 1, tour: {slug: {current: 'alpha'}}},
        {order: 2, tour: {slug: {current: 'beta'}}},
        {order: 3, tour: {slug: {current: 'gamma'}}},
      ]},
    }}), {status: 200, headers: {'Content-Type': 'application/json'}}),
  });

  const cardPhoto = {src: SANITY_IMAGE, alt: 'Card', hotspot: {x: 0.5, y: 0.5}};
  const coverPhoto = {src: cover, alt: 'Cover', hotspot: {x: 0.2, y: 0.4}};
  let mapped = (await load(cardPhoto, coverPhoto)).tours[0];
  assert.ok(mapped.image.startsWith(SANITY_IMAGE + '?'));
  assert.ok(mapped.heroImage.startsWith(cover + '?'));
  assert.match(mapped.heroImage, /w=1920/);
  assert.match(mapped.heroImage, /fp-x=0\.2000/);

  mapped = (await load(cardPhoto, null)).tours[0];
  assert.ok(mapped.image.startsWith(SANITY_IMAGE + '?'));
  assert.equal(mapped.heroImage, undefined, 'the existing card must remain the hero fallback');
}

{
  const photo = number => ({
    src: `https://cdn.sanity.io/g${number}.jpg`, alt: `Photo ${number}`, caption: `Caption ${number}`,
    width: 800, height: 1000,
  });
  const withGallery = gallery => loadTourContent({
    localTours,
    env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
    fetchImpl: async () => new Response(JSON.stringify({result: {
      tours: [
        {slug: {current: 'alpha'}, title: 'Alpha', duration: '1 Day', price: 125, gallery},
        {slug: {current: 'beta'}, title: 'Beta', duration: '2 Hours', price: 80},
        {slug: {current: 'gamma'}, title: 'Gamma', duration: '3 Hours', price: 90},
      ],
      featured: {items: [
        {order: 1, tour: {slug: {current: 'alpha'}}},
        {order: 2, tour: {slug: {current: 'beta'}}},
        {order: 3, tour: {slug: {current: 'gamma'}}},
      ]},
    }}), {status: 200, headers: {'Content-Type': 'application/json'}}),
  });

  assert.equal((await withGallery([photo(1), photo(2)])).tours[0].gallery, undefined,
    'two existing Sanity photos are not a gallery');
  const three = (await withGallery([photo(1), photo(2), photo(3)])).tours[0].gallery;
  assert.equal(three.length, 3);
  assert.ok(three[0].src.includes('w='), 'Sanity gallery photos keep rendition sizing');
  assert.equal(three[0].caption, 'Caption 1');
  assert.equal(three[0].tall, true);
}

// ── PHASE 3C: GENERIC STORYBLOK STANDARD-TOUR CONTRACT ────────────────

assert.equal(STORYBLOK_STANDARD_TOUR_REGISTRY.length, 12,
  'the registry must enumerate all approved standard tours');
assert(!STORYBLOK_STANDARD_TOUR_REGISTRY.some(entry => entry.slug === 'just-go-ghana'),
  'Just Go Ghana must remain outside the standard-tour registry');
const registryBySlug = new Map(STORYBLOK_STANDARD_TOUR_REGISTRY.map(entry => [entry.slug, entry]));
const fullSlugFor = slug => {
  const entry = registryBySlug.get(slug);
  assert(entry, `${slug} is not an approved standard-tour registry entry`);
  return entry.fullSlug;
};

const asset = (name, alt, {
  focus = '600x420:601x421', width = 1600, height = 900,
} = {}) => ({
  filename: `https://a.storyblok.com/f/999999/${name}/${name}.jpg`,
  alt,
  focus,
  meta_data: {dimensions: {width, height}},
});
const listItem = text => ({component: 'list_item', text});
const faqItem = (question, answer) => ({component: 'faq_item', question, answer});
const galleryItem = (image, layout, caption, altText) => ({
  component: 'gallery_item', image, layout, caption, ...(altText ? {alt_text: altText} : {}),
});

const makeTourContent = (slug, {
  title = `${slug} from Storyblok`,
  displayOrder = 4,
  cardImage = asset(`${slug}-card`, `${slug} card image`),
  heroImage = asset(`${slug}-hero`, `${slug} hero image`, {focus: '412x600:413x601', width: 1200, height: 1600}),
  ...overrides
} = {}) => {
  const river = asset(`${slug}-river`, `${slug} river image`, {width: 900, height: 1200});
  const gallery = asset(`${slug}-gallery`, `${slug} gallery image`, {width: 1200, height: 1500});
  return {
    component: 'tour',
    slug,
    published: true,
    experience_type: 'day',
    name: title,
    display_order: String(displayOrder),
    card_image: cardImage,
    card_badge: 'Best Seller',
    card_description: `A concise ${slug} card description.`,
    categories: ['culture', 'heritage'],
    vibes: ['Heritage', 'History'],
    destination: 'cape-coast',
    search_summary: 'Places, people, and history',
    price: '160',
    currency: 'USD',
    price_unit: 'Per Person',
    price_options: [{component: 'price_option', label: 'With a naming ceremony', price: '180'}],
    duration: 'Full Day',
    locations: [listItem('Assin Manso'), listItem('Cape Coast'), listItem('Elmina')],
    starting_point: 'Hotel or apartment pickup in Accra',
    minimum_guests: '1',
    maximum_guests: '12',
    group_size_note: 'Private departures are available on request.',
    hero_image: heroImage,
    hero_watermark: 'CAPE COAST',
    page_headline: 'Walk the Door of No Return.',
    page_intro: 'A concise introduction for the page.',
    overview: 'A Storyblok overview.\n\nA second paragraph.',
    included: [listItem('Private transport'), listItem('Guide')],
    excluded: [listItem('Lunch')],
    good_to_know: [listItem('Bring water'), listItem('Wear comfortable shoes')],
    gallery: [
      galleryItem(river, 'portrait', 'First Bath of Return', 'Guests at the river'),
      galleryItem(cardImage, 'wide', 'Naming ceremony'),
      galleryItem(gallery, 'automatic', 'Cape Coast Castle'),
    ],
    faqs: [
      faqItem('Is it reflective?', 'Yes, with room for reflection.'),
      faqItem('Can we add a ceremony?', 'Yes.'),
    ],
    seo: [{
      component: 'seo',
      title: `${title} | People & Places`,
      description: `A Storyblok description for ${slug}.`,
      indexing: 'index',
      social_image: cardImage,
    }],
    ...overrides,
  };
};

const makeStory = (slug, {
  storySlug = slug,
  fullSlug = fullSlugFor(slug),
  contentOverrides = {},
} = {}) => ({
  // Draft outer state is deliberate: the local adapter uses the Preview API
  // while the editor-facing "Show this experience" setting controls mapping.
  published: false,
  slug: storySlug,
  full_slug: fullSlug,
  content: makeTourContent(slug, contentOverrides),
});

const capeBase = {
  slug: 'cape-coast', title: 'Cape Coast Ancestral Tour', detailUrl: 'cape-coast-tour.html',
  price: '$160', priceUnit: 'Per Person', duration: 'Full Day', groupSize: '1-12 People',
  location: 'Assin Manso, Cape Coast, Elmina', destination: 'cape-coast',
  categories: ['culture', 'heritage'], vibes: ['Heritage', 'History'], badge: 'Best Seller',
  image: 'assets/photos/tour-cape-coast-card.jpg', packageImage: 'assets/photos/tour-cape-coast-card.jpg',
  alt: 'Committed Cape Coast card image', description: 'Committed description.',
  packageDescription: 'Committed package description.', commandSummary: 'Committed summary.',
  homeFeatured: true, homeOrder: 2, packageOrder: 4,
};
const adaBase = {
  slug: 'ada-foah', title: 'Ada Day Tour', detailUrl: 'ada-tour.html', price: '$145',
  priceUnit: 'Per Person', duration: 'Full Day', groupSize: '1-10 People', location: 'Ada Foah',
  destination: 'ada', categories: ['culture'], vibes: ['Nature'], image: 'assets/ada.jpg',
  packageImage: 'assets/ada.jpg', alt: 'Committed Ada image', description: 'Committed Ada description.',
  packageDescription: 'Committed Ada package description.', commandSummary: 'Committed Ada summary.', packageOrder: 8,
};
const accraBase = {
  slug: 'accra-city', title: 'Accra City Tour', detailUrl: 'accra-city-tour.html', price: '$110',
  priceUnit: 'Per Person', duration: 'Half Day', groupSize: '1-8 People', location: 'Accra',
  destination: 'accra', categories: ['culture'], vibes: ['History'], image: 'assets/accra.jpg',
  packageImage: 'assets/accra.jpg', alt: 'Committed Accra image', description: 'Committed Accra description.',
  packageDescription: 'Committed Accra package description.', commandSummary: 'Committed Accra summary.', packageOrder: 1,
};
const justGoGhana = {
  slug: 'just-go-ghana', title: 'Just Go Ghana', detailUrl: 'just-go-ghana.html', price: '$3,000',
  priceUnit: 'Per Person', duration: '8 Days / 7 Nights', groupSize: 'Any group size', location: 'Accra, Ghana',
  destination: 'accra', categories: ['multi-day'], vibes: ['Multi-Day'], image: 'https://images.unsplash.com/just-go',
  packageImage: 'https://images.unsplash.com/just-go', alt: 'Just Go Ghana 8 day tour',
  description: 'Committed multi-day description.', packageDescription: 'Committed multi-day package description.',
  commandSummary: 'Committed multi-day summary.', packageOrder: 0,
};
const standardBaseTours = [capeBase, adaBase, accraBase, justGoGhana];
const storyblokEnv = {
  STORYBLOK_STANDARD_TOURS_ENABLED: 'true',
  STORYBLOK_PREVIEW_API_TOKEN: 'test-preview-token',
  STORYBLOK_REGION: 'eu',
};

const makeResponder = (stories, calls = []) => async request => {
  const url = new URL(request);
  calls.push(url);
  const fullSlug = url.pathname.replace('/v2/cdn/stories/', '');
  const story = stories.get(fullSlug);
  if (!story) return new Response(JSON.stringify({}), {status: 404});
  return new Response(JSON.stringify({story}), {status: 200, headers: {'Content-Type': 'application/json'}});
};

const capeStory = makeStory('cape-coast', {
  contentOverrides: {
    title: 'Cape Coast Ancestral Tour from Storyblok',
    displayOrder: 4,
    // This deliberately malicious-looking field is ignored. Public routes are
    // inherited from the local base, never accepted from a CMS document.
    detailUrl: 'moved-by-storyblok.html',
  },
});
const adaStory = makeStory('ada-foah', {contentOverrides: {title: 'Ada Day Tour from Storyblok', displayOrder: 8}});
const accraStory = makeStory('accra-city', {contentOverrides: {title: 'Accra City Tour from Storyblok', displayOrder: 1}});
const validStories = new Map([
  [fullSlugFor('cape-coast'), capeStory],
  [fullSlugFor('ada-foah'), adaStory],
  [fullSlugFor('accra-city'), accraStory],
]);

// Map one complete story first: this makes the approved editor model explicit
// and covers all important renderer-facing content without tying the renderer
// to Storyblok's component JSON.
const mappedCape = mapStoryblokTour({
  story: capeStory,
  baseTour: capeBase,
  expectedFullSlug: fullSlugFor('cape-coast'),
});
assert(mappedCape, 'a complete standard Storyblok tour should map successfully');
assert.equal(mappedCape.title, 'Cape Coast Ancestral Tour from Storyblok');
assert.equal(mappedCape.detailUrl, capeBase.detailUrl, 'Storyblok cannot change the existing route');
assert.equal(mappedCape.homeFeatured, capeBase.homeFeatured, 'homepage curation remains local');
assert.equal(mappedCape.homeOrder, capeBase.homeOrder, 'homepage order remains local');
assert.equal(mappedCape.packageOrder, 4);
assert.equal(mappedCape.price, '$160');
assert.equal(mappedCape.priceUnit, 'Per Person');
assert.equal(mappedCape.groupSize, '1-12 People');
assert.equal(mappedCape.groupSizeNote, 'Private departures are available on request.');
assert.equal(mappedCape.location, 'Assin Manso, Cape Coast, Elmina');
assert.deepEqual(mappedCape.categories, ['culture', 'heritage']);
assert.deepEqual(mappedCape.vibes, ['Heritage', 'History']);
assert.equal(mappedCape.destination, 'cape-coast');
assert.equal(mappedCape.startingPoint, 'Hotel or apartment pickup in Accra');
assert.equal(mappedCape.heroWatermark, 'CAPE COAST');
assert.equal(mappedCape.pageHeadline, 'Walk the Door of No Return.');
assert.equal(mappedCape.pageIntro, 'A concise introduction for the page.');
assert.equal(mappedCape.description, 'A Storyblok overview.\n\nA second paragraph.');
assert.deepEqual(mappedCape.included, ['Private transport', 'Guide']);
assert.deepEqual(mappedCape.excluded, ['Lunch']);
assert.deepEqual(mappedCape.funFacts, ['Bring water', 'Wear comfortable shoes']);
assert.deepEqual(mappedCape.priceOptions, [{label: 'With a naming ceremony', price: 180}]);
assert.deepEqual(mappedCape.faqs.map(item => item.question), ['Is it reflective?', 'Can we add a ceremony?']);
assert.deepEqual(mappedCape.gallery.map(item => item.caption), ['First Bath of Return', 'Naming ceremony', 'Cape Coast Castle']);
assert.deepEqual(mappedCape.gallery.map(item => item.alt), ['Guests at the river', 'cape-coast card image', 'cape-coast gallery image']);
assert.deepEqual(mappedCape.gallery.map(item => item.tall), [true, false, true]);
assert.match(mappedCape.image, /\/m\/1200x840\/filters:focal\(600x420:601x421\):quality\(80\)$/);
assert.match(mappedCape.packageImage, /\/m\/1200x825\/filters:focal\(600x420:601x421\):quality\(80\)$/);
assert.match(mappedCape.heroImage, /\/m\/1920x1080\/filters:focal\(412x600:413x601\):quality\(80\)$/);
assert.equal(mappedCape.heroAlt, 'cape-coast hero image');
assert.equal(mappedCape.alt, 'cape-coast card image');
assert.equal(mappedCape.seo.title, 'Cape Coast Ancestral Tour from Storyblok | People & Places');

assert.equal(mapStoryblokTour({
  story: makeStory('cape-coast', {contentOverrides: {good_to_know: []}}),
  baseTour: capeBase,
  expectedFullSlug: fullSlugFor('cape-coast'),
}), undefined, 'good-to-know is required by the approved Phase 3C model');
assert.equal(mapStoryblokTour({
  story: makeStory('cape-coast', {fullSlug: 'tours/not-the-approved-path/cape-coast'}),
  baseTour: capeBase,
  expectedFullSlug: fullSlugFor('cape-coast'),
}), undefined, 'a Storyblok folder path must match the approved registry path');
const twoGalleryCape = mapStoryblokTour({
  story: makeStory('cape-coast', {contentOverrides: {gallery: capeStory.content.gallery.slice(0, 2)}}),
  baseTour: capeBase,
  expectedFullSlug: fullSlugFor('cape-coast'),
});
assert.deepEqual(twoGalleryCape.gallery, [], 'the existing three-image gallery minimum remains intact');

// The renderer is still CMS-agnostic: it receives the established internal
// tour shape, complete with ordered gallery data and Storyblok focal renditions.
const galleryHtml = renderTourPage({template: '{{GALLERY}}', tour: mappedCape, catalogue: [mappedCape, adaBase]});
assert.equal((galleryHtml.match(/class="gallery-item/g) || []).length, 3);
assert.match(galleryHtml, /class="gallery-item is-wide"/);
assert.ok(galleryHtml.indexOf('cape-coast-river') < galleryHtml.indexOf('cape-coast-card'));
assert.ok(galleryHtml.indexOf('cape-coast-card') < galleryHtml.indexOf('cape-coast-gallery'));

assert.equal(isStoryblokEuAssetUrl(mappedCape.image), true);
assert.equal(isStoryblokEuAssetUrl('https://a2.storyblok.com/f/999/image.jpg'), true);
assert.equal(isStoryblokEuAssetUrl('https://example.test/f/999/image.jpg'), false);
assert.equal(isStoryblokEuAssetUrl('http://a.storyblok.com/f/999/image.jpg'), false);
assert.match(storyblokImageUrl(capeStory.content.card_image, 1200, 840), /filters:focal\(600x420:601x421\):quality\(80\)$/);
assert.doesNotThrow(() => renderPackageTourCards([mappedCape]));
assert.throws(
  () => renderPackageTourCards([{...mappedCape, image: 'https://example.test/unsafe.jpg', packageImage: undefined}]),
  /Unsafe tour image URL/,
);

// Multiple independently valid standard stories apply together. The loader
// fetches only registry entries present in the local catalogue, never the
// excluded multi-day tour, and returns a per-tour health record for all twelve
// standard registry slugs.
const validCalls = [];
const validLoad = await loadStoryblokStandardTours({
  baseTours: standardBaseTours,
  env: storyblokEnv,
  fetchImpl: makeResponder(validStories, validCalls),
});
assert.deepEqual([...validLoad.appliedSlugs].sort(), ['accra-city', 'ada-foah', 'cape-coast']);
assert.equal(validLoad.sourcesBySlug['cape-coast'], 'applied');
assert.equal(validLoad.sourcesBySlug['ada-foah'], 'applied');
assert.equal(validLoad.sourcesBySlug['accra-city'], 'applied');
assert.equal(validLoad.sourcesBySlug.kumasi, 'not-applicable');
assert.deepEqual(validLoad.summary, {applied: 3, fallback: 0});
assert.equal(validCalls.length, 3, 'only standard base tours are requested');
assert(validCalls.every(url => url.origin === 'https://api.storyblok.com'));
assert(validCalls.every(url => url.searchParams.get('version') === 'draft'));
assert(validCalls.every(url => url.searchParams.get('resolve_assets') === '1'));
assert(validCalls.every(url => url.searchParams.get('token') === 'test-preview-token'));
assert(!validCalls.some(url => url.pathname.includes('just-go-ghana')), 'Just Go Ghana must never be requested');
for (const tour of [capeBase, adaBase, accraBase]) {
  const mapped = validLoad.tours.find(item => item.slug === tour.slug);
  assert.notEqual(mapped, tour, `${tour.slug} should have an independently mapped Storyblok record`);
  assert.equal(mapped.detailUrl, tour.detailUrl, `${tour.slug} route is immutable during mapping`);
}
assert.equal(validLoad.tours.find(tour => tour.slug === 'just-go-ghana'), justGoGhana,
  'Just Go Ghana remains the original local object');

// `loadTourContent` preserves its existing local/Sanity source indicator while
// exposing generic Storyblok diagnostics and accepted slugs to the static build.
const integratedLoad = await loadTourContent({
  localTours: standardBaseTours,
  env: storyblokEnv,
  fetchImpl: makeResponder(validStories),
});
assert.equal(integratedLoad.source, 'local');
assert.deepEqual([...integratedLoad.storyblokAppliedSlugs].sort(), ['accra-city', 'ada-foah', 'cape-coast']);
assert.deepEqual(integratedLoad.storyblokStandardTourSummary, {applied: 3, fallback: 0});
assert.equal(integratedLoad.storyblokStandardTourSources['cape-coast'], 'applied');
assert.equal('storyblokCapeCoastSource' in integratedLoad, false,
  'Phase 3C must not retain a one-tour Cape Coast adapter status');

// One missing and one malformed Storyblok record must fall back only those
// tours; Cape Coast remains applied and every catalogue position is retained.
const mixedCalls = [];
const mixedLoad = await loadStoryblokStandardTours({
  baseTours: standardBaseTours,
  env: storyblokEnv,
  fetchImpl: makeResponder(new Map([
    [fullSlugFor('cape-coast'), capeStory],
    [fullSlugFor('accra-city'), makeStory('accra-city', {contentOverrides: {good_to_know: []}})],
  ]), mixedCalls),
});
assert.equal(mixedLoad.sourcesBySlug['cape-coast'], 'applied');
assert.equal(mixedLoad.sourcesBySlug['ada-foah'], 'missing-story');
assert.equal(mixedLoad.sourcesBySlug['accra-city'], 'invalid-content');
assert.deepEqual(mixedLoad.summary, {applied: 1, fallback: 2});
assert.notEqual(mixedLoad.tours[0], capeBase, 'the valid tour still applies');
assert.equal(mixedLoad.tours[1], adaBase, 'a missing tour falls back without affecting its neighbour');
assert.equal(mixedLoad.tours[2], accraBase, 'an invalid tour falls back without affecting its neighbour');
assert.deepEqual(mixedLoad.tours.map(tour => tour.slug), standardBaseTours.map(tour => tour.slug),
  'mixed Storyblok/fallback content cannot reorder the registry');
assert(!mixedCalls.some(url => url.pathname.includes('just-go-ghana')));

// Duplicate display positions are rejected as a group: guessing would change
// the Experiences order and make cards differ across builds.
const duplicateOrderLoad = await loadStoryblokStandardTours({
  baseTours: standardBaseTours,
  env: storyblokEnv,
  fetchImpl: makeResponder(new Map([
    [fullSlugFor('cape-coast'), makeStory('cape-coast', {contentOverrides: {displayOrder: 4}})],
    [fullSlugFor('ada-foah'), makeStory('ada-foah', {contentOverrides: {displayOrder: 4}})],
    [fullSlugFor('accra-city'), accraStory],
  ])),
});
assert.equal(duplicateOrderLoad.sourcesBySlug['cape-coast'], 'duplicate-display-order');
assert.equal(duplicateOrderLoad.sourcesBySlug['ada-foah'], 'duplicate-display-order');
assert.equal(duplicateOrderLoad.sourcesBySlug['accra-city'], 'applied');
assert.deepEqual(duplicateOrderLoad.appliedSlugs, ['accra-city']);
assert.equal(duplicateOrderLoad.tours[0], capeBase);
assert.equal(duplicateOrderLoad.tours[1], adaBase);
assert.notEqual(duplicateOrderLoad.tours[2], accraBase);
assert.deepEqual(duplicateOrderLoad.summary, {applied: 1, fallback: 2});

// A duplicate local slug is likewise isolated before any request. The adapter
// cannot tell which local route would be authoritative, so both stay local.
const duplicateCapeBase = {...capeBase, title: 'Duplicate local Cape Coast'};
const duplicateLocalCalls = [];
const duplicateLocalLoad = await loadStoryblokStandardTours({
  baseTours: [capeBase, duplicateCapeBase, adaBase, justGoGhana],
  env: storyblokEnv,
  fetchImpl: makeResponder(validStories, duplicateLocalCalls),
});
assert.equal(duplicateLocalLoad.sourcesBySlug['cape-coast'], 'duplicate-slug');
assert.equal(duplicateLocalLoad.sourcesBySlug['ada-foah'], 'applied');
assert.equal(duplicateLocalLoad.tours[0], capeBase);
assert.equal(duplicateLocalLoad.tours[1], duplicateCapeBase);
assert(!duplicateLocalCalls.some(url => url.pathname.endsWith('/cape-coast')),
  'duplicate local slugs must not trigger a speculative Storyblok request');

// Configuration problems fail closed before the network is contacted and are
// visible per tour in build diagnostics.
let disabledCalls = 0;
const disabledLoad = await loadStoryblokStandardTours({
  baseTours: standardBaseTours,
  env: {},
  fetchImpl: async () => { disabledCalls += 1; throw new Error('should not fetch'); },
});
assert.equal(disabledCalls, 0);
assert.equal(disabledLoad.sourcesBySlug['cape-coast'], 'disabled');
assert.equal(disabledLoad.sourcesBySlug['ada-foah'], 'disabled');
assert.equal(disabledLoad.sourcesBySlug['accra-city'], 'disabled');
assert.equal(disabledLoad.tours, standardBaseTours);

const missingTokenLoad = await loadStoryblokStandardTours({
  baseTours: standardBaseTours,
  env: {STORYBLOK_STANDARD_TOURS_ENABLED: 'true'},
  fetchImpl: async () => { throw new Error('should not fetch'); },
});
assert.equal(missingTokenLoad.sourcesBySlug['cape-coast'], 'missing-configuration');
assert.equal(missingTokenLoad.tours, standardBaseTours);

const wrongRegionLoad = await loadStoryblokStandardTours({
  baseTours: standardBaseTours,
  env: {...storyblokEnv, STORYBLOK_REGION: 'us'},
  fetchImpl: async () => { throw new Error('should not fetch'); },
});
assert.equal(wrongRegionLoad.sourcesBySlug['cape-coast'], 'unsupported-region');
assert.equal(wrongRegionLoad.tours, standardBaseTours);

const warnings = [];
const unavailableLoad = await loadStoryblokStandardTours({
  baseTours: [capeBase, justGoGhana],
  env: storyblokEnv,
  fetchImpl: async () => { throw new Error('test-preview-token must never reach logs'); },
  logger: {warn: message => warnings.push(message)},
});
assert.equal(unavailableLoad.sourcesBySlug['cape-coast'], 'unavailable');
assert.equal(unavailableLoad.tours[0], capeBase);
assert.equal(warnings.length, 1);
assert(!warnings[0].includes('test-preview-token'), 'loader logs must not expose a preview token');

// The one generated overlay synchronises only accepted browser-card fields.
// It has no CMS API client, does not change routes, and remains idempotent.
const browserOverlay = renderStoryblokStandardToursBrowserOverlay({
  tours: validLoad.tours,
  appliedSlugs: validLoad.appliedSlugs,
});
assert.match(browserOverlay, /Generated during local Storyblok standard-tour validation/);
assert.match(browserOverlay, /a\.storyblok\.com/);
assert(!/api\.storyblok\.com|STORYBLOK_[A-Z0-9_]*TOKEN|(?:[?&]token=)|\b(?:fetch|XMLHttpRequest)\b/i.test(browserOverlay),
  'browser overlay must contain public mapped content only');
assert(!browserOverlay.includes('detailUrl'), 'the browser overlay must not accept CMS route data');
assert(!/\b(?:faqs|gallery|seo|good_to_know)\b/.test(browserOverlay),
  'the browser overlay must not expose detail-only Storyblok fields');

const browserWindow = {PEOPLE_PLACES_TOURS: structuredClone(standardBaseTours)};
new Function('window', browserOverlay)(browserWindow);
assert.deepEqual(browserWindow.PEOPLE_PLACES_TOURS.map(tour => tour.slug), standardBaseTours.map(tour => tour.slug),
  'the generic overlay preserves catalogue array order');
assert.equal(browserWindow.PEOPLE_PLACES_TOURS.find(tour => tour.slug === 'cape-coast').title,
  'Cape Coast Ancestral Tour from Storyblok');
assert.equal(browserWindow.PEOPLE_PLACES_TOURS.find(tour => tour.slug === 'ada-foah').title,
  'Ada Day Tour from Storyblok');
assert.equal(browserWindow.PEOPLE_PLACES_TOURS.find(tour => tour.slug === 'accra-city').title,
  'Accra City Tour from Storyblok');
assert.deepEqual(browserWindow.PEOPLE_PLACES_TOURS.find(tour => tour.slug === 'just-go-ghana'), justGoGhana,
  'the standard-tour overlay must not modify Just Go Ghana');
for (const tour of browserWindow.PEOPLE_PLACES_TOURS) {
  assert.equal(tour.detailUrl, standardBaseTours.find(base => base.slug === tour.slug).detailUrl,
    `the browser overlay changed ${tour.slug}'s established route`);
}
const afterFirstOverlay = structuredClone(browserWindow.PEOPLE_PLACES_TOURS);
new Function('window', browserOverlay)(browserWindow);
assert.deepEqual(browserWindow.PEOPLE_PLACES_TOURS, afterFirstOverlay,
  'executing the generated overlay twice must not cause drift');
assert.equal(renderStoryblokStandardToursBrowserOverlay({tours: validLoad.tours, appliedSlugs: []}), undefined);

const mixedOverlay = renderStoryblokStandardToursBrowserOverlay({
  tours: mixedLoad.tours,
  appliedSlugs: mixedLoad.appliedSlugs,
});
const mixedBrowserWindow = {PEOPLE_PLACES_TOURS: structuredClone(standardBaseTours)};
new Function('window', mixedOverlay)(mixedBrowserWindow);
assert.equal(mixedBrowserWindow.PEOPLE_PLACES_TOURS[0].title, 'Cape Coast Ancestral Tour from Storyblok');
assert.deepEqual(mixedBrowserWindow.PEOPLE_PLACES_TOURS[1], adaBase,
  'the overlay cannot change a missing-story fallback');
assert.deepEqual(mixedBrowserWindow.PEOPLE_PLACES_TOURS[2], accraBase,
  'the overlay cannot change an invalid-content fallback');
assert.throws(
  () => renderStoryblokStandardToursBrowserOverlay({tours: validLoad.tours, appliedSlugs: ['cape-coast', 'cape-coast']}),
  /duplicate or invalid approved slugs/,
);

// A genuine content-ready draft may deliberately have no approved card photo
// while photography is pending. The relaxed Studio requirement must not relax
// the build adapter: this one record stays on its exact local fallback and is
// absent from the generated browser overlay, while its valid neighbour applies.
const assetlessDraftLoad = await loadStoryblokStandardTours({
  baseTours: [capeBase, accraBase, justGoGhana],
  env: storyblokEnv,
  fetchImpl: makeResponder(new Map([
    [fullSlugFor('cape-coast'), capeStory],
    [fullSlugFor('accra-city'), makeStory('accra-city', {contentOverrides: {
      published: false,
      card_image: undefined,
      hero_image: undefined,
      seo: [{component: 'seo', title: 'Draft without photography', indexing: 'index'}],
    }})],
  ])),
});
assert.equal(assetlessDraftLoad.sourcesBySlug['cape-coast'], 'applied');
assert.equal(assetlessDraftLoad.sourcesBySlug['accra-city'], 'invalid-content');
assert.notEqual(assetlessDraftLoad.tours[0], capeBase);
assert.equal(assetlessDraftLoad.tours[1], accraBase,
  'an asset-blocked draft must preserve only its own local fallback');
assert.deepEqual(assetlessDraftLoad.appliedSlugs, ['cape-coast']);
const assetlessOverlay = renderStoryblokStandardToursBrowserOverlay({
  tours: assetlessDraftLoad.tours,
  appliedSlugs: assetlessDraftLoad.appliedSlugs,
});
assert.match(assetlessOverlay, /cape-coast/);
assert(!assetlessOverlay.includes('accra-city'),
  'the browser overlay must not present an asset-blocked draft as a CMS card');


// --- Phase 3G F3: a bounded request, and exactly one retry for what a retry can fix.
// Before this, a hung Storyblok connection could stall a build indefinitely and a
// single dropped packet dropped a tour to fallback with no second attempt.
const storyEntry = {slug: 'cape-coast', fullSlug: fullSlugFor('cape-coast')};
const okResponse = () => new Response(JSON.stringify({story: capeStory}), {status: 200});
const attempt = async (responses, options = {}) => {
  let calls = 0;
  const result = await loadOneStory({
    entry: storyEntry,
    token: 'test-token',
    fetchImpl: async (url, init) => {
      const step = responses[Math.min(calls, responses.length - 1)];
      calls += 1;
      return step(init?.signal);
    },
    retryDelayMs: 0,
    ...options,
  });
  return {...result, calls};
};
const status = code => () => new Response('', {status: code});
const netFail = () => { throw new TypeError('fetch failed'); };
const hangs = signal => new Promise((_, reject) => {
  signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
});

// 1. A healthy response is taken on the first attempt and never repeated.
const clean = await attempt([okResponse]);
assert.equal(clean.source, 'received');
assert.equal(clean.calls, 1, 'a successful request must not be retried');

// 2. A transient network error is retried once, and the retry is honoured.
const recovered = await attempt([netFail, okResponse]);
assert.equal(recovered.source, 'received');
assert.equal(recovered.calls, 2, 'a dropped connection deserves exactly one more attempt');

// 3. A hung connection is cut off by the timeout, then retried once.
const timedOut = await attempt([hangs, okResponse], {timeoutMs: 40});
assert.equal(timedOut.source, 'received');
assert.equal(timedOut.calls, 2, 'a request that hangs must time out and be retried');

// A request that hangs on every attempt still terminates rather than stalling the build.
let hungCalls = 0;
await assert.rejects(
  () => loadOneStory({
    entry: storyEntry,
    token: 'test-token',
    fetchImpl: (url, init) => { hungCalls += 1; return hangs(init.signal); },
    timeoutMs: 40,
    retryDelayMs: 0,
  }),
  'a permanently hung host must surface to the caller, which warns and falls back');
assert.equal(hungCalls, 2, 'a permanently hung host must stop after one retry');

// 4. 429 and 5xx are transient; each is retried exactly once and then given up on.
for (const code of [429, 500, 502, 503]) {
  const throttled = await attempt([status(code), okResponse]);
  assert.equal(throttled.source, 'received', `${code} must be retried`);
  assert.equal(throttled.calls, 2, `${code} must be retried exactly once`);
  const persistent = await attempt([status(code)]);
  assert.equal(persistent.source, 'unavailable');
  assert.equal(persistent.calls, 2, `a persistent ${code} must stop after one retry`);
}

// 5. A missing story and a rejected token are permanent. Asking twice changes neither
//    answer and only delays the fallback, so neither is retried.
for (const [code, expected] of [[404, 'missing-story'], [401, 'unavailable'], [403, 'unavailable'], [400, 'unavailable']]) {
  const permanent = await attempt([status(code)]);
  assert.equal(permanent.source, expected, `${code} must map to ${expected}`);
  assert.equal(permanent.calls, 1, `${code} is permanent and must not be retried`);
}

// 6. A malformed body is a bad answer, not a lost one. It is reported, not repeated.
const malformed = await attempt([() => new Response('<html>not json</html>', {status: 200})]);
assert.equal(malformed.source, 'invalid-response');
assert.equal(malformed.calls, 1, 'malformed JSON must not be retried');

// A 200 carrying no story is equally permanent.
const storyless = await attempt([() => new Response(JSON.stringify({}), {status: 200})]);
assert.equal(storyless.source, 'invalid-response');
assert.equal(storyless.calls, 1, 'a response without a story must not be retried');

// And the retry stays inside per-record isolation: one unreachable tour retries,
// falls back alone, and leaves its healthy neighbour applied.
let retriedSlugs = [];
const isolated = await loadStoryblokStandardTours({
  baseTours: [capeBase, accraBase],
  env: storyblokEnv,
  fetchImpl: async request => {
    const fullSlug = new URL(request).pathname.replace('/v2/cdn/stories/', '');
    if (fullSlug === fullSlugFor('accra-city')) {
      retriedSlugs.push(fullSlug);
      return new Response('', {status: 503});
    }
    return new Response(JSON.stringify({story: capeStory}), {status: 200});
  },
});
assert.equal(isolated.sourcesBySlug['cape-coast'], 'applied');
assert.equal(isolated.sourcesBySlug['accra-city'], 'unavailable');
assert.equal(retriedSlugs.length, 2, 'the failing record retries once, on its own');
assert.equal(isolated.tours[1], accraBase,
  'an unreachable record keeps its local fallback and does not disturb its neighbour');

console.log('Storyblok request timeout and retry tests passed.');
console.log('Tour source contract tests passed.');
