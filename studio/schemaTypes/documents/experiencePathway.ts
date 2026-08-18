import {defineField, defineType} from 'sanity'

/**
 * One of the "ways to experience Ghana" cards on the homepage.
 *
 * These are editorial groupings, not a rigid taxonomy — a visitor picks the
 * one that sounds like the trip they want, and it opens the catalogue filtered
 * to match. Labels are written for whoever runs the business; the field `name`
 * values are what the website reads and must not be renamed.
 */
export const experiencePathway = defineType({
  name: 'experiencePathway',
  title: 'Way to experience Ghana',
  type: 'document',
  description: 'The image cards on the homepage asking "what pulls you in?". Each one opens the experience list filtered to match.',
  fields: [
    defineField({
      name: 'title',
      title: 'Card heading',
      type: 'string',
      description: 'A few words, for example "History & Memory".',
      validation: (Rule) => Rule.required().error('The card needs a heading.'),
    }),
    defineField({
      name: 'description',
      title: 'A line or two underneath',
      type: 'text',
      rows: 3,
      description: 'Written to draw someone in rather than to describe a category.',
    }),
    defineField({
      name: 'image',
      title: 'Photo for the card',
      type: 'mediaAsset',
      description: 'These cards are mostly photograph, so this matters more than the words. It must be set to "Yes, publish it" before the card appears.',
    }),
    defineField({
      name: 'filterKey',
      title: 'Which experiences should it show?',
      type: 'string',
      options: {list: [
        {title: 'History & heritage', value: 'heritage'},
        {title: 'Food', value: 'food'},
        {title: 'Nature', value: 'nature'},
        {title: 'Adventure', value: 'adventure'},
        {title: 'Craft', value: 'craft'},
        {title: 'Multi-day trips', value: 'multi-day'},
      ]},
      validation: (Rule) => Rule.required(),
      description: 'Clicking the card opens the experience list already filtered to this.',
    }),
    defineField({
      name: 'relatedTours',
      title: 'Particular experiences to link',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'tour'}]}],
      description: 'Optional.',
    }),
    defineField({
      name: 'order',
      title: 'Position on the homepage',
      type: 'number',
      description: '1 appears first. Up to six cards.',
      validation: (Rule) => Rule.required().min(1).max(6).error('Position must be between 1 and 6.'),
    }),
  ],
  orderings: [{title: 'Position', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', subtitle: 'description', order: 'order', media: 'image.image'},
    prepare: ({title, subtitle, order, media}: any) => ({
      title: `${order ? `${order}. ` : ''}${title || 'Untitled'}`,
      subtitle,
      media,
    }),
  },
})
