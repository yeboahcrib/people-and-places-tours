/**
 * The tour overlay must be byte-identical when the tour data has not changed.
 *
 * The Storyblok records are fetched together and collected as each request
 * resolves, so the applied slugs arrive in whatever order the network produced.
 * The overlay then serialised them in that order, which meant the same twelve
 * records wrote a different file on every build — a different content hash, a
 * different `?v=` on the script tag every page carries, and a re-download for
 * every returning visitor after every deploy. Three consecutive builds of the
 * same commit produced three different hashes.
 *
 * Sorting fixes it, and is safe because order is inert: the emitted script
 * turns the patches into a slug lookup and then walks the catalogue in its own
 * order. This file pins both halves — the output is stable, and it is still the
 * same data applied to the same tours.
 */
import assert from 'node:assert/strict';
import {renderStoryblokStandardToursBrowserOverlay} from '../scripts/storyblok-tour-browser-overlay.mjs';

const tour = slug => ({
  slug,
  title: `${slug} title`,
  price: '$100',
  priceUnit: 'Per Person',
  duration: 'Full Day',
  location: 'Ghana',
  destination: 'accra',
  categories: ['culture'],
  vibes: ['Culture'],
  packageOrder: 1,
  description: `${slug} description`,
  packageDescription: `${slug} card description`,
  commandSummary: `${slug} summary`,
  image: `https://a.storyblok.com/f/1/${slug}.jpg`,
  packageImage: `https://a.storyblok.com/f/1/${slug}-card.jpg`,
  alt: `${slug} photograph`,
  detailUrl: `${slug}.html`,
});

const SLUGS = ['volta-community', 'accra-city', 'kumasi', 'aburi', 'cape-coast', 'ada-foah'];
const tours = SLUGS.map(tour);

// ── The same records in any arrival order must produce the same file ──
const shuffles = [
  SLUGS,
  [...SLUGS].reverse(),
  ['kumasi', 'volta-community', 'ada-foah', 'accra-city', 'cape-coast', 'aburi'],
  ['cape-coast', 'aburi', 'accra-city', 'kumasi', 'ada-foah', 'volta-community'],
];
const outputs = shuffles.map(appliedSlugs =>
  renderStoryblokStandardToursBrowserOverlay({tours, appliedSlugs}));

for (const [index, output] of outputs.entries()) {
  assert.equal(output, outputs[0],
    `arrival order ${index} produced a different overlay — the file is not deterministic`);
}

// The order actually written is the sorted one, so it is predictable rather
// than merely stable.
{
  const patches = JSON.parse(/const patches = (\[[\s\S]*?\]);/.exec(outputs[0])[1]);
  assert.deepEqual(patches.map(p => p.slug), [...SLUGS].sort(),
    'the overlay is stable but not sorted by slug');
}

// ── Sorting must not lose or alter a record ──
{
  const patches = JSON.parse(/const patches = (\[[\s\S]*?\]);/.exec(outputs[0])[1]);
  assert.equal(patches.length, SLUGS.length, 'the overlay dropped a record while sorting');
  for (const slug of SLUGS) {
    const patch = patches.find(p => p.slug === slug);
    assert(patch, `${slug} vanished from the overlay`);
    assert.equal(patch.title, `${slug} title`, `${slug} was given another tour's title`);
    assert.equal(patch.packageImage, `https://a.storyblok.com/f/1/${slug}-card.jpg`,
      `${slug} was given another tour's photograph`);
  }
}

// ── The catalogue a visitor sees is still applied by slug, not by position ──
// This is why sorting is safe. The emitted script is run against a catalogue in
// a deliberately different order from the patches.
{
  const script = outputs[0];
  const catalogue = [...SLUGS].reverse().map(slug => ({slug, title: 'committed', price: '$1'}));
  const window = {PEOPLE_PLACES_TOURS: catalogue};
  new Function('window', script)(window);
  assert.deepEqual(window.PEOPLE_PLACES_TOURS.map(t => t.slug), [...SLUGS].reverse(),
    'the overlay reordered the catalogue a visitor sees');
  for (const entry of window.PEOPLE_PLACES_TOURS) {
    assert.equal(entry.title, `${entry.slug} title`, `${entry.slug} received the wrong patch`);
  }
}

// An unapplied tour keeps its committed record untouched.
{
  const window = {PEOPLE_PLACES_TOURS: [{slug: 'just-go-ghana', title: 'committed', price: '$3,000'}]};
  new Function('window', outputs[0])(window);
  assert.deepEqual(window.PEOPLE_PLACES_TOURS[0], {slug: 'just-go-ghana', title: 'committed', price: '$3,000'},
    'a tour with no Storyblok patch was modified');
}

console.log('Storyblok overlay determinism tests passed.');
