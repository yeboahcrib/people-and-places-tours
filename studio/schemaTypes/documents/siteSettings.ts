import {defineField, defineType} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  // Singleton — the Studio structure hides the "create new" option for this type.
  fields: [
    defineField({name: 'businessName', title: 'Business name', type: 'string', initialValue: 'People & Places'}),
    defineField({
      name: 'legalName',
      title: 'Legal/registered name',
      type: 'string',
      description: 'e.g. "People & Places Tours Ltd." — used on receipts/invoices, not necessarily the public brand name.',
    }),
    defineField({name: 'publicDescriptor', title: 'Public descriptor', type: 'string', description: 'No permanent descriptor is currently approved — leave blank rather than forcing one.'}),
    defineField({name: 'primaryPhone', title: 'Primary phone (Ghana)', type: 'string', initialValue: '+233 50 367 3473'}),
    defineField({
      name: 'internationalPhone',
      title: 'International phone',
      type: 'string',
      initialValue: '+1 803 477 6489',
      description: 'Labelled for diaspora/international guests specifically, a deliberate decision.',
    }),
    defineField({name: 'email', title: 'Public email', type: 'string'}),
    defineField({name: 'hours', title: 'Business hours', type: 'string', initialValue: 'Monday–Friday, 9:00 a.m.–5:00 p.m.'}),
    defineField({name: 'responsePromise', title: 'Response-time promise', type: 'string', initialValue: 'Usually within one hour during business hours'}),
    defineField({name: 'serviceArea', title: 'Service area', type: 'string', initialValue: 'Accra and the Adenta Municipality, with experiences across Ghana'}),
    defineField({name: 'instagramHandle', title: 'Instagram handle', type: 'string', initialValue: '@peopleand.places'}),
    defineField({name: 'instagramUrl', title: 'Instagram URL', type: 'url'}),
    defineField({name: 'googleBusinessUrl', title: 'Google Business Profile URL', type: 'url'}),
  ],
})
