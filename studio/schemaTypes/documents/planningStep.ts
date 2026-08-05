import {defineField, defineType} from 'sanity'

export const planningStep = defineType({
  name: 'planningStep',
  title: 'Planning Step',
  type: 'document',
  fields: [
    defineField({name: 'stepNumber', title: 'Step number', type: 'number', validation: (Rule) => Rule.required()}),
    defineField({name: 'title', title: 'Title', type: 'string'}),
    defineField({name: 'description', title: 'Description', type: 'text'}),
    defineField({name: 'cta', title: 'Call to action', type: 'reference', to: [{type: 'cta'}]}),
  ],
  orderings: [{title: 'Step order', name: 'stepAsc', by: [{field: 'stepNumber', direction: 'asc'}]}],
  preview: {select: {title: 'title', subtitle: 'stepNumber'}},
})
