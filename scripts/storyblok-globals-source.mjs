/**
 * Site-wide globals — contact details, social profiles and the shell's words —
 * read from Storyblok at build time.
 *
 * **Storyblok owns words, code owns destinations.** Every href on this site is
 * load-bearing in three separate places: `safeNavigationHref` in
 * shared-shell.mjs only accepts the `name.html` form, `cleanInternalUrls` in
 * the build rewrites that to the extensionless address Cloudflare serves, and
 * `script.js` carries a `storyNavMap` that matches homepage sections to
 * `about.html` / `packages.html` / `contact.html` by hand. An editor who
 * retyped a destination would not move a link; they would break the active-link
 * indicator and, on a typo, fail the build. So the structure below is taken
 * from the committed content and Storyblok may only replace the label on it.
 *
 * That single rule is what makes requirement 7 hold without a special case: a
 * failed read, a malformed document and an editor deleting a whole column all
 * land in the same place, because the navigation and the legal column were
 * never Storyblok's to supply. It can rename a link. It cannot remove one.
 *
 * Social profiles are the exception to "fall back to Sanity", and deliberately.
 * Their URLs have never been in Sanity — the GROQ query in content-source.mjs
 * does not project them and the footer partial hardcoded all three — so their
 * fallback is the code-owned constant below rather than a CMS value that would
 * arrive undefined and blank the icons.
 */
import {loadOneStory} from './storyblok-tour-source.mjs';
import {FOOTER_SOCIAL_DEFAULTS} from './shared-shell.mjs';

export const GLOBALS_STORY_SLUG = 'globals/site';

/**
 * Re-exported from the renderer so there is exactly one set of addresses: the
 * value the footer falls back to is the same value this adapter measures a
 * Storyblok edit against.
 */
export const SOCIAL_DEFAULTS = FOOTER_SOCIAL_DEFAULTS;

/** Contact values an editor may change. Everything else on the page is code. */
export const EDITABLE_SETTINGS = Object.freeze([
  'businessName',
  'primaryPhone',
  'internationalPhone',
  'email',
  'hours',
  'responsePromise',
  'instagramHandle',
]);

/**
 * Without these the site cannot render: the nav phone, the policy contact
 * block and the footer all read them. Matches what `validateContent` already
 * demands of Sanity, so Storyblok cannot get a page past a gate Sanity could
 * not.
 */
const REQUIRED_SETTINGS = Object.freeze(['businessName', 'primaryPhone', 'email']);

const text = value => (typeof value === 'string' ? value.trim() : '');
const list = value => (Array.isArray(value) ? value : []);
const blocksOf = (value, component) =>
  list(value).filter(entry => entry && entry.component === component);

/** Only https, and only a real host — an editor cannot point a profile at a script. */
const httpsUrl = value => {
  const raw = text(value);
  if (!raw) return '';
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && url.hostname ? url.href : '';
  } catch {
    return '';
  }
};

/** Storyblok's label for this href, or the committed one. Never the href itself. */
const labelFor = (overrides, href, fallback) => overrides.get(href) || fallback;

const labelMap = entries => new Map(
  blocksOf(entries, 'global_link')
    .map(entry => [text(entry.href), text(entry.label)])
    .filter(([href, label]) => href && label),
);

/**
 * Merge one story over the committed globals.
 *
 * Returns undefined when the document could not be trusted at all, and
 * `{hidden: true}` when an editor has switched it off. Anything softer — a
 * renamed column, a link that no longer exists — leaves that part committed
 * and lets the rest through, because a half-applied label is harmless where a
 * half-applied navigation would not be.
 */
export function mapStoryblokGlobals(story, base, warn = () => {}) {
  const c = story?.content;
  if (!c || c.component !== 'site_globals') return undefined;
  if (c.published !== true) return {hidden: true};

  const baseSettings = base?.siteSettings ?? {};
  const baseNavigation = base?.navigation ?? {};

  const siteSettings = {...baseSettings};
  for (const key of EDITABLE_SETTINGS) {
    const value = text(c[toSnake(key)]);
    if (value) siteSettings[key] = value;
  }
  // An empty Storyblok field means "I did not edit this", not "delete this",
  // so a cleared phone number keeps the committed one — the same rule every
  // other field follows. Refusing the document instead would throw away the
  // editor's unrelated edits without producing a better phone number.
  //
  // This check therefore guards the merged result rather than the input: if
  // the committed globals are themselves missing something the shell cannot
  // render without, nothing here can rescue it, and falling back whole is the
  // only honest outcome.
  for (const key of REQUIRED_SETTINGS) {
    if (!text(siteSettings[key])) return undefined;
  }

  const social = {...SOCIAL_DEFAULTS};
  for (const key of Object.keys(SOCIAL_DEFAULTS)) {
    const raw = text(c[toSnake(key)]);
    if (!raw) continue;
    const url = httpsUrl(raw);
    if (url) social[key] = url;
    else warn(`The Storyblok social link "${key}" is not an https address; keeping the current one.`);
  }

  const navOverrides = labelMap(c.nav_labels);
  const navLinks = list(baseNavigation.navLinks)
    .map(link => ({...link, label: labelFor(navOverrides, link.href, link.label)}));

  const baseColumns = list(baseNavigation.footerColumns);
  const storyColumns = blocksOf(c.footer_columns, 'footer_column');
  // Columns are matched by position, so a document that has gained or lost one
  // is describing a footer this site does not have. Keep the committed footer
  // whole rather than guess which column the editor meant.
  const columnsAlign = storyColumns.length === baseColumns.length;
  if (storyColumns.length && !columnsAlign) {
    warn(`Storyblok describes ${storyColumns.length} footer columns and the site has ${baseColumns.length}; keeping the committed footer links.`);
  }
  const footerColumns = baseColumns.map((column, index) => {
    const source = columnsAlign ? storyColumns[index] : undefined;
    const overrides = labelMap(source?.links);
    return {
      ...column,
      heading: text(source?.heading) || column.heading,
      links: list(column.links)
        .map(link => ({...link, label: labelFor(overrides, link.href, link.label)})),
    };
  });

  return {
    siteSettings,
    social,
    navigation: {
      ...baseNavigation,
      footerTagline: text(c.footer_tagline) || baseNavigation.footerTagline,
      navLinks,
      footerColumns,
    },
  };
}

/** businessName -> business_name. Storyblok field names are snake_case. */
function toSnake(key) {
  return key.replace(/[A-Z]/g, character => `_${character.toLowerCase()}`);
}

/**
 * Fetch the globals. Every failure path returns the committed content
 * untouched, with the code-owned social defaults attached so the footer icons
 * are never left without addresses.
 */
export async function loadStoryblokGlobals({
  baseContent,
  env = process.env,
  fetchImpl = fetch,
  logger = console,
  contentVersion = 'draft',
  tokenEnvVar = 'STORYBLOK_PREVIEW_API_TOKEN',
} = {}) {
  const unchanged = source => ({
    content: {...baseContent, social: {...SOCIAL_DEFAULTS}},
    source,
  });

  if (env.STORYBLOK_GLOBALS_ENABLED !== 'true') return unchanged('disabled');
  const token = text(env[tokenEnvVar]);
  if (!token) return unchanged('missing-configuration');
  if (text(env.STORYBLOK_REGION || 'eu').toLowerCase() !== 'eu') return unchanged('unsupported-region');

  let result;
  try {
    result = await loadOneStory({
      entry: {fullSlug: GLOBALS_STORY_SLUG},
      token,
      fetchImpl,
      contentVersion,
    });
  } catch {
    logger?.warn?.('Storyblok globals could not be loaded; keeping the committed navigation, footer and contact details.');
    return unchanged('unavailable');
  }
  if (result.source !== 'received') return unchanged(result.source);

  const mapped = mapStoryblokGlobals(result.story, baseContent, message => logger?.warn?.(`Storyblok: ${message}`));
  if (mapped?.hidden) {
    logger?.warn?.('The Storyblok globals record is switched off; keeping the committed navigation, footer and contact details.');
    return unchanged('editorial-suppressed');
  }
  if (!mapped) {
    logger?.warn?.('The Storyblok globals record did not pass the content gate; keeping the committed navigation, footer and contact details.');
    return unchanged('invalid-content');
  }

  return {content: mapped, source: 'applied'};
}
