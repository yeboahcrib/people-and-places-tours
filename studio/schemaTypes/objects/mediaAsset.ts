import {defineField, defineType} from 'sanity'

/**
 * Media model — see docs/sprint-2-tour-and-media-architecture.md Part 2.
 * Used wherever a tour, section, or story needs a photo/video, instead of
 * embedding a raw image URL the way tours.js does today.
 *
 * Sanity's `hotspot: true` on the image field gives editors a visual focal
 * point picker — this satisfies the "focal point" requirement natively,
 * and every derived crop (thumbnail, hero, card) respects it automatically.
 */
export const mediaAsset = defineType({
  name: 'mediaAsset',
  title: 'Media',
  type: 'object',
  fields: [
    defineField({
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {hotspot: true},
    }),
    defineField({
      name: 'video',
      title: 'Video (external URL)',
      type: 'url',
      description: 'For video, link an external host for now rather than uploading large files — keeps the project on Sanity\'s free tier.',
    }),
    defineField({
      name: 'altText',
      title: 'Alt text',
      type: 'string',
      validation: (Rule) => Rule.required().error('Alt text is required before this can publish.'),
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'string',
    }),
    defineField({
      name: 'orientation',
      title: 'Orientation',
      type: 'string',
      options: {
        list: [
          {title: 'Landscape', value: 'landscape'},
          {title: 'Portrait', value: 'portrait'},
          {title: 'Square', value: 'square'},
        ],
      },
    }),
    defineField({
      name: 'credit',
      title: 'Credit',
      type: 'string',
      description: 'Photographer/owner, if applicable.',
    }),
    defineField({
      name: 'owner',
      title: 'Owner',
      type: 'string',
    }),
    defineField({
      name: 'consent',
      title: 'Consent',
      type: 'string',
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Requested', value: 'requested'},
          {title: 'Granted', value: 'granted'},
          {title: 'Not required (no identifiable people)', value: 'notRequired'},
        ],
        layout: 'radio',
      },
      initialValue: 'none',
      description: 'Critical for anything showing an identifiable guest.',
    }),
    defineField({
      name: 'relatedPeople',
      title: 'Related people',
      type: 'array',
      of: [{type: 'string'}],
      description: 'e.g. "Isaac Yeboah", "Cynthia Muldrow\'s family".',
    }),
    defineField({
      name: 'relatedTour',
      title: 'Related tour',
      type: 'reference',
      to: [{type: 'tour'}],
    }),
    defineField({
      name: 'relatedStory',
      title: 'Related guest story',
      type: 'reference',
      to: [{type: 'guestStory'}],
    }),
    defineField({
      name: 'placeholderState',
      title: 'Placeholder state',
      type: 'string',
      options: {
        list: [
          {title: 'Placeholder (development only)', value: 'placeholder'},
          {title: 'Approved final media', value: 'approved'},
        ],
        layout: 'radio',
      },
      initialValue: 'placeholder',
      description: 'A placeholder must never be presented as if it were a real named person — Brand Foundation §18.',
    }),
    defineField({
      name: 'publicApprovalState',
      title: 'Public approval state',
      type: 'string',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Approved', value: 'approved'},
          {title: 'Rejected', value: 'rejected'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
    }),
  ],
  preview: {
    select: {
      title: 'altText',
      media: 'image',
      subtitle: 'placeholderState',
    },
  },
})
