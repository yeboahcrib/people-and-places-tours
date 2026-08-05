import {defineArrayMember, defineField, defineType} from 'sanity'

/**
 * Singleton — the About page.
 *
 * Read at build time by scripts/about-source.mjs and injected into
 * about.html, so the founder bios, mission, difference cards, impact figures
 * and FAQs can all be edited without a developer. Committed defaults live in
 * src/content/about.json and ship when Sanity is not configured.
 *
 * Icons are deliberately not editable: they belong to the design system, and
 * letting editors choose arbitrary artwork is how a design system drifts.
 */
export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Hero', default: true},
    {name: 'story', title: 'Story & mission'},
    {name: 'difference', title: 'The difference'},
    {name: 'team', title: 'Team'},
    {name: 'impact', title: 'Impact'},
    {name: 'faqs', title: 'FAQs'},
    {name: 'cta', title: 'Closing invitation'},
  ],
  fields: [
    defineField({name: 'heroTitle', title: 'Hero heading', type: 'string', group: 'hero', validation: r => r.required().max(60)}),
    defineField({name: 'heroSubtitle', title: 'Hero supporting copy', type: 'text', rows: 3, group: 'hero', validation: r => r.required().max(260)}),

    defineField({name: 'storyEyebrow', title: 'Story eyebrow', type: 'string', group: 'story', validation: r => r.required().max(40)}),
    defineField({name: 'storyTitle', title: 'Story heading', type: 'string', group: 'story', validation: r => r.required().max(60)}),
    defineField({
      name: 'storyParagraphs',
      title: 'Story paragraphs',
      type: 'array',
      of: [defineArrayMember({type: 'text', rows: 4})],
      group: 'story',
      description: 'Why the company exists. Each entry renders as its own paragraph.',
      validation: r => r.required().min(1).max(6),
    }),
    defineField({name: 'missionEyebrow', title: 'Mission eyebrow', type: 'string', group: 'story', validation: r => r.required().max(40)}),
    defineField({name: 'missionTitle', title: 'Mission heading', type: 'string', group: 'story', validation: r => r.required().max(70)}),
    defineField({name: 'missionBody', title: 'Mission copy', type: 'text', rows: 4, group: 'story', validation: r => r.required().max(400)}),

    defineField({name: 'differenceEyebrow', title: 'Eyebrow', type: 'string', group: 'difference', validation: r => r.required().max(40)}),
    defineField({name: 'differenceTitle', title: 'Heading', type: 'string', group: 'difference', validation: r => r.required().max(60)}),
    defineField({name: 'differenceIntro', title: 'Intro', type: 'text', rows: 3, group: 'difference', validation: r => r.required().max(260)}),
    defineField({
      name: 'differenceItems',
      title: 'Difference cards',
      type: 'array',
      group: 'difference',
      description: 'Numbered automatically. Icons follow the existing set in page order.',
      validation: r => r.required().min(1).max(9),
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({name: 'title', title: 'Title', type: 'string', validation: r => r.required().max(50)}),
          defineField({name: 'text', title: 'Text', type: 'text', rows: 3, validation: r => r.required().max(300)}),
        ],
        preview: {select: {title: 'title', subtitle: 'text'}},
      })],
    }),

    defineField({name: 'teamEyebrow', title: 'Eyebrow', type: 'string', group: 'team', validation: r => r.required().max(40)}),
    defineField({name: 'teamTitle', title: 'Heading', type: 'string', group: 'team', validation: r => r.required().max(60)}),
    defineField({name: 'teamIntro', title: 'Intro', type: 'text', rows: 2, group: 'team', validation: r => r.required().max(220)}),
    defineField({
      name: 'team',
      title: 'Team members',
      type: 'array',
      group: 'team',
      description: 'Initials are derived from the name; a quoted nickname is skipped.',
      validation: r => r.required().min(1).max(8),
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({name: 'name', title: 'Name', type: 'string', validation: r => r.required().max(60)}),
          defineField({name: 'role', title: 'Role', type: 'string', validation: r => r.required().max(60)}),
          defineField({name: 'bio', title: 'Short bio', type: 'text', rows: 3, validation: r => r.required().max(320)}),
          defineField({
            name: 'photo',
            title: 'Photo',
            type: 'mediaAsset',
            description: 'Optional. Until a photo is approved the card falls back to initials, so this can stay empty while photography is in progress. Alt text is required, and the image only publishes once both approval states are "approved".',
          }),
        ],
        preview: {select: {title: 'name', subtitle: 'role', media: 'photo.image'}},
      })],
    }),
    defineField({name: 'teamNote', title: 'Photography note', type: 'text', rows: 2, group: 'team', validation: r => r.required().max(200)}),

    defineField({
      name: 'impactStats',
      title: 'Impact figures',
      type: 'array',
      group: 'impact',
      description: 'Only claims approved in the Claim Register belong here. Whole numbers animate; anything else renders as written.',
      validation: r => r.required().min(1).max(6),
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({name: 'value', title: 'Value', type: 'string', validation: r => r.required().max(12)}),
          defineField({name: 'label', title: 'Label', type: 'string', validation: r => r.required().max(40)}),
        ],
        preview: {select: {title: 'value', subtitle: 'label'}},
      })],
    }),

    defineField({
      name: 'faqs',
      title: 'About FAQs',
      type: 'array',
      group: 'faqs',
      description: 'The first question is expanded by default.',
      validation: r => r.required().min(1).max(12),
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({name: 'question', title: 'Question', type: 'string', validation: r => r.required().max(120)}),
          defineField({name: 'answer', title: 'Answer', type: 'text', rows: 4, validation: r => r.required().max(700)}),
        ],
        preview: {select: {title: 'question', subtitle: 'answer'}},
      })],
    }),

    defineField({name: 'ctaEyebrow', title: 'Eyebrow', type: 'string', group: 'cta', validation: r => r.required().max(40)}),
    defineField({name: 'ctaTitle', title: 'Heading', type: 'string', group: 'cta', validation: r => r.required().max(60)}),
    defineField({name: 'ctaBody', title: 'Copy', type: 'text', rows: 3, group: 'cta', validation: r => r.required().max(300)}),
    defineField({name: 'ctaNote', title: 'Reassurance note', type: 'text', rows: 2, group: 'cta', validation: r => r.required().max(200)}),
  ],
  preview: {prepare: () => ({title: 'About Page'})},
})
