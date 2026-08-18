import {defineField, defineType} from 'sanity'

/**
 * A homepage section someone can add without a developer.
 *
 * The seven sections in `homepageSection` are the site's narrative spine and
 * each has bespoke markup. This document is the opposite: a small set of
 * layouts that already match the site's design, so a new section inherits the
 * type, colour and spacing rather than inventing its own.
 *
 * Written for someone who is not a developer. The first three questions are
 * what it looks like, where it goes, and whether it is live. Everything after
 * that is content, and the fields shown change with the layout chosen so that
 * nobody is asked for a quote on a section that has no quote in it.
 *
 * Adding a new layout means adding an option to `layout` here AND a renderer
 * in homepage-sections.js. tests/homepage-layouts.mjs fails if the two lists
 * ever drift apart.
 */

const LAYOUTS = [
  {title: 'Photo beside text — a picture on one side, words on the other', value: 'photoBeside'},
  {title: 'Row of cards — two to four boxes side by side', value: 'cards'},
  {title: 'Quote — one large quote on its own', value: 'quote'},
  {title: 'Invitation — a heading and a button or two', value: 'invitation'},
]

const PLACEMENTS = [
  {title: 'At the very top, above everything', value: 'top'},
  {title: 'After the opening hero', value: 'after:hero'},
  {title: 'After the founder story', value: 'after:founderStory'},
  {title: 'After "Ways to experience Ghana"', value: 'after:waysToExperience'},
  {title: 'After "How you are hosted"', value: 'after:howHosted'},
  {title: 'After the reviews', value: 'after:reviewsAndTrust'},
  {title: 'After the planning steps', value: 'after:planningProcess'},
  {title: 'At the very bottom, below everything', value: 'after:finalInvitation'},
]

const showFor = (...layouts: string[]) => ({document}: any) => !layouts.includes(document?.layout)

export const flexibleSection = defineType({
  name: 'flexibleSection',
  title: 'Extra homepage section',
  type: 'document',
  groups: [
    {name: 'setup', title: 'Where and what', default: true},
    {name: 'content', title: 'Content'},
    {name: 'actions', title: 'Buttons'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Name this section',
      type: 'string',
      group: 'setup',
      description: 'Only for your own reference in this list — visitors never see it.',
      validation: (Rule) => Rule.required().error('Give the section a name so you can find it again.'),
    }),
    defineField({
      name: 'layout',
      title: 'What should it look like?',
      type: 'string',
      group: 'setup',
      options: {list: LAYOUTS, layout: 'radio'},
      initialValue: 'photoBeside',
      validation: (Rule) => Rule.required(),
      description: 'Each option already matches the rest of the site. You choose the shape; the fonts, colours and spacing are handled for you.',
    }),
    defineField({
      name: 'placement',
      title: 'Where on the page?',
      type: 'string',
      group: 'setup',
      options: {list: PLACEMENTS},
      initialValue: 'after:reviewsAndTrust',
      validation: (Rule) => Rule.required(),
      description: 'If two extra sections sit in the same place, they appear in the order given below.',
    }),
    defineField({
      name: 'positionWithinPlacement',
      title: 'If more than one section sits here, which comes first?',
      type: 'number',
      group: 'setup',
      initialValue: 1,
      description: 'Lowest number first. Leave at 1 if this is the only one.',
    }),
    defineField({
      name: 'visible',
      title: 'Show this section on the website?',
      type: 'boolean',
      group: 'setup',
      initialValue: false,
      description: 'Off while you write it. Turn it on when you are ready for visitors to see it.',
    }),
    defineField({
      name: 'tone',
      title: 'Background',
      type: 'string',
      group: 'setup',
      options: {
        list: [
          {title: 'Light — black text on white', value: 'light'},
          {title: 'Dark — white text on charcoal', value: 'dark'},
        ],
        layout: 'radio',
      },
      initialValue: 'light',
    }),

    defineField({
      name: 'eyebrow',
      title: 'Small label above the heading',
      type: 'string',
      group: 'content',
      description: 'A few words in capitals, like "OUR STORY". Optional.',
    }),
    defineField({
      name: 'headline',
      title: 'Heading',
      type: 'string',
      group: 'content',
      hidden: showFor('photoBeside', 'cards', 'invitation'),
    }),
    defineField({
      name: 'body',
      title: 'Paragraph',
      type: 'text',
      group: 'content',
      rows: 5,
      hidden: showFor('photoBeside', 'cards', 'invitation'),
      description: 'Leave a blank line between paragraphs to split them.',
    }),
    defineField({
      name: 'image',
      title: 'Photo',
      type: 'mediaAsset',
      group: 'content',
      hidden: showFor('photoBeside'),
      description: 'Remember to set it to "Yes, publish it" — a photo still under review will not appear.',
    }),
    defineField({
      name: 'imageSide',
      title: 'Which side is the photo on?',
      type: 'string',
      group: 'content',
      hidden: showFor('photoBeside'),
      options: {
        list: [
          {title: 'Right of the words', value: 'right'},
          {title: 'Left of the words', value: 'left'},
        ],
        layout: 'radio',
      },
      initialValue: 'right',
    }),
    defineField({
      name: 'cards',
      title: 'Cards',
      type: 'array',
      group: 'content',
      hidden: showFor('cards'),
      validation: (Rule) => Rule.max(4).warning('More than four cards get very narrow on a phone.'),
      of: [
        {
          type: 'object',
          name: 'flexCard',
          fields: [
            defineField({name: 'title', title: 'Card heading', type: 'string', validation: (Rule) => Rule.required()}),
            defineField({name: 'text', title: 'Card text', type: 'text', rows: 3}),
            defineField({name: 'image', title: 'Card photo (optional)', type: 'mediaAsset'}),
            defineField({
              name: 'href',
              title: 'Link this card somewhere (optional)',
              type: 'string',
              description: 'A page on this site, like packages.html, or a full https:// address.',
            }),
          ],
          preview: {select: {title: 'title', subtitle: 'text', media: 'image.image'}},
        },
      ],
    }),
    defineField({
      name: 'quote',
      title: 'The quote',
      type: 'text',
      group: 'content',
      rows: 4,
      hidden: showFor('quote'),
      description: 'Do not add quotation marks — the design adds them.',
    }),
    defineField({
      name: 'attribution',
      title: 'Who said it',
      type: 'string',
      group: 'content',
      hidden: showFor('quote'),
    }),
    defineField({
      name: 'reassurance',
      title: 'Small reassuring line under the buttons',
      type: 'string',
      group: 'content',
      hidden: showFor('invitation'),
      description: 'Something like "No pressure — just a conversation."',
    }),

    defineField({
      name: 'ctas',
      title: 'Buttons',
      type: 'array',
      group: 'actions',
      of: [{type: 'reference', to: [{type: 'cta'}]}],
      validation: (Rule) => Rule.max(2),
      description: 'Up to two. The first is the solid button, the second is outlined.',
    }),
  ],
  orderings: [
    {title: 'Position on the page', name: 'placementAsc', by: [{field: 'placement', direction: 'asc'}, {field: 'positionWithinPlacement', direction: 'asc'}]},
  ],
  preview: {
    select: {title: 'title', layout: 'layout', visible: 'visible', placement: 'placement', media: 'image.image'},
    prepare: ({title, layout, visible, placement, media}: any) => ({
      title: title || 'Untitled section',
      subtitle: `${visible ? 'Live' : 'Hidden'} · ${LAYOUTS.find(l => l.value === layout)?.value || layout || 'no layout'} · ${placement || 'unplaced'}`,
      media,
    }),
  },
})
