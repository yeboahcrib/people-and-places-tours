import {fetchSanity} from './sanity-fetch.mjs';
import {loadStoryblokStandardTours, loadStoryblokMultiDayTours} from './storyblok-tour-source.mjs';
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

/**
 * Turn a Studio photo into a card image URL, cropped around its focal point.
 *
 * The Studio has always shown a draggable circle on every photo — "drag the
 * circle over the most important part so it stays visible wherever the photo
 * is cropped" — but nothing read it, so the circle did nothing. Sanity's image
 * CDN does the cropping itself from these parameters, which means an editor
 * moving that circle changes the card without a deploy and without anyone
 * re-cutting a JPEG by hand.
 *
 * Without a hotspot the CDN centre-crops, which is the old behaviour.
 */
function cardImageUrl(photo, width, height) {
  if (!photo?.src) return undefined;
  const params = new URLSearchParams({
    w: String(width), h: String(height), fit: 'crop', auto: 'format', q: '80',
  });
  const {x, y} = photo.hotspot || {};
  if (Number.isFinite(x) && Number.isFinite(y)) {
    params.set('crop', 'focalpoint');
    params.set('fp-x', x.toFixed(4));
    params.set('fp-y', y.toFixed(4));
  }
  return `${photo.src}?${params}`;
}

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
      // A photo published in the Studio replaces the committed one. Both card
      // sizes come from the same source photo and the same focal point.
      ...definedOnly({
        image: cardImageUrl(tour.cardPhoto, 1200, 840),
        packageImage: cardImageUrl(tour.cardPhoto, 1200, 825),
        alt: tour.cardPhoto?.alt,
        // Only when an editor chose one. Without it the page keeps widening the
        // card, which is the old behaviour and still perfectly reasonable.
        heroImage: cardImageUrl(tour.coverPhoto, 1920, 1080),
        // Two photographs are a pair, not a gallery — the section only appears
        // once there are enough to read as a set.
        gallery: (tour.gallery || []).length >= 3
          ? tour.gallery.map(photo => ({
              src: cardImageUrl(photo, 900, 1125),
              alt: photo.alt || photo.caption || '',
              caption: photo.caption || '',
              tall: !(photo.width && photo.height && photo.width > photo.height),
            }))
          : undefined,
      }),
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

export async function loadTourContent({
  localTours,
  env = process.env,
  fetchImpl = fetch,
  logger = console,
  // Only authoritative delivery may drop a record from the catalogue. Every
  // other build keeps per-record fallback, so this defaults off.
  authoritativeDelivery = false,
  contentVersion = 'draft',
  tokenEnvVar = 'STORYBLOK_PREVIEW_API_TOKEN',
}) {
  const projectId = env.SANITY_STUDIO_PROJECT_ID;
  const dataset = env.SANITY_STUDIO_DATASET || 'production';
  let tours = localTours;
  let source = 'local';

  if (projectId && projectId !== 'REPLACE_WITH_PROJECT_ID') {
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
      // A card and a cover want opposite shapes, so they are separate fields.
      // Each falls back rather than failing: no cover uses the card, and no
      // card uses the first approved gallery photo, which is what every tour
      // held before these fields existed. Unapproved and stand-in photos are
      // filtered here rather than later, so a tour with none falls back to the
      // committed image instead of rendering a blank card.
      "cardPhoto": select(
        cardPhoto.publicApprovalState == "approved" && cardPhoto.placeholderState == "approved" =>
          cardPhoto{"src": image.asset->url, "alt": altText, "hotspot": image.hotspot},
        media[publicApprovalState == "approved" && placeholderState == "approved"][0]{
          "src": image.asset->url, "alt": altText, "hotspot": image.hotspot
        }
      ),
      // Photographs from the experience itself. Approved only, and filtered
      // here rather than later so an unpublished one cannot reach the page.
      "gallery": media[publicApprovalState == "approved" && placeholderState == "approved"]{
        "src": image.asset->url,
        "alt": altText,
        "caption": caption,
        "hotspot": image.hotspot,
        "width": image.asset->metadata.dimensions.width,
        "height": image.asset->metadata.dimensions.height
      },
      "coverPhoto": select(
        coverPhoto.publicApprovalState == "approved" && coverPhoto.placeholderState == "approved" =>
          coverPhoto{"src": image.asset->url, "alt": altText, "hotspot": image.hotspot},
        null
      ),
      priceOptions[]{label, price},
      faqs[]{question, answer},
      itinerary[]{day, title, description, meals}
    },
    "featured": *[_id == "featuredTourCollection"][0]{items[]{order, tour->{slug}}}
  }`;
    const url = `https://${projectId}.apicdn.sanity.io/v${API_VERSION}/data/query/${dataset}?query=${encodeURIComponent(query)}`;
    const body = await fetchSanity(url, {fetchImpl, label: 'Sanity tour'});

    // Detail-page filenames intentionally remain local. Catalogue facts and
    // the card photo come from Sanity and are merged by slug.
    tours = validateSanityTours(body.result, localTours);
    source = 'sanity';
  }

  // Storyblok deliberately maps into the same renderer-facing shape as the
  // established sources. The generic loader validates each standard tour on
  // its own, so an invalid or unavailable Storyblok record leaves only that
  // tour on its local/Sanity base instead of taking down the whole catalogue.
  const storyblok = await loadStoryblokStandardTours({
    baseTours: tours,
    env,
    fetchImpl,
    logger,
    authoritativeDelivery,
    contentVersion,
    tokenEnvVar,
  });

  // The one multi-day trip runs through its own gate, behind its own flag,
  // after the standard ones. Same shape of check: a record that fails it leaves
  // Just Go Ghana on whatever source it already had.
  const storyblokMultiDay = await loadStoryblokMultiDayTours({
    baseTours: storyblok.tours,
    env,
    fetchImpl,
    logger,
    authoritativeDelivery,
    contentVersion,
    tokenEnvVar,
  });

  return {
    tours: storyblokMultiDay.tours,
    source,
    storyblokStandardTourSources: storyblok.sourcesBySlug,
    storyblokStandardTourSummary: storyblok.summary,
    storyblokAppliedSlugs: storyblok.appliedSlugs,
    storyblokMultiDaySources: storyblokMultiDay.sourcesBySlug,
    storyblokMultiDaySummary: storyblokMultiDay.summary,
    storyblokMultiDayAppliedSlugs: storyblokMultiDay.appliedSlugs,
  };
}
