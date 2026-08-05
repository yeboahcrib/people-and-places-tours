import {defineField, defineType} from 'sanity'

export const cta = defineType({
  name: 'cta',
  title: 'Call to Action',
  type: 'document',
  description: 'Centralized so the approved CTA hierarchy (messaging brief §18/§23) is enforced consistently rather than copy-pasted per page.',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'destination', title: 'Destination (URL or path)', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'tier',
      title: 'Tier',
      type: 'string',
      options: {
        list: [
          {title: 'Explore', value: 'explore'},
          {title: 'Learn', value: 'learn'},
          {title: 'Converse', value: 'converse'},
          {title: 'Inspect', value: 'inspect'},
          {title: 'Confirm', value: 'confirm'},
          {title: 'Book (final transactional step only)', value: 'book'},
        ],
      },
      description: '"Book now"-style CTAs should be rare and only at the final transactional step — see messaging brief §18.',
    }),
    defineField({name: 'external', title: 'Opens externally', type: 'boolean', initialValue: false}),
  ],
  preview: {select: {title: 'label', subtitle: 'tier'}},
})
