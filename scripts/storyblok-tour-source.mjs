import {isAuthoritative} from './storyblok-migration-authority.mjs';

const STORYBLOK_API_ORIGIN = 'https://api.storyblok.com';
export const STORYBLOK_EU_ASSET_HOSTS = new Set(['a.storyblok.com', 'a2.storyblok.com']);
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

/** One attempt is allowed this long, including reading the body. */
export const STORYBLOK_REQUEST_TIMEOUT_MS = 10000;
/** A single retry, spaced enough to clear a blip without stalling a build. */
export const STORYBLOK_RETRY_DELAY_MS = 400;

/*
 * Retry only what a second attempt could plausibly fix. A 404 means the story
 * is not there, a 401 means the token is wrong, and malformed JSON means the
 * response was not what we asked for; asking again changes none of them, and
 * retrying would only double the delay before the tour falls back.
 */
const isTransientStatus = status =>
  status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599);

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


/*
 * What an absent or hidden story means depends on who owns the tour.
 *
 * Under authoritative delivery, a tour Storyblok owns has no second opinion:
 * if the story is gone the editor removed it, and reprinting the committed
 * copy would put a withdrawn tour back on the site. The record is dropped
 * instead. A tour still pending migration is the opposite case — its absence
 * is expected, and its fallback is the only content there is.
 *
 * Migration builds never drop anything. Pending tours have to stay testable
 * locally, and draft delivery cannot tell withdrawal from work in progress.
 */
function resolveAbsence({slug, reason, authoritativeDelivery}) {
  if (!authoritativeDelivery) return {source: reason, remove: false};
  if (!isAuthoritative(slug)) {
    return {source: reason === 'missing-story' ? 'pending-not-migrated' : reason, remove: false};
  }
  return {
    source: reason === 'missing-story' ? 'withdrawn' : 'editorial-suppressed',
    remove: true,
  };
}

/** The editor's "Show this experience" switch, read before content validation. */
const hiddenByEditor = story => story?.content?.published !== true;

async function attemptStory({url, fetchImpl, timeoutMs}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let response;
    try {
      response = await fetchImpl(url, {signal: controller.signal});
    } catch (error) {
      // A timeout and a dropped connection arrive the same way and both deserve one more try.
      return {source: 'unavailable', retryable: true, error};
    }
    if (!response?.ok) {
      if (response?.status === 404) return {source: 'missing-story', retryable: false};
      // A rejected credential is reported separately from an unreachable host:
      // production delivery must stop on it immediately rather than waiting for
      // enough records to fail that it looks like an outage.
      if (response?.status === 401 || response?.status === 403) {
        return {source: 'unauthorized', retryable: false};
      }
      return {source: 'unavailable', retryable: isTransientStatus(response?.status)};
    }
    let body;
    try {
      body = await response.json();
    } catch {
      // A body cut short by the timeout is a transient failure, not malformed content.
      return controller.signal.aborted
        ? {source: 'unavailable', retryable: true, error: new Error('Storyblok response timed out')}
        : {source: 'invalid-response', retryable: false};
    }
    return body?.story
      ? {source: 'received', story: body.story, retryable: false}
      : {source: 'invalid-response', retryable: false};
  } finally {
    clearTimeout(timer);
  }
}

export async function loadOneStory({
  entry,
  token,
  fetchImpl,
  contentVersion = 'draft',
  timeoutMs = STORYBLOK_REQUEST_TIMEOUT_MS,
  retryDelayMs = STORYBLOK_RETRY_DELAY_MS,
}) {
  const url = new URL('/v2/cdn/stories/' + entry.fullSlug, STORYBLOK_API_ORIGIN);
  url.searchParams.set('version', contentVersion);
  url.searchParams.set('resolve_assets', '1');
  url.searchParams.set('token', token);

  const first = await attemptStory({url, fetchImpl, timeoutMs});
  if (!first.retryable) return {source: first.source, story: first.story};
  if (retryDelayMs > 0) await sleep(retryDelayMs);
  const second = await attemptStory({url, fetchImpl, timeoutMs});
  // An unreachable host still surfaces to the caller as a throw, so the record
  // falls back with the warning it has always produced. The retry is silent;
  // only the final outcome is reported.
  if (second.error) throw second.error;
  return {source: second.source, story: second.story};
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
  authoritativeDelivery = false,
  // Which content the build reads, and which credential may read it. Draft via
  // the Preview token is the migration default; authoritative delivery passes
  // published and the Public token, and the two must never be crossed.
  contentVersion = 'draft',
  tokenEnvVar = 'STORYBLOK_PREVIEW_API_TOKEN',
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

  const token = text(env[tokenEnvVar]);
  if (!token) {
    for (const slug of baseBySlug.keys()) sourcesBySlug[slug] = 'missing-configuration';
    return {tours: baseTours, sourcesBySlug, summary: sourceSummary(sourcesBySlug), appliedSlugs: []};
  }
  if (text(env.STORYBLOK_REGION || 'eu').toLowerCase() !== 'eu') {
    for (const slug of baseBySlug.keys()) sourcesBySlug[slug] = 'unsupported-region';
    return {tours: baseTours, sourcesBySlug, summary: sourceSummary(sourcesBySlug), appliedSlugs: []};
  }

  const candidates = new Map();
  const removedSlugs = new Set();
  await Promise.all([...baseBySlug.entries()].map(async ([slug, baseTour]) => {
    if (sourcesBySlug[slug] === 'duplicate-slug') return;
    const entry = registryMap.get(slug);
    try {
      const result = await loadOneStory({entry, token, fetchImpl, contentVersion});
      if (result.source !== 'received') {
        if (result.source === 'missing-story') {
          const absence = resolveAbsence({slug, reason: 'missing-story', authoritativeDelivery});
          sourcesBySlug[slug] = absence.source;
          if (absence.remove) removedSlugs.add(slug);
          return;
        }
        sourcesBySlug[slug] = result.source;
        return;
      }
      if (hiddenByEditor(result.story)) {
        const absence = resolveAbsence({slug, reason: 'invalid-content', authoritativeDelivery});
        sourcesBySlug[slug] = absence.remove ? absence.source : 'invalid-content';
        if (absence.remove) removedSlugs.add(slug);
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
  // A withdrawn or editor-suppressed record leaves the catalogue entirely. It
  // must not reappear from the committed copy, which is the whole point.
  const tours = safeTours
    .filter(tour => !removedSlugs.has(text(tour?.slug)))
    .map(tour => candidates.get(tour?.slug) || tour);

  return {
    tours,
    sourcesBySlug,
    summary: sourceSummary(sourcesBySlug),
    appliedSlugs,
  };
}

/* ── Multi-day experiences (Phase 3E) ───────────────────────────────────────
 *
 * One record: Just Go Ghana. It is the only multi-day trip and the only tour
 * whose page is hand-authored rather than generated, so its route is fixed in
 * code and is never derived from a Storyblok path.
 *
 * The production gate is deliberately the same as the standard one. Just Go
 * Ghana has no approved photograph, so it is expected to fail that gate and
 * fall back — that is the correct outcome, not a defect to work around.
 */
const MULTI_DAY_DIRECTORY = 'tours/multi-day-experiences';

export const STORYBLOK_MULTI_DAY_REGISTRY = Object.freeze([
  Object.freeze({slug: 'just-go-ghana', fullSlug: MULTI_DAY_DIRECTORY + '/just-go-ghana'}),
]);

function itineraryDays(value) {
  if (!Array.isArray(value) || value.length < 2) return undefined;
  const days = [];
  for (const block of value) {
    if (block?.component !== 'itinerary_day') return undefined;
    const day = positiveInteger(block.day);
    const title = text(block.title);
    const description = text(block.description);
    if (!day || !title || !description) return undefined;
    const meals = Array.isArray(block.meals)
      ? block.meals.map(meal => text(meal)).filter(Boolean)
      : [];
    days.push({day, title, description, meals: meals.map(meal => meal.charAt(0).toUpperCase() + meal.slice(1))});
  }
  // The page numbers the days, so an out-of-order or gapped list would render a
  // trip that reads as though a day were missing.
  const ordered = days.every((entry, index) => entry.day === index + 1);
  return ordered ? days : undefined;
}

export function mapStoryblokMultiDayTour({story, baseTour, expectedFullSlug}) {
  if (!story || !baseTour || !expectedFullSlug) return undefined;
  const content = story.content;
  if (
    text(story.slug) !== baseTour.slug
    || text(story.full_slug) !== expectedFullSlug
    || content?.component !== 'multi_day_tour'
    || text(content.slug) !== baseTour.slug
    || content.published !== true
    || text(content.experience_type) !== 'tailored_multi_day'
  ) return undefined;

  const title = text(content.name);
  const cardDescription = text(content.card_description);
  const duration = text(content.duration);
  const startingPoint = text(content.starting_point);
  const overview = text(content.overview);
  const pageHeadline = text(content.page_headline);
  const price = positiveNumber(content.price);
  const currency = text(content.currency);
  const priceUnit = text(content.price_unit);
  const displayOrder = nonNegativeNumber(content.display_order);
  const destination = text(content.destination);
  const categories = stringList(content.categories, {minimum: 1, maximum: 6});
  const vibes = stringList(content.vibes, {minimum: 1, maximum: 3});
  const locations = listItems(content.locations, {minimum: 1, maximum: 8});
  const highlights = listItems(content.highlights, {minimum: 1, maximum: 10});
  const included = listItems(content.included, {minimum: 1, maximum: 20});
  const excluded = listItems(content.excluded, {minimum: 1, maximum: 15});
  const faqs = faqItems(content.faqs);
  const itinerary = itineraryDays(content.itinerary);
  const minimumGuests = positiveInteger(content.minimum_guests);
  const maximumGuests = positiveInteger(content.maximum_guests);
  // The gate. A trip with no approved photograph cannot be applied, however
  // complete the rest of its record is.
  const cardImage = validAsset(content.card_image);

  if (
    !title || !cardDescription || !duration || !startingPoint || !overview
    || !pageHeadline || !price || currency !== 'USD' || !priceUnit
    || displayOrder === undefined || !destination || !categories || !vibes
    || !locations || !highlights || !included || !excluded || !faqs || !itinerary
    || !minimumGuests || !maximumGuests || minimumGuests > maximumGuests || !cardImage
  ) return undefined;

  const card = storyblokImageUrl(cardImage, 1200, 840);
  const packageImage = storyblokImageUrl(cardImage, 1200, 825);
  if (!card || !packageImage) return undefined;

  return mergeDefined(baseTour, {
    // detailUrl is never taken from Storyblok: /just-go-ghana.html is a fixed
    // public route that predates this migration.
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
    description: overview,
    packageDescription: cardDescription,
    commandSummary: optionalText(content, 'search_summary'),
    packageOrder: displayOrder,
    startingPoint,
    pageHeadline,
    activityLevel: optionalText(content, 'activity_level'),
    tripStyle: optionalText(content, 'trip_style'),
    accommodation: optionalText(content, 'accommodation'),
    airportTransfer: optionalText(content, 'airport_transfer'),
    dedicatedHost: optionalText(content, 'dedicated_host'),
    depositNote: optionalText(content, 'deposit_note'),
    highlights,
    included,
    excluded,
    faqs,
    itinerary,
  });
}

export async function loadStoryblokMultiDayTours({
  baseTours,
  env = process.env,
  fetchImpl = fetch,
  logger = console,
  registry = STORYBLOK_MULTI_DAY_REGISTRY,
  authoritativeDelivery = false,
  // Which content the build reads, and which credential may read it. Draft via
  // the Preview token is the migration default; authoritative delivery passes
  // published and the Public token, and the two must never be crossed.
  contentVersion = 'draft',
  tokenEnvVar = 'STORYBLOK_PREVIEW_API_TOKEN',
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

  if (env.STORYBLOK_MULTI_DAY_ENABLED !== 'true') {
    return {tours: baseTours, sourcesBySlug, summary: sourceSummary(sourcesBySlug), appliedSlugs: []};
  }
  const token = text(env[tokenEnvVar]);
  if (!token) {
    for (const slug of baseBySlug.keys()) sourcesBySlug[slug] = 'missing-configuration';
    return {tours: baseTours, sourcesBySlug, summary: sourceSummary(sourcesBySlug), appliedSlugs: []};
  }
  if (text(env.STORYBLOK_REGION || 'eu').toLowerCase() !== 'eu') {
    for (const slug of baseBySlug.keys()) sourcesBySlug[slug] = 'unsupported-region';
    return {tours: baseTours, sourcesBySlug, summary: sourceSummary(sourcesBySlug), appliedSlugs: []};
  }

  const candidates = new Map();
  const removedSlugs = new Set();
  await Promise.all([...baseBySlug.entries()].map(async ([slug, baseTour]) => {
    const entry = registryMap.get(slug);
    try {
      const result = await loadOneStory({entry, token, fetchImpl, contentVersion});
      if (result.source !== 'received') {
        if (result.source === 'missing-story') {
          const absence = resolveAbsence({slug, reason: 'missing-story', authoritativeDelivery});
          sourcesBySlug[slug] = absence.source;
          if (absence.remove) removedSlugs.add(slug);
          return;
        }
        sourcesBySlug[slug] = result.source;
        return;
      }
      if (hiddenByEditor(result.story)) {
        const absence = resolveAbsence({slug, reason: 'invalid-content', authoritativeDelivery});
        sourcesBySlug[slug] = absence.remove ? absence.source : 'invalid-content';
        if (absence.remove) removedSlugs.add(slug);
        return;
      }
      const mapped = mapStoryblokMultiDayTour({story: result.story, baseTour, expectedFullSlug: entry.fullSlug});
      if (!mapped) {
        sourcesBySlug[slug] = 'invalid-content';
        return;
      }
      candidates.set(slug, mapped);
      sourcesBySlug[slug] = 'applied';
    } catch {
      sourcesBySlug[slug] = 'unavailable';
      logger?.warn?.('Storyblok multi-day tour "' + slug + '" could not be loaded; using its local fallback.');
    }
  }));

  const appliedSlugs = [...candidates.keys()];
  // A withdrawn or editor-suppressed record leaves the catalogue entirely. It
  // must not reappear from the committed copy, which is the whole point.
  const tours = safeTours
    .filter(tour => !removedSlugs.has(text(tour?.slug)))
    .map(tour => candidates.get(tour?.slug) || tour);
  return {tours, sourcesBySlug, summary: sourceSummary(sourcesBySlug), appliedSlugs};
}
