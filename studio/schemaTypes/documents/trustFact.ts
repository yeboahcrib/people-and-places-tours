import {defineField, defineType} from 'sanity'

export const trustFact = defineType({
  name: 'trustFact',
  title: 'Fact about the business',
  type: 'document',
  description: 'A number or fact you state publicly — guests hosted, years running, rating. One record each, so every claim has something behind it.',
  fields: [
    defineField({name: 'label', title: 'What the fact is', type: 'string', description: 'For example "Guests hosted".', validation: (Rule) => Rule.required()}),
    defineField({name: 'value', title: 'The number or figure', type: 'string', description: 'For example "300+".', validation: (Rule) => Rule.required()}),
    defineField({name: 'publicDisplayStatus', title: 'Can this be shown publicly?', type: 'string', options: {
      list: [
        {title: 'Yes, show it', value: 'approved'},
        {title: 'No, keep it private for now', value: 'withheld'},
      ],
      layout: 'radio',
    }, initialValue: 'withheld'}),
    defineField({name: 'trust', title: 'Where this came from', type: 'trustFields', description: 'Required. A number on the website is a promise \u2014 it needs a source and a date.', validation: (Rule) => Rule.required()}),
  ],
  preview: {select: {title: 'label', subtitle: 'value'}},
})
