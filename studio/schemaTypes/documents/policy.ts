import {defineField, defineType} from 'sanity'

export const policy = defineType({
  name: 'policy',
  title: 'Policy',
  type: 'document',
  description: 'Privacy, terms/booking policy, cancellation/refund — see docs/legal-pages-draft.md for the drafted starting content. Not legal advice; requires lawyer review before publishing.',
  fields: [
    defineField({
      name: 'policyType',
      title: 'Policy type',
      type: 'string',
      options: {
        list: [
          {title: 'Privacy Policy', value: 'privacy'},
          {title: 'Terms & Conditions / Booking Policy', value: 'terms'},
          {title: 'Cancellation & Refund Policy', value: 'cancellation'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'body', title: 'Body', type: 'array', of: [{type: 'block'}]}),
    defineField({name: 'version', title: 'Version', type: 'string'}),
    defineField({name: 'lastUpdated', title: 'Last updated', type: 'date', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'lawyerReviewed',
      title: 'Lawyer reviewed',
      type: 'boolean',
      initialValue: false,
      description: 'Should be true before this publishes, per docs/legal-pages-draft.md.',
    }),
  ],
  preview: {select: {title: 'title', subtitle: 'policyType'}},
})
