/**
 * The policy pages, read from Storyblok at build time.
 *
 * Routing, layout and the page markup stay in code. This supplies the same
 * shape `loadPolicyContent` already returns, so nothing about how a policy page
 * looks or where it lives depends on the CMS.
 *
 * **A policy is never merged.** The Sanity path already refuses to blend a
 * half-written policy with the committed one, on the grounds that the result
 * would be a document nobody wrote and nobody agreed to, and the same rule
 * holds here: a policy comes from Storyblok whole, or it keeps its current
 * wording whole. That is why the gate below is strict — a missing section is
 * not a gap to paper over on a legal page.
 *
 * Each page is independent. One policy failing its gate leaves the other four
 * on Storyblok; nothing is all-or-nothing across pages.
 */
import {loadOneStory} from './storyblok-tour-source.mjs';

export const POLICY_FOLDER = 'policies';
export const policyStorySlug = policyType => `${POLICY_FOLDER}/${policyType}`;

const text = value => (typeof value === 'string' ? value.trim() : '');
const list = value => (Array.isArray(value) ? value : []);
const blocksOf = (value, component) =>
  list(value).filter(entry => entry && entry.component === component);

/**
 * Map one story onto the policy content shape.
 *
 * Returns undefined for anything that would publish an incomplete policy, and
 * `{hidden: true}` when an editor has switched the page off.
 */
export function mapStoryblokPolicy(story, policyType) {
  const c = story?.content;
  if (!c || c.component !== 'policy_page') return undefined;
  if (c.published !== true) return {hidden: true};
  // A document that says it is a different policy must never be published as
  // this one. Mismatches are refused rather than guessed at.
  if (text(c.policy_type) !== policyType) return undefined;

  const sections = blocksOf(c.sections, 'policy_section')
    .map(section => {
      const items = blocksOf(section.items, 'policy_item')
        .map(item => {
          const label = text(item.link_label);
          const href = text(item.link_href);
          return {
            term: text(item.term),
            text: text(item.text),
            ...(label && href ? {link: {label, href}} : {}),
          };
        })
        .filter(item => item.term && item.text);
      const intro = text(section.intro);
      return {heading: text(section.heading), ...(intro ? {intro} : {}), items};
    })
    // A section with a heading and nothing under it reads as a policy with a
    // hole in it, so an incomplete section fails the whole page rather than
    // shipping alone.
    .filter(section => section.heading && section.items.length);

  const title = text(c.title);
  const lastUpdated = text(c.last_updated);
  const intro = text(c.intro);
  const contactIntro = text(c.contact_intro);
  if (!title || !lastUpdated || !intro || !contactIntro || !sections.length) return undefined;

  // If any section was dropped above, the document in Storyblok is not the
  // document that would ship. Refuse rather than publish a shortened policy.
  if (sections.length !== blocksOf(c.sections, 'policy_section').length) return undefined;

  const closing = text(c.closing);
  return {
    title,
    lastUpdated,
    intro,
    sections,
    contactIntro,
    // Only two policies carry one; the others must not gain an empty paragraph.
    ...(closing ? {closing} : {}),
  };
}

/**
 * Fetch one policy. Every failure path returns the current content untouched.
 */
export async function loadStoryblokPolicy({
  policyType,
  baseContent,
  env = process.env,
  fetchImpl = fetch,
  logger = console,
  contentVersion = 'draft',
  tokenEnvVar = 'STORYBLOK_PREVIEW_API_TOKEN',
} = {}) {
  const unchanged = source => ({content: baseContent, source});

  if (env.STORYBLOK_POLICIES_ENABLED !== 'true') return unchanged('disabled');
  const token = text(env[tokenEnvVar]);
  if (!token) return unchanged('missing-configuration');
  if (text(env.STORYBLOK_REGION || 'eu').toLowerCase() !== 'eu') return unchanged('unsupported-region');

  let result;
  try {
    result = await loadOneStory({
      entry: {fullSlug: policyStorySlug(policyType)},
      token,
      fetchImpl,
      contentVersion,
    });
  } catch {
    logger?.warn?.(`Storyblok policy "${policyType}" could not be loaded; keeping its current wording.`);
    return unchanged('unavailable');
  }
  if (result.source !== 'received') return unchanged(result.source);

  const mapped = mapStoryblokPolicy(result.story, policyType);
  if (mapped?.hidden) {
    logger?.warn?.(`The Storyblok policy "${policyType}" is switched off; keeping its current wording.`);
    return unchanged('editorial-suppressed');
  }
  if (!mapped) {
    logger?.warn?.(`The Storyblok policy "${policyType}" did not pass the content gate; keeping its current wording.`);
    return unchanged('invalid-content');
  }

  // Replaced whole, never merged.
  return {content: mapped, source: 'applied'};
}
