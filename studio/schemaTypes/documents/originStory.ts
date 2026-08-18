import {defineField, defineType} from 'sanity'

/**
 * How People & Places began.
 *
 * Singleton — referenced from both the homepage founder-story section and the
 * About page, so it is written once and reused rather than drifting apart.
 */
export const originStory = defineType({
  name: 'originStory',
  title: 'Our story',
  type: 'document',
  description: 'How People & Places began. Written once here and used on both the homepage and the About page.',
  fields: [
    defineField({
      name: 'headline',
      title: 'Heading',
      type: 'string',
      description: 'A few words, for example "Two friends, one country worth showing".',
    }),
    defineField({
      name: 'shortVersion',
      title: 'Short version',
      type: 'text',
      rows: 5,
      description: 'A paragraph or two, for the homepage. This is the one most visitors read, so it matters most.',
    }),
    defineField({
      name: 'fullVersion',
      title: 'Full version',
      type: 'text',
      rows: 12,
      description: 'The longer telling, for the About page. Leave a blank line between paragraphs.',
    }),
    defineField({
      name: 'media',
      title: 'Photos',
      type: 'array',
      of: [{type: 'mediaAsset'}],
      description: 'Each photo has to be set to "Yes, publish it" before it appears.',
    }),
  ],
  preview: {
    select: {title: 'headline', media: 'media.0.image'},
    prepare: ({title, media}: any) => ({title: title || 'Our story', media}),
  },
})
