/**
 * The two tours whose live wording only existed in Sanity.
 *
 * Phase 5C's job was to get that wording into Storyblok. It was already there —
 * the Phase 3D staging had carried it across — so this file's job is to stop it
 * drifting back out, and to be honest about why these two still fall back.
 *
 * The gate they fail is photography, not copy. `mapStoryblokTour` refuses a
 * record with no approved card image, and that refusal is deliberate: the whole
 * point of the pending state is that a tour without an owned photograph must
 * not present a stock placeholder as its own. So these assertions pin both
 * halves — the words are ready, and the record still correctly declines to
 * apply.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {mapStoryblokTour} from '../scripts/storyblok-tour-source.mjs';
import {authorityFor} from '../scripts/storyblok-migration-authority.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));

/** The exact wording production serves today, captured from the live site. */
const LIVE_WORDING = {
  'accra-food': {
    // The sentence that only existed in Sanity. On the live page it is the
    // second .price-group-note; the first is generic copy every tour carries.
    group_size_note: 'Minimum three travellers. Two can be accommodated at $110 per person.',
    card_description: "From waakye stalls to kelewele vendors and rooftop bars - taste Accra's legendary food scene as the city lights up at night.",
    page_headline: "The City's Best Flavours Come Out at Night",
  },
  'volta-community': {
    // The packages card that differed from the committed fallback.
    card_description: 'A day with the people who grow and make things in the Volta Region: palm wine harvested and distilled into akpeteshie, palm oil pressed, cocoa picked, and Wli Waterfalls to finish.',
    page_headline: 'The Volta Region, From the Inside.',
  },
};

const stories = JSON.parse(await readFile(`${projectRoot}tests/fixtures/storyblok-pending-tours.json`, 'utf8'));

for (const [slug, expected] of Object.entries(LIVE_WORDING)) {
  const content = stories[slug]?.content;
  assert(content, `no Storyblok record captured for ${slug}`);

  // 1. The wording that only lived in Sanity is in Storyblok, exactly.
  for (const [field, value] of Object.entries(expected)) {
    assert.equal(String(content[field] ?? '').trim(), value,
      `${slug}.${field} no longer matches the wording production serves`);
  }

  // 2. Both remain pending, and for the stated reason. If someone satisfies
  //    this gate by uploading a stock placeholder, that is a decision to take
  //    deliberately — not one to discover from a green build.
  assert.equal(authorityFor(slug), 'pending',
    `${slug} was marked authoritative while it still has no approved photograph`);
  assert(!content.card_image?.filename, `${slug} gained a card image; re-check that it is an owned photograph`);
  assert.equal((content.gallery ?? []).length, 0, `${slug} gained gallery photographs`);

  // 3. The gate agrees: this record cannot be served.
  const mapped = mapStoryblokTour({
    story: {slug, full_slug: `tours/day-short-experiences/${slug}`, content},
    baseTour: {slug},
    expectedFullSlug: `tours/day-short-experiences/${slug}`,
  });
  assert.equal(mapped, undefined,
    `${slug} passed the content gate without an approved photograph`);
}

// The committed fallback is what ships while they are pending, so it has to
// stay complete — this is the wording a visitor sees if Sanity goes away.
const {loadLocalTours} = await import('../scripts/local-render-source.mjs');
const local = await loadLocalTours(projectRoot);
for (const slug of Object.keys(LIVE_WORDING)) {
  const tour = local.find(t => t.slug === slug);
  assert(tour, `${slug} left the committed catalogue`);
  assert(tour.packageDescription || tour.description, `${slug} has no committed card wording to fall back to`);
  assert(tour.image && tour.packageImage, `${slug} lost its committed card imagery`);
}

console.log('Storyblok pending-tour contract tests passed.');
