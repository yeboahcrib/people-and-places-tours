import {fetchSanity} from './sanity-fetch.mjs';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

const API_VERSION = '2026-08-02';

function validateContent(content, source) {
  const settings = content?.siteSettings;
  const navigation = content?.navigation;
  if (!settings?.businessName || !settings?.primaryPhone || !settings?.email) {
    throw new Error(`${source} is missing required site settings`);
  }
  if (!Array.isArray(navigation?.navLinks) || navigation.navLinks.length === 0) {
    throw new Error(`${source} is missing navigation links`);
  }
  for (const [index, link] of navigation.navLinks.entries()) {
    if (!link?.label || !link?.href) throw new Error(`${source} navigation link ${index + 1} is incomplete`);
  }
  if (!navigation.footerTagline || !Array.isArray(navigation.footerColumns) || navigation.footerColumns.length === 0) {
    throw new Error(`${source} is missing footer content`);
  }
  return content;
}

export async function loadSiteContent({projectRoot, env = process.env, fetchImpl = fetch}) {
  const projectId = env.SANITY_STUDIO_PROJECT_ID;
  const dataset = env.SANITY_STUDIO_DATASET || 'production';

  if (!projectId || projectId === 'REPLACE_WITH_PROJECT_ID') {
    const local = JSON.parse(await readFile(join(projectRoot, 'src/content/site.json'), 'utf8'));
    return {content: validateContent(local, 'Local site content'), source: 'local'};
  }

  if (!/^[a-z0-9-]+$/.test(projectId) || !/^[a-z0-9_-]+$/.test(dataset)) {
    throw new Error('Sanity project or dataset configuration is invalid');
  }

  const query = `{
    "siteSettings": *[_id == "siteSettings"][0]{businessName, primaryPhone, internationalPhone, email, hours, responsePromise, serviceArea, instagramHandle, instagramUrl},
    "navigation": *[_id == "navigation"][0]{navLinks[]{label, href}, footerTagline, footerColumns[]{heading, links[]{label, href}}}
  }`;
  const url = `https://${projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
  const result = await fetchSanity(url, {fetchImpl, label: 'Sanity content'});

  // When Sanity is explicitly configured, fail the build instead of silently
  // publishing stale local values. A visible failed deployment is safer than
  // an apparently successful site with outdated operational information.
  return {content: validateContent(result.result, 'Sanity content'), source: 'sanity'};
}
