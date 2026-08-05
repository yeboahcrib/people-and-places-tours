import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

const API_VERSION = '2026-08-02';

const TEXT_KEYS = [
  'heroTitle', 'heroSubtitle',
  'storyEyebrow', 'storyTitle',
  'missionEyebrow', 'missionTitle', 'missionBody',
  'differenceEyebrow', 'differenceTitle', 'differenceIntro',
  'teamEyebrow', 'teamTitle', 'teamIntro', 'teamNote',
  'ctaEyebrow', 'ctaTitle', 'ctaBody', 'ctaNote',
];

const LIST_SHAPES = {
  differenceItems: ['title', 'text'],
  team: ['name', 'role', 'bio'],
  impactStats: ['value', 'label'],
  faqs: ['question', 'answer'],
};

function validateAbout(about, source) {
  if (!about || typeof about !== 'object') throw new Error(`${source} is missing About content`);
  for (const key of TEXT_KEYS) {
    if (typeof about[key] !== 'string' || !about[key].trim()) {
      throw new Error(`${source} is missing About copy for "${key}"`);
    }
  }
  if (!Array.isArray(about.storyParagraphs) || about.storyParagraphs.length === 0) {
    throw new Error(`${source} is missing the origin story paragraphs`);
  }
  for (const [list, fields] of Object.entries(LIST_SHAPES)) {
    if (!Array.isArray(about[list]) || about[list].length === 0) {
      throw new Error(`${source} is missing About "${list}"`);
    }
    for (const [index, entry] of about[list].entries()) {
      for (const field of fields) {
        if (!entry?.[field]) throw new Error(`${source} ${list}[${index}] is missing "${field}"`);
      }
    }
  }
  return about;
}

export async function loadLocalAboutContent(projectRoot) {
  const file = JSON.parse(await readFile(join(projectRoot, 'src/content/about.json'), 'utf8'));
  return validateAbout(file?.aboutPage, 'Local About content');
}

export async function loadAboutContent({localContent, env = process.env, fetchImpl = fetch}) {
  const projectId = env.SANITY_STUDIO_PROJECT_ID;
  const dataset = env.SANITY_STUDIO_DATASET || 'production';

  if (!projectId || projectId === 'REPLACE_WITH_PROJECT_ID') {
    return {content: localContent, source: 'local'};
  }
  if (!/^[a-z0-9-]+$/.test(projectId) || !/^[a-z0-9_-]+$/.test(dataset)) {
    throw new Error('Sanity project or dataset configuration is invalid');
  }

  const query = `*[_id == "aboutPage"][0]{
    ${TEXT_KEYS.join(', ')},
    storyParagraphs,
    differenceItems[]{title, text},
    team[]{name, role, bio},
    impactStats[]{value, label},
    faqs[]{question, answer}
  }`;
  const url = `https://${projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
  const response = await fetchImpl(url, {headers: {Accept: 'application/json'}});
  if (!response.ok) throw new Error(`Sanity About request failed with HTTP ${response.status}`);

  const body = await response.json();
  if (body.error) throw new Error(`Sanity About request failed: ${body.error.description || body.error.type}`);

  // Fail the build rather than quietly publishing the committed copy when
  // Sanity is configured but incomplete.
  return {content: validateAbout(body.result, 'Sanity About content'), source: 'sanity'};
}

export {TEXT_KEYS, LIST_SHAPES};
