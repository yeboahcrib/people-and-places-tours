import {defineField, defineType} from 'sanity'

export const guestStory = defineType({
  name: 'guestStory',
  title: 'Guest Story',
  type: 'document',
  fields: [
    defineField({name: 'guestName', title: 'Guest name', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'headline', title: 'Headline', type: 'string'}),
    defineField({name: 'storyText', title: 'Story text', type: 'text'}),
    defineField({name: 'relatedTour', title: 'Related tour', type: 'reference', to: [{type: 'tour'}]}),
    defineField({name: 'relatedReview', title: 'Related review', type: 'reference', to: [{type: 'review'}]}),
    defineField({name: 'media', title: 'Media', type: 'array', of: [{type: 'mediaAsset'}]}),
    defineField({
      name: 'trust',
      title: 'Trust & provenance',
      type: 'trustFields',
      description: 'Consent is especially important here — heritage/ancestry stories must never be published without confirmed family comfort (Brand Foundation §13, messaging brief §13).',
    }),
  ],
  preview: {select: {title: 'guestName', subtitle: 'headline'}},
})
