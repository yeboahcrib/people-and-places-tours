import {defineField, defineType} from 'sanity'

/**
 * One of the "how you are hosted" cards on the homepage.
 *
 * `proofReview` is the point of this type: each promise is meant to be backed
 * by a real guest saying it happened, rather than asserted on its own.
 */
export const hostingPrinciple = defineType({
  name: 'hostingPrinciple',
  title: 'How you look after guests',
  type: 'document',
  description: 'The cards on the homepage explaining what travelling with People & Places is actually like. Each one is stronger with a real review behind it.',
  fields: [
    defineField({
      name: 'title',
      title: 'Card heading',
      type: 'string',
      description: 'What you promise, in a few words — for example "Your comfort matters".',
      validation: (Rule) => Rule.required().error('The card needs a heading.'),
    }),
    defineField({
      name: 'description',
      title: 'What it means in practice',
      type: 'text',
      rows: 3,
      description: 'One or two sentences. Say what you actually do, not what you value.',
    }),
    defineField({
      name: 'icon',
      title: 'Little picture on the card',
      type: 'string',
      options: {list: [
        {title: 'Map pin — about places', value: 'pin'},
        {title: 'Heart — about care', value: 'heart'},
        {title: 'Person — about your hosts', value: 'user-circle'},
        {title: 'Calendar — about planning', value: 'calendar'},
      ]},
      validation: (Rule) => Rule.required(),
      description: 'Pick the one closest in meaning. These come from the site\'s own set so the cards stay consistent.',
    }),
    defineField({
      name: 'proofReview',
      title: 'A guest review that proves it',
      type: 'reference',
      to: [{type: 'review'}],
      description: 'Optional but worth doing. A real guest saying it happened is far more convincing than the promise on its own.',
    }),
    defineField({
      name: 'order',
      title: 'Position on the homepage',
      type: 'number',
      description: '1 appears first. Up to four cards.',
      validation: (Rule) => Rule.required().min(1).max(4).error('Position must be between 1 and 4.'),
    }),
  ],
  orderings: [{title: 'Position', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', subtitle: 'description', order: 'order'},
    prepare: ({title, subtitle, order}: any) => ({
      title: `${order ? `${order}. ` : ''}${title || 'Untitled'}`,
      subtitle,
    }),
  },
})
