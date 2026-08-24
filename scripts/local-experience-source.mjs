import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

const API_VERSION = '2026-08-02';

// Names only, by design. The founders' tour document lists these without
// prices or descriptions because each is arranged around the guest, so the
// site must not imply a fixed offer it cannot honour.
function validate(content, source) {
  if (!content || !Array.isArray(content.experiences) || content.experiences.length === 0) {
    throw new Error(`${source} has no add-on experiences`);
  }
  for (const experience of content.experiences) {
    if (!experience?.name?.trim()) throw new Error(`${source} has an add-on with no name`);
    if ('price' in experience) throw new Error(`${source}: add-ons are quoted on request and must not carry a price`);
  }
  if (!Number.isInteger(content.minimumGroup) || content.minimumGroup < 1) {
    throw new Error(`${source} is missing the minimum group size`);
  }
  return {
    minimumGroup: content.minimumGroup,
    experiences: [...content.experiences].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
  };
}

export async function loadLocalExperienceContent(projectRoot) {
  const file = JSON.parse(await readFile(join(projectRoot, 'src/content/local-experiences.json'), 'utf8'));
  return validate(file, 'Local add-on content');
}

export async function loadExperienceContent({localContent, env = process.env, fetchImpl = fetch}) {
  const projectId = env.SANITY_STUDIO_PROJECT_ID;
  const dataset = env.SANITY_STUDIO_DATASET || 'production';
  if (!projectId || projectId === 'REPLACE_WITH_PROJECT_ID') return {content: localContent, source: 'local'};
  if (!/^[a-z0-9-]+$/.test(projectId) || !/^[a-z0-9_-]+$/.test(dataset)) {
    throw new Error('Sanity project or dataset configuration is invalid');
  }

  const query = '*[_type == "localExperience" && active == true]|order(order asc){name, order}';
  const url = `https://${projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
  const response = await fetchImpl(url, {headers: {Accept: 'application/json'}});
  if (!response.ok) throw new Error(`Sanity add-on request failed with HTTP ${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(`Sanity add-on request failed: ${body.error.description || body.error.type}`);

  // Switching every add-on off is a decision an editor is allowed to make;
  // an empty response should take the section down, not fall back to a list
  // they have just removed.
  if (!Array.isArray(body.result)) return {content: localContent, source: 'local'};
  return {
    content: validate({minimumGroup: localContent.minimumGroup, experiences: body.result}, 'Sanity add-on content'),
    source: 'sanity',
  };
}
