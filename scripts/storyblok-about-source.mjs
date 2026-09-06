/**
 * The About page, read from Storyblok at build time.
 *
 * Storyblok owns the words; the existing markup and injector own every class
 * name, section order and route. This fills the same shape `loadAboutContent`
 * already returns, so nothing about the page's appearance depends on what the
 * CMS sends back.
 *
 * It fails closed. A story that is missing, unreachable, rejected by its
 * credential, switched off by its editor, or short of the sections the page
 * needs leaves the About page exactly as it is today, on Sanity or the
 * committed copy. One story, so there is no partial state.
 */
import {
  isStoryblokEuAssetUrl,
  loadOneStory,
  storyblokImageUrl,
} from './storyblok-tour-source.mjs';

export const ABOUT_STORY_SLUG = 'about';

const text = value => (typeof value === 'string' ? value.trim() : '');
const list = value => (Array.isArray(value) ? value : []);
const blocksOf = (value, component) =>
  list(value).filter(entry => entry && entry.component === component);

/**
 * A photograph, requested at the size the existing markup already displays it
 * at so the rendered page does not move.
 *
 * `decorative` is the difference between the two kinds of image on this page.
 * The hero sits behind the heading and is described by it, so an empty alt is
 * correct there and must be preserved rather than treated as missing. Every
 * other photograph carries meaning of its own, so one without alt text is
 * dropped rather than shipped unlabelled.
 */
function photo(asset, width, height, {decorative = false} = {}) {
  const filename = text(asset?.filename);
  if (!filename || !isStoryblokEuAssetUrl(filename)) return undefined;
  const alt = text(asset?.alt);
  if (!alt && !decorative) return undefined;
  const src = storyblokImageUrl(asset, width, height);
  if (!src) return undefined;
  return {src, alt: decorative ? '' : alt, width, height};
}

/* The sizes about.html already asks for. Changing one would move the page. */
const HERO_IMAGE = {width: 1920, height: 720};
const STORY_IMAGE = {width: 700, height: 850};
const TEAM_PHOTO = {width: 700, height: 850};

/**
 * Map one story onto the About content shape.
 *
 * Returns undefined for anything the page could not render honestly, and
 * `{hidden: true}` when an editor has switched the page off.
 */
export function mapStoryblokAbout(story) {
  const c = story?.content;
  if (!c || c.component !== 'about_page') return undefined;
  if (c.published !== true) return {hidden: true};

  const heroTitle = text(c.hero_title);
  if (!heroTitle) return undefined;

  const storyParagraphs = blocksOf(c.story_paragraphs, 'about_paragraph')
    .map(p => text(p.text)).filter(Boolean);
  const missionProof = blocksOf(c.mission_proof, 'about_mission_proof')
    .map(p => ({place: text(p.place), craft: text(p.craft)})).filter(p => p.place);
  const differenceItems = blocksOf(c.difference_items, 'about_difference')
    .map(d => ({title: text(d.title), text: text(d.text)})).filter(d => d.title);
  const team = blocksOf(c.team, 'about_team_member')
    .map(m => {
      const portrait = photo(m.photo, TEAM_PHOTO.width, TEAM_PHOTO.height);
      return {name: text(m.name), role: text(m.role), bio: text(m.bio), ...(portrait ? {photo: portrait} : {})};
    })
    .filter(m => m.name);
  const impactStats = blocksOf(c.impact_stats, 'about_stat')
    .map(s => ({value: text(s.value), label: text(s.label)})).filter(s => s.value && s.label);
  const faqs = blocksOf(c.faqs, 'faq_item')
    .map(f => ({question: text(f.question), answer: text(f.answer)})).filter(f => f.question && f.answer);

  // Every one of these renders as a visible band. A story missing any of them
  // would ship an empty section, so the page keeps its current source instead.
  if (!storyParagraphs.length || !missionProof.length || !differenceItems.length
    || !team.length || !impactStats.length || !faqs.length) return undefined;

  const heroImage = photo(c.hero_image, HERO_IMAGE.width, HERO_IMAGE.height, {decorative: true});
  const storyImage = photo(c.story_image, STORY_IMAGE.width, STORY_IMAGE.height);

  return {
    heroTitle,
    heroSubtitle: text(c.hero_subtitle),
    ...(heroImage ? {heroImage} : {}),
    ...(storyImage ? {storyImage} : {}),
    storyEyebrow: text(c.story_eyebrow),
    storyTitle: text(c.story_title),
    storyParagraphs,
    missionEyebrow: text(c.mission_eyebrow),
    missionTitle: text(c.mission_title),
    missionLede: text(c.mission_lede),
    missionBody: text(c.mission_body),
    missionProof,
    differenceEyebrow: text(c.difference_eyebrow),
    differenceTitle: text(c.difference_title),
    differenceIntro: text(c.difference_intro),
    differenceItems,
    teamEyebrow: text(c.team_eyebrow),
    teamTitle: text(c.team_title),
    teamIntro: text(c.team_intro),
    teamNote: text(c.team_note),
    team,
    impactStats,
    faqs,
    ctaEyebrow: text(c.cta_eyebrow),
    ctaTitle: text(c.cta_title),
  };
}

/**
 * Fetch the About story and merge it over whatever the page already had.
 *
 * `baseContent` is the current source. Every failure path returns it untouched
 * and says why in `source`.
 */
export async function loadStoryblokAbout({
  baseContent,
  env = process.env,
  fetchImpl = fetch,
  logger = console,
  contentVersion = 'draft',
  tokenEnvVar = 'STORYBLOK_PREVIEW_API_TOKEN',
} = {}) {
  const unchanged = source => ({content: baseContent, source});

  if (env.STORYBLOK_ABOUT_ENABLED !== 'true') return unchanged('disabled');
  const token = text(env[tokenEnvVar]);
  if (!token) return unchanged('missing-configuration');
  if (text(env.STORYBLOK_REGION || 'eu').toLowerCase() !== 'eu') return unchanged('unsupported-region');

  let result;
  try {
    result = await loadOneStory({entry: {fullSlug: ABOUT_STORY_SLUG}, token, fetchImpl, contentVersion});
  } catch {
    logger?.warn?.('Storyblok About page could not be loaded; keeping the current About page.');
    return unchanged('unavailable');
  }
  if (result.source !== 'received') return unchanged(result.source);

  const mapped = mapStoryblokAbout(result.story);
  if (mapped?.hidden) {
    logger?.warn?.('The Storyblok About page is switched off; keeping the current About page.');
    return unchanged('editorial-suppressed');
  }
  if (!mapped) {
    logger?.warn?.('The Storyblok About page did not pass the content gate; keeping the current About page.');
    return unchanged('invalid-content');
  }

  // Merge rather than replace, so any field the renderer reads that this model
  // has no home for survives from the current source.
  return {content: {...(baseContent || {}), ...mapped}, source: 'applied'};
}
