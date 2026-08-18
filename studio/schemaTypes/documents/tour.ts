import {defineField, defineType} from 'sanity'

/**
 * An experience — see docs/sprint-2-tour-and-media-architecture.md Part 1.
 *
 * Deliberately does NOT store a deposit/payment rule per tour. Payment
 * terms are derived from `offerType` against the one universal policy
 * (docs/sprint-1-policy-payment-register.md): day tours = full payment,
 * 48h cancellation window; tailored/custom = 30% deposit, balance 30 days
 * out, 72h hold. Storing it per-tour is exactly how the original Just Go
 * Ghana $400-vs-30% conflict happened — don't reintroduce that risk here.
 *
 * Field titles and descriptions here are written for whoever runs the
 * business, not for a developer. The field `name` values are what the website
 * reads, so they must not be renamed — only the labels around them.
 */
export const tour = defineType({
  name: 'tour',
  title: 'Experience',
  type: 'document',
  groups: [
    {name: 'catalogue', title: 'The basics', default: true},
    {name: 'pricing', title: 'Price'},
    {name: 'media', title: 'Photos & story'},
    {name: 'search', title: 'Finding it on the site'},
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Name of this experience',
      type: 'string',
      group: 'catalogue',
      description: 'What visitors see, for example "Cape Coast & Elmina Castles".',
      validation: (Rule) => Rule.required().error('Every experience needs a name.'),
    }),
    defineField({
      name: 'slug',
      title: 'Web address',
      type: 'slug',
      options: {source: 'title'},
      group: 'catalogue',
      description: 'Click "Generate" to make this from the name. It becomes the page address, so avoid changing it once the page is live — old links stop working.',
      validation: (Rule) => Rule.required().error('Click Generate to create the web address.'),
    }),
    defineField({
      name: 'offerType',
      title: 'What kind of trip is this?',
      type: 'string',
      group: 'catalogue',
      options: {
        list: [
          {title: 'A single day out', value: 'day'},
          {title: 'Several days, planned around the guest', value: 'tailoredMultiDay'},
          {title: 'Fully custom', value: 'custom'},
        ],
        layout: 'radio',
      },
      description: 'This also decides the payment terms shown to the guest — a day out is paid in full, longer trips take a 30% deposit. Do not write payment terms anywhere else.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'active',
      title: 'Show this experience on the website?',
      type: 'boolean',
      group: 'catalogue',
      initialValue: true,
      description: 'Turn off to take it down without deleting it — useful for something seasonal.',
    }),
    defineField({
      name: 'duration',
      title: 'How long does it take?',
      type: 'string',
      group: 'catalogue',
      description: 'In plain words, for example "1 Day" or "5 Days".',
      validation: (Rule) => Rule.required().error('Guests need to know how long it takes.'),
    }),
    defineField({
      name: 'locations',
      title: 'Places visited',
      type: 'array',
      of: [{type: 'string'}],
      group: 'catalogue',
      description: 'One place per line — Cape Coast, Elmina, and so on.',
    }),
    defineField({
      name: 'startingPoint',
      title: 'Where does it start?',
      type: 'string',
      group: 'catalogue',
      initialValue: 'Pickup and drop-off from Accra or your hotel, unless a different arrangement is requested.',
      description: 'The standard arrangement is already filled in. Only change it if this particular trip genuinely works differently.',
    }),
    defineField({
      name: 'groupSizeMin',
      title: 'Smallest group you will take',
      type: 'number',
      group: 'catalogue',
      initialValue: 1,
      description: 'Leave at 1. Every experience is available to someone travelling alone, and raising this quietly turns solo travellers away.',
    }),
    defineField({
      name: 'groupSizeMax',
      title: 'Largest group you can take',
      type: 'number',
      group: 'catalogue',
      description: 'Usually set by the vehicle, the equipment, or the space you are working in.',
    }),
    defineField({
      name: 'groupSizeNote',
      title: 'Anything else about group size?',
      type: 'string',
      group: 'catalogue',
      description: 'Optional. For example: "Larger family or reunion groups by arrangement, up to 30."',
    }),
    defineField({
      name: 'included',
      title: 'What is included',
      type: 'array',
      of: [{type: 'string'}],
      group: 'catalogue',
      description: 'One item per line. Be specific — "Lunch at a local chop bar" tells a guest more than "Meals".',
    }),
    defineField({
      name: 'excluded',
      title: 'What is not included',
      type: 'array',
      of: [{type: 'string'}],
      group: 'catalogue',
      description: 'One item per line. Saying this clearly prevents awkward conversations on the day.',
    }),
    defineField({
      name: 'accessibilityNotes',
      title: 'Who is this suitable for?',
      type: 'text',
      group: 'catalogue',
      rows: 3,
      description: 'Walking involved, steps, heat, age suitability — anything a guest should know before booking.',
    }),
    defineField({
      name: 'availabilityNote',
      title: 'When can people book it?',
      type: 'string',
      group: 'catalogue',
      initialValue: 'Available any day with advance notice.',
    }),

    defineField({
      name: 'price',
      title: 'Price',
      type: 'number',
      group: 'pricing',
      description: 'Numbers only — no currency symbol.',
      validation: (Rule) => Rule.required().min(0).error('Every experience needs a price.'),
    }),
    defineField({
      name: 'currency',
      title: 'Currency',
      type: 'string',
      group: 'pricing',
      initialValue: 'USD',
    }),
    defineField({
      name: 'priceUnit',
      title: 'That price is per…',
      type: 'string',
      group: 'pricing',
      initialValue: 'Per Person',
      description: 'Usually "Per Person". Change it if the price covers a whole group.',
    }),

    defineField({
      name: 'description',
      title: 'Short description',
      type: 'text',
      group: 'media',
      rows: 3,
      description: 'Two or three sentences. This is what appears on the cards around the site, so make it the reason someone would choose this one.',
    }),
    defineField({
      name: 'culturalContext',
      title: 'The story behind it',
      type: 'text',
      group: 'media',
      rows: 6,
      description: 'The longer piece for the experience\'s own page — the history, the people, why it matters. This is where People & Places sounds different from a listings site.',
    }),
    defineField({
      name: 'media',
      title: 'Photos',
      type: 'array',
      of: [{type: 'mediaAsset'}],
      group: 'media',
      description: 'The first photo is the main one. Remember each photo has to be set to "Yes, publish it" before it appears.',
    }),
    defineField({
      name: 'relatedGuestStory',
      title: 'A guest story about this experience',
      type: 'reference',
      to: [{type: 'guestStory'}],
      group: 'media',
      description: 'Optional. Links a real guest\'s account to this page.',
    }),

    defineField({
      name: 'categories',
      title: 'Which filters should this show under?',
      type: 'array',
      of: [{type: 'string'}],
      group: 'search',
      description: 'The buttons visitors use to narrow the list — heritage, food, nature, adventure, craft, multi-day.',
    }),
    defineField({
      name: 'vibes',
      title: 'Words describing the feel of it',
      type: 'array',
      of: [{type: 'string'}],
      group: 'search',
      description: 'Optional, for search only. Things like "reflective", "lively", "outdoors".',
    }),
    defineField({
      name: 'destination',
      title: 'Region',
      type: 'string',
      group: 'search',
      description: 'The broad area, for example "Central Region" — used to group experiences.',
    }),
    defineField({
      name: 'commandSummary',
      title: 'One-line summary for site search',
      type: 'string',
      group: 'search',
      description: 'A single line shown when someone searches the site. Optional — the short description is used if this is blank.',
    }),
  ],
  preview: {
    select: {title: 'title', offerType: 'offerType', active: 'active', duration: 'duration', media: 'media.0.image'},
    prepare: ({title, offerType, active, duration, media}: any) => ({
      title: title || 'Untitled experience',
      subtitle: `${active === false ? 'Hidden' : 'Live'}${duration ? ` · ${duration}` : ''}${
        offerType === 'day' ? ' · Day out' : offerType === 'tailoredMultiDay' ? ' · Multi-day' : offerType === 'custom' ? ' · Custom' : ''
      }`,
      media,
    }),
  },
})
