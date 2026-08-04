import {defineField, defineType} from 'sanity'

export const homepageSection = defineType({
  name: 'homepageSection',
  title: 'Homepage Section',
  type: 'document',
  fields: [
    defineField({
      name: 'sectionKey',
      title: 'Section',
      type: 'string',
      options: {
        list: [
          {title: '1. Hero — the invitation', value: 'hero'},
          {title: '2. Founder story', value: 'founderStory'},
          {title: '3. Ways to experience Ghana', value: 'waysToExperience'},
          {title: '4. Available tours', value: 'availableTours'},
          {title: '5. How you are hosted', value: 'howHosted'},
          {title: '6. Reviews and trust', value: 'reviewsAndTrust'},
          {title: '7. Planning process', value: 'planningProcess'},
          {title: '8. Final invitation', value: 'finalInvitation'},
        ],
      },
      validation: (Rule) => Rule.required(),
      description: 'The approved 8-section narrative order — this field constrains content to that order rather than an arbitrary array.',
    }),
    defineField({name: 'order', title: 'Order', type: 'number', validation: (Rule) => Rule.required()}),
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({name: 'headline', title: 'Headline', type: 'string'}),
    defineField({name: 'body', title: 'Body copy', type: 'text'}),
    defineField({name: 'media', title: 'Media', type: 'array', of: [{type: 'mediaAsset'}]}),
    defineField({
      name: 'ctas',
      title: 'Calls to action',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'cta'}]}],
    }),
  ],
  orderings: [
    {
      title: 'Section order',
      name: 'orderAsc',
      by: [{field: 'order', direction: 'asc'}],
    },
  ],
  preview: {
    select: {title: 'headline', subtitle: 'sectionKey'},
  },
})
