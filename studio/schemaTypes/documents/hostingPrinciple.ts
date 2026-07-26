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
      name: 'proofReview',
      title: 'Proof (linked review)',
      type: 'reference',
      to: [{type: 'review'}],
      description: 'Optional — a real review that demonstrates this principle, rather than an abstract claim.',
    }),
    defineField({name: 'order', title: 'Order', type: 'number'}),
  ],
  orderings: [{title: 'Order', name: 'orderAsc', by: [{field: 'order', direction: 'asc'}]}],
})
