/**
 * The Storyblok model for the existing homepage.
 *
 * Shaped to the homepage the site already has, not to a page builder: seven
 * named sections in the order the renderer uses, with the labels an editor
 * would recognise from looking at the page. Presentation stays in
 * homepage-sections.js — nothing here chooses a layout, a class or an order.
 */
const text = (display_name, pos, extra = {}) => ({type: 'text', display_name, pos, ...extra});
const area = (display_name, pos, extra = {}) => ({type: 'textarea', display_name, pos, ...extra});
const asset = (display_name, pos, extra = {}) => ({
  type: 'asset', filetypes: ['images'], display_name, pos, ...extra,
});
const blocks = (display_name, pos, components, extra = {}) => ({
  type: 'bloks', display_name, pos, restrict_type: '', restrict_components: true,
  component_whitelist: components, ...extra,
});
const tab = (display_name, pos, keys) => ({type: 'tab', display_name, pos, keys});

export const NESTABLE = [
  {
    name: 'home_founder', display_name: 'Founder', is_nestable: true,
    schema: {
      name: text('Full name', 0, {required: true}),
      preferred_name: text('Preferred name (optional)', 1),
      role: text('Role', 2),
      initials: text('Initials shown in the circle', 3, {max_length: 3}),
    },
  },
  {
    name: 'home_pathway', display_name: 'Way to experience Ghana', is_nestable: true,
    schema: {
      title: text('Title', 0, {required: true}),
      description: area('Description', 1, {max_length: 240}),
      link: text('Link', 2, {description: 'Where the card goes, e.g. packages.html?category=heritage'}),
      image: asset('Photo', 3),
    },
  },
  {
    name: 'home_moment', display_name: 'Trip moment', is_nestable: true,
    schema: {
      image: asset('Photograph', 0, {required: true}),
      caption: text('Caption', 1),
      shape: {
        type: 'option', display_name: 'Shape on the page', pos: 2, default_value: 'wide',
        options: [{name: 'Tall', value: 'tall'}, {name: 'Wide', value: 'wide'}],
      },
    },
  },
  {
    name: 'home_step', display_name: 'Planning step', is_nestable: true,
    schema: {
      number: text('Step number', 0, {max_length: 4}),
      title: text('Title', 1, {required: true}),
      description: area('Description', 2, {max_length: 240}),
      icon: {
        type: 'option', display_name: 'Icon', pos: 3, default_value: 'search',
        options: [
          {name: 'Search', value: 'search'}, {name: 'Route', value: 'route'},
          {name: 'Calendar', value: 'calendar'}, {name: 'Chat', value: 'chat'},
        ],
      },
    },
  },
  {
    name: 'home_review', display_name: 'Guest review', is_nestable: true,
    schema: {
      quote: area('Review', 0, {required: true}),
      author: text('Reviewer name', 1, {required: true}),
      source_label: text('Where it came from', 2, {default_value: 'Verified Google review'}),
      review_date: {type: 'text', display_name: 'Date (YYYY-MM-DD)', pos: 3},
      rating: {type: 'number', display_name: 'Stars out of 5', pos: 4, default_value: '5'},
    },
  },
  {
    name: 'home_trust_fact', display_name: 'Trust fact', is_nestable: true,
    schema: {
      value: text('Figure', 0, {required: true, description: 'e.g. 300+'}),
      label: text('Label', 1, {required: true, description: 'e.g. Guests Hosted'}),
    },
  },
];

export const HOMEPAGE = {
  name: 'homepage', display_name: 'Homepage', is_root: true, is_nestable: false,
  schema: {
    hero_tab: tab('Hero', 0, ['published', 'hero_headline', 'hero_sub', 'hero_image', 'hero_cta_label', 'hero_cta_link']),
    published: {type: 'boolean', display_name: 'Show this homepage', pos: 1, default_value: false,
      description: 'Leave off until the page is ready. The site keeps its current homepage until this is on.'},
    hero_headline: text('Headline', 2, {required: true}),
    hero_sub: area('Sub-heading', 3),
    hero_image: asset('Hero photograph', 4),
    hero_cta_label: text('Button label', 5),
    hero_cta_link: text('Button link', 6),

    founder_tab: tab('Founder story', 10, ['founder_eyebrow', 'founder_headline', 'founder_body', 'founder_trust_note', 'founder_cta_label', 'founder_cta_link', 'founders']),
    founder_eyebrow: text('Small label above the heading', 11),
    founder_headline: text('Heading', 12),
    founder_body: area('Story', 13),
    founder_trust_note: area('Note under the founders', 14),
    founder_cta_label: text('Button label', 15),
    founder_cta_link: text('Button link', 16),
    founders: blocks('Founders', 17, ['home_founder']),

    ways_tab: tab('Ways to experience Ghana', 20, ['ways_eyebrow', 'ways_title', 'ways_intro', 'pathways', 'ways_cta_label', 'ways_cta_link']),
    ways_eyebrow: text('Small label above the heading', 21),
    ways_title: text('Heading', 22),
    ways_intro: area('Introduction', 23),
    pathways: blocks('Ways to experience', 24, ['home_pathway']),
    ways_cta_label: text('Button label', 25),
    ways_cta_link: text('Button link', 26),

    moments_tab: tab('Trip moments', 30, ['moments_eyebrow', 'moments_title', 'moments_intro', 'moments']),
    moments_eyebrow: text('Small label above the heading', 31),
    moments_title: text('Heading', 32),
    moments_intro: area('Introduction', 33),
    moments: blocks('Photographs', 34, ['home_moment']),

    reviews_tab: tab('Reviews & trust', 40, ['reviews_eyebrow', 'reviews_title_lines', 'reviews_intro', 'reviews_image', 'rating_value', 'rating_source', 'rating_count', 'rating_link', 'trust_facts', 'reviews']),
    reviews_eyebrow: text('Small label above the heading', 41),
    reviews_title_lines: area('Heading', 42, {description: 'One line per line of the heading.'}),
    reviews_intro: area('Introduction', 43),
    reviews_image: asset('Photograph', 44),
    rating_value: text('Rating', 45, {description: 'e.g. 5.0'}),
    rating_source: text('Rated on', 46, {default_value: 'Google'}),
    rating_count: {type: 'number', display_name: 'Number of reviews', pos: 47},
    rating_link: text('Link to the reviews', 48),
    trust_facts: blocks('Trust facts', 49, ['home_trust_fact']),
    reviews: blocks('Reviews', 50, ['home_review']),

    planning_tab: tab('Planning process', 60, ['planning_eyebrow', 'planning_title', 'steps']),
    planning_eyebrow: text('Small label above the heading', 61),
    planning_title: text('Heading', 62),
    steps: blocks('Steps', 63, ['home_step']),

    invitation_tab: tab('Final invitation', 70, ['invitation_eyebrow', 'invitation_headline', 'invitation_body', 'invitation_reassurance', 'invitation_trust_message', 'invitation_cta_label', 'invitation_cta_link', 'invitation_secondary_label', 'invitation_secondary_link']),
    invitation_eyebrow: text('Small label above the heading', 71),
    invitation_headline: text('Heading', 72),
    invitation_body: area('Body', 73),
    invitation_reassurance: area('Reassurance line', 74),
    invitation_trust_message: area('Trust line', 75),
    invitation_cta_label: text('Main button label', 76),
    invitation_cta_link: text('Main button link', 77),
    invitation_secondary_label: text('Second button label', 78),
    invitation_secondary_link: text('Second button link', 79),
  },
};
