import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Singleton — the copy for the contact page booking flow.
 *
 * Every field here is read at build time by scripts/booking-source.mjs and
 * injected into contact.html, so editors can reword the flow, its CTAs, its
 * reassurances and its confirmation message without a code change. The
 * committed defaults live in src/content/booking.json and are what ships when
 * Sanity is not configured.
 */
export const bookingFlow = defineType({
  name: 'bookingFlow',
  title: 'Booking Flow',
  type: 'document',
  groups: [
    {name: 'intro', title: 'Introduction', default: true},
    {name: 'steps', title: 'Steps & CTAs'},
    {name: 'trust', title: 'Trust & reassurance'},
    {name: 'confirmation', title: 'Confirmation'},
    {name: 'faqs', title: 'FAQs'},
  ],
  fields: [
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string', group: 'intro', validation: r => r.required().max(40)}),
    defineField({name: 'title', title: 'Headline', type: 'string', group: 'intro', validation: r => r.required().max(90)}),
    defineField({
      name: 'intro',
      title: 'Introductory copy',
      type: 'text',
      rows: 3,
      group: 'intro',
      description: 'Sets the tone before the first question. Keep it reassuring — this is a conversation, not a checkout.',
      validation: r => r.required().max(260),
    }),

    defineField({name: 'step1Name', title: 'Step 1 — progress label', type: 'string', group: 'steps', validation: r => r.required().max(24)}),
    defineField({name: 'step1Legend', title: 'Step 1 — question heading', type: 'string', group: 'steps', validation: r => r.required().max(80)}),
    defineField({name: 'step1Help', title: 'Step 1 — helper text', type: 'text', rows: 2, group: 'steps', validation: r => r.required().max(180)}),
    defineField({
      name: 'nextLabel',
      title: 'Continue button',
      type: 'string',
      group: 'steps',
      description: 'Invitational, not transactional — "Continue Your Journey" rather than "Next".',
      validation: r => r.required().max(30),
    }),
    defineField({name: 'nextNote', title: 'Note under the continue button', type: 'string', group: 'steps', validation: r => r.required().max(120)}),

    defineField({name: 'step2Name', title: 'Step 2 — progress label', type: 'string', group: 'steps', validation: r => r.required().max(24)}),
    defineField({name: 'step2Legend', title: 'Step 2 — question heading', type: 'string', group: 'steps', validation: r => r.required().max(80)}),
    defineField({name: 'step2Help', title: 'Step 2 — helper text', type: 'text', rows: 2, group: 'steps', validation: r => r.required().max(180)}),
    defineField({
      name: 'submitLabel',
      title: 'Submit button',
      type: 'string',
      group: 'steps',
      description: 'Avoid "Submit" or "Send Inquiry" — this is the start of planning together.',
      validation: r => r.required().max(30),
    }),
    defineField({name: 'submitNote', title: 'Note under the submit button', type: 'string', group: 'steps', validation: r => r.required().max(140)}),

    defineField({
      name: 'privacyNote',
      title: 'Privacy note',
      type: 'text',
      rows: 3,
      group: 'trust',
      validation: r => r.required().max(300),
    }),
    defineField({name: 'altPrompt', title: 'WhatsApp prompt', type: 'string', group: 'trust', validation: r => r.required().max(80)}),
    defineField({
      name: 'trustPoints',
      title: 'Reassurance points',
      type: 'array',
      group: 'trust',
      description: 'The short row beneath the form. Three works best.',
      validation: r => r.required().min(1).max(4),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              options: {list: [
                {title: 'Location pin', value: 'pin'},
                {title: 'Clock', value: 'clock'},
                {title: 'Padlock', value: 'lock'},
              ]},
              validation: r => r.required(),
            }),
            defineField({name: 'label', title: 'Label', type: 'string', validation: r => r.required().max(60)}),
          ],
          preview: {select: {title: 'label', subtitle: 'icon'}},
        }),
      ],
    }),

    defineField({name: 'nextStepsTitle', title: '"What happens next" heading', type: 'string', group: 'confirmation', validation: r => r.required().max(70)}),
    defineField({name: 'nextStepsIntro', title: '"What happens next" intro', type: 'text', rows: 2, group: 'confirmation', validation: r => r.required().max(200)}),
    defineField({
      name: 'nextSteps',
      title: 'What happens next',
      type: 'array',
      group: 'confirmation',
      description: 'Numbered automatically in the order listed here.',
      validation: r => r.required().min(1).max(6),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Title', type: 'string', validation: r => r.required().max(60)}),
            defineField({name: 'description', title: 'Description', type: 'text', rows: 2, validation: r => r.required().max(220)}),
          ],
          preview: {select: {title: 'title', subtitle: 'description'}},
        }),
      ],
    }),
    defineField({name: 'talkTitle', title: '"Rather talk?" heading', type: 'string', group: 'confirmation', validation: r => r.required().max(50)}),
    defineField({name: 'talkText', title: '"Rather talk?" copy', type: 'text', rows: 2, group: 'confirmation', validation: r => r.required().max(180)}),
    defineField({
      name: 'successTitle',
      title: 'Success heading',
      type: 'string',
      group: 'confirmation',
      description: 'Shown in place of the form once an inquiry is delivered.',
      validation: r => r.required().max(60),
    }),
    defineField({name: 'successText', title: 'Success message', type: 'text', rows: 3, group: 'confirmation', validation: r => r.required().max(300)}),

    defineField({
      name: 'faqs',
      title: 'Booking FAQs',
      type: 'array',
      group: 'faqs',
      description: 'The first question is expanded by default on the page.',
      validation: r => r.required().min(1).max(10),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'question', title: 'Question', type: 'string', validation: r => r.required().max(120)}),
            defineField({name: 'answer', title: 'Answer', type: 'text', rows: 4, validation: r => r.required().max(700)}),
          ],
          preview: {select: {title: 'question', subtitle: 'answer'}},
        }),
      ],
    }),
  ],
  preview: {
    prepare: () => ({title: 'Booking Flow'}),
  },
})
