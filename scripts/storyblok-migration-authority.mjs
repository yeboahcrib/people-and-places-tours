/**
 * Which tours Storyblok is allowed to own.
 *
 * This is not a CMS and not a second content source. It records one fact per
 * product for the length of the cutover: should published Storyblok be treated
 * as the authority for this tour?
 *
 * It exists because a 404 from the Published Delivery API is ambiguous. It can
 * mean "this tour was never migrated" or "an editor withdrew this tour", and
 * those need opposite responses — the first keeps its committed fallback, the
 * second must disappear. Nothing in the API distinguishes them, so the answer
 * has to be recorded here, deliberately, by a person.
 *
 * Two states, and no more:
 *
 *   authoritative  Storyblok owns this tour. A missing story means withdrawn.
 *   pending        Not migrated yet. A missing story means fall back.
 *
 * This is separate from whether a tour is currently visible. Visibility is
 * editorial and lives in the Storyblok field ("Show this experience"); this
 * file is about ownership, and only changes when a migration step completes.
 * A draft existing in Storyblok is not grounds for promotion — the three
 * pending tours below all have drafts and none of them are ready.
 */

export const STORYBLOK_TOUR_AUTHORITY = Object.freeze({
  // Migrated, asset-ready, and passing the content gate.
  'accra-city': 'authoritative',
  'cape-coast': 'authoritative',
  'kumasi': 'authoritative',
  'ada-foah': 'authoritative',
  'quad-bike': 'authoritative',
  'volta': 'authoritative',
  'shai-hills': 'authoritative',
  'aburi': 'authoritative',
  'cape-coast-day': 'authoritative',
  'batik-workshop': 'authoritative',

  // Approved photography still missing. Each has a Storyblok draft; none of
  // them may be promoted on that basis alone.
  'accra-food': 'pending',
  'volta-community': 'pending',
  'just-go-ghana': 'pending',
});

export const STORYBLOK_AUTHORITY_STATES = Object.freeze(['authoritative', 'pending']);

/** Unknown slugs are pending: the safe answer is always "keep the fallback". */
export function authorityFor(slug) {
  const value = STORYBLOK_TOUR_AUTHORITY[slug];
  return value === 'authoritative' ? 'authoritative' : 'pending';
}

export const isAuthoritative = slug => authorityFor(slug) === 'authoritative';
