/**
 * The one photograph on the Experiences page that Sanity still owns.
 *
 * `loadExperiencesPagePhotos` reads two pictures from Sanity: the page hero and
 * the one beside "Things You Can Add On". Only the second has ever had an
 * approved record — the hero is null in Sanity, so the committed image is what
 * ships there, and that is left exactly as it is.
 *
 * This is deliberately the smallest possible adapter. It does not migrate the
 * Experiences page, its add-on copy or its tour grid; the rendering path asks
 * for photographs keyed by `data-cms-photo` and this supplies one of those
 * keys. Anything more would be migrating content nothing has asked for.
 *
 * The shape returned is the same `mediaAsset` the Sanity loader produces, so
 * `injectPagePhotos` cannot tell the two apart and no rendering code changes.
 */
import {loadOneStory, isStoryblokEuAssetUrl, storyblokImageUrl} from './storyblok-tour-source.mjs';

export const EXPERIENCES_STORY_SLUG = 'experiences';

/** The slot in packages.html. The photo is fetched at exactly this size. */
export const ADD_ON_SLOT = Object.freeze({width: 900, height: 1125});

const text = value => (typeof value === 'string' ? value.trim() : '');

/**
 * Map the story onto the photo shape the page renderer already accepts.
 *
 * Returns undefined unless there is a usable, EU-hosted asset: a page with a
 * broken picture is worse than a page with its committed one.
 */
export function mapStoryblokExperiences(story) {
  const c = story?.content;
  if (!c || c.component !== 'experiences_page') return undefined;
  if (c.published !== true) return {hidden: true};

  const asset = c.add_on_photo;
  const filename = text(asset?.filename);
  if (!filename || !isStoryblokEuAssetUrl(filename)) return undefined;

  const src = storyblokImageUrl(asset, ADD_ON_SLOT.width, ADD_ON_SLOT.height);
  if (!src) return undefined;

  // The alt field wins over the asset's own, because the page's description of
  // a picture is a page decision. An empty alt is refused rather than shipped:
  // this photograph carries meaning, and the Sanity record it replaces has
  // always described it.
  const alt = text(c.add_on_alt) || text(asset?.alt);
  if (!alt) return undefined;

  return {
    experiencesAddOn: {
      src,
      alt,
      width: ADD_ON_SLOT.width,
      height: ADD_ON_SLOT.height,
      // injectPagePhotos only uses a photo whose two approval states are
      // approved. Reaching this point means an editor published the record,
      // which is the same decision those states encode in Sanity.
      placeholderState: 'approved',
      publicApprovalState: 'approved',
    },
  };
}

/**
 * Fetch the Experiences photographs. Every failure path returns the photos the
 * build already had, so the page keeps whichever picture it is showing now.
 */
export async function loadStoryblokExperiences({
  basePhotos = {},
  env = process.env,
  fetchImpl = fetch,
  logger = console,
  contentVersion = 'draft',
  tokenEnvVar = 'STORYBLOK_PREVIEW_API_TOKEN',
} = {}) {
  const unchanged = source => ({photos: basePhotos, source});

  if (env.STORYBLOK_EXPERIENCES_ENABLED !== 'true') return unchanged('disabled');
  const token = text(env[tokenEnvVar]);
  if (!token) return unchanged('missing-configuration');
  if (text(env.STORYBLOK_REGION || 'eu').toLowerCase() !== 'eu') return unchanged('unsupported-region');

  let result;
  try {
    result = await loadOneStory({
      entry: {fullSlug: EXPERIENCES_STORY_SLUG},
      token,
      fetchImpl,
      contentVersion,
    });
  } catch {
    logger?.warn?.('Storyblok experiences photo could not be loaded; keeping the current one.');
    return unchanged('unavailable');
  }
  if (result.source !== 'received') return unchanged(result.source);

  const mapped = mapStoryblokExperiences(result.story);
  if (mapped?.hidden) {
    logger?.warn?.('The Storyblok experiences photo is switched off; keeping the current one.');
    return unchanged('editorial-suppressed');
  }
  if (!mapped) {
    logger?.warn?.('The Storyblok experiences photo did not pass the content gate; keeping the current one.');
    return unchanged('invalid-content');
  }

  // Merged, not replaced: the hero has no Storyblok record and must keep
  // whatever the build already resolved for it.
  return {photos: {...basePhotos, ...mapped}, source: 'applied'};
}
