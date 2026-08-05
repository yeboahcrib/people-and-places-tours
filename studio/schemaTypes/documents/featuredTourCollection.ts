import {defineField, defineType} from 'sanity'

/**
 * Replaces the old `homeFeatured: true` boolean on tours. See
 * docs/sprint-2-tour-and-media-architecture.md — this is exactly the type
 * that should have prevented 6 tours ending up featured against an
 * approved 3–5, since the array itself refuses a 6th item.
 */
export const featuredTourCollection = defineType({
  name: 'featuredTourCollection',
  title: 'Featured Tour Collection',
  type: 'document',
  // Singleton — the current homepage featured set.
  fields: [
    defineField({
      name: 'items',
      title: 'Featured tours',
      type: 'array',
      validation: (Rule) => Rule.min(3).max(5).error('Must be 3–5 tours, per the approved featured-tour range.'),
      of: [
        {
          type: 'object',
          name: 'featuredItem',
          fields: [
            defineField({name: 'tour', title: 'Tour', type: 'reference', to: [{type: 'tour'}], validation: (Rule) => Rule.required()}),
            defineField({name: 'order', title: 'Order', type: 'number', validation: (Rule) => Rule.required()}),
            defineField({
              name: 'reasonForFeature',
              title: 'Reason for feature',
              type: 'string',
              description: 'e.g. "Balances the set with a craft experience" — a short internal note so a future edit doesn\'t have to reverse-engineer why this was chosen.',
            }),
            defineField({name: 'startDate', title: 'Start date (optional)', type: 'date'}),
            defineField({name: 'endDate', title: 'End date (optional)', type: 'date'}),
          ],
          preview: {
            select: {tourTitle: 'tour.title', order: 'order'},
            prepare({tourTitle, order}) {
              return {title: `${order}. ${tourTitle || 'Untitled tour'}`}
            },
          },
        },
      ],
      options: {sortable: true},
    }),
    defineField({
      name: 'motivationBalanceNote',
      title: 'Motivation balance check',
      type: 'text',
      description: 'A soft reminder, not an enforced rule: does the set span heritage, food/city, craft, nature, and tailored multi-day? (per the messaging brief)',
    }),
  ],
})
