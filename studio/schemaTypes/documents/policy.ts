import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * A published policy page.
 *
 * The shape here mirrors src/content/policy.json exactly, because
 * scripts/policy-source.mjs validates both against the same rules. A section
 * with no terms under it, or a term with no explanation, fails the build
 * rather than publishing a policy that looks complete and promises nothing.
 *
 * Not legal advice. docs/legal-pages-draft.md carries the drafting notes.
 */
export const policy = defineType({
  name: 'policy',
  title: 'Policy page',
  type: 'document',
  description: 'The cancellation, refund, privacy or booking terms a traveller can read before they pay you.',
  fields: [
    defineField({
      name: 'policyType',
      title: 'Which policy is this?',
      type: 'string',
      options: {
        list: [
          {title: 'Cancellation & refunds', value: 'cancellation'},
          {title: 'Privacy', value: 'privacy'},
          {title: 'Booking terms & conditions', value: 'terms'},
        ],
        layout: 'radio',
      },
      description: 'Only the cancellation policy has a page on the website today. The others can be written now and published when their pages exist.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Page heading',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lastUpdated',
      title: 'Last updated',
      type: 'date',
      description: 'Shown at the top of the page. A traveller deciding whether these terms still apply to them needs this date, so change it every time you change the wording.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'intro',
      title: 'Opening paragraph',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sections',
      title: 'Sections',
      type: 'array',
      description: 'One per part of the policy — what happens if the traveller cancels, if you cancel, and so on.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'policySection',
          fields: [
            defineField({name: 'heading', title: 'Section heading', type: 'string', validation: (Rule) => Rule.required()}),
            defineField({name: 'intro', title: 'Opening line for this section', type: 'text', rows: 3, description: 'Optional.'}),
            defineField({
              name: 'items',
              title: 'Terms',
              type: 'array',
              description: 'Each one is a rule a traveller can point to.',
              of: [
                defineArrayMember({
                  type: 'object',
                  name: 'policyTerm',
                  fields: [
                    defineField({name: 'term', title: 'The rule, in a few words', type: 'string', description: 'For example "30 days or less before the trip".', validation: (Rule) => Rule.required()}),
                    defineField({name: 'text', title: 'What it means', type: 'text', rows: 3, validation: (Rule) => Rule.required()}),
                  ],
                  preview: {select: {title: 'term', subtitle: 'text'}},
                }),
              ],
              validation: (Rule) => Rule.min(1).error('A section with no terms in it publishes an empty promise.'),
            }),
          ],
          preview: {select: {title: 'heading'}},
        }),
      ],
      validation: (Rule) => Rule.min(1).required(),
    }),
    defineField({
      name: 'contactIntro',
      title: 'Line above your contact details',
      type: 'text',
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'closing',
      title: 'Closing statement',
      type: 'text',
      rows: 3,
      description: 'The line that says booking means the traveller accepts these terms.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'lawyerReviewed',
      title: 'Has a lawyer read this?',
      type: 'boolean',
      initialValue: false,
      description: 'For your own record. It does not stop the page publishing.',
    }),
  ],
  preview: {select: {title: 'title', subtitle: 'policyType'}},
})
