import {defineField, defineType} from 'sanity'

/**
 * Tour — see docs/sprint-2-tour-and-media-architecture.md Part 1.
 *
 * Deliberately does NOT store a deposit/payment rule per tour. Payment
 * terms are derived from `offerType` against the one universal policy
 * (docs/sprint-1-policy-payment-register.md): day tours = full payment,
 * 48h cancellation window; tailored/custom = 30% deposit, balance 30 days
 * out, 72h hold. Storing it per-tour is exactly how the original Just Go
 * Ghana $400-vs-30% conflict happened — don't reintroduce that risk here.
 */
export const tour = defineType({
  name: 'tour',
  title: 'Tour',
  type: 'document',
  groups: [
    {name: 'catalogue', title: 'Catalogue content', default: true},
    {name: 'pricing', title: 'Pricing'},
    {name: 'media', title: 'Media & story'},
    {name: 'search', title: 'Search & filters'},
  ],
  fields: [
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'title'}, group: 'catalogue', validation: (Rule) => Rule.required()}),
    defineField({name: 'title', title: 'Public title', type: 'string', group: 'catalogue', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'offerType',
      title: 'Offer type',
      type: 'string',
      group: 'catalogue',
      options: {
        list: [
          {title: 'Day tour', value: 'day'},
          {title: 'Tailored multi-day', value: 'tailoredMultiDay'},
          {title: 'Custom', value: 'custom'},
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      group: 'catalogue',
      initialValue: true,
      description: 'All 15 current tours confirmed active 2026-07-25.',
    }),
    defineField({name: 'duration', title: 'Duration', type: 'string', group: 'catalogue', validation: (Rule) => Rule.required()}),
    defineField({name: 'locations', title: 'Locations', type: 'array', of: [{type: 'string'}], group: 'catalogue'}),
    defineField({
      name: 'startingPoint',
      title: 'Starting point / meeting arrangement',
      type: 'string',
      group: 'catalogue',
      initialValue: 'Pickup and drop-off from Accra or your hotel, unless a different arrangement is requested.',
      description: 'Standard policy confirmed 2026-07-25. Override only for a genuine exception.',
    }),
    defineField({
      name: 'groupSizeMin',
      title: 'Group size — minimum',
      type: 'number',
      group: 'catalogue',
      initialValue: 1,
      description: 'Solo travel confirmed available on every tour — minimum should not be raised above 1 without a real reason.',
    }),
    defineField({name: 'groupSizeMax', title: 'Group size — maximum', type: 'number', group: 'catalogue'}),
    defineField({
      name: 'groupSizeNote',
      title: 'Group size note',
      type: 'string',
      group: 'catalogue',
      description: 'e.g. "Larger community/reunion groups by arrangement, up to 30" for Just Go Ghana. See the group-size framework in the Tour Inventory: vehicle-limited / equipment-limited / workspace-limited / community-arrangement.',
    }),
    defineField({name: 'included', title: 'Included', type: 'array', of: [{type: 'string'}], group: 'catalogue'}),
    defineField({name: 'excluded', title: 'Excluded', type: 'array', of: [{type: 'string'}], group: 'catalogue'}),
    defineField({name: 'accessibilityNotes', title: 'Accessibility / audience notes', type: 'text', group: 'catalogue'}),
    defineField({name: 'availabilityNote', title: 'Availability note', type: 'string', group: 'catalogue', initialValue: 'Available any day with advance notice.'}),

    defineField({name: 'price', title: 'Price', type: 'number', group: 'pricing', validation: (Rule) => Rule.required()}),
    defineField({name: 'currency', title: 'Currency', type: 'string', group: 'pricing', initialValue: 'USD'}),
    defineField({name: 'priceUnit', title: 'Price unit', type: 'string', group: 'pricing', initialValue: 'Per Person'}),

    defineField({name: 'description', title: 'Short description', type: 'text', group: 'media'}),
    defineField({name: 'culturalContext', title: 'Cultural context / human story', type: 'text', group: 'media'}),
    defineField({name: 'media', title: 'Media', type: 'array', of: [{type: 'mediaAsset'}], group: 'media'}),
    defineField({name: 'relatedGuestStory', title: 'Related guest story', type: 'reference', to: [{type: 'guestStory'}], group: 'media'}),

    defineField({name: 'categories', title: 'Categories', type: 'array', of: [{type: 'string'}], group: 'search'}),
    defineField({name: 'vibes', title: 'Vibes', type: 'array', of: [{type: 'string'}], group: 'search'}),
    defineField({name: 'destination', title: 'Destination region', type: 'string', group: 'search'}),
    defineField({name: 'commandSummary', title: 'Command palette summary', type: 'string', group: 'search'}),
  ],
  preview: {
    select: {title: 'title', subtitle: 'offerType', media: 'media.0.image'},
  },
})
