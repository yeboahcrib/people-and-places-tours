import assert from 'node:assert/strict';
import {loadTourContent} from '../scripts/tour-source.mjs';

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
// the focal point the editor dragged. This is the whole point of the hotspot:
// nothing read it before, so the circle in the Studio did nothing.
const withPhoto = (cardPhoto) => loadTourContent({
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

const SRC = 'https://cdn.sanity.io/images/p1/production/abc-4480x5600.jpg';

let alpha = (await withPhoto({src: SRC, alt: 'Guests on the boat', hotspot: {x: 0.42, y: 0.3}})).tours[0];
assert.ok(alpha.image.startsWith(SRC + '?'), 'card image should come from the Studio photo');
assert.match(alpha.image, /crop=focalpoint/);
assert.match(alpha.image, /fp-x=0\.4200/);
assert.match(alpha.image, /fp-y=0\.3000/);
assert.match(alpha.image, /w=1200&h=840|h=840&w=1200/);
assert.match(alpha.packageImage, /h=825/);
assert.match(alpha.packageImage, /fp-y=0\.3000/);
assert.equal(alpha.alt, 'Guests on the boat');

// Both card sizes crop the same photo around the same point, so the two
// renderings of one tour cannot disagree about what the photo is of.
assert.equal(
  new URL(alpha.image).searchParams.get('fp-x'),
  new URL(alpha.packageImage).searchParams.get('fp-x'),
);

// No hotspot set: the CDN centre-crops, which is what it did before.
alpha = (await withPhoto({src: SRC, alt: 'No focal point'})).tours[0];
assert.ok(alpha.image.includes('fit=crop'));
assert.ok(!alpha.image.includes('crop=focalpoint'), 'must not claim a focal point it does not have');
assert.ok(!alpha.image.includes('fp-x'));

// An unapproved photo never reaches the query, so the committed image stands.
alpha = (await withPhoto(null)).tours[0];
assert.equal(alpha.image, 'assets/alpha.jpg', 'a tour with no approved photo keeps its committed image');
assert.equal(alpha.packageImage, undefined);

// A card and a cover are separate choices now. The cover falls back to the
// card, because a tour with only one photograph should still have a page.
{
  const SRC2 = 'https://cdn.sanity.io/images/p1/production/def-4000x2000.jpg';
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

  const card = {src: SRC, alt: 'Card', hotspot: {x: 0.5, y: 0.5}};
  const cover = {src: SRC2, alt: 'Cover', hotspot: {x: 0.2, y: 0.4}};

  let a = (await load(card, cover)).tours[0];
  assert.ok(a.image.startsWith(SRC + '?'), 'the card comes from the card photo');
  assert.ok(a.heroImage.startsWith(SRC2 + '?'), 'the cover comes from the cover photo');
  assert.match(a.heroImage, /w=1920/);
  assert.match(a.heroImage, /fp-x=0\.2000/, 'the cover keeps its own focal point');

  // No cover chosen: the page widens the card, which is what it did before
  // these fields existed and is still a reasonable page.
  a = (await load(card, null)).tours[0];
  assert.ok(a.image.startsWith(SRC + '?'));
  assert.equal(a.heroImage, undefined, 'no cover means no override, so the card is widened');
}

console.log('Tour source contract tests passed.');
