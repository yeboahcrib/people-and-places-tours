import {defineField, defineType} from 'sanity'

export const originStory = defineType({
  name: 'originStory',
  title: 'Origin Story',
  type: 'document',
  // Singleton — referenced from both the homepage founder-story section and the About page, written once.
  fields: [
    defineField({name: 'headline', title: 'Headline', type: 'string'}),
    defineField({name: 'shortVersion', title: 'Short public version', type: 'text'}),
    defineField({name: 'fullVersion', title: 'Full internal/canonical version', type: 'text'}),
    defineField({name: 'media', title: 'Media', type: 'array', of: [{type: 'mediaAsset'}]}),
  ],
})
