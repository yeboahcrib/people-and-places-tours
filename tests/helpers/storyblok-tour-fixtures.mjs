/**
 * One definition of a valid Storyblok tour story, shared by the suites that
 * need one.
 *
 * It lives here because two copies would drift, and a drifted copy is worse
 * than no fixture at all: the withdrawal tests assert that a *valid* story
 * applies, so a fixture that quietly stopped passing the content gate would
 * make them prove nothing.
 */
import {STORYBLOK_STANDARD_TOUR_REGISTRY} from '../../scripts/storyblok-tour-source.mjs';

const registryBySlug = new Map(STORYBLOK_STANDARD_TOUR_REGISTRY.map(entry => [entry.slug, entry]));

export const fullSlugFor = slug => {
  const entry = registryBySlug.get(slug);
  if (!entry) throw new Error(`${slug} is not an approved standard-tour registry entry`);
  return entry.fullSlug;
};

export const asset = (name, alt, {
  focus = '600x420:601x421', width = 1600, height = 900,
} = {}) => ({
  filename: `https://a.storyblok.com/f/999999/${name}/${name}.jpg`,
  alt,
  focus,
  meta_data: {dimensions: {width, height}},
});
export const listItem = text => ({component: 'list_item', text});
export const faqItem = (question, answer) => ({component: 'faq_item', question, answer});
export const galleryItem = (image, layout, caption, altText) => ({
  component: 'gallery_item', image, layout, caption, ...(altText ? {alt_text: altText} : {}),
});

export const makeTourContent = (slug, {
  title = `${slug} from Storyblok`,
  displayOrder = 4,
  cardImage = asset(`${slug}-card`, `${slug} card image`),
  heroImage = asset(`${slug}-hero`, `${slug} hero image`, {focus: '412x600:413x601', width: 1200, height: 1600}),
  ...overrides
} = {}) => {
  const river = asset(`${slug}-river`, `${slug} river image`, {width: 900, height: 1200});
  const gallery = asset(`${slug}-gallery`, `${slug} gallery image`, {width: 1200, height: 1500});
  return {
    component: 'tour',
    slug,
    published: true,
    experience_type: 'day',
    name: title,
    display_order: String(displayOrder),
    card_image: cardImage,
    card_badge: 'Best Seller',
    card_description: `A concise ${slug} card description.`,
    categories: ['culture', 'heritage'],
    vibes: ['Heritage', 'History'],
    destination: 'cape-coast',
    search_summary: 'Places, people, and history',
    price: '160',
    currency: 'USD',
    price_unit: 'Per Person',
    price_options: [{component: 'price_option', label: 'With a naming ceremony', price: '180'}],
    duration: 'Full Day',
    locations: [listItem('Assin Manso'), listItem('Cape Coast'), listItem('Elmina')],
    starting_point: 'Hotel or apartment pickup in Accra',
    minimum_guests: '1',
    maximum_guests: '12',
    group_size_note: 'Private departures are available on request.',
    hero_image: heroImage,
    hero_watermark: 'CAPE COAST',
    page_headline: 'Walk the Door of No Return.',
    page_intro: 'A concise introduction for the page.',
    overview: 'A Storyblok overview.\n\nA second paragraph.',
    included: [listItem('Private transport'), listItem('Guide')],
    excluded: [listItem('Lunch')],
    good_to_know: [listItem('Bring water'), listItem('Wear comfortable shoes')],
    gallery: [
      galleryItem(river, 'portrait', 'First Bath of Return', 'Guests at the river'),
      galleryItem(cardImage, 'wide', 'Naming ceremony'),
      galleryItem(gallery, 'automatic', 'Cape Coast Castle'),
    ],
    faqs: [
      faqItem('Is it reflective?', 'Yes, with room for reflection.'),
      faqItem('Can we add a ceremony?', 'Yes.'),
    ],
    seo: [{
      component: 'seo',
      title: `${title} | People & Places`,
      description: `A Storyblok description for ${slug}.`,
      indexing: 'index',
      social_image: cardImage,
    }],
    ...overrides,
  };
};

export const makeStory = (slug, {
  storySlug = slug,
  fullSlug = fullSlugFor(slug),
  contentOverrides = {},
} = {}) => ({
  // Draft outer state is deliberate: the local adapter uses the Preview API
  // while the editor-facing "Show this experience" setting controls mapping.
  published: false,
  slug: storySlug,
  full_slug: fullSlug,
  content: makeTourContent(slug, contentOverrides),
});
