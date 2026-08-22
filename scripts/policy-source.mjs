import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

const API_VERSION = '2026-08-02';

// A policy is a legal statement, so this validates harder than the other
// adapters: a section with no items, or an item with a heading and no text,
// would publish a page that looks complete and promises nothing.
function validatePolicy(policy, source) {
  if (!policy || typeof policy !== 'object') {
    throw new Error(`${source} is missing the cancellation policy`);
  }
  for (const key of ['title', 'intro', 'contactIntro', 'closing']) {
    if (typeof policy[key] !== 'string' || !policy[key].trim()) {
      throw new Error(`${source} is missing policy copy for "${key}"`);
    }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(policy.lastUpdated || '')) {
    throw new Error(`${source} needs a "last updated" date — a policy without one cannot be relied on`);
  }
  if (!Array.isArray(policy.sections) || policy.sections.length === 0) {
    throw new Error(`${source} has no policy sections`);
  }
  for (const [index, section] of policy.sections.entries()) {
    if (!section?.heading?.trim()) throw new Error(`${source} section ${index + 1} has no heading`);
    if (!Array.isArray(section.items) || section.items.length === 0) {
      throw new Error(`${source} section "${section.heading}" has no terms in it`);
    }
    for (const item of section.items) {
      if (!item?.term?.trim() || !item?.text?.trim()) {
        throw new Error(`${source} section "${section.heading}" has a term with nothing under it`);
      }
    }
  }
  return policy;
}

export async function loadLocalPolicyContent(projectRoot) {
  const file = JSON.parse(await readFile(join(projectRoot, 'src/content/policy.json'), 'utf8'));
  return validatePolicy(file?.cancellationRefund, 'Local policy content');
}

export async function loadPolicyContent({localContent, env = process.env, fetchImpl = fetch}) {
  const projectId = env.SANITY_STUDIO_PROJECT_ID;
  const dataset = env.SANITY_STUDIO_DATASET || 'production';

  if (!projectId || projectId === 'REPLACE_WITH_PROJECT_ID') {
    return {content: localContent, source: 'local'};
  }
  if (!/^[a-z0-9-]+$/.test(projectId) || !/^[a-z0-9_-]+$/.test(dataset)) {
    throw new Error('Sanity project or dataset configuration is invalid');
  }

  const query = `*[_type == "policy" && policyType == "cancellation"][0]{
    title, intro, contactIntro, closing, "lastUpdated": string(lastUpdated),
    sections[]{heading, intro, items[]{term, text}}
  }`;
  const url = `https://${projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
  const response = await fetchImpl(url, {headers: {Accept: 'application/json'}});
  if (!response.ok) throw new Error(`Sanity policy request failed with HTTP ${response.status}`);

  const body = await response.json();
  if (body.error) throw new Error(`Sanity policy request failed: ${body.error.description || body.error.type}`);

  // Unlike the homepage, there is no merge here. A half-written policy must
  // never be blended with the committed one — the result would be a document
  // nobody wrote and nobody agreed to.
  if (!body.result) return {content: localContent, source: 'local'};
  return {content: validatePolicy(body.result, 'Sanity policy content'), source: 'sanity'};
}
