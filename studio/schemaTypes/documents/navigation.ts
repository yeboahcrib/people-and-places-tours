import {defineField, defineType} from 'sanity'

export const navigation = defineType({
  name: 'navigation',
  title: 'Navigation & Footer',
  type: 'document',
  // Singleton.
  fields: [
    defineField({
      name: 'navLinks',
      title: 'Nav links',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'navLink',
          fields: [
            defineField({name: 'label', type: 'string'}),
            defineField({name: 'href', type: 'string'}),
          ],
        },
      ],
      description: 'Replaces the nav markup currently hand-duplicated across all 20 HTML pages.',
    }),
    defineField({
      name: 'footerTagline',
      title: 'Footer tagline',
      type: 'string',
    }),
    defineField({
      name: 'footerColumns',
      title: 'Footer columns',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'footerColumn',
          fields: [
            defineField({name: 'heading', type: 'string'}),
            defineField({
              name: 'links',
              type: 'array',
              of: [
                {
                  type: 'object',
                  name: 'footerLink',
                  fields: [
                    defineField({name: 'label', type: 'string'}),
                    defineField({name: 'href', type: 'string'}),
                  ],
                },
              ],
            }),
          ],
        },
      ],
    }),
  ],
})
