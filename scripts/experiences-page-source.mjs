import {fetchSanity} from './sanity-fetch.mjs';

const API_VERSION = '2026-08-02';

const PHOTO = `{
  "src": image.asset->url,
  "alt": altText,
  "width": image.asset->metadata.dimensions.width,
  "height": image.asset->metadata.dimensions.height,
  placeholderState, publicApprovalState
}`;

/**
 * The two photographs on the experiences page that do not belong to a tour.
 *
 * Both are optional: the page ships with a committed image behind each, and
 * that is what renders until someone chooses one in the Studio. So there is
 * nothing to validate and no reason to fail a build over an empty document.
 */
export async function loadExperiencesPagePhotos({env = process.env, fetchImpl = fetch} = {}) {
  const projectId = env.SANITY_STUDIO_PROJECT_ID;
  const dataset = env.SANITY_STUDIO_DATASET || 'production';
  if (!projectId || projectId === 'REPLACE_WITH_PROJECT_ID') return {photos: {}, source: 'local'};
  if (!/^[a-z0-9-]+$/.test(projectId) || !/^[a-z0-9_-]+$/.test(dataset)) {
    throw new Error('Sanity project or dataset configuration is invalid');
  }

  const query = `*[_type == "experiencesPage"][0]{
    "experiencesHero": coverPhoto${PHOTO},
    "experiencesAddOn": addOnPhoto${PHOTO}
  }`;
  const url = `https://${projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
  const body = await fetchSanity(url, {fetchImpl, label: 'Sanity experiences page'});
  return {photos: body.result || {}, source: body.result ? 'sanity' : 'local'};
}
