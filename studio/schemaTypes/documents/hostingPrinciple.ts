import {defineField, defineType} from 'sanity'

export const hostingPrinciple = defineType({
  name: 'hostingPrinciple',
  title: 'Hosting Principle',
  type: 'document',
  description: 'The "how you are hosted" proof points — e.g. context before checklists, care you can feel.',
  fields: [
    defineField({name: 'title', title: 'Title', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'description', title: 'Description', type: 'text'}),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      options: {list: [
        {title: 'Place / context', value: 'pin'},
        {title: 'Care / hospitality', value: 'heart'},
        {title: 'Local host', value: 'user-circle'},
        {title: 'Thoughtful planning', value: 'calendar'},
      ]},
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'proofReview',
      title: 'Proof (linked review)',
      type: 'reference',
      to: [{type: 'review'}],
      description: 'Optional — a real review that demonstrates this principle, rather than an abstract claim.',
    }),
    defineField({name: 'order', title: 'Order', type: 'number', validation: (Rule) => Rule.required().min(1).max(4)}),
  ],
  orderings: [{title: 'Order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
})
