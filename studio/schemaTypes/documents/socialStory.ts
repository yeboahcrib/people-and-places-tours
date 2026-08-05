import {defineField, defineType} from 'sanity'

export const socialStory = defineType({
  name: 'socialStory',
  title: 'Social / Editorial Story',
  type: 'document',
  description: 'Real Instagram posts or owned editorial content — never a simulated feed of stock images.',
  fields: [
    defineField({
      name: 'postUrl',
      title: 'Original post URL',
      type: 'url',
      description: 'Link to the actual Instagram post, when the item is a repost rather than owned original content.',
    }),
    defineField({name: 'media', title: 'Media', type: 'mediaAsset'}),
    defineField({name: 'caption', title: 'Caption', type: 'text'}),
    defineField({name: 'context', title: 'Context', type: 'text', description: 'Why this matters, not just what it shows.'}),
    defineField({name: 'publicationState', title: 'Publication state', type: 'string', options: {
      list: [
        {title: 'Draft', value: 'draft'},
        {title: 'Published', value: 'published'},
        {title: 'Archived', value: 'archived'},
      ],
    }, initialValue: 'draft'}),
  ],
  preview: {select: {title: 'caption', media: 'media.image'}},
})
