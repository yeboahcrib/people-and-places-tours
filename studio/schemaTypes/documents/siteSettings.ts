import {defineField, defineType} from 'sanity'

/**
 * Contact details and hours, used across every page of the site.
 *
 * Singleton — the Studio structure hides the "create new" option for this type.
 * Labels are written for whoever runs the business; the field `name` values are
 * what the website reads and must not be renamed.
 */
export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Contact details & hours',
  type: 'document',
  description: 'Change these once and they update everywhere on the site — every page footer, the contact page, and the booking form.',
  fields: [
    defineField({
      name: 'businessName',
      title: 'Business name',
      type: 'string',
      initialValue: 'People & Places',
      description: 'The name guests know you by.',
    }),
    defineField({
      name: 'legalName',
      title: 'Registered company name',
      type: 'string',
      description: 'The full legal name, if it differs — for example "People & Places Tours Ltd." Used on receipts and invoices rather than on the site itself.',
    }),
    defineField({
      name: 'publicDescriptor',
      title: 'Short phrase after the name',
      type: 'string',
      description: 'Something like "Ghana travel, hosted locally". Leave blank unless you are happy to stand behind it everywhere — a vague slogan is worse than none.',
    }),
    defineField({
      name: 'primaryPhone',
      title: 'Ghana phone number',
      type: 'string',
      initialValue: '+233 50 367 3473',
      description: 'Include the country code. This is the main number shown on the site.',
    }),
    defineField({
      name: 'internationalPhone',
      title: 'International phone number',
      type: 'string',
      initialValue: '+1 803 477 6489',
      description: 'Shown alongside the Ghana number and labelled for guests calling from abroad.',
    }),
    defineField({
      name: 'email',
      title: 'Email address',
      type: 'string',
      description: 'The address enquiries should reach. Shown publicly.',
    }),
    defineField({
      name: 'hours',
      title: 'When you are open',
      type: 'string',
      initialValue: 'Monday–Friday, 9:00 a.m.–5:00 p.m.',
    }),
    defineField({
      name: 'responsePromise',
      title: 'How quickly you reply',
      type: 'string',
      initialValue: 'Usually within one hour during business hours',
      description: 'Only promise what you can keep — this appears next to the enquiry form and sets the expectation.',
    }),
    defineField({
      name: 'serviceArea',
      title: 'Where you operate',
      type: 'string',
      initialValue: 'Accra and the Adenta Municipality, with experiences across Ghana',
    }),
    defineField({
      name: 'instagramHandle',
      title: 'Instagram handle',
      type: 'string',
      initialValue: '@peopleand.places',
      description: 'Including the @.',
    }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram web address',
      type: 'url',
      description: 'The full https:// link to the profile.',
    }),
    defineField({
      name: 'googleBusinessUrl',
      title: 'Google Business listing',
      type: 'url',
      description: 'The full link to your Google listing, where guests leave reviews.',
    }),
  ],
  preview: {
    select: {title: 'businessName', subtitle: 'email'},
  },
})
