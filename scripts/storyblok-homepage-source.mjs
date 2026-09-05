/**
 * The homepage, read from Storyblok at build time.
 *
 * Storyblok owns the words and the photographs. homepage-sections.js still owns
 * every class name, layout decision and section order — this only fills the same
 * shape the renderer already consumes, so nothing about the page's appearance
 * depends on what the CMS returns.
 *
 * It fails closed. A story that is missing, unreachable, hidden by its editor
 * switch, or short of the fields the page needs leaves the homepage exactly as
 * it is today, on Sanity or the committed copy. There is one story here rather
 * than thirteen records, so there is no partial state: either the whole page
 * comes from Storyblok or none of it does.
 */
import {
  isStoryblokEuAssetUrl,
  loadOneStory,
  storyblokImageUrl,
} from './storyblok-tour-source.mjs';

export const HOMEPAGE_STORY_SLUG = 'homepage';

const text = value => (typeof value === 'string' ? value.trim() : '');
const list = value => (Array.isArray(value) ? value : []);

/**
 * Image sizes the existing markup asks for. Kept here so a photograph is
 * requested at the size it is displayed at rather than at its master size —
 * the same reason the Sanity path sizes its own images.
 */
const SLOT = {
  hero: {width: 1920, height: 1080},
  pathway: {width: 900, height: 1100},
  moment: {width: 1200, height: 1500},
  reviews: {width: 1600, height: 1000},
};

function photo(asset, slot) {
  const filename = text(asset?.filename);
  if (!filename || !isStoryblokEuAssetUrl(filename)) return undefined;
  const alt = text(asset?.alt);
  // Alt text is not decoration. A photograph without it is not publishable, so
  // the section falls back rather than shipping an unlabelled image.
  if (!alt) return undefined;
  const {width, height} = SLOT[slot] || SLOT.hero;
  const src = storyblokImageUrl(asset, width, height);
  if (!src) return undefined;
  return {src, alt, width, height};
}

const cta = (label, href) => {
  const l = text(label);
  const h = text(href);
  return l && h ? {label: l, href: h} : undefined;
};

const blocksOf = (value, component) =>
  list(value).filter(entry => entry && entry.component === component);

/**
 * Map one published story onto the renderer's content shape.
 *
 * Returns undefined for anything the page could not render honestly. The
 * caller treats that as "keep the current homepage".
 */
export function mapStoryblokHomepage(story) {
  const c = story?.content;
  if (!c || c.component !== 'homepage') return undefined;
  // The editor's own switch, read before any content check so turning a page
  // off is never reported as broken content.
  if (c.published !== true) return {hidden: true};

  const heroImage = photo(c.hero_image, 'hero');
  const heroHeadline = text(c.hero_headline);
  if (!heroHeadline || !heroImage) return undefined;

  const founders = blocksOf(c.founders, 'home_founder')
    .map(f => ({
      name: text(f.name),
      preferredName: text(f.preferred_name),
      role: text(f.role),
      initials: text(f.initials),
    }))
    .filter(f => f.name);

  const pathways = blocksOf(c.pathways, 'home_pathway')
    .map(p => ({
      title: text(p.title),
      text: text(p.description),
      href: text(p.link),
      image: photo(p.image, 'pathway'),
    }))
    .filter(p => p.title && p.href && p.image);

  const moments = blocksOf(c.moments, 'home_moment')
    .map(m => ({
      shape: text(m.shape) === 'tall' ? 'tall' : 'wide',
      caption: text(m.caption),
      image: photo(m.image, 'moment'),
    }))
    .filter(m => m.image);

  const trustFacts = blocksOf(c.trust_facts, 'home_trust_fact')
    .map(t => ({label: text(t.label), value: text(t.value)}))
    .filter(t => t.label && t.value);

  const items = blocksOf(c.reviews, 'home_review')
    .map(r => ({
      quote: text(r.quote),
      author: text(r.author),
      location: text(r.source_label),
      date: text(r.review_date),
      rating: Number(r.rating) || 5,
    }))
    .filter(r => r.quote && r.author);

  const steps = blocksOf(c.steps, 'home_step')
    .map(s => ({
      icon: text(s.icon) || 'search',
      number: text(s.number),
      title: text(s.title),
      text: text(s.description),
    }))
    .filter(s => s.title);

  // The page reads as broken without these, so a story missing them keeps the
  // current homepage instead of rendering an empty band.
  if (!pathways.length || !moments.length || !steps.length || !founders.length) return undefined;

  const titleLines = text(c.reviews_title_lines).split('\n').map(text).filter(Boolean);
  const ratingCount = Number(c.rating_count);

  return {
    hero: {
      headline: heroHeadline,
      sub: text(c.hero_sub),
      image: heroImage,
      cta: cta(c.hero_cta_label, c.hero_cta_link),
    },
    founderStory: {
      eyebrow: text(c.founder_eyebrow),
      headline: text(c.founder_headline),
      body: text(c.founder_body),
      trustNote: text(c.founder_trust_note),
      founders,
      cta: cta(c.founder_cta_label, c.founder_cta_link),
    },
    waysToExperience: {
      eyebrow: text(c.ways_eyebrow),
      title: text(c.ways_title),
      intro: text(c.ways_intro),
      pathways,
      cta: cta(c.ways_cta_label, c.ways_cta_link),
    },
    tripMoments: {
      eyebrow: text(c.moments_eyebrow),
      title: text(c.moments_title),
      intro: text(c.moments_intro),
      moments,
    },
    reviewsAndTrust: {
      eyebrow: text(c.reviews_eyebrow),
      titleLines,
      intro: text(c.reviews_intro),
      heroImage: photo(c.reviews_image, 'reviews'),
      ratingSummary: {
        value: text(c.rating_value),
        source: text(c.rating_source),
        count: Number.isFinite(ratingCount) && ratingCount > 0 ? ratingCount : undefined,
        href: text(c.rating_link),
      },
      trustFacts,
      items,
    },
    planningProcess: {
      eyebrow: text(c.planning_eyebrow),
      title: text(c.planning_title),
      steps,
    },
    finalInvitation: {
      eyebrow: text(c.invitation_eyebrow),
      headline: text(c.invitation_headline),
      body: text(c.invitation_body),
      reassurance: text(c.invitation_reassurance),
      trustMessage: text(c.invitation_trust_message),
      cta: cta(c.invitation_cta_label, c.invitation_cta_link),
      secondaryCta: cta(c.invitation_secondary_label, c.invitation_secondary_link),
    },
  };
}

/**
 * Fetch the homepage story and merge it over whatever the page already had.
 *
 * `baseContent` is the current source — Sanity, or the committed copy. Every
 * failure path returns it untouched, and says why in `source`.
 */
export async function loadStoryblokHomepage({
  baseContent,
  env = process.env,
  fetchImpl = fetch,
  logger = console,
  contentVersion = 'draft',
  tokenEnvVar = 'STORYBLOK_PREVIEW_API_TOKEN',
} = {}) {
  const unchanged = source => ({content: baseContent, source});

  if (env.STORYBLOK_HOMEPAGE_ENABLED !== 'true') return unchanged('disabled');
  const token = text(env[tokenEnvVar]);
  if (!token) return unchanged('missing-configuration');
  if (text(env.STORYBLOK_REGION || 'eu').toLowerCase() !== 'eu') return unchanged('unsupported-region');

  let result;
  try {
    result = await loadOneStory({
      entry: {fullSlug: HOMEPAGE_STORY_SLUG},
      token,
      fetchImpl,
      contentVersion,
    });
  } catch {
    logger?.warn?.('Storyblok homepage could not be loaded; keeping the current homepage.');
    return unchanged('unavailable');
  }
  if (result.source !== 'received') return unchanged(result.source);

  const mapped = mapStoryblokHomepage(result.story);
  if (mapped?.hidden) {
    logger?.warn?.('The Storyblok homepage is switched off; keeping the current homepage.');
    return unchanged('editorial-suppressed');
  }
  if (!mapped) {
    logger?.warn?.('The Storyblok homepage did not pass the content gate; keeping the current homepage.');
    return unchanged('invalid-content');
  }

  // Merge rather than replace: anything the model does not cover — section
  // order, and any field the renderer reads that Storyblok has no home for —
  // stays exactly as the current source left it.
  const merged = {...(baseContent || {})};
  for (const [key, value] of Object.entries(mapped)) {
    merged[key] = {...(baseContent?.[key] || {}), ...value};
  }
  return {content: merged, source: 'applied'};
}
