import {defineField, defineType} from 'sanity'

/**
 * Shared trust-aware field set — see docs/sprint-2-information-architecture.md
 * "Trust-Aware Fields" section. Embedded in any type carrying a public claim:
 * Trust facts, Reviews, Guest stories, Media.
 *
 * Publish-blocking rules for specific types (e.g. reviews needing source +
 * sourceUrl + rating + date) are enforced per-document, not here — this
 * object just holds the shared shape.
 */
export const trustFields = defineType({
  name: 'trustFields',
  title: 'Trust & provenance',
  type: 'object',
  fields: [
    defineField({
      name: 'source',
      title: 'Source',
      type: 'string',
      description: 'Where this claim/quote/image actually comes from (e.g. "Google Business Profile export, reviews.json").',
    }),
    defineField({
      name: 'verificationDate',
      title: 'Verification date',
      type: 'date',
      description: 'When someone last confirmed this is still true.',
    }),
    defineField({
      name: 'permissionState',
      title: 'Permission state',
      type: 'string',
      options: {
        list: [
          {title: 'None', value: 'none'},
          {title: 'Requested', value: 'requested'},
          {title: 'Granted', value: 'granted'},
          {title: 'Not required', value: 'notRequired'},
        ],
        layout: 'radio',
      },
      initialValue: 'none',
    }),
    defineField({
      name: 'approvalState',
      title: 'Approval state',
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
    defineField({
      name: 'publicationState',
      title: 'Publication state',
      type: 'string',
      description: 'Sanity already tracks draft-vs-published natively; this field adds "archived", which Sanity has no built-in concept of.',
      options: {
        list: [
          {title: 'Draft', value: 'draft'},
          {title: 'Published', value: 'published'},
          {title: 'Archived', value: 'archived'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
    }),
    defineField({
      name: 'owner',
      title: 'Owner',
      type: 'string',
      description: 'Who is accountable for this record staying accurate.',
    }),
    defineField({
      name: 'expiryOrReviewDate',
      title: 'Expiry / review date',
      type: 'date',
      description: 'When this should be re-checked (e.g. re-verify the Google rating quarterly).',
    }),
    defineField({
      name: 'channelEligibility',
      title: 'Channel eligibility',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'Website', value: 'website'},
          {title: 'Instagram', value: 'instagram'},
          {title: 'Google', value: 'google'},
          {title: 'WhatsApp', value: 'whatsapp'},
          {title: 'Email', value: 'email'},
        ],
      },
      description: 'Not every approved fact is approved for every channel.',
    }),
  ],
})
