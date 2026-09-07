/**
 * The Storyblok model for the existing Contact / booking copy.
 *
 * Only the words. The form's fields, their order, their required/optional
 * decisions, validation, submission, Turnstile and tour preselection all stay
 * in code, where they already are — nothing here can add, remove, reorder or
 * re-validate a field.
 *
 * The tabs follow the journey an editor sees on the page: the header, the two
 * steps in order, what happens after sending, and the supporting sections.
 *
 * `faq_item` is reused; it already exists here with the question/answer shape
 * this page needs.
 */
const text = (display_name, pos, extra = {}) => ({type: 'text', display_name, pos, ...extra});
const area = (display_name, pos, extra = {}) => ({type: 'textarea', display_name, pos, ...extra});
const blocks = (display_name, pos, whitelist, extra = {}) => ({
  type: 'bloks', display_name, pos, restrict_components: true, component_whitelist: whitelist, ...extra,
});
const tab = (display_name, pos, keys) => ({type: 'tab', display_name, pos, keys});

export const NESTABLE = [
  {
    name: 'contact_trust_point', display_name: 'Reassurance point', is_nestable: true,
    schema: {
      label: text('Text', 0, {required: true}),
      icon: {
        type: 'option', display_name: 'Icon', pos: 1, default_value: 'pin',
        // Exactly the icons the existing renderer can draw. A value outside
        // this list would render nothing, so the editor is not offered one.
        options: [
          {name: 'Location pin', value: 'pin'},
          {name: 'Clock', value: 'clock'},
          {name: 'Padlock', value: 'lock'},
        ],
      },
    },
  },
  {
    name: 'contact_next_step', display_name: 'What happens next', is_nestable: true,
    schema: {
      title: text('Title', 0, {required: true}),
      description: area('Description', 1, {max_length: 320}),
    },
  },
];

export const CONTACT_PAGE = {
  name: 'contact_page', display_name: 'Contact page', is_root: true, is_nestable: false,
  schema: {
    header_tab: tab('Page header', 0, ['published', 'eyebrow', 'title', 'intro', 'hero_subtitle']),
    published: {
      type: 'boolean', display_name: 'Show this contact copy', pos: 1, default_value: false,
      description: 'Leave off until the copy is ready. The site keeps its current wording until this is on.',
    },
    eyebrow: text('Small label above the heading', 2),
    title: text('Heading', 3, {required: true}),
    intro: area('Introduction', 4),
    hero_subtitle: area('Sub-heading at the top of the page', 5),

    step1_tab: tab('Step 1 — the trip', 10, ['step1_name', 'step1_legend', 'step1_help', 'next_label', 'next_note']),
    step1_name: text('Step name in the progress bar', 11),
    step1_legend: text('Heading above the fields', 12),
    step1_help: area('Helper text under the heading', 13),
    next_label: text('Continue button label', 14),
    next_note: area('Note under the Continue button', 15),

    step2_tab: tab('Step 2 — how we reach you', 20, ['step2_name', 'step2_legend', 'step2_help', 'submit_label', 'submit_note', 'privacy_note', 'alt_prompt']),
    step2_name: text('Step name in the progress bar', 21),
    step2_legend: text('Heading above the fields', 22),
    step2_help: area('Helper text under the heading', 23),
    submit_label: text('Send button label', 24),
    submit_note: area('Note under the Send button', 25),
    privacy_note: area('Privacy note', 26),
    alt_prompt: text('Prompt offering to talk instead', 27),

    success_tab: tab('After sending', 30, ['success_title', 'success_text']),
    success_title: text('Heading', 31),
    success_text: area('Message', 32),

    trust_tab: tab('Reassurance', 40, ['trust_points']),
    trust_points: blocks('Points', 41, ['contact_trust_point']),

    next_tab: tab('What happens next', 50, ['next_steps_title', 'next_steps_intro', 'next_steps']),
    next_steps_title: text('Heading', 51),
    next_steps_intro: area('Introduction', 52),
    next_steps: blocks('Steps', 53, ['contact_next_step']),

    talk_tab: tab('Rather talk?', 60, ['talk_title', 'talk_text']),
    talk_title: text('Heading', 61),
    talk_text: area('Message', 62),

    faq_tab: tab('Questions', 70, ['faqs']),
    faqs: blocks('Questions', 71, ['faq_item']),
  },
};
