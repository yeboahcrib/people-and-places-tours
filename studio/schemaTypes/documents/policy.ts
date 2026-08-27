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
  title: 'Policy or information page',
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
          {title: 'Travelling to Ghana (practical information)', value: 'travel'},
          {title: 'Travel insurance', value: 'insurance'},
          {title: 'Privacy', value: 'privacy'},
          {title: 'Booking terms & conditions', value: 'terms'},
        ],
        layout: 'radio',
      },
      description: 'Cancellation and travel insurance have pages on the website today. The others can be written now and published when their pages exist.',
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
                    // Optional. Every string on a policy page is escaped, so a
                    // term that mentions another of our pages had no way to link
                    // to it: travel-information told visitors that visas, yellow
                    // fever and insurance each had their own page and linked
                    // none, sending them to Google at the point they trusted us
                    // most. Only a page on this site is accepted; the build
                    // drops anything else rather than rendering it.
                    defineField({
                      name: 'link',
                      title: 'Link to one of our pages (optional)',
                      type: 'object',
                      options: {collapsible: true, collapsed: true},
                      fields: [
                        defineField({name: 'href', title: 'Which page', type: 'string', description: 'A page on this site, for example travel-insurance.html'}),
                        defineField({name: 'label', title: 'Link wording', type: 'string', description: 'For example "Read the insurance requirements".'}),
                      ],
                    }),
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
