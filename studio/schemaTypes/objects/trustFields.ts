import {defineField, defineType} from 'sanity'

/**
 * Shared trust-aware field set — see docs/sprint-2-information-architecture.md
 * "Trust-Aware Fields" section. Embedded in any type carrying a public claim:
 * Trust facts, Reviews, Guest stories, Media.
 *
 * Publish-blocking rules for specific types (e.g. reviews needing source +
 * sourceUrl + rating + date) are enforced per-document, not here — this
 * object just holds the shared shape.
 *
 * This block appears inside several documents, so its labels are the ones an
 * editor meets most often. They are written as plain questions rather than as
 * state names; the stored values are unchanged.
 */
export const trustFields = defineType({
  name: 'trustFields',
  title: 'Where this came from',
  type: 'object',
  description: 'How you know this is true, and whether you are allowed to publish it.',
  fields: [
    defineField({
      name: 'source',
      title: 'Where did it come from?',
      type: 'string',
      description: 'Be specific enough that someone else could find it again — for example "Google reviews export, July 2026".',
    }),
    defineField({
      name: 'verificationDate',
      title: 'When did you last check it was still true?',
      type: 'date',
    }),
    defineField({
      name: 'permissionState',
      title: 'Do you have permission to use it?',
      type: 'string',
      options: {
        list: [
          {title: 'Not asked yet', value: 'none'},
          {title: 'Asked, waiting to hear back', value: 'requested'},
          {title: 'Yes, they agreed', value: 'granted'},
          {title: 'No permission needed', value: 'notRequired'},
        ],
        layout: 'radio',
      },
      initialValue: 'none',
    }),
    defineField({
      name: 'approvalState',
      title: 'Have you approved it for the website?',
      type: 'string',
      options: {
        list: [
          {title: 'Not yet — still checking', value: 'draft'},
          {title: 'Yes, approved', value: 'approved'},
          {title: 'No, do not use it', value: 'rejected'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
    }),
    defineField({
      name: 'publicationState',
      title: 'Is it in use right now?',
      type: 'string',
      description: 'Use "Retired" for something that was true once but should no longer be shown.',
      options: {
        list: [
          {title: 'Not published yet', value: 'draft'},
          {title: 'In use on the site', value: 'published'},
          {title: 'Retired', value: 'archived'},
        ],
        layout: 'radio',
      },
      initialValue: 'draft',
    }),
    defineField({
      name: 'owner',
      title: 'Who is responsible for keeping it accurate?',
      type: 'string',
      description: 'A name. Someone should own every public claim.',
    }),
    defineField({
      name: 'expiryOrReviewDate',
      title: 'When should it be checked again?',
      type: 'date',
      description: 'Anything that can go out of date — a rating, a guest count, a price — deserves a date here.',
    }),
    defineField({
      name: 'channelEligibility',
      title: 'Where are you allowed to use it?',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        list: [
          {title: 'The website', value: 'website'},
          {title: 'Instagram', value: 'instagram'},
          {title: 'Google', value: 'google'},
          {title: 'WhatsApp', value: 'whatsapp'},
          {title: 'Email', value: 'email'},
        ],
      },
      description: 'Someone may be happy to be quoted on the website but not on social media. Tick only what they agreed to.',
    }),
  ],
})
