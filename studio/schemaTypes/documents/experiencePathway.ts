import {defineField, defineType} from 'sanity'

export const experiencePathway = defineType({
  name: 'experiencePathway',
  title: 'Experience Pathway',
  type: 'document',
  description: 'The "ways to experience Ghana" categories — editorial groupings, not a rigid tour taxonomy.',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'description', title: 'Description', type: 'text'}),
    defineField({name: 'image', title: 'Representative image', type: 'mediaAsset'}),
    defineField({
      name: 'filterKey',
      title: 'Catalog experience filter',
      type: 'string',
      options: {list: [
        {title: 'History & heritage', value: 'heritage'},
        {title: 'Food', value: 'food'},
        {title: 'Nature', value: 'nature'},
        {title: 'Adventure', value: 'adventure'},
        {title: 'Craft', value: 'craft'},
        {title: 'Multi-day', value: 'multi-day'},
      ]},
      validation: (Rule) => Rule.required(),
      description: 'Controls which catalog view opens when a visitor selects this card.',
    }),
    defineField({
      name: 'relatedTours',
      title: 'Related tours',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tour'}]}],
    }),
    defineField({name: 'order', title: 'Order', type: 'number', validation: (Rule) => Rule.required().min(1).max(6)}),
  ],
  orderings: [{title: 'Order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'title', media: 'image.image'}},
})
