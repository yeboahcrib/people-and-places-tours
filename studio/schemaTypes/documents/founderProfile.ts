import {defineField, defineType} from 'sanity'

export const founderProfile = defineType({
  name: 'founderProfile',
  title: 'Founder / Host Profile',
  type: 'document',
  fields: [
    defineField({name: 'name', title: 'Name', type: 'string', validation: (Rule) => Rule.required()}),
    defineField({name: 'preferredName', title: 'Preferred / short name', type: 'string', description: 'e.g. "Nana Yeboah" or "Kojo".'}),
    defineField({name: 'role', title: 'Role', type: 'string'}),
    defineField({name: 'languages', title: 'Languages', type: 'array', of: [{type: 'string'}]}),
    defineField({name: 'background', title: 'Background', type: 'text'}),
    defineField({name: 'bio', title: 'Bio', type: 'text'}),
    defineField({name: 'photo', title: 'Photo', type: 'mediaAsset'}),
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'string',
      description: 'Only if real and approved — see Brand Foundation §13.7: never invent a quote.',
    }),
    defineField({
      name: 'isFounder',
      title: 'Is a founder',
      type: 'boolean',
      initialValue: true,
      description: 'False for a real guide who isn\'t a founder (e.g. a "Samuel"-type record), if ever added.',
    }),
  ],
  preview: {
    select: {title: 'name', subtitle: 'role', media: 'photo.image'},
  },
})
