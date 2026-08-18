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
 *
 * Labels are written for whoever runs the business rather than for a
 * developer — "eyebrow" and "copy" mean nothing outside a design studio. The
 * field `name` values are what the website reads and must not be renamed.
 */
export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About page',
  type: 'document',
  groups: [
    {name: 'hero', title: 'Top of the page', default: true},
    {name: 'story', title: 'Your story & purpose'},
    {name: 'difference', title: 'What makes you different'},
    {name: 'team', title: 'The team'},
    {name: 'impact', title: 'Numbers'},
    {name: 'faqs', title: 'Questions & answers'},
    {name: 'cta', title: 'Closing invitation'},
  ],
  fields: [
    defineField({
      name: 'heroTitle',
      title: 'Main heading',
      type: 'string',
      group: 'hero',
      description: 'The first thing visitors read. Keep it short.',
      validation: r => r.required().max(60).error('Keep the heading under 60 characters so it does not wrap awkwardly.'),
    }),
    defineField({
      name: 'heroSubtitle',
      title: 'Sentence underneath',
      type: 'text',
      rows: 3,
      group: 'hero',
      validation: r => r.required().max(260),
    }),

    defineField({
      name: 'storyEyebrow',
      title: 'Small label above the story heading',
      type: 'string',
      group: 'story',
      description: 'A few words in capitals, like "OUR STORY".',
      validation: r => r.required().max(40),
    }),
    defineField({
      name: 'storyTitle',
      title: 'Story heading',
      type: 'string',
      group: 'story',
      validation: r => r.required().max(60),
    }),
    defineField({
      name: 'storyParagraphs',
      title: 'The story itself',
      type: 'array',
      of: [defineArrayMember({type: 'text', rows: 4})],
      group: 'story',
      description: 'Why the company exists. Add each paragraph as its own entry — do not put them all in one box.',
      validation: r => r.required().min(1).max(6),
    }),
    defineField({
      name: 'missionEyebrow',
      title: 'Small label above the purpose heading',
      type: 'string',
      group: 'story',
      validation: r => r.required().max(40),
    }),
    defineField({
      name: 'missionTitle',
      title: 'Purpose heading',
      type: 'string',
      group: 'story',
      validation: r => r.required().max(70),
    }),
    defineField({
      name: 'missionBody',
      title: 'What you are trying to do',
      type: 'text',
      rows: 4,
      group: 'story',
      description: 'One paragraph. What People & Places is for, in your own words.',
      validation: r => r.required().max(400),
    }),

    defineField({
      name: 'differenceEyebrow',
      title: 'Small label above the heading',
      type: 'string',
      group: 'difference',
      validation: r => r.required().max(40),
    }),
    defineField({
      name: 'differenceTitle',
      title: 'Heading',
      type: 'string',
      group: 'difference',
      validation: r => r.required().max(60),
    }),
    defineField({
      name: 'differenceIntro',
      title: 'Introduction',
      type: 'text',
      rows: 3,
      group: 'difference',
      validation: r => r.required().max(260),
    }),
    defineField({
      name: 'differenceItems',
      title: 'The points themselves',
      type: 'array',
      group: 'difference',
      description: 'Numbered automatically, and each gets an icon from the site\'s set in the order listed — you do not choose the icons.',
      validation: r => r.required().min(1).max(9),
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({name: 'title', title: 'Heading', type: 'string', validation: r => r.required().max(50)}),
          defineField({name: 'text', title: 'Explanation', type: 'text', rows: 3, validation: r => r.required().max(300)}),
        ],
        preview: {select: {title: 'title', subtitle: 'text'}},
      })],
    }),

    defineField({
      name: 'teamEyebrow',
      title: 'Small label above the heading',
      type: 'string',
      group: 'team',
      validation: r => r.required().max(40),
    }),
    defineField({
      name: 'teamTitle',
      title: 'Heading',
      type: 'string',
      group: 'team',
      validation: r => r.required().max(60),
    }),
    defineField({
      name: 'teamIntro',
      title: 'Introduction',
      type: 'text',
      rows: 2,
      group: 'team',
      validation: r => r.required().max(220),
    }),
    defineField({
      name: 'team',
      title: 'People',
      type: 'array',
      group: 'team',
      description: 'Until someone has an approved photo, their card shows their initials instead — so you can add people now and photograph them later.',
      validation: r => r.required().min(1).max(8),
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({name: 'name', title: 'Name', type: 'string', validation: r => r.required().max(60)}),
          defineField({name: 'role', title: 'What they do', type: 'string', validation: r => r.required().max(60)}),
          defineField({name: 'bio', title: 'A few lines about them', type: 'text', rows: 3, validation: r => r.required().max(320)}),
          defineField({
            name: 'photo',
            title: 'Photo',
            type: 'mediaAsset',
            description: 'Optional. Leave empty and their initials are shown instead. A photo only appears once it is described and set to "Yes, publish it".',
          }),
        ],
        preview: {select: {title: 'name', subtitle: 'role', media: 'photo.image'}},
      })],
    }),
    defineField({
      name: 'teamNote',
      title: 'Note about the photography',
      type: 'text',
      rows: 2,
      group: 'team',
      description: 'A short honest line explaining why some people show initials rather than a photograph.',
      validation: r => r.required().max(200),
    }),

    defineField({
      name: 'impactStats',
      title: 'Numbers you want to show',
      type: 'array',
      group: 'impact',
      description: 'Only figures you can actually stand behind. Whole numbers count up as the visitor scrolls; anything else is shown as written.',
      validation: r => r.required().min(1).max(6),
      of: [defineArrayMember({
        type: 'object',
        fields: [
          defineField({name: 'value', title: 'The number', type: 'string', description: 'For example "300+" or "5.0".', validation: r => r.required().max(12)}),
          defineField({name: 'label', title: 'What it means', type: 'string', description: 'For example "Guests hosted".', validation: r => r.required().max(40)}),
        ],
        preview: {select: {title: 'value', subtitle: 'label'}},
      })],
    }),

    defineField({
      name: 'faqs',
      title: 'Questions & answers',
      type: 'array',
      group: 'faqs',
      description: 'The first one is open by default, so put the question people ask most at the top.',
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

    defineField({
      name: 'ctaEyebrow',
      title: 'Small label above the heading',
      type: 'string',
      group: 'cta',
      validation: r => r.required().max(40),
    }),
    defineField({
      name: 'ctaTitle',
      title: 'Heading',
      type: 'string',
      group: 'cta',
      validation: r => r.required().max(60),
    }),
    defineField({
      name: 'ctaBody',
      title: 'Paragraph',
      type: 'text',
      rows: 3,
      group: 'cta',
      validation: r => r.required().max(300),
    }),
    defineField({
      name: 'ctaNote',
      title: 'Reassuring line at the very end',
      type: 'text',
      rows: 2,
      group: 'cta',
      description: 'Something low-pressure, like "No commitment — just a conversation."',
      validation: r => r.required().max(200),
    }),
  ],
  preview: {prepare: () => ({title: 'About page'})},
})
