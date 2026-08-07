import {defineField, defineType} from 'sanity'

export const trustFact = defineType({
  name: 'trustFact',
  title: 'Trust Fact',
  type: 'document',
  description: 'One record per approved public fact.',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'value', title: 'Value', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'publicDisplayStatus', title: 'Public display status', type: 'string', options: {
      list: [
        {title: 'Approved', value: 'approved'},
        {title: 'Withheld', value: 'withheld'},
      ],
      layout: 'radio',
    }, initialValue: 'withheld'}),
    defineField({name: 'trust', title: 'Trust & provenance', type: 'trustFields', validation: (Rule) => Rule.required()}),
  ],
  preview: {select: {title: 'label', subtitle: 'value'}},
})
