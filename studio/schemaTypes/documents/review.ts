import {defineField, defineType} from 'sanity'

export const review = defineType({
  name: 'review',
  title: 'Review',
  type: 'document',
  fields: [
    defineField({name: 'reviewerName', title: 'Reviewer name', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'country', title: 'Country of origin', type: 'string', description: 'Only publish when supplied or confirmed by the traveler.'}),
    defineField({
      name: 'sourceText',
      title: 'Full source text (verbatim)',
      type: 'text',
      validation: (Rule) => Rule.required(),
      description: 'Exact wording from the source — never rewritten, never cleaned up (Sprint 1 non-negotiable #5). Enforce "no edits after initial entry" via role permissions (Reviewer/Editor can create, only Administrator can amend) rather than a schema-level lock, which needs custom document actions beyond this first-pass schema.',
    }),
    defineField({
      name: 'selectedExcerpt',
      title: 'Selected excerpt',
      type: 'text',
      description: 'A shorter verbatim excerpt for display — must be an exact substring of the source text, not a rewrite.',
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(5),
    }),
    defineField({name: 'platform', title: 'Platform', type: 'string', initialValue: 'Google'}),
    defineField({name: 'reviewDate', title: 'Review date', type: 'date', validation: (Rule) => Rule.required()}),
    defineField({
      name: 'sourceUrl',
      title: 'Source URL',
      type: 'url',
      description: 'Direct link to the review if available. The July 2026 Google Takeout export has no public per-review permalink — pull this from the live Google Maps listing if/when needed.',
    }),
    defineField({name: 'relatedExperience', title: 'Related tour / experience', type: 'reference', to: [{type: 'tour'}]}),
    defineField({
      name: 'hostsNamed',
      title: 'Hosts named',
      type: 'array',
      of: [{type: 'string'}],
      description: 'e.g. "Kojo", "Nana" — don\'t attribute an unnamed review to a founder to manufacture symmetry (Sprint 1 Review Register).',
    }),
    defineField({name: 'media', title: 'Optional related media', type: 'array', of: [{type: 'mediaAsset'}]}),
    defineField({name: 'trust', title: 'Trust & provenance', type: 'trustFields'}),
  ],
  preview: {
    select: {title: 'reviewerName', subtitle: 'selectedExcerpt'},
  },
})
