// The long-standing browser script recreates cards, filters, command search,
// and booking choices from window.PEOPLE_PLACES_TOURS after static HTML has
// loaded. During the migration, this generated file makes that established
// browser catalogue agree with the validated Storyblok records used at build
// time. It is public-content only: there is no CMS client, credential, or
// network behaviour here.

// Keep this deliberately narrow. Detail-page routes remain owned by tours.js;
// Storyblok folders and story slugs must never be able to change a public URL.
const browserTourFields = [
  'slug',
  'title',
  'homeTitle',
  'price',
  'priceUnit',
  'duration',
  'groupSize',
  'groupSizeNote',
  'location',
  'destination',
  'categories',
  'vibes',
  'badge',
  'cardHighlight',
  'image',
  'packageImage',
  'alt',
  'description',
  'packageDescription',
  'commandSummary',
  'homeFeatured',
  'homeOrder',
  'packageOrder',
];

const publicFields = tour => Object.fromEntries(browserTourFields
  .filter(field => tour[field] !== undefined)
  .map(field => [field, tour[field]]));

const safeJson = value => JSON.stringify(value)
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026')
  .replace(/\u2028/g, '\\u2028')
  .replace(/\u2029/g, '\\u2029');

/**
 * Create one token-free catalogue patch for every Storyblok standard-tour
 * record the build adapter has already accepted. Local records that failed
 * validation are intentionally absent from `appliedSlugs`, so the browser
 * keeps their committed/Sanity-backed values unchanged.
 */
export function renderStoryblokStandardToursBrowserOverlay({tours, appliedSlugs}) {
  if (!Array.isArray(appliedSlugs) || appliedSlugs.length === 0) return undefined;
  if (!Array.isArray(tours)) throw new Error('Storyblok standard-tour overlay requires a catalogue');

  const uniqueSlugs = [...new Set(appliedSlugs.filter(slug => typeof slug === 'string' && slug))];
  if (uniqueSlugs.length !== appliedSlugs.length) {
    throw new Error('Storyblok standard-tour overlay received duplicate or invalid approved slugs');
  }

  const patches = uniqueSlugs.map(slug => {
    const matches = tours.filter(tour => tour?.slug === slug);
    if (matches.length !== 1) {
      throw new Error(`Storyblok standard-tour overlay requires exactly one approved ${slug} record`);
    }
    return publicFields(matches[0]);
  });

  return `/* Generated during local Storyblok standard-tour validation. */
(() => {
  const patches = ${safeJson(patches)};
  const catalogue = window.PEOPLE_PLACES_TOURS;
  if (!Array.isArray(catalogue)) return;
  const patchesBySlug = Object.create(null);
  for (const patch of patches) patchesBySlug[patch.slug] = patch;
  for (let index = 0; index < catalogue.length; index += 1) {
    const tour = catalogue[index];
    const patch = tour && patchesBySlug[tour.slug];
    if (patch) catalogue[index] = {...tour, ...patch};
  }
})();
`;
}
