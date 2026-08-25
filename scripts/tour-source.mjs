import {fetchSanity} from './sanity-fetch.mjs';
const API_VERSION = '2026-08-02';

const formatPrice = (price, currency = 'USD') => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency,
  maximumFractionDigits: Number.isInteger(price) ? 0 : 2,
}).format(price);

function groupSize(tour) {
  const minimum = tour.groupSizeMin ?? 1;
  if (tour.groupSizeMax) return `${minimum}-${tour.groupSizeMax} People`;
  return tour.groupSizeNote || `${minimum}+ People`;
}

const definedOnly = fields => Object.fromEntries(
  Object.entries(fields).filter(([, value]) => value !== undefined && value !== null
    && !(Array.isArray(value) && value.length === 0)),
);

function validateSanityTours(result, localTours) {
  if (!Array.isArray(result?.tours) || result.tours.length === 0) {
    throw new Error('Sanity content is missing active tours');
  }
  const featuredItems = result?.featured?.items;
  if (!Array.isArray(featuredItems) || featuredItems.length < 3 || featuredItems.length > 5) {
    throw new Error('Sanity featured tour collection must contain 3–5 tours');
  }

  const presentationBySlug = new Map(localTours.map(tour => [tour.slug, tour]));
  const featuredOrder = new Map(featuredItems.map(item => [item?.tour?.slug?.current, item.order]));

  return result.tours.map(tour => {
    const slug = tour?.slug?.current;
    const presentation = presentationBySlug.get(slug);
    if (!slug || !presentation) {
      throw new Error(`Sanity tour ${slug || '(missing slug)'} has no local presentation mapping`);
    }
    if (!tour.title || !tour.duration || !Number.isFinite(tour.price)) {
      throw new Error(`Sanity tour ${slug} is missing required catalogue fields`);
    }

    return {
      ...presentation,
      title: tour.title,
      homeTitle: presentation.homeTitle && presentation.title === tour.title ? presentation.homeTitle : tour.title,
      price: formatPrice(tour.price, tour.currency || 'USD'),
      priceUnit: tour.priceUnit || presentation.priceUnit,
      duration: tour.duration,
      groupSize: groupSize(tour),
      // Kept alongside the formatted string: the tour page shows this note
      // beside the price when a tour has a minimum of its own.
      groupSizeNote: tour.groupSizeNote || presentation.groupSizeNote,
      location: tour.locations?.join(', ') || presentation.location,
      destination: tour.destination || presentation.destination,
      categories: tour.categories?.length ? tour.categories : presentation.categories,
      vibes: tour.vibes?.length ? tour.vibes : presentation.vibes,
      description: tour.description || presentation.description,
      packageDescription: tour.description || presentation.packageDescription,
      commandSummary: tour.commandSummary || presentation.commandSummary,
      homeFeatured: featuredOrder.has(slug),
      homeOrder: featuredOrder.get(slug),
      // Only fields the document actually holds, so a tour with no FAQs in
      // Sanity falls back to the committed snapshot rather than blanking it.
      ...definedOnly({
        included: tour.included,
        excluded: tour.excluded,
        funFacts: tour.funFacts,
        heroWatermark: tour.heroWatermark,
        pageHeadline: tour.pageHeadline,
        pageIntro: tour.pageIntro,
        priceOptions: tour.priceOptions,
        faqs: tour.faqs,
        itinerary: tour.itinerary,
      }),
    };
  });
}

export async function loadTourContent({localTours, env = process.env, fetchImpl = fetch}) {
  const projectId = env.SANITY_STUDIO_PROJECT_ID;
  const dataset = env.SANITY_STUDIO_DATASET || 'production';

  if (!projectId || projectId === 'REPLACE_WITH_PROJECT_ID') {
    return {tours: localTours, source: 'local'};
  }
  if (!/^[a-z0-9-]+$/.test(projectId) || !/^[a-z0-9_-]+$/.test(dataset)) {
    throw new Error('Sanity project or dataset configuration is invalid');
  }

  const query = `{
    "tours": *[_type == "tour" && active == true] | order(title asc){
      slug, title, duration, locations, groupSizeMin, groupSizeMax, groupSizeNote,
      price, currency, priceUnit, description, categories, vibes, destination, commandSummary,
      // Everything a generated tour page is made of. Without these the pages
      // build from the committed snapshot alone, and an edit in the Studio
      // changes nothing a visitor sees.
      included, excluded, funFacts, heroWatermark, pageHeadline, pageIntro,
      priceOptions[]{label, price},
      faqs[]{question, answer},
      itinerary[]{day, title, description, meals}
    },
    "featured": *[_id == "featuredTourCollection"][0]{items[]{order, tour->{slug}}}
  }`;
  const url = `https://${projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
  const body = await fetchSanity(url, {fetchImpl, label: 'Sanity tour'});

  // Images and detail-page filenames intentionally remain local for now. The
  // user-visible catalogue facts come from Sanity and are merged by slug.
  return {tours: validateSanityTours(body.result, localTours), source: 'sanity'};
}
