/**
 * The Storyblok model for the five existing policy pages.
 *
 * All five already share one structure — a title, a date, an introduction,
 * numbered sections of term-and-text items, a contact line and sometimes a
 * closing paragraph — so they share one content type rather than five. That is
 * a shape the pages genuinely have, not one imposed on them: the committed
 * content, the Sanity schema and the renderer all already agree on it.
 *
 * Routing, layout and the page markup stay in code. Nothing here can add a
 * policy, change a route, or alter how a policy is enforced.
 */
const text = (display_name, pos, extra = {}) => ({type: 'text', display_name, pos, ...extra});
const area = (display_name, pos, extra = {}) => ({type: 'textarea', display_name, pos, ...extra});
const blocks = (display_name, pos, whitelist, extra = {}) => ({
  type: 'bloks', display_name, pos, restrict_components: true, component_whitelist: whitelist, ...extra,
});

export const NESTABLE = [
  {
    name: 'policy_item', display_name: 'Policy point', is_nestable: true,
    schema: {
      term: text('Term', 0, {required: true,
        description: 'The condition or label, e.g. "60 or more days before the trip".'}),
      text: area('What it means', 1, {required: true}),
      link_label: text('Link text (optional)', 2),
      link_href: text('Link address (optional)', 3,
        {description: 'A page on this site, e.g. travel-insurance.html'}),
    },
  },
  {
    name: 'policy_section', display_name: 'Policy section', is_nestable: true,
    schema: {
      heading: text('Heading', 0, {required: true}),
      intro: area('Introduction (optional)', 1),
      items: blocks('Points', 2, ['policy_item']),
    },
  },
];

export const POLICY_PAGE = {
  name: 'policy_page', display_name: 'Policy page', is_root: true, is_nestable: false,
  schema: {
    published: {
      type: 'boolean', display_name: 'Show this policy', pos: 0, default_value: false,
      description: 'Leave off until the wording is approved. The site keeps its current '
        + 'policy until this is on. A policy is never part-published: it is this version or the current one.',
    },
    /*
     * Which page this document is. The build looks a policy up by this value,
     * so it is a fixed list rather than free text — a typo here would silently
     * leave a page on its old wording.
     */
    policy_type: {
      type: 'option', display_name: 'Which policy', pos: 1, required: true,
      options: [
        {name: 'Cancellation & refunds', value: 'cancellation'},
        {name: 'Travel insurance', value: 'insurance'},
        {name: 'Privacy', value: 'privacy'},
        {name: 'Booking terms', value: 'terms'},
        {name: 'Travelling to Ghana', value: 'travel'},
      ],
    },
    title: text('Page title', 2, {required: true}),
    last_updated: text('Last updated', 3,
      {required: true, description: 'YYYY-MM-DD, e.g. 2026-08-22.'}),
    intro: area('Introduction', 4, {required: true}),
    sections: blocks('Sections', 5, ['policy_section']),
    contact_intro: area('Line above the contact details', 6),
    closing: area('Closing paragraph (optional)', 7,
      {description: 'Only two policies use one. Leave empty on the others.'}),
  },
};
