import {defineField, defineType} from 'sanity'

/**
 * One of the three steps in the "how planning works" section of the homepage.
 *
 * The design fits exactly three; a fourth is not rendered.
 */
export const planningStep = defineType({
  name: 'planningStep',
  title: 'Planning step',
  type: 'document',
  description: 'One of the three steps shown on the homepage explaining how planning a trip works.',
  fields: [
    defineField({
      name: 'stepNumber',
      title: 'Which step is this?',
      type: 'number',
      description: '1, 2 or 3. The homepage shows three steps — a fourth will not appear.',
      validation: (Rule) => Rule.required().min(1).max(3).error('Steps are numbered 1 to 3.'),
    }),
    defineField({
      name: 'title',
      title: 'Step heading',
      type: 'string',
      description: 'Short and active, for example "Tell us about your trip".',
    }),
    defineField({
      name: 'description',
      title: 'What happens at this step',
      type: 'text',
      rows: 3,
      description: 'One or two sentences, written to the guest.',
    }),
    defineField({
      name: 'cta',
      title: 'Button (optional)',
      type: 'reference',
      to: [{type: 'cta'}],
    }),
  ],
  orderings: [{title: 'Step order', name: 'stepAsc', by: [{field: 'stepNumber', direction: 'asc'}]}],
  preview: {
    select: {title: 'title', subtitle: 'description', stepNumber: 'stepNumber'},
    prepare: ({title, subtitle, stepNumber}: any) => ({
      title: `${stepNumber ? `${stepNumber}. ` : ''}${title || 'Untitled step'}`,
      subtitle,
    }),
  },
})
