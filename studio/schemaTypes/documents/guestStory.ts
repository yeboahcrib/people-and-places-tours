import {defineField, defineType} from 'sanity'

/**
 * A guest's own account of their trip, told at length.
 *
 * Consent matters more here than anywhere else in the schema: heritage and
 * ancestry stories must never be published without confirmed family comfort
 * (Brand Foundation §13, messaging brief §13).
 */
export const guestStory = defineType({
  name: 'guestStory',
  title: 'Guest story',
  type: 'document',
  description: 'A longer account from a guest about their trip. Only ever published with their clear agreement.',
  fields: [
    defineField({
      name: 'guestName',
      title: 'Whose story is it?',
      type: 'string',
      validation: (Rule) => Rule.required().error('A story needs a name.'),
    }),
    defineField({
      name: 'headline',
      title: 'Heading for the story',
      type: 'string',
      description: 'A short line that captures it.',
    }),
    defineField({
      name: 'storyText',
      title: 'The story',
      type: 'text',
      rows: 10,
      description: 'In their words wherever possible. Leave a blank line between paragraphs.',
    }),
    defineField({
      name: 'relatedTour',
      title: 'Which experience was it?',
      type: 'reference',
      to: [{type: 'tour'}],
    }),
    defineField({
      name: 'relatedReview',
      title: 'Their review, if they left one',
      type: 'reference',
      to: [{type: 'review'}],
    }),
    defineField({
      name: 'media',
      title: 'Photos',
      type: 'array',
      of: [{type: 'mediaAsset'}],
      description: 'Only photos they are happy for you to publish.',
    }),
    defineField({
      name: 'trust',
      title: 'Permission & where it came from',
      type: 'trustFields',
      description: 'Take this seriously here. A story about someone tracing their ancestry is personal to their whole family — never publish one without being certain they are comfortable with it.',
    }),
  ],
  preview: {
    select: {title: 'guestName', subtitle: 'headline', media: 'media.0.image'},
    prepare: ({title, subtitle, media}: any) => ({
      title: title || 'Unnamed guest',
      subtitle: subtitle || 'No heading yet',
      media,
    }),
  },
})
