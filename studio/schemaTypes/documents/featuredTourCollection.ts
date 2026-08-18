import {defineField, defineType} from 'sanity'

/**
 * Replaces the old `homeFeatured: true` boolean on tours. See
 * docs/sprint-2-tour-and-media-architecture.md — this is exactly the type
 * that should have prevented 6 tours ending up featured against an
 * approved 3–5, since the array itself refuses a 6th item.
 */
export const featuredTourCollection = defineType({
  name: 'featuredTourCollection',
  title: 'Experiences featured on the homepage',
  type: 'document',
  // Singleton — the current homepage featured set.
  fields: [
    defineField({
      name: 'items',
      title: 'Which experiences to feature',
      type: 'array',
      validation: (Rule) => Rule.min(3).max(5).error('Choose between 3 and 5 — fewer looks thin, and more stops feeling chosen.'),
      of: [
        {
          type: 'object',
          name: 'featuredItem',
          fields: [
            defineField({name: 'tour', title: 'Experience', type: 'reference', to: [{type: 'tour'}], validation: (Rule) => Rule.required()}),
            defineField({name: 'order', title: 'Position', type: 'number', description: '1 appears first.', validation: (Rule) => Rule.required()}),
            defineField({
              name: 'reasonForFeature',
              title: 'Why this one?',
              type: 'string',
              description: 'A short note to yourself, for example "Balances the set with a craft experience". Nobody else sees it, and it saves you guessing later.',
            }),
            defineField({name: 'startDate', title: 'Show from (optional)', type: 'date'}),
            defineField({name: 'endDate', title: 'Show until (optional)', type: 'date'}),
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
      title: 'Does the set feel balanced?',
      type: 'text',
      description: 'A reminder, not a rule. Between them, do these experiences cover history, food and city life, craft, nature, and a longer trip? A note here is just for you.',
    }),
  ],
})
