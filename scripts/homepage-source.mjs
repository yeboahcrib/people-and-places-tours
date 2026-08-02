const API_VERSION = '2026-08-02';
const SECTION_KEYS = [
  'hero', 'founderStory', 'waysToExperience', 'availableTours', 'howHosted',
  'guestStory', 'reviewsAndTrust', 'planningProcess', 'stories', 'finalInvitation',
];

const clone = value => structuredClone(value);

function safeCta(cta, sectionKey) {
  if (!cta) return undefined;
  const href = String(cta.destination || '').trim();
  if (!cta.label || !/^(?:[a-z0-9][a-z0-9-]*\.html(?:\?[^\s]*)?|https:\/\/[^\s]+)$/i.test(href)) {
    throw new Error(`Sanity homepage section ${sectionKey} has an invalid CTA`);
  }
  return {label: cta.label, href, external: Boolean(cta.external)};
}

function applyPrimaryCopy(target, section) {
  const {sectionKey, eyebrow, headline, body} = section;
  if (eyebrow) target.eyebrow = eyebrow;
  if (headline) {
    if (sectionKey === 'howHosted' || sectionKey === 'reviewsAndTrust') target.titleLines = headline.split(/\s*\n\s*/).filter(Boolean);
    else if (sectionKey === 'hero' || sectionKey === 'founderStory' || sectionKey === 'guestStory' || sectionKey === 'finalInvitation') target.headline = headline;
    else target.title = headline;
  }
  if (body) {
    if (sectionKey === 'hero') target.sub = body;
    else if (sectionKey === 'founderStory' || sectionKey === 'guestStory' || sectionKey === 'finalInvitation') target.body = body;
    else if (sectionKey === 'stories') target.tagline = body;
    else target.intro = body;
  }
  const ctas = (section.ctas || []).map(cta => safeCta(cta, sectionKey));
  if (ctas[0]) target.cta = ctas[0];
  if (ctas[1] && sectionKey === 'finalInvitation') target.secondaryCta = ctas[1];
}

function mergeHomepage(localContent, sections) {
  if (!Array.isArray(sections) || sections.length !== SECTION_KEYS.length) {
    throw new Error(`Sanity homepage must contain exactly ${SECTION_KEYS.length} sections`);
  }
  const byKey = new Map();
  for (const section of sections) {
    if (!SECTION_KEYS.includes(section?.sectionKey) || byKey.has(section.sectionKey)) {
      throw new Error(`Sanity homepage has an invalid or duplicate section: ${section?.sectionKey || '(missing)'}`);
    }
    byKey.set(section.sectionKey, section);
  }
  SECTION_KEYS.forEach((key, index) => {
    const section = byKey.get(key);
    if (!section || section.order !== index + 1) throw new Error(`Sanity homepage section ${key} has an invalid order`);
  });

  const content = clone(localContent);
  for (const key of SECTION_KEYS) applyPrimaryCopy(content[key], byKey.get(key));
  return content;
}

export async function loadHomepageContent({localContent, env = process.env, fetchImpl = fetch}) {
  const projectId = env.SANITY_STUDIO_PROJECT_ID;
  const dataset = env.SANITY_STUDIO_DATASET || 'production';
  if (!projectId || projectId === 'REPLACE_WITH_PROJECT_ID') {
    return {content: localContent, source: 'local'};
  }
  if (!/^[a-z0-9-]+$/.test(projectId) || !/^[a-z0-9_-]+$/.test(dataset)) {
    throw new Error('Sanity project or dataset configuration is invalid');
  }

  const query = `*[_type == "homepageSection"] | order(order asc){sectionKey, order, eyebrow, headline, body, "ctas": ctas[]->{label, destination, external}}`;
  const url = `https://${projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
  const response = await fetchImpl(url, {headers: {Accept: 'application/json'}});
  if (!response.ok) throw new Error(`Sanity homepage request failed with HTTP ${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(`Sanity homepage request failed: ${body.error.description || body.error.type}`);
  return {content: mergeHomepage(localContent, body.result), source: 'sanity'};
}
