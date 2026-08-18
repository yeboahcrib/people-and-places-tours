import {defineField, defineType} from 'sanity'

/**
 * A founder or host.
 *
 * `quote` must be something the person actually said — see Brand Foundation
 * §13.7: never invent a quote. Labels are written for whoever runs the
 * business; the field `name` values are what the website reads and must not
 * be renamed.
 */
export const founderProfile = defineType({
  name: 'founderProfile',
  title: 'Team member',
  type: 'document',
  description: 'The people behind People & Places. Used on the homepage and the About page.',
  fields: [
    defineField({
      name: 'name',
      title: 'Full name',
      type: 'string',
      validation: (Rule) => Rule.required().error('A team member needs a name.'),
    }),
    defineField({
      name: 'preferredName',
      title: 'What people actually call them',
      type: 'string',
      description: 'For example "Kojo". This is what the site shows if it is filled in.',
    }),
    defineField({
      name: 'role',
      title: 'What they do',
      type: 'string',
      description: 'A few words, for example "Co-founder & host".',
    }),
    defineField({
      name: 'languages',
      title: 'Languages they speak',
      type: 'array',
      of: [{type: 'string'}],
      description: 'One per line.',
    }),
    defineField({
      name: 'background',
      title: 'Their background',
      type: 'text',
      rows: 4,
      description: 'Notes for your own use — where they are from, what they did before.',
    }),
    defineField({
      name: 'bio',
      title: 'A few lines for the website',
      type: 'text',
      rows: 4,
      description: 'What a guest would want to know about the person showing them around.',
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'mediaAsset',
      description: 'Optional. Without an approved photo the site shows their initials instead, which looks deliberate — so you can add someone now and photograph them later.',
    }),
    defineField({
      name: 'quote',
      title: 'Something they said',
      type: 'string',
      description: 'Only a real quote, in their own words. Never write one on someone\'s behalf — leave it blank instead.',
    }),
    defineField({
      name: 'isFounder',
      title: 'Is this one of the founders?',
      type: 'boolean',
      initialValue: true,
      description: 'Turn off for a guide or host who is not a founder.',
    }),
  ],
  preview: {
    select: {title: 'name', preferred: 'preferredName', subtitle: 'role', media: 'photo.image'},
    prepare: ({title, preferred, subtitle, media}: any) => ({
      title: preferred && preferred !== title ? `${title} (${preferred})` : title || 'Unnamed',
      subtitle,
      media,
    }),
  },
})
