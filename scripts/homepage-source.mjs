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

/**
 * Copy the fields an editor actually filled in over the committed ones.
 *
 * A blank field in the Studio means "I have not written this yet", never "make
 * this empty on the website". Only defined, non-empty values are copied, so a
 * half-finished entry keeps the rest of its committed text.
 */
function overlay(base, fields) {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === '') continue;
    base[key] = value;
  }
  return base;
}

/**
 * A photo is only usable once the editor has confirmed it is real and approved
 * for the website. Anything else returns undefined, which `overlay` skips —
 * so the committed photo stays until the new one is ready.
 */
function usablePhoto(image) {
  if (!image?.src) return undefined;
  if (image.publicApprovalState !== 'approved') return undefined;
  if (image.placeholderState !== 'approved') return undefined;
  return image;
}

/**
 * Build a list from Sanity, using the committed list to fill in the gaps.
 *
 * The editor decides which items exist and what order they are in — this is a
 * CMS, so removing an item in the Studio removes it from the page, and adding
 * one adds it. The committed list is not a floor; it is a source of detail for
 * items the editor has not finished.
 *
 * Each Sanity entry is matched to a committed one by a stable key — the
 * pathway's category, the principle's icon, the reviewer's name, the step's
 * number. The committed values are the starting point, and only the fields the
 * editor actually filled in are written over them. So an entry can be renamed
 * without losing its photograph, or have its photograph swapped without losing
 * its words.
 *
 * Callers only reach this function when Sanity actually has the list. A list
 * the editor has never touched is absent from the query result, not empty, and
 * keeps its committed content untouched — see `mergeHomepage`.
 *
 * An entry still missing something it cannot be rendered without is left off
 * the page and reported, rather than published half built. The rest of the list
 * is unaffected.
 */
function mergeList(committed, incoming, config) {
  const byKey = new Map();
  for (const item of committed || []) {
    const key = config.committedKey(item);
    if (key !== undefined && key !== '' && !byKey.has(key)) byKey.set(key, item);
  }

  const ordered = config.orderOf
    ? [...incoming].sort((a, b) => (config.orderOf(a) ?? Number.MAX_SAFE_INTEGER) - (config.orderOf(b) ?? Number.MAX_SAFE_INTEGER))
    : [...incoming];

  const merged = [];
  for (const entry of ordered) {
    const key = config.incomingKey(entry);
    const existing = key !== undefined && key !== '' ? byKey.get(key) : undefined;
    const item = overlay(existing ? clone(existing) : {...config.defaults}, config.patch(entry));
    if (config.isRenderable(item)) merged.push(item);
    else console.warn(`Sanity ${config.label} "${config.describe(entry)}" is not on the page yet. ${config.needs}`);
  }

  return config.limit ? merged.slice(0, config.limit) : merged;
}

function applyPrimaryCopy(target, section) {
  const {sectionKey, eyebrow, headline, body, reassurance, trustMessage} = section;
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
  if (sectionKey === 'finalInvitation') {
    if (reassurance) target.reassurance = reassurance;
    if (trustMessage) target.trustMessage = trustMessage;
  }
  const approvedMedia = (section.media || []).filter(media =>
    media?.publicApprovalState === 'approved' && media?.placeholderState === 'approved'
  );
  if (sectionKey === 'hero' && approvedMedia.length) {
    const video = approvedMedia.find(media => media.video);
    const poster = approvedMedia.find(media => media.src);
    target.video ||= {};
    if (video) target.video.src = video.video;
    if (poster) target.video.poster = poster;
  }
  if (sectionKey === 'reviewsAndTrust') {
    const banner = approvedMedia.find(media => media.src);
    if (banner) target.heroImage = banner;
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
      if (founder.photo?.src && founder.photo.publicApprovalState === 'approved' && founder.photo.placeholderState === 'approved') profile.image = founder.photo;
      return profile;
    });
  }
  if (sectionKey === 'waysToExperience' && Array.isArray(section.pathways)) {
    target.pathways = mergeList(target.pathways, section.pathways, {
      label: 'pathway',
      needs: 'It needs a title, a category and an approved photo.',
      describe: entry => entry?.title || entry?.filterKey || 'untitled',
      orderOf: entry => entry?.order,
      defaults: {text: ''},
      // The committed href encodes the category it links to.
      committedKey: item => String(item?.href || '').split('category=')[1],
      incomingKey: entry => entry?.filterKey,
      patch: entry => ({
        title: entry?.title,
        text: entry?.description,
        href: entry?.filterKey ? `packages.html?category=${encodeURIComponent(entry.filterKey)}` : undefined,
        image: usablePhoto(entry?.image),
      }),
      isRenderable: item => Boolean(item.title && item.href && item.image?.src),
    });
  }
  if (sectionKey === 'howHosted' && Array.isArray(section.hostingPrinciples)) {
    target.principles = mergeList(target.principles, section.hostingPrinciples, {
      label: 'hosting principle',
      needs: 'It needs an icon, a title and a description.',
      describe: entry => entry?.title || entry?.icon || 'untitled',
      orderOf: entry => entry?.order,
      defaults: {proofQuote: '', proofAuthor: ''},
      committedKey: item => item?.icon,
      incomingKey: entry => entry?.icon,
      patch: entry => ({
        icon: entry?.icon,
        title: entry?.title,
        text: entry?.description,
        proofQuote: entry?.proofReview?.selectedExcerpt,
        proofAuthor: entry?.proofReview?.reviewerName,
      }),
      isRenderable: item => Boolean(item.icon && item.title && item.text),
    });
  }
  if (sectionKey === 'reviewsAndTrust' && Array.isArray(section.featuredReviews)) {
    target.items = mergeList(target.items, section.featuredReviews, {
      label: 'review',
      needs: 'It needs a reviewer name and an excerpt.',
      describe: entry => entry?.reviewerName || 'unnamed',
      committedKey: item => String(item?.author || '').trim().toLowerCase(),
      incomingKey: entry => String(entry?.reviewerName || '').trim().toLowerCase(),
      patch: entry => ({
        quote: entry?.selectedExcerpt,
        author: entry?.reviewerName,
        location: entry?.country || (entry?.platform ? `Verified ${entry.platform} review` : undefined),
        rating: entry?.rating,
        sourceUrl: entry?.sourceUrl,
        image: usablePhoto(entry?.image),
      }),
      defaults: {rating: 5, location: 'Verified traveler review'},
      isRenderable: item => Boolean(item.quote && item.author),
    });
  }
  if (sectionKey === 'planningProcess' && Array.isArray(section.planningSteps)) {
    const defaultIcons = ['search', 'chat', 'play'];
    target.steps = mergeList(target.steps, section.planningSteps, {
      label: 'planning step',
      needs: 'It needs a step number, a title and a description.',
      describe: entry => entry?.title || `step ${entry?.stepNumber ?? '?'}`,
      // The design is a fixed three-step process; a fourth would not render.
      limit: 3,
      orderOf: entry => Number(entry?.stepNumber),
      committedKey: item => Number(item?.number),
      incomingKey: entry => Number(entry?.stepNumber),
      patch: entry => ({
        icon: defaultIcons[Math.min(Math.max(Number(entry?.stepNumber) - 1, 0), defaultIcons.length - 1)],
        number: entry?.stepNumber ? String(entry.stepNumber).padStart(2, '0') : undefined,
        title: entry?.title,
        text: entry?.description,
        cta: safeCta(entry?.cta, sectionKey),
      }),
      isRenderable: item => Boolean(item.number && item.title && item.text),
    });
  }
}

/**
 * Build the homepage from the committed content, letting Sanity edit it.
 *
 * Sections are optional and independent. A section the editor has not created
 * yet, or has deleted, keeps its committed content — the homepage is never
 * short a section, and the build is never blocked by one. This is what makes it
 * safe to move the homepage into the Studio a section at a time.
 *
 * A section arriving twice is the one case with no safe reading, so the first
 * by `order` wins and the duplicate is reported rather than silently picked.
 */
function mergeHomepage(localContent, sections) {
  if (!Array.isArray(sections)) throw new Error('Sanity homepage sections were not a list');

  const byKey = new Map();
  for (const section of sections) {
    const key = section?.sectionKey;
    if (!SECTION_KEYS.includes(key)) {
      console.warn(`Sanity homepage has a section this site does not render (${key || 'unnamed'}) — ignoring it.`);
      continue;
    }
    if (byKey.has(key)) {
      console.warn(`Sanity homepage has more than one "${key}" section — using the first and ignoring the rest.`);
      continue;
    }
    byKey.set(key, section);
  }

  const content = clone(localContent);
  for (const key of SECTION_KEYS) {
    const section = byKey.get(key);
    if (section) applyPrimaryCopy(content[key], section);
    else console.warn(`Sanity homepage has no "${key}" section — keeping the committed content for it.`);
  }
  return content;
}

export const FLEX_LAYOUTS = ['photoBeside', 'cards', 'quote', 'invitation'];

/**
 * Turn the sections an editor added into the homepage's render plan.
 *
 * The seven built-in sections are fixed and ordered; an added section says
 * where it goes relative to them ("top", or "after:howHosted"). Two sections
 * claiming the same slot are separated by `positionWithinPlacement`, and then
 * by name, so the order is always deterministic rather than dependent on the
 * order Sanity happened to return them in.
 *
 * A section is only planned in if it is switched on, uses a layout this site
 * can render, and has the content that layout needs — an editor part-way
 * through writing one has it invisible rather than half-published.
 */
function planSections(flexible) {
  const bySlot = new Map([['top', []], ...SECTION_KEYS.map(key => [`after:${key}`, []])]);

  for (const entry of flexible || []) {
    if (!entry?.visible) continue;
    if (!FLEX_LAYOUTS.includes(entry.layout)) {
      console.warn(`Extra homepage section "${entry?.title || 'untitled'}" uses a layout this site cannot render (${entry?.layout || 'none'}) — leaving it off.`);
      continue;
    }
    const slot = bySlot.get(entry.placement);
    if (!slot) {
      console.warn(`Extra homepage section "${entry.title}" has no valid position on the page — leaving it off.`);
      continue;
    }
    const section = {
      layout: entry.layout,
      title: entry.title,
      tone: entry.tone === 'dark' ? 'dark' : 'light',
      eyebrow: entry.eyebrow || undefined,
      headline: entry.headline || undefined,
      body: entry.body || undefined,
      image: usablePhoto(entry.image),
      imageSide: entry.imageSide === 'left' ? 'left' : 'right',
      quote: entry.quote || undefined,
      attribution: entry.attribution || undefined,
      reassurance: entry.reassurance || undefined,
      cards: (entry.cards || [])
        .filter(card => card?.title)
        .map(card => ({title: card.title, text: card.text || '', href: card.href || undefined, image: usablePhoto(card.image)})),
      // A malformed button is the editor's mistake to fix, not a reason to
      // fail the deploy — drop the button, keep the section, say so.
      ctas: (entry.ctas || []).map(cta => {
        try {
          return safeCta(cta, `extra section "${entry.title}"`);
        } catch {
          console.warn(`Extra homepage section "${entry.title}" has a button with an invalid link — leaving that button off.`);
          return undefined;
        }
      }).filter(Boolean),
    };
    if (!isFlexSectionRenderable(section)) {
      console.warn(`Extra homepage section "${entry.title}" is switched on but has nothing to show yet — leaving it off. ${FLEX_NEEDS[section.layout]}`);
      continue;
    }
    slot.push({...section, sortKey: [entry.positionWithinPlacement ?? 1, entry.title || '']});
  }

  const plan = [];
  const drain = slot => {
    for (const section of (bySlot.get(slot) || []).sort((a, b) =>
      a.sortKey[0] - b.sortKey[0] || String(a.sortKey[1]).localeCompare(String(b.sortKey[1])))) {
      const {sortKey, ...rest} = section;
      plan.push(rest);
    }
  };
  drain('top');
  for (const key of SECTION_KEYS) {
    plan.push({key});
    drain(`after:${key}`);
  }
  return plan;
}

const FLEX_NEEDS = {
  photoBeside: 'It needs a heading or an approved photo.',
  cards: 'It needs at least one card with a heading.',
  quote: 'It needs the quote itself.',
  invitation: 'It needs a heading.',
};

function isFlexSectionRenderable(section) {
  if (section.layout === 'photoBeside') return Boolean(section.headline || section.image?.src);
  if (section.layout === 'cards') return section.cards.length > 0;
  if (section.layout === 'quote') return Boolean(section.quote);
  if (section.layout === 'invitation') return Boolean(section.headline);
  return false;
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
    sectionKey, order, eyebrow, headline, body, reassurance, trustMessage,
    "media": media[]{
      "src": image.asset->url,
      "video": video,
      "alt": altText,
      "width": image.asset->metadata.dimensions.width,
      "height": image.asset->metadata.dimensions.height,
      placeholderState, publicApprovalState
    },
    "ctas": ctas[]->{label, destination, external},
    "founders": founders[]->{
      name, preferredName, role, quote,
      "photo": {
        "src": photo.image.asset->url,
        "alt": photo.altText,
        "width": photo.image.asset->metadata.dimensions.width,
        "height": photo.image.asset->metadata.dimensions.height,
        "publicApprovalState": photo.publicApprovalState,
        "placeholderState": photo.placeholderState
      }
    },
    "pathways": pathways[]->{
      title, description, filterKey, order,
      "image": {
        "src": image.image.asset->url,
        "alt": image.altText,
        "width": image.image.asset->metadata.dimensions.width,
        "height": image.image.asset->metadata.dimensions.height,
        "publicApprovalState": image.publicApprovalState,
        "placeholderState": image.placeholderState
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
        "publicApprovalState": media[0].publicApprovalState,
        "placeholderState": media[0].placeholderState
      }
    },
    "planningSteps": planningSteps[]->{
      stepNumber, title, description,
      "cta": cta->{label, destination, external}
    }
  }`;

  // Sections an editor added, fetched alongside the built-in seven so the whole
  // homepage still costs one request.
  const photoProjection = `{
    "src": image.asset->url,
    "alt": altText,
    "width": image.asset->metadata.dimensions.width,
    "height": image.asset->metadata.dimensions.height,
    publicApprovalState, placeholderState
  }`;
  const flexQuery = `*[_type == "flexibleSection"] | order(placement asc, positionWithinPlacement asc){
    title, layout, placement, positionWithinPlacement, visible, tone,
    eyebrow, headline, body, imageSide, quote, attribution, reassurance,
    "image": image${photoProjection},
    "cards": cards[]{title, text, href, "image": image${photoProjection}},
    "ctas": ctas[]->{label, destination, external}
  }`;

  const combined = `{"sections": ${query}, "flexible": ${flexQuery}}`;
  const url = `https://${projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${dataset}?query=${encodeURIComponent(combined)}`;
  const response = await fetchImpl(url, {headers: {Accept: 'application/json'}});
  if (!response.ok) throw new Error(`Sanity homepage request failed with HTTP ${response.status}`);
  const body = await response.json();
  if (body.error) throw new Error(`Sanity homepage request failed: ${body.error.description || body.error.type}`);

  const content = mergeHomepage(localContent, body.result?.sections);
  content.sectionOrder = planSections(body.result?.flexible);
  return {content, source: 'sanity'};
}
