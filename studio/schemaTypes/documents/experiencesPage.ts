import {defineField, defineType} from 'sanity'

/**
 * The two photographs on the experiences page that are not a tour's own.
 *
 * They were plain <img> tags in packages.html with nothing behind them, so
 * they could only be changed by editing code — the same gap that made every
 * tour card invisible in the Studio until they were migrated.
 */
export const experiencesPage = defineType({
  name: 'experiencesPage',
  title: 'Experiences page photos',
  type: 'document',
  fields: [
    defineField({
      name: 'heroPhoto',
      title: 'Photo behind the page title',
      type: 'mediaAsset',
      description: 'The wide photograph at the top of the experiences page. It sits behind text, so something with a calm area on the left reads best.',
    }),
    defineField({
      name: 'addOnPhoto',
      title: 'Photo beside "Things You Can Add On"',
      type: 'mediaAsset',
      description: 'Shown next to the list of add-on experiences. A photograph of one of the things in that list works better than a general shot.',
    }),
  ],
  preview: {
    select: {media: 'heroPhoto.image'},
    prepare: ({media}: any) => ({title: 'Experiences page photos', media}),
  },
})
