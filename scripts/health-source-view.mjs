/**
 * A derived, unambiguous view of where each part of the site actually came
 * from.
 *
 * The flat `*ContentSource` fields in health.json report the **base** layer —
 * the Sanity-or-committed content a Storyblok adapter was handed before it
 * merged or replaced anything. That is accurate, and it has been misread more
 * than once: `policyContentSource: "sanity"` sat next to five policies all
 * reporting `applied`, and read as though Storyblok were not live.
 *
 * Rather than rename fields an external monitor may already watch, this adds a
 * second view that separates the three things that were being conflated:
 *
 *   effective  — what actually shipped on the page
 *   base       — what would ship if Storyblok were unavailable
 *   storyblok  — the adapter's own state, verbatim
 *
 * Nothing here changes delivery. It reports the same build three ways so that
 * a person reading it at 2am does not have to know the merge order to answer
 * "is Storyblok live?".
 */

/** Only a literal `applied` means the page shipped Storyblok's content. */
export const APPLIED = 'applied';

const isApplied = state => state === APPLIED;

/**
 * One page area whose content comes from a single Storyblok record.
 */
function singleArea(storyblokState, baseSource) {
  return {
    effective: isApplied(storyblokState) ? 'storyblok' : baseSource,
    base: baseSource,
    storyblok: storyblokState,
  };
}

/**
 * A group of independent records — the five policies. Each stands alone, so
 * the group can legitimately be part-migrated and `mixed` is a real answer
 * rather than a rounding of one.
 */
function groupArea(statesByKey, baseSource) {
  const states = Object.values(statesByKey ?? {});
  const applied = states.filter(isApplied).length;
  const effective = states.length === 0 ? baseSource
    : applied === states.length ? 'storyblok'
    : applied === 0 ? baseSource
    : 'mixed';
  return {
    effective,
    base: baseSource,
    storyblok: {...statesByKey},
    appliedCount: applied,
    total: states.length,
  };
}

/**
 * Build the derived view.
 *
 * `tours` is summarised from the fallback assessment rather than recomputed,
 * and the assessment object itself is never touched: `storyblokFallback`
 * remains the authority on thresholds, withdrawals, transport and
 * auth/config failures, and this is a convenience layer above it.
 */
export function describeSourceView({
  contentSource,
  homepageContentSource,
  aboutContentSource,
  bookingContentSource,
  policyContentSource,
  experienceContentSource,
  tourContentSource,
  storyblokHomepageSource,
  storyblokAboutSource,
  storyblokContactSource,
  storyblokGlobalsSource,
  storyblokPolicySources,
  storyblokFallback,
} = {}) {
  const tourApplied = Number(storyblokFallback?.appliedCount ?? 0);
  const tourAttempted = Number(storyblokFallback?.attempted ?? 0);
  const tourFallback = Math.max(tourAttempted - tourApplied, 0);

  return {
    // Bumped only when the shape changes, so a consumer can pin to it.
    schema: 1,
    homepage: singleArea(storyblokHomepageSource, homepageContentSource),
    about: singleArea(storyblokAboutSource, aboutContentSource),
    contact: singleArea(storyblokContactSource, bookingContentSource),
    globals: singleArea(storyblokGlobalsSource, contentSource),
    policies: groupArea(storyblokPolicySources, policyContentSource),
    tours: {
      effective: tourAttempted === 0 ? tourContentSource
        : tourApplied === tourAttempted ? 'storyblok'
        : tourApplied === 0 ? tourContentSource
        : 'mixed',
      base: tourContentSource,
      // Repeated from storyblokFallback so this view answers the common
      // question on its own. storyblokFallback stays the source of truth.
      mode: storyblokFallback?.mode,
      enforced: storyblokFallback?.enforced,
      appliedCount: tourApplied,
      attempted: tourAttempted,
      fallbackCount: tourFallback,
    },
    // Never migrated to Storyblok; named here so its absence is a stated fact
    // rather than a gap someone has to notice.
    experiences: {
      effective: experienceContentSource,
      base: experienceContentSource,
      storyblok: 'not-migrated',
    },
  };
}
