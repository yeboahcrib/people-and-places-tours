import {defineField, defineType} from 'sanity'

/**
 * A button, kept in one place so the same wording is reused rather than
 * copy-pasted per page, and so the approved CTA hierarchy (messaging brief
 * §18/§23) stays enforceable.
 *
 * `tier` records how hard the button pushes. It exists because the brief is
 * explicit that "Book now" should be rare and late; naming the intent makes
 * that reviewable instead of a matter of taste. Written here in plain language
 * — the stored values are unchanged.
 */
export const cta = defineType({
  name: 'cta',
  title: 'Button',
  type: 'document',
  description: 'Buttons used around the site. Create one here and it can be reused anywhere.',
  fields: [
    defineField({
      name: 'label',
      title: 'What the button says',
      type: 'string',
      description: 'Keep it short and specific — "Plan your trip" beats "Click here".',
      validation: (Rule) => Rule.required().error('A button needs words on it.'),
    }),
    defineField({
      name: 'destination',
      title: 'Where it goes',
      type: 'string',
      description: 'A page on this site, like contact.html or packages.html, or a full address starting with https://',
      validation: (Rule) => Rule.required().error('A button needs somewhere to go.'),
    }),
    defineField({
      name: 'tier',
      title: 'How strong is this button?',
      type: 'string',
      options: {
        list: [
          {title: 'Have a look around — browsing, no commitment', value: 'explore'},
          {title: 'Read more about something', value: 'learn'},
          {title: 'Start a conversation with us', value: 'converse'},
          {title: 'Look at the details of one trip', value: 'inspect'},
          {title: 'Confirm something already discussed', value: 'confirm'},
          {title: 'Book and pay — use sparingly', value: 'book'},
        ],
      },
      description: 'Most buttons should be one of the first three. A "Book and pay" button belongs only at the very end, once someone has already spoken to you — pushing it earlier is what makes a travel site feel pushy.',
    }),
    defineField({
      name: 'external',
      title: 'Does it lead to another website?',
      type: 'boolean',
      initialValue: false,
      description: 'Turn on for links to WhatsApp, Instagram, or anywhere off this site. It makes the link open in a new tab.',
    }),
  ],
  preview: {
    select: {title: 'label', subtitle: 'destination'},
    prepare: ({title, subtitle}: any) => ({
      title: title || 'Unnamed button',
      subtitle: subtitle || 'No destination set',
    }),
  },
})
