const API_VERSION = '2026-08-02';
const SECTION_KEYS = [
  'hero', 'founderStory', 'waysToExperience', 'howHosted',
  'reviewsAndTrust', 'planningProcess', 'finalInvitation',
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
    else if (sectionKey === 'hero' || sectionKey === 'founderStory' || sectionKey === 'finalInvitation') target.headline = headline;
    else target.title = headline;
  }
  if (body) {
    if (sectionKey === 'hero') target.sub = body;
    else if (sectionKey === 'founderStory' || sectionKey === 'finalInvitation') target.body = body;
    else target.intro = body;
  }
  const ctas = (section.ctas || []).map(cta => safeCta(cta, sectionKey));
  if (ctas[0]) target.cta = ctas[0];
  if (ctas[1] && sectionKey === 'finalInvitation') target.secondaryCta = ctas[1];
  if (sectionKey === 'founderStory' && Array.isArray(section.founders) && section.founders.length) {
    target.founders = section.founders.map(founder => {
      const displayName = founder.preferredName || founder.name;
      const profile = {
        name: founder.name,
        preferredName: founder.preferredName,
        role: founder.role || '',
        quote: founder.quote || undefined,
        initials: String(displayName || '').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase(),
      };
      if (founder.photo?.src && founder.photo.publicApprovalState === 'approved') profile.image = founder.photo;
      return profile;
    });
  }
  if (sectionKey === 'waysToExperience' && Array.isArray(section.pathways) && section.pathways.length) {
    target.pathways = section.pathways
      .filter(pathway => pathway?.title && pathway?.filterKey && pathway?.image?.src)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      .map(pathway => ({
        title: pathway.title,
        text: pathway.description || '',
        href: `packages.html?category=${encodeURIComponent(pathway.filterKey)}`,
        image: pathway.image,
      }));
  }
  if (sectionKey === 'howHosted' && Array.isArray(section.hostingPrinciples) && section.hostingPrinciples.length) {
    target.principles = section.hostingPrinciples
      .filter(principle => principle?.title && principle?.description && principle?.icon)
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
      .map(principle => ({
        icon: principle.icon,
        title: principle.title,
        text: principle.description,
        proofQuote: principle.proofReview?.selectedExcerpt || '',
        proofAuthor: principle.proofReview?.reviewerName || '',
      }));
  }
  if (sectionKey === 'reviewsAndTrust' && Array.isArray(section.featuredReviews) && section.featuredReviews.length) {
    target.items = section.featuredReviews
      .filter(review => review?.reviewerName && review?.selectedExcerpt)
      .map(review => {
        const item = {
          quote: review.selectedExcerpt,
          author: review.reviewerName,
          location: review.country || `Verified ${review.platform || 'traveler'} review`,
          rating: review.rating || 5,
          sourceUrl: review.sourceUrl || undefined,
        };
        if (review.image?.src && review.image.publicApprovalState === 'approved') item.image = review.image;
        return item;
      });
  }
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
  SECTION_KEYS.forEach(key => {
    if (!byKey.has(key)) throw new Error(`Sanity homepage is missing section ${key}`);
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

  const sectionKeyFilter = SECTION_KEYS.map(key => `"${key}"`).join(', ');
  const query = `*[_type == "homepageSection" && sectionKey in [${sectionKeyFilter}]] | order(order asc){
    sectionKey, order, eyebrow, headline, body,
    "ctas": ctas[]->{label, destination, external},
    "founders": founders[]->{
      name, preferredName, role, quote,
      "photo": {
        "src": photo.image.asset->url,
        "alt": photo.altText,
        "width": photo.image.asset->metadata.dimensions.width,
        "height": photo.image.asset->metadata.dimensions.height,
        "publicApprovalState": photo.publicApprovalState
      }
    },
    "pathways": pathways[]->{
      title, description, filterKey, order,
      "image": {
        "src": image.image.asset->url,
        "alt": image.altText,
        "width": image.image.asset->metadata.dimensions.width,
        "height": image.image.asset->metadata.dimensions.height
      }
    },
    "hostingPrinciples": hostingPrinciples[]->{
      title, description, icon, order,
      "proofReview": proofReview->{reviewerName, selectedExcerpt}
    },
    "featuredReviews": featuredReviews[]->{
      reviewerName, country, selectedExcerpt, rating, platform, sourceUrl,
      "image": {
        "src": media[0].image.asset->url,
        "alt": media[0].altText,
        "width": media[0].image.asset->metadata.dimensions.width,
        "height": media[0].image.asset->metadata.dimensions.height,
        "publicApprovalState": media[0].publicApprovalState
      }
    }
  }`;
  const url = `https://${projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
  const response = await fetchImpl(url, {headers: {Accept: 'application/json'}});
  if (!response.ok) throw new Error(`Sanity homepage request failed with HTTP ${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(`Sanity homepage request failed: ${body.error.description || body.error.type}`);
  return {content: mergeHomepage(localContent, body.result), source: 'sanity'};
}
