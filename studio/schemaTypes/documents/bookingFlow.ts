import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Singleton — the copy for the contact page booking flow.
 *
 * Every field here is read at build time by scripts/booking-source.mjs and
 * injected into contact.html, so editors can reword the flow, its buttons, its
 * reassurances and its confirmation message without a code change. The
 * committed defaults live in src/content/booking.json and are what ships when
 * Sanity is not configured.
 *
 * The enquiry form asks its questions over two screens. "Step 1" and "Step 2"
 * below are those screens, in order. Labels are written for whoever runs the
 * business; the field `name` values are what the website reads and must not be
 * renamed.
 */
export const bookingFlow = defineType({
  name: 'bookingFlow',
  title: 'Contact & booking wording',
  type: 'document',
  description: 'Everything a visitor reads while filling in the enquiry form — the questions, the buttons, and what they see after sending it.',
  groups: [
    {name: 'intro', title: 'Before the form', default: true},
    {name: 'steps', title: 'The two screens'},
    {name: 'trust', title: 'Reassurance'},
    {name: 'confirmation', title: 'After they send it'},
    {name: 'faqs', title: 'Questions & answers'},
  ],
  fields: [
    defineField({
      name: 'heroSubtitle',
      title: 'Sentence at the top of the page',
      type: 'text',
      rows: 3,
      group: 'intro',
      description: 'Sits under "Let’s Plan Ghana Together". It should sit comfortably with both a first-time visitor and someone returning to Ghana, without naming either.',
      validation: r => r.required().max(260),
    }),
    defineField({
      name: 'eyebrow',
      title: 'Small label above the form heading',
      type: 'string',
      group: 'intro',
      description: 'A few words in capitals.',
      validation: r => r.required().max(40),
    }),
    defineField({
      name: 'title',
      title: 'Form heading',
      type: 'string',
      group: 'intro',
      validation: r => r.required().max(90),
    }),
    defineField({
      name: 'intro',
      title: 'Sentence before the first question',
      type: 'text',
      rows: 3,
      group: 'intro',
      description: 'Sets the tone. Keep it reassuring — this is the start of a conversation, not a checkout.',
      validation: r => r.required().max(260),
    }),

    defineField({
      name: 'step1Name',
      title: 'Screen 1 — short name',
      type: 'string',
      group: 'steps',
      description: 'One or two words. Shown in the little progress indicator at the top.',
      validation: r => r.required().max(24),
    }),
    defineField({
      name: 'step1Legend',
      title: 'Screen 1 — the question',
      type: 'string',
      group: 'steps',
      validation: r => r.required().max(80),
    }),
    defineField({
      name: 'step1Help',
      title: 'Screen 1 — line underneath',
      type: 'text',
      rows: 2,
      group: 'steps',
      validation: r => r.required().max(180),
    }),
    defineField({
      name: 'nextLabel',
      title: 'Button to go to screen 2',
      type: 'string',
      group: 'steps',
      description: 'Inviting rather than mechanical — "Continue Your Journey" rather than "Next".',
      validation: r => r.required().max(30),
    }),
    defineField({
      name: 'nextNote',
      title: 'Small line under that button',
      type: 'string',
      group: 'steps',
      validation: r => r.required().max(120),
    }),

    defineField({
      name: 'step2Name',
      title: 'Screen 2 — short name',
      type: 'string',
      group: 'steps',
      validation: r => r.required().max(24),
    }),
    defineField({
      name: 'step2Legend',
      title: 'Screen 2 — the question',
      type: 'string',
      group: 'steps',
      validation: r => r.required().max(80),
    }),
    defineField({
      name: 'step2Help',
      title: 'Screen 2 — line underneath',
      type: 'text',
      rows: 2,
      group: 'steps',
      validation: r => r.required().max(180),
    }),
    defineField({
      name: 'submitLabel',
      title: 'Button that sends the enquiry',
      type: 'string',
      group: 'steps',
      description: 'Avoid "Submit" or "Send Inquiry" — this is the start of planning together.',
      validation: r => r.required().max(30),
    }),
    defineField({
      name: 'submitNote',
      title: 'Small line under that button',
      type: 'string',
      group: 'steps',
      validation: r => r.required().max(140),
    }),

    defineField({
      name: 'privacyNote',
      title: 'What you do with their details',
      type: 'text',
      rows: 3,
      group: 'trust',
      description: 'Say plainly who sees the enquiry and that it is not passed on. People do read this one.',
      validation: r => r.required().max(300),
    }),
    defineField({
      name: 'altPrompt',
      title: 'Line offering WhatsApp instead',
      type: 'string',
      group: 'trust',
      description: 'For visitors who would rather message than fill in a form.',
      validation: r => r.required().max(80),
    }),
    defineField({
      name: 'trustPoints',
      title: 'Short reassurance points',
      type: 'array',
      group: 'trust',
      description: 'The small row beneath the form. Three works best.',
      validation: r => r.required().min(1).max(4),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'icon',
              title: 'Little picture beside it',
              type: 'string',
              options: {list: [
                {title: 'Location pin', value: 'pin'},
                {title: 'Clock', value: 'clock'},
                {title: 'Padlock', value: 'lock'},
              ]},
              validation: r => r.required(),
            }),
            defineField({name: 'label', title: 'The words', type: 'string', validation: r => r.required().max(60)}),
          ],
          preview: {select: {title: 'label', subtitle: 'icon'}},
        }),
      ],
    }),

    defineField({
      name: 'nextStepsTitle',
      title: '"What happens next" heading',
      type: 'string',
      group: 'confirmation',
      validation: r => r.required().max(70),
    }),
    defineField({
      name: 'nextStepsIntro',
      title: '"What happens next" opening line',
      type: 'text',
      rows: 2,
      group: 'confirmation',
      validation: r => r.required().max(200),
    }),
    defineField({
      name: 'nextSteps',
      title: 'The steps you will take',
      type: 'array',
      group: 'confirmation',
      description: 'Numbered automatically in the order listed. Only promise what you will actually do.',
      validation: r => r.required().min(1).max(6),
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'title', title: 'Step heading', type: 'string', validation: r => r.required().max(60)}),
            defineField({name: 'description', title: 'What happens', type: 'text', rows: 2, validation: r => r.required().max(220)}),
          ],
          preview: {select: {title: 'title', subtitle: 'description'}},
        }),
      ],
    }),
    defineField({
      name: 'talkTitle',
      title: '"Rather talk?" heading',
      type: 'string',
      group: 'confirmation',
      validation: r => r.required().max(50),
    }),
    defineField({
      name: 'talkText',
      title: '"Rather talk?" wording',
      type: 'text',
      rows: 2,
      group: 'confirmation',
      validation: r => r.required().max(180),
    }),
    defineField({
      name: 'successTitle',
      title: 'Thank-you heading',
      type: 'string',
      group: 'confirmation',
      description: 'Replaces the form once the enquiry has actually reached you.',
      validation: r => r.required().max(60),
    }),
    defineField({
      name: 'successText',
      title: 'Thank-you message',
      type: 'text',
      rows: 3,
      group: 'confirmation',
      description: 'Tell them when to expect a reply. This is the last thing they read, so make it warm and specific.',
      validation: r => r.required().max(300),
    }),

    defineField({
      name: 'faqs',
      title: 'Questions & answers',
      type: 'array',
      group: 'faqs',
      description: 'The first one is open by default, so put the question people ask most at the top.',
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
    prepare: () => ({title: 'Contact & booking wording'}),
  },
})
