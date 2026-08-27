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
          {title: '4. How you are hosted', value: 'howHosted'},
          {title: '5. Photographs from our trips', value: 'tripMoments'},
          {title: '6. Reviews and trust', value: 'reviewsAndTrust'},
          {title: '7. Planning process', value: 'planningProcess'},
          {title: '8. Final invitation', value: 'finalInvitation'},
        ],
      },
      validation: (Rule) => Rule.required(),
      description: 'The approved 7-section narrative order — this field constrains content to that order rather than an arbitrary array.',
    }),
    defineField({name: 'order', title: 'Order', type: 'number', validation: (Rule) => Rule.required()}),
    defineField({name: 'eyebrow', title: 'Eyebrow', type: 'string'}),
    defineField({name: 'headline', title: 'Headline', type: 'string'}),
    defineField({name: 'body', title: 'Body copy', type: 'text'}),
    defineField({
      name: 'reassurance',
      title: 'Reassurance line',
      type: 'string',
      hidden: ({document}) => document?.sectionKey !== 'finalInvitation',
      description: 'A short, low-pressure message shown beneath the final actions.',
    }),
    defineField({
      name: 'trustMessage',
      title: 'Local team trust message',
      type: 'string',
      hidden: ({document}) => document?.sectionKey !== 'finalInvitation',
      description: 'Confirms who the traveler will speak with after taking action.',
    }),
    defineField({name: 'media', title: 'Media', type: 'array', of: [{type: 'mediaAsset'}]}),
    defineField({
      name: 'founders',
      title: 'Founder cards',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'founderProfile'}]}],
      hidden: ({document}) => document?.sectionKey !== 'founderStory',
      validation: (Rule) => Rule.max(2),
      description: 'Choose the two founder profiles shown on the homepage. Their approved photos, names, roles, and real quotes are read from those profiles.',
    }),
    defineField({
      name: 'pathways',
      title: 'Experience cards',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'experiencePathway'}]}],
      hidden: ({document}) => document?.sectionKey !== 'waysToExperience',
      validation: (Rule) => Rule.max(6),
      description: 'The image-led experience choices shown in “What Pulls You In?”. Edit each referenced pathway to replace its photo, title, description, filter, or order.',
    }),
    defineField({
      name: 'hostingPrinciples',
      title: 'Care principles',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'hostingPrinciple'}]}],
      hidden: ({document}) => document?.sectionKey !== 'howHosted',
      validation: (Rule) => Rule.max(4),
      description: 'The four benefit-led care cards. Edit each principle to change its title, copy, icon, order, or linked proof review.',
    }),
    defineField({
      name: 'featuredReviews',
      title: 'Featured traveler reviews',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'review'}]}],
      hidden: ({document}) => document?.sectionKey !== 'reviewsAndTrust',
      // Was max(8) while the published document already carried ten, which the
      // carousel renders perfectly well. The rule was never enforced against the
      // existing content, so it only surfaced when an editor next tried to save
      // — the document could not be published at all, and the reason was a cap
      // that reality had already passed. Twelve leaves room without going
      // unbounded; a marquee of twenty-odd would be its own problem.
      validation: (Rule) => Rule.max(12),
      description: 'Select and order the verified reviews shown in the homepage carousel. Traveler country and approved media are read from each review.',
    }),
    defineField({
      name: 'planningSteps',
      title: 'Journey planning steps',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'planningStep'}]}],
      hidden: ({document}) => document?.sectionKey !== 'planningProcess',
      validation: (Rule) => Rule.max(3),
      description: 'Select the three concise steps shown near the end of the homepage. They are ordered by step number.',
    }),
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
