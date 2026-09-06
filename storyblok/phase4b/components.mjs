/**
 * The Storyblok model for the existing About page.
 *
 * Eight sections in the order the page already renders them, labelled the way
 * an editor would name them looking at the page. Presentation and routing stay
 * in the existing code; nothing here chooses a layout or an order.
 *
 * `faq_item` is reused rather than duplicated — it already exists in this space
 * with exactly the question/answer shape this page needs. The other blocks are
 * new because nothing existing genuinely fits: forcing the homepage's trust
 * fact onto an About statistic would save one component and cost the editor a
 * block named for the wrong page.
 */
const text = (display_name, pos, extra = {}) => ({type: 'text', display_name, pos, ...extra});
const area = (display_name, pos, extra = {}) => ({type: 'textarea', display_name, pos, ...extra});
const blocks = (display_name, pos, whitelist) => ({
  type: 'bloks', display_name, pos, restrict_components: true, component_whitelist: whitelist,
});
const tab = (display_name, pos, keys) => ({type: 'tab', display_name, pos, keys});

export const NESTABLE = [
  {
    name: 'about_paragraph', display_name: 'Paragraph', is_nestable: true,
    schema: {text: area('Paragraph', 0, {required: true})},
  },
  {
    name: 'about_mission_proof', display_name: 'Where we host', is_nestable: true,
    schema: {
      place: text('Place', 0, {required: true}),
      craft: text('What it is known for', 1),
    },
  },
  {
    name: 'about_difference', display_name: 'What makes us different', is_nestable: true,
    schema: {
      title: text('Title', 0, {required: true}),
      text: area('Description', 1, {max_length: 320}),
    },
  },
  {
    name: 'about_team_member', display_name: 'Team member', is_nestable: true,
    schema: {
      name: text('Name', 0, {required: true}),
      role: text('Role', 1),
      bio: area('Short bio', 2, {max_length: 400}),
      photo: {
        type: 'asset', filetypes: ['images'], display_name: 'Photograph (optional)', pos: 3,
        description: 'Leave empty until an approved photograph exists — the page shows initials instead.',
      },
    },
  },
  {
    name: 'about_stat', display_name: 'Impact figure', is_nestable: true,
    schema: {
      value: text('Figure', 0, {required: true, description: 'e.g. 300+'}),
      label: text('Label', 1, {required: true, description: 'e.g. Guests Hosted'}),
    },
  },
];

export const ABOUT_PAGE = {
  name: 'about_page', display_name: 'About page', is_root: true, is_nestable: false,
  schema: {
    hero_tab: tab('Hero', 0, ['published', 'hero_title', 'hero_subtitle', 'hero_image']),
    published: {
      type: 'boolean', display_name: 'Show this About page', pos: 1, default_value: false,
      description: 'Leave off until the page is ready. The site keeps its current About page until this is on.',
    },
    hero_title: text('Heading', 2, {required: true}),
    hero_subtitle: area('Sub-heading', 3),
    hero_image: {
      type: 'asset', filetypes: ['images'], display_name: 'Background photograph', pos: 4,
      description: 'Sits behind the heading. Decorative, so it is described by the heading '
        + 'rather than by alt text — leave the asset\'s alt text empty.',
    },

    story_tab: tab('Our story', 10, ['story_eyebrow', 'story_title', 'story_paragraphs', 'story_image']),
    story_eyebrow: text('Small label above the heading', 11),
    story_title: text('Heading', 12),
    story_paragraphs: blocks('Paragraphs', 13, ['about_paragraph']),
    story_image: {
      type: 'asset', filetypes: ['images'], display_name: 'Photograph beside the story', pos: 14,
      description: 'Shown at 700x850. Needs alt text, because it carries meaning of its own.',
    },

    mission_tab: tab('Mission', 20, ['mission_eyebrow', 'mission_title', 'mission_lede', 'mission_body', 'mission_proof']),
    mission_eyebrow: text('Small label above the heading', 21),
    mission_title: text('Heading', 22),
    mission_lede: area('Opening line', 23),
    mission_body: area('Body', 24),
    mission_proof: blocks('Where we host', 25, ['about_mission_proof']),

    difference_tab: tab('Why choose us', 30, ['difference_eyebrow', 'difference_title', 'difference_intro', 'difference_items']),
    difference_eyebrow: text('Small label above the heading', 31),
    difference_title: text('Heading', 32),
    difference_intro: area('Introduction', 33),
    difference_items: blocks('Reasons', 34, ['about_difference']),

    team_tab: tab('Team', 40, ['team_eyebrow', 'team_title', 'team_intro', 'team_note', 'team']),
    team_eyebrow: text('Small label above the heading', 41),
    team_title: text('Heading', 42),
    team_intro: area('Introduction', 43),
    team_note: area('Note under the team', 44),
    team: blocks('Team members', 45, ['about_team_member']),

    stats_tab: tab('Impact', 50, ['impact_stats']),
    impact_stats: blocks('Figures', 51, ['about_stat']),

    faq_tab: tab('Questions', 60, ['faqs']),
    faqs: blocks('Questions', 61, ['faq_item']),

    cta_tab: tab('Final invitation', 70, ['cta_eyebrow', 'cta_title']),
    cta_eyebrow: text('Small label above the heading', 71),
    cta_title: text('Heading', 72),
  },
};
