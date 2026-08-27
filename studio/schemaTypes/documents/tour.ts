import {defineArrayMember, defineField, defineType} from 'sanity'

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
    {name: 'page', title: "What's on this tour's page"},
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
      description: 'This also decides the payment terms shown to the guest — a day out is paid in full at booking, longer trips are secured with $400 per person. Do not write payment terms anywhere else.',
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
      name: 'priceOptions',
      title: 'Other ways to book this',
      type: 'array',
      group: 'pricing',
      description: 'Only for a real alternative at a different price — Kumasi by road or by domestic flight, Cape Coast with the naming ceremony added. Leave empty when there is only one price.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'priceOption',
          fields: [
            defineField({name: 'label', title: 'What is different about it', type: 'string', description: 'For example "With a domestic flight" or "With the naming ceremony".', validation: (Rule) => Rule.required()}),
            defineField({name: 'price', title: 'Price per person', type: 'number', validation: (Rule) => Rule.required().positive()}),
          ],
          preview: {select: {title: 'label', subtitle: 'price'}},
        }),
      ],
    }),
    defineField({
      name: 'smallGroupSupplement',
      title: 'Extra per person for one or two travellers',
      type: 'number',
      group: 'pricing',
      description: 'The site already tells everyone that prices assume three travellers and that smaller groups pay $20–30 more. Put the figure for this tour here so it can be stated exactly rather than as a range.',
      validation: (Rule) => Rule.min(0),
    }),
    defineField({
      name: 'highlights',
      title: 'What people remember',
      type: 'array',
      group: 'page',
      description: 'Five or so short lines, each one thing a guest actually sees or does. Not sales copy — the drumming lesson, the last bath at Assin Manso, the coconut cut in front of you.',
      of: [{type: 'string'}],
      validation: (Rule) => Rule.max(8),
    }),
    defineField({
      name: 'heroWatermark',
      title: 'Word behind the title',
      type: 'string',
      group: 'page',
      description: 'The large faded word set behind the tour name at the top of its page — usually the place, in capitals. "ADA FOAH", "CAPE COAST".',
    }),
    defineField({
      name: 'pageHeadline',
      title: 'Headline on the tour page',
      type: 'string',
      group: 'page',
      description: 'The line that opens the page, under "Tour Overview". This is the sentence that sells the day — "Walk the Door of No Return." It is not the tour name.',
    }),
    defineField({
      name: 'pageIntro',
      title: 'Opening paragraph on the tour page',
      type: 'text',
      rows: 5,
      group: 'page',
      description: 'Longer than the short line used on the catalogue card. A paragraph that tells someone what the day is.',
    }),
    defineField({
      name: 'funFacts',
      title: 'Good to know',
      type: 'array',
      group: 'page',
      description: 'Two or three facts a guest would not know and would enjoy being told — the year a castle was built, why a market matters. Shown as a short list on the tour page.',
      of: [{type: 'string'}],
      validation: (Rule) => Rule.max(5),
    }),
    defineField({
      name: 'faqs',
      title: 'Questions people ask about this tour',
      type: 'array',
      group: 'page',
      description: 'Only questions specific to this tour. Visas, currency and what to pack are answered once on the Travelling to Ghana page — do not repeat them here.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'tourFaq',
          fields: [
            defineField({name: 'question', title: 'The question', type: 'string', validation: (Rule) => Rule.required()}),
            defineField({name: 'answer', title: 'Your answer', type: 'text', rows: 4, validation: (Rule) => Rule.required()}),
          ],
          preview: {select: {title: 'question', subtitle: 'answer'}},
        }),
      ],
    }),
    defineField({
      name: 'itinerary',
      title: 'Day by day',
      type: 'array',
      group: 'page',
      // A single day out has no day-by-day, so it is never asked for one.
      hidden: ({document}: any) => document?.offerType === 'day',
      description: 'One entry per day, in order. Only for trips that run over more than one day.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'itineraryDay',
          fields: [
            defineField({name: 'day', title: 'Day number', type: 'number', validation: (Rule) => Rule.required().integer().positive()}),
            defineField({name: 'title', title: 'What happens that day', type: 'string', description: 'Short, like "Ancestral trip to Cape Coast".', validation: (Rule) => Rule.required()}),
            defineField({name: 'description', title: 'The day in a paragraph or two', type: 'text', rows: 6, validation: (Rule) => Rule.required()}),
            defineField({
              name: 'meals',
              title: 'Meals included that day',
              type: 'array',
              of: [{type: 'string'}],
              options: {list: [
                {title: 'Breakfast', value: 'Breakfast'},
                {title: 'Lunch', value: 'Lunch'},
                {title: 'Dinner', value: 'Dinner'},
              ]},
            }),
          ],
          preview: {select: {title: 'title', subtitle: 'day'}},
        }),
      ],
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
    // Three jobs, three fields. The first photo in one list used to become both
    // the card and the page cover, and nothing said so — an editor could not
    // tell which picture went where, and one photograph was made to do two jobs
    // that want opposite shapes: a card is nearly square and wants a tight
    // subject, a cover is very wide and needs a calm area for the headline.
    defineField({
      name: 'cardPhoto',
      title: 'Photo for the card',
      type: 'mediaAsset',
      group: 'media',
      description: 'The picture people see in the experiences list before they click. Nearly square, so a close subject works best. Remember to set it to "Yes, publish it".',
    }),
    defineField({
      name: 'coverPhoto',
      title: 'Photo across the top of this page',
      type: 'mediaAsset',
      group: 'media',
      description: 'The wide band behind this experience\'s title. Very wide, and the title sits on the left, so something with a calmer left side reads best. Leave it empty and the card photo is used.',
    }),
    defineField({
      name: 'media',
      title: 'More photos from this experience',
      type: 'array',
      of: [{type: 'mediaAsset'}],
      group: 'media',
      description: 'Photographs from the experience itself, shown together further down the page. Each one has to be set to "Yes, publish it" before it appears.',
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
