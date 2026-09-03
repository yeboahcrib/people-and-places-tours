const STORYBLOK_API_ORIGIN = 'https://api.storyblok.com';
const STORYBLOK_EU_ASSET_HOSTS = new Set(['a.storyblok.com', 'a2.storyblok.com']);
const STANDARD_TOUR_DIRECTORY = 'tours/day-short-experiences';

// The local catalogue owns visitor-facing routes. This registry deliberately
// contains only the standard day/short experiences authorised for Phase 3C;
// Just Go Ghana remains a future multi_day_tour migration.
export const STORYBLOK_STANDARD_TOUR_REGISTRY = Object.freeze([
  'accra-city',
  'accra-food',
  'cape-coast',
  'kumasi',
  'ada-foah',
  'quad-bike',
  'volta',
  'shai-hills',
  'aburi',
  'cape-coast-day',
  'volta-community',
  'batik-workshop',
].map(slug => Object.freeze({
  slug,
  fullSlug: STANDARD_TOUR_DIRECTORY + '/' + slug,
})));

const text = value => typeof value === 'string' ? value.trim() : '';
const hasOwn = (object, key) => Boolean(object) && Object.prototype.hasOwnProperty.call(object, key);

const positiveInteger = value => {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : undefined;
};

const nonNegativeNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : undefined;
};

const positiveNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : undefined;
};

const formatPrice = (price, currency = 'USD') => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency,
  maximumFractionDigits: Number.isInteger(price) ? 0 : 2,
}).format(price);

/**
 * Storyblok asset delivery is trusted only from the EU image hosts used by
 * this space. The Content Delivery API itself is never exposed to a browser.
 */
export function isStoryblokEuAssetUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' && STORYBLOK_EU_ASSET_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

const validFocus = focus => /^\d+x\d+:\d+x\d+$/.test(text(focus));

/**
 * Build a Storyblok Image Service rendition while retaining the asset's native
 * focal point. A placement can therefore use the same master asset without
 * adding desktop/mobile derivatives to the CMS.
 */
export function storyblokImageUrl(asset, width, height) {
  const filename = text(asset?.filename);
  const requestedWidth = positiveInteger(width);
  const requestedHeight = positiveInteger(height);
  if (!filename || !requestedWidth || !requestedHeight || !isStoryblokEuAssetUrl(filename)) return undefined;

  const filters = [];
  if (validFocus(asset?.focus)) filters.push('focal(' + text(asset.focus) + ')');
  filters.push('quality(80)');
  return filename + '/m/' + requestedWidth + 'x' + requestedHeight + '/filters:' + filters.join(':');
}

function assetDimensions(asset) {
  const directWidth = positiveInteger(asset?.width);
  const directHeight = positiveInteger(asset?.height);
  if (directWidth && directHeight) return {width: directWidth, height: directHeight};

  const dimensions = asset?.meta_data?.dimensions
    ?? asset?.meta_data?.size
    ?? asset?.metadata?.dimensions;
  const nestedWidth = positiveInteger(dimensions?.width);
  const nestedHeight = positiveInteger(dimensions?.height);
  if (nestedWidth && nestedHeight) return {width: nestedWidth, height: nestedHeight};

  const match = String(dimensions || '').match(/(\d+)x(\d+)/);
  if (!match) return undefined;
  const width = positiveInteger(match[1]);
  const height = positiveInteger(match[2]);
  return width && height ? {width, height} : undefined;
}

function validAsset(value) {
  const filename = text(value?.filename);
  const alt = text(value?.alt);
  if (!filename || !alt || !isStoryblokEuAssetUrl(filename)) return undefined;
  const dimensions = assetDimensions(value);
  return {
    filename,
    alt,
    ...(validFocus(value.focus) ? {focus: text(value.focus)} : {}),
    ...(dimensions || {}),
  };
}

function listItems(value, {minimum = 0, maximum = 6} = {}) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) return undefined;
  const items = value.map(item => {
    if (item?.component !== 'list_item') return undefined;
    return text(item.text);
  });
  return items.every(Boolean) ? items : undefined;
}

function faqItems(value) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) return undefined;
  const items = value.map(item => {
    if (item?.component !== 'faq_item') return undefined;
    const question = text(item.question);
    const answer = text(item.answer);
    return question && answer ? {question, answer} : undefined;
  });
  return items.every(Boolean) ? items : undefined;
}

function priceOptions(value) {
  if (value === undefined || value === null || value === '') return [];
  if (!Array.isArray(value) || value.length > 6) return undefined;
  const items = value.map(item => {
    if (item?.component !== 'price_option') return undefined;
    const label = text(item.label);
    const price = positiveNumber(item.price);
    return label && price ? {label, price} : undefined;
  });
  return items.every(Boolean) ? items : undefined;
}

function isTallAsset(asset) {
  const dimensions = assetDimensions(asset);
  // The existing gallery defaults unknown source dimensions to portrait. That
  // keeps the old automatic layout behaviour for assets without metadata.
  return !dimensions || dimensions.height >= dimensions.width;
}

function galleryItems(value) {
  if (value === undefined || value === null || value === '') return [];
  if (!Array.isArray(value) || value.length > 6) return undefined;
  const items = value.map(item => {
    if (item?.component !== 'gallery_item') return undefined;
    const image = validAsset(item.image);
    const layout = text(item.layout || 'automatic').toLowerCase();
    if (!image || !['automatic', 'portrait', 'wide'].includes(layout)) return undefined;
    const src = storyblokImageUrl(image, 900, 1125);
    if (!src) return undefined;
    return {
      src,
      alt: text(item.alt_text) || image.alt,
      caption: text(item.caption),
      tall: layout === 'portrait' ? true : layout === 'wide' ? false : isTallAsset(image),
    };
  });
  return items.every(Boolean) ? items : undefined;
}

function stringList(value, {minimum = 1, maximum = 6} = {}) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) return undefined;
  const items = value.map(text);
  return items.every(Boolean) ? items : undefined;
}

function optionalText(content, key) {
  if (!hasOwn(content, key)) return undefined;
  return text(content[key]);
}

function optionalSeo(value) {
  if (value === undefined || value === null || value === '') return {};
  if (!Array.isArray(value) || value.length > 1) return undefined;
  if (!value.length) return {};
  const item = value[0];
  if (item?.component !== 'seo') return undefined;
  const title = text(item.title);
  const description = text(item.description);
  const indexing = text(item.indexing);
  const socialImage = item.social_image ? validAsset(item.social_image) : undefined;
  if (item.social_image && !socialImage) return undefined;
  if (indexing && !['index', 'noindex'].includes(indexing)) return undefined;
  return {
    ...(title ? {title} : {}),
    ...(description ? {description} : {}),
    ...(indexing ? {indexing} : {}),
    ...(socialImage ? {socialImage: storyblokImageUrl(socialImage, 1200, 630)} : {}),
  };
}

function mergeDefined(base, patch) {
  return {
    ...base,
    ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)),
  };
}

/**
 * Convert one validated Storyblok story into the renderer's existing internal
 * tour shape. The base tour intentionally provides route and local-only
 * presentation fields so Storyblok paths can never alter live URLs.
 */
export function mapStoryblokTour({story, baseTour, expectedFullSlug}) {
  if (!story || !baseTour || !expectedFullSlug) return undefined;
  const content = story.content;
  if (
    text(story.slug) !== baseTour.slug
    || text(story.full_slug) !== expectedFullSlug
    || content?.component !== 'tour'
    || text(content.slug) !== baseTour.slug
    || content.published !== true
    || text(content.experience_type || 'day') !== 'day'
  ) return undefined;

  const title = text(content.name);
  const cardDescription = text(content.card_description);
  const duration = text(content.duration);
  const startingPoint = text(content.starting_point);
  const overview = text(content.overview);
  const price = positiveNumber(content.price);
  const currency = text(content.currency);
  const priceUnit = text(content.price_unit);
  const displayOrder = nonNegativeNumber(content.display_order);
  const destination = text(content.destination);
  const categories = stringList(content.categories, {minimum: 1, maximum: 4});
  const vibes = stringList(content.vibes, {minimum: 1, maximum: 2});
  const locations = listItems(content.locations, {minimum: 1, maximum: 6});
  const included = listItems(content.included, {minimum: 1, maximum: 12});
  const excluded = listItems(content.excluded, {minimum: 1, maximum: 12});
  const goodToKnow = listItems(content.good_to_know, {minimum: 1, maximum: 6});
  const faqs = faqItems(content.faqs);
  const options = priceOptions(content.price_options);
  const gallery = galleryItems(content.gallery);
  const seo = optionalSeo(content.seo);
  const minimumGuests = positiveInteger(content.minimum_guests);
  const maximumGuests = positiveInteger(content.maximum_guests);
  const cardImage = validAsset(content.card_image);
  const heroImage = content.hero_image ? validAsset(content.hero_image) : undefined;

  if (
    !title || !cardDescription || !duration || !startingPoint || !overview
    || !price || currency !== 'USD' || !priceUnit || displayOrder === undefined
    || !destination || !categories || !vibes || !locations || !included || !excluded
    || !goodToKnow || !faqs || !options || !gallery || !seo || !minimumGuests
    || !maximumGuests || minimumGuests > maximumGuests || !cardImage
    || (content.hero_image && !heroImage)
  ) return undefined;

  const card = storyblokImageUrl(cardImage, 1200, 840);
  const packageImage = storyblokImageUrl(cardImage, 1200, 825);
  const resolvedHero = heroImage || cardImage;
  const hero = storyblokImageUrl(resolvedHero, 1920, 1080);
  if (!card || !packageImage || !hero) return undefined;

  return mergeDefined(baseTour, {
    // detailUrl, homepage curation, and unrelated local metadata remain
    // omitted here: the base is retained and can never be overwritten.
    title,
    price: formatPrice(price, currency),
    priceUnit,
    duration,
    groupSize: String(minimumGuests) + '-' + String(maximumGuests) + ' People',
    groupSizeNote: optionalText(content, 'group_size_note'),
    location: locations.join(', '),
    destination,
    categories,
    vibes,
    badge: optionalText(content, 'card_badge'),
    image: card,
    packageImage,
    alt: cardImage.alt,
    // A separately chosen wide hero remains optional for editors. When none
    // is chosen, derive a wider rendition of the card master around the same
    // focal point rather than stretching a card crop across the page.
    heroImage: hero,
    heroAlt: resolvedHero.alt,
    description: overview,
    packageDescription: cardDescription,
    commandSummary: optionalText(content, 'search_summary'),
    packageOrder: displayOrder,
    startingPoint,
    heroWatermark: optionalText(content, 'hero_watermark'),
    pageHeadline: optionalText(content, 'page_headline'),
    pageIntro: optionalText(content, 'page_intro'),
    included,
    excluded,
    funFacts: goodToKnow,
    priceOptions: options,
    faqs,
    // An explicitly entered Storyblok gallery replaces stale local gallery
    // data. The renderer still keeps its existing three-image threshold.
    gallery: gallery.length >= 3 ? gallery : [],
    seo,
  });
}

function registryBySlug(registry) {
  const bySlug = new Map();
  for (const entry of registry) {
    if (!entry?.slug || !entry?.fullSlug || bySlug.has(entry.slug)) {
      throw new Error('Storyblok standard tour registry is invalid');
    }
    bySlug.set(entry.slug, entry);
  }
  return bySlug;
}

const sourceSummary = sources => ({
  applied: Object.values(sources).filter(value => value === 'applied').length,
  fallback: Object.values(sources).filter(value => value !== 'applied' && value !== 'not-applicable').length,
});

async function loadOneStory({entry, token, fetchImpl}) {
  const url = new URL('/v2/cdn/stories/' + entry.fullSlug, STORYBLOK_API_ORIGIN);
  url.searchParams.set('version', 'draft');
  url.searchParams.set('resolve_assets', '1');
  url.searchParams.set('token', token);
  const response = await fetchImpl(url);
  if (!response?.ok) return {source: response?.status === 404 ? 'missing-story' : 'unavailable'};
  let body;
  try {
    body = await response.json();
  } catch {
    return {source: 'invalid-response'};
  }
  return body?.story ? {source: 'received', story: body.story} : {source: 'invalid-response'};
}

/**
 * Load each authorised standard tour independently. A bad or missing record
 * must never erase the rest of the catalogue or alter an immutable local route.
 */
export async function loadStoryblokStandardTours({
  baseTours,
  env = process.env,
  fetchImpl = fetch,
  logger = console,
  registry = STORYBLOK_STANDARD_TOUR_REGISTRY,
} = {}) {
  const registryMap = registryBySlug(registry);
  const safeTours = Array.isArray(baseTours) ? baseTours : [];
  const sourcesBySlug = Object.fromEntries([...registryMap.keys()].map(slug => [slug, 'not-applicable']));
  const baseBySlug = new Map();

  for (const tour of safeTours) {
    const slug = text(tour?.slug);
    if (!registryMap.has(slug)) continue;
    if (baseBySlug.has(slug)) {
      sourcesBySlug[slug] = 'duplicate-slug';
      baseBySlug.delete(slug);
      continue;
    }
    baseBySlug.set(slug, tour);
    sourcesBySlug[slug] = 'disabled';
  }

  if (env.STORYBLOK_STANDARD_TOURS_ENABLED !== 'true') {
    return {tours: baseTours, sourcesBySlug, summary: sourceSummary(sourcesBySlug), appliedSlugs: []};
  }

  const token = text(env.STORYBLOK_PREVIEW_API_TOKEN);
  if (!token) {
    for (const slug of baseBySlug.keys()) sourcesBySlug[slug] = 'missing-configuration';
    return {tours: baseTours, sourcesBySlug, summary: sourceSummary(sourcesBySlug), appliedSlugs: []};
  }
  if (text(env.STORYBLOK_REGION || 'eu').toLowerCase() !== 'eu') {
    for (const slug of baseBySlug.keys()) sourcesBySlug[slug] = 'unsupported-region';
    return {tours: baseTours, sourcesBySlug, summary: sourceSummary(sourcesBySlug), appliedSlugs: []};
  }

  const candidates = new Map();
  await Promise.all([...baseBySlug.entries()].map(async ([slug, baseTour]) => {
    if (sourcesBySlug[slug] === 'duplicate-slug') return;
    const entry = registryMap.get(slug);
    try {
      const result = await loadOneStory({entry, token, fetchImpl});
      if (result.source !== 'received') {
        sourcesBySlug[slug] = result.source;
        return;
      }
      const mapped = mapStoryblokTour({story: result.story, baseTour, expectedFullSlug: entry.fullSlug});
      if (!mapped) {
        sourcesBySlug[slug] = 'invalid-content';
        return;
      }
      candidates.set(slug, mapped);
      sourcesBySlug[slug] = 'candidate';
    } catch {
      // Do not include the request URL or exception text: either could carry
      // a token in an implementation-specific error message.
      sourcesBySlug[slug] = 'unavailable';
      logger?.warn?.('Storyblok standard tour "' + slug + '" could not be loaded; using its local fallback.');
    }
  }));

  // A duplicate display order creates an unstable card sequence. Preserve the
  // local records for every member of the collision rather than guessing.
  const orderGroups = new Map();
  for (const [slug, tour] of candidates) {
    const order = String(tour.packageOrder);
    orderGroups.set(order, [...(orderGroups.get(order) || []), slug]);
  }
  for (const slugs of orderGroups.values()) {
    if (slugs.length < 2) continue;
    for (const slug of slugs) {
      candidates.delete(slug);
      sourcesBySlug[slug] = 'duplicate-display-order';
    }
  }

  const appliedSlugs = [...candidates.keys()];
  for (const slug of appliedSlugs) sourcesBySlug[slug] = 'applied';
  const tours = safeTours.map(tour => candidates.get(tour?.slug) || tour);

  return {
    tours,
    sourcesBySlug,
    summary: sourceSummary(sourcesBySlug),
    appliedSlugs,
  };
}
