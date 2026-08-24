import {defineField, defineType} from 'sanity'

/**
 * An activity a guest can add to a trip, rather than a tour they book on its
 * own. The founders' tour document lists these by name only, with no price
 * and no description, because each one is arranged around the guest — so the
 * schema deliberately does not ask for either. What it involves is explained
 * when someone gets in touch.
 */
export const localExperience = defineType({
  name: 'localExperience',
  title: 'Add-on experience',
  type: 'document',
  description: 'Something a guest can add to a trip — a cooking class, a dance lesson. Arranged on request, for groups of four or more.',
  fields: [
    defineField({
      name: 'name',
      title: 'What it is called',
      type: 'string',
      description: 'Short and plain: "Cooking Classes", "Shea Butter Making".',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'active',
      title: 'Show this on the website?',
      type: 'boolean',
      initialValue: true,
      description: 'Turn off to stop offering it without deleting it.',
    }),
    defineField({
      name: 'order',
      title: 'Where it sits in the list',
      type: 'number',
      validation: (Rule) => Rule.required().integer().positive(),
    }),
  ],
  orderings: [{title: 'Listed order', name: 'order', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'name', subtitle: 'order'}},
})
