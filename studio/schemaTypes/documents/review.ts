import {defineField, defineType} from 'sanity'

/**
 * A real guest review.
 *
 * The integrity rule is that nothing here is ever rewritten. `sourceText` is
 * the review exactly as the guest left it, and `selectedExcerpt` must be an
 * exact substring of it rather than a tidied-up paraphrase. Enforcing
 * "no edits after entry" belongs in role permissions (Reviewer/Editor create,
 * only Administrator amends) rather than a schema lock, which would need
 * custom document actions.
 *
 * Labels are written for whoever runs the business; the field `name` values
 * are what the website reads and must not be renamed.
 */
export const review = defineType({
  name: 'review',
  title: 'Guest review',
  type: 'document',
  description: 'Real reviews from real guests. Never reword one — quote it exactly or not at all.',
  fields: [
    defineField({
      name: 'reviewerName',
      title: 'Who wrote it',
      type: 'string',
      description: 'Exactly as they signed it.',
      validation: (Rule) => Rule.required().error('A review needs a name.'),
    }),
    defineField({
      name: 'country',
      title: 'Where they are from',
      type: 'string',
      description: 'Only fill this in if they said so themselves. Do not guess from a name.',
    }),
    defineField({
      name: 'sourceText',
      title: 'The full review, word for word',
      type: 'text',
      rows: 6,
      validation: (Rule) => Rule.required().error('Paste the review exactly as it was written.'),
      description: 'Copy and paste it exactly — including any typos. This is the record, and it is never tidied up or improved.',
    }),
    defineField({
      name: 'selectedExcerpt',
      title: 'The part to show on the site',
      type: 'text',
      rows: 3,
      description: 'A shorter piece taken from the review above. It must be their exact words, copied straight out — shortening is fine, rewording is not.',
    }),
    defineField({
      name: 'rating',
      title: 'Stars they gave',
      type: 'number',
      description: '1 to 5.',
      validation: (Rule) => Rule.required().min(1).max(5).error('A rating is between 1 and 5.'),
    }),
    defineField({
      name: 'platform',
      title: 'Where they left it',
      type: 'string',
      initialValue: 'Google',
      description: 'Google, TripAdvisor, and so on.',
    }),
    defineField({
      name: 'reviewDate',
      title: 'When they left it',
      type: 'date',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'sourceUrl',
      title: 'Link to the original',
      type: 'url',
      description: 'If you can link straight to it, paste the address here. It lets a visitor check the review is genuine.',
    }),
    defineField({
      name: 'relatedExperience',
      title: 'Which experience was it about?',
      type: 'reference',
      to: [{type: 'tour'}],
    }),
    defineField({
      name: 'hostsNamed',
      title: 'Hosts they mentioned by name',
      type: 'array',
      of: [{type: 'string'}],
      description: 'Only if the review actually names them. Do not attach a founder to an unnamed review to even things up.',
    }),
    defineField({
      name: 'media',
      title: 'Photos they shared',
      type: 'array',
      of: [{type: 'mediaAsset'}],
      description: 'Optional, and only with their permission.',
    }),
    defineField({
      name: 'trust',
      title: 'Where this came from',
      type: 'trustFields',
      description: 'How you know it is genuine.',
    }),
  ],
  preview: {
    select: {title: 'reviewerName', subtitle: 'selectedExcerpt', rating: 'rating', full: 'sourceText'},
    prepare: ({title, subtitle, rating, full}: any) => ({
      title: `${title || 'Unnamed'}${rating ? ` · ${'★'.repeat(rating)}` : ''}`,
      subtitle: subtitle || full,
    }),
  },
})
