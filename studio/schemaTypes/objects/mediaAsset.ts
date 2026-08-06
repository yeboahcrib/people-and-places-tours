import {defineField, defineType} from 'sanity'

/**
 * A photo, plus the few facts the website needs about it.
 *
 * Rewritten for people who are not developers. Adding a photo used to present
 * thirteen fields, including two radio groups called "Placeholder state" and
 * "Public approval state" that between them decided whether the image was
 * allowed on the site. Almost nobody could be expected to guess that.
 *
 * Now the first thing you see is the photo, a description of it, and one
 * switch that says whether it should appear on the website. Everything else —
 * crediting, permission, which tour it belongs to — sits in collapsed groups
 * underneath, because it matters occasionally rather than every time.
 *
 * Nothing was removed. The website still reads exactly the same fields, so
 * this is a change of presentation rather than of data. Drag the circle on
 * the image to choose the part that must stay visible when it is cropped.
 */
export const mediaAsset = defineType({
  name: 'mediaAsset',
  title: 'Photo',
  type: 'object',
  groups: [
    {name: 'photo', title: 'Photo', default: true},
    {name: 'rights', title: 'Credit & permission'},
    {name: 'links', title: 'Related to'},
  ],
  fields: [
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'image',
      group: 'photo',
      options: {hotspot: true},
      description: 'After uploading, drag the circle over the most important part so it stays visible wherever the photo is cropped.',
    }),
    defineField({
      name: 'altText',
      title: 'Describe this photo',
      type: 'string',
      group: 'photo',
      description: 'One short sentence describing what is happening, for visitors using a screen reader and for Google. For example: "Kojo showing guests around Jamestown at sunset."',
      validation: (Rule) => Rule.required().error('A description is needed before this photo can be used.'),
    }),
    defineField({
      name: 'publicApprovalState',
      title: 'Show this photo on the website?',
      type: 'string',
      group: 'photo',
      options: {
        list: [
          {title: 'Not yet — still reviewing', value: 'draft'},
          {title: 'Yes, publish it', value: 'approved'},
          {title: 'No, do not use this one', value: 'rejected'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
      description: 'Photos only appear on the live website once this says yes.',
    }),
    defineField({
      name: 'caption',
      title: 'Caption (optional)',
      type: 'string',
      group: 'photo',
      description: 'Shown under the photo in some places. Leave blank if you do not want one.',
    }),

    defineField({
      name: 'credit',
      title: 'Who took this photo?',
      type: 'string',
      group: 'rights',
      description: 'The photographer, if it should be credited.',
    }),
    defineField({
      name: 'owner',
      title: 'Who owns it?',
      type: 'string',
      group: 'rights',
      description: 'Leave blank if it is ours.',
    }),
    defineField({
      name: 'consent',
      title: 'Do we have permission from the people in it?',
      type: 'string',
      group: 'rights',
      options: {
        list: [
          {title: 'Nobody identifiable is in this photo', value: 'notRequired'},
          {title: 'Yes, they agreed', value: 'granted'},
          {title: 'Asked, waiting to hear back', value: 'requested'},
          {title: 'Not asked yet', value: 'none'},
        ],
        layout: 'radio',
      },
      initialValue: 'notRequired',
      description: 'Only matters when a guest or community member can be recognised.',
    }),

    defineField({
      name: 'relatedTour',
      title: 'Which experience is this from?',
      type: 'reference',
      to: [{type: 'tour'}],
      group: 'links',
    }),
    defineField({
      name: 'relatedPeople',
      title: 'Who is in it?',
      type: 'array',
      of: [{type: 'string'}],
      group: 'links',
      description: 'Names, if you want to keep a record.',
    }),
    defineField({
      name: 'relatedStory',
      title: 'Related guest story',
      type: 'reference',
      to: [{type: 'guestStory'}],
      group: 'links',
    }),
    defineField({
      name: 'video',
      title: 'Video link instead of a photo',
      type: 'url',
      group: 'links',
      description: 'Paste a link from YouTube or Vimeo. Videos are linked rather than uploaded, to keep the site fast.',
    }),

    // Kept because the website checks it, and because it is the guard that
    // stops a stock stand-in being published as though it were a real guest or
    // host. It defaults to the right answer for a genuine photograph, so an
    // editor uploading their own work never has to think about it.
    defineField({
      name: 'placeholderState',
      title: 'Is this a real photograph?',
      type: 'string',
      group: 'rights',
      options: {
        list: [
          {title: 'Yes, this is our own photo', value: 'approved'},
          {title: 'No, it is a temporary stand-in', value: 'placeholder'},
        ],
        layout: 'radio',
      },
      initialValue: 'approved',
      description: 'A stand-in image must never be presented as a real guest, host or partner.',
    }),

    // Removed from the editing form: orientation is visible from the photo
    // itself, and nothing on the website reads it.
  ],
  preview: {
    select: {title: 'altText', media: 'image', subtitle: 'publicApprovalState'},
    prepare: ({title, media, subtitle}: any) => ({
      title: title || 'Untitled photo',
      subtitle: subtitle === 'approved' ? 'On the website' : subtitle === 'rejected' ? 'Not used' : 'Not published yet',
      media,
    }),
  },
})
