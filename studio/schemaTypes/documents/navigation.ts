import {defineField, defineType} from 'sanity'

/**
 * The menu at the top of every page and the footer at the bottom.
 *
 * Singleton. Replaces the nav markup currently hand-duplicated across all 20
 * HTML pages. Labels are written for whoever runs the business; the field
 * `name` values are what the website reads and must not be renamed.
 */

const linkFields = [
  defineField({
    name: 'label',
    title: 'What the link says',
    type: 'string',
    validation: (Rule) => Rule.required().error('A link needs words on it.'),
  }),
  defineField({
    name: 'href',
    title: 'Where it goes',
    type: 'string',
    description: 'A page on this site, like packages.html, or a full address starting with https://',
    validation: (Rule) => Rule.required().error('A link needs a destination.'),
  }),
]

export const navigation = defineType({
  name: 'navigation',
  title: 'Menu & footer',
  type: 'document',
  description: 'The menu across the top of every page, and the footer at the bottom. Changes here apply to the whole site.',
  fields: [
    defineField({
      name: 'navLinks',
      title: 'Menu links',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'navLink',
          fields: linkFields,
          preview: {select: {title: 'label', subtitle: 'href'}},
        },
      ],
      description: 'The order here is the order they appear. Keep it to five or six — the menu has to fit on a phone.',
    }),
    defineField({
      name: 'footerTagline',
      title: 'Line under the logo in the footer',
      type: 'string',
      description: 'One sentence about who you are. Leave blank rather than using a claim you cannot stand behind.',
    }),
    defineField({
      name: 'footerColumns',
      title: 'Footer link columns',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'footerColumn',
          fields: [
            defineField({
              name: 'heading',
              title: 'Column heading',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'links',
              title: 'Links in this column',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'footerLink',
                  fields: linkFields,
                  preview: {select: {title: 'label', subtitle: 'href'}},
                },
              ],
            }),
          ],
          preview: {select: {title: 'heading', links: 'links'},
            prepare: ({title, links}: any) => ({
              title: title || 'Untitled column',
              subtitle: `${(links || []).length} link${(links || []).length === 1 ? '' : 's'}`,
            })},
        },
      ],
      description: 'Each column is a heading with links beneath it. Three columns fit comfortably.',
    }),
  ],
  preview: {
    prepare: () => ({title: 'Menu & footer'}),
  },
})
