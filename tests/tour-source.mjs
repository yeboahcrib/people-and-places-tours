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

console.log('Tour source contract tests passed.');
