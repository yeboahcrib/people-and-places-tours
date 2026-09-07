/**
 * The Contact page's copy, read from Storyblok at build time.
 *
 * Words only. The form's fields, their order, their required and optional
 * decisions, validation, submission, Turnstile and tour preselection all stay
 * in code — nothing here can reach them. This fills the same shape
 * `loadBookingContent` already returns, so the page's structure and behaviour
 * do not depend on what the CMS sends back.
 *
 * It fails closed: anything missing, unreachable, rejected, switched off, or
 * short of the copy the page needs leaves the current wording exactly as it is.
 */
import {
  isStoryblokEuAssetUrl,
  loadOneStory,
  storyblokImageUrl,
} from './storyblok-tour-source.mjs';

export const CONTACT_STORY_SLUG = 'contact';

const text = value => (typeof value === 'string' ? value.trim() : '');
const list = value => (Array.isArray(value) ? value : []);
const blocksOf = (value, component) =>
  list(value).filter(entry => entry && entry.component === component);

/*
 * The band the hero occupies. The tag already carries these numbers — they are
 * what stops the page jumping while the image loads — so the photograph is
 * fetched for that slot rather than as a master.
 *
 * Doubled for the same reason the Sanity path doubles: a 1920-wide band on a
 * phone is a 3840-wide band of pixels, and serving it at 1x is the difference
 * between a sharp hero and a soft one. The master is 4100 square, so 3840x1440
 * asks for nothing it does not hold.
 */
const HERO_SLOT = {width: 1920, height: 720};
const HERO_REQUEST = {width: HERO_SLOT.width * 2, height: HERO_SLOT.height * 2};

/**
 * The hero photograph, in the shape the page-photo injector already accepts.
 *
 * It marks itself approved because reaching this point means it passed the
 * gate: an editor put it in a published story, and only approved assets belong
 * in one. The two approval flags exist for Sanity's editorial workflow, which
 * Storyblok expresses through publishing instead.
 */
function heroPhoto(asset) {
  const filename = text(asset?.filename);
  if (!filename || !isStoryblokEuAssetUrl(filename)) return undefined;
  const src = storyblokImageUrl(asset, HERO_REQUEST.width, HERO_REQUEST.height);
  if (!src) return undefined;
  return {
    src,
    alt: text(asset?.alt),
    width: HERO_SLOT.width,
    height: HERO_SLOT.height,
    publicApprovalState: 'approved',
    placeholderState: 'approved',
  };
}

/** The only icons the existing renderer can draw. Anything else renders nothing. */
const TRUST_ICONS = new Set(['pin', 'clock', 'lock']);

/**
 * Map one story onto the booking copy shape.
 *
 * Returns undefined for anything that would leave a visible gap in the form,
 * and `{hidden: true}` when an editor has switched the copy off.
 */
export function mapStoryblokContact(story) {
  const c = story?.content;
  if (!c || c.component !== 'contact_page') return undefined;
  if (c.published !== true) return {hidden: true};

  const trustPoints = blocksOf(c.trust_points, 'contact_trust_point')
    .map(t => ({label: text(t.label), icon: TRUST_ICONS.has(text(t.icon)) ? text(t.icon) : 'pin'}))
    .filter(t => t.label);
  const nextSteps = blocksOf(c.next_steps, 'contact_next_step')
    .map(n => ({title: text(n.title), description: text(n.description)}))
    .filter(n => n.title);
  const faqs = blocksOf(c.faqs, 'faq_item')
    .map(f => ({question: text(f.question), answer: text(f.answer)}))
    .filter(f => f.question && f.answer);

  const coverPhoto = heroPhoto(c.hero_image);

  const mapped = {
    ...(coverPhoto ? {coverPhoto} : {}),
    eyebrow: text(c.eyebrow),
    title: text(c.title),
    intro: text(c.intro),
    heroSubtitle: text(c.hero_subtitle),
    step1Name: text(c.step1_name),
    step1Legend: text(c.step1_legend),
    step1Help: text(c.step1_help),
    nextLabel: text(c.next_label),
    nextNote: text(c.next_note),
    step2Name: text(c.step2_name),
    step2Legend: text(c.step2_legend),
    step2Help: text(c.step2_help),
    submitLabel: text(c.submit_label),
    submitNote: text(c.submit_note),
    privacyNote: text(c.privacy_note),
    altPrompt: text(c.alt_prompt),
    successTitle: text(c.success_title),
    successText: text(c.success_text),
    nextStepsTitle: text(c.next_steps_title),
    nextStepsIntro: text(c.next_steps_intro),
    talkTitle: text(c.talk_title),
    talkText: text(c.talk_text),
    trustPoints,
    nextSteps,
    faqs,
  };

  // A control the visitor operates must never lose its wording. An empty button
  // or step heading is worse than slightly older copy, so the page keeps its
  // current source rather than shipping one.
  const required = ['title', 'step1Name', 'step1Legend', 'nextLabel',
    'step2Name', 'step2Legend', 'submitLabel', 'successTitle'];
  if (required.some(key => !mapped[key])) return undefined;
  if (!trustPoints.length || !nextSteps.length || !faqs.length) return undefined;

  return mapped;
}

/**
 * Fetch the Contact story and merge it over whatever the page already had.
 *
 * `baseContent` is the current source. Every failure path returns it untouched.
 */
export async function loadStoryblokContact({
  baseContent,
  env = process.env,
  fetchImpl = fetch,
  logger = console,
  contentVersion = 'draft',
  tokenEnvVar = 'STORYBLOK_PREVIEW_API_TOKEN',
} = {}) {
  const unchanged = source => ({content: baseContent, source});

  if (env.STORYBLOK_CONTACT_ENABLED !== 'true') return unchanged('disabled');
  const token = text(env[tokenEnvVar]);
  if (!token) return unchanged('missing-configuration');
  if (text(env.STORYBLOK_REGION || 'eu').toLowerCase() !== 'eu') return unchanged('unsupported-region');

  let result;
  try {
    result = await loadOneStory({entry: {fullSlug: CONTACT_STORY_SLUG}, token, fetchImpl, contentVersion});
  } catch {
    logger?.warn?.('Storyblok Contact copy could not be loaded; keeping the current wording.');
    return unchanged('unavailable');
  }
  if (result.source !== 'received') return unchanged(result.source);

  const mapped = mapStoryblokContact(result.story);
  if (mapped?.hidden) {
    logger?.warn?.('The Storyblok Contact copy is switched off; keeping the current wording.');
    return unchanged('editorial-suppressed');
  }
  if (!mapped) {
    logger?.warn?.('The Storyblok Contact copy did not pass the content gate; keeping the current wording.');
    return unchanged('invalid-content');
  }

  // Merge, so any key the renderer reads that this model has no home for —
  // and the site-wide phone, email and hours it also uses — survive untouched.
  return {content: {...(baseContent || {}), ...mapped}, source: 'applied'};
}
