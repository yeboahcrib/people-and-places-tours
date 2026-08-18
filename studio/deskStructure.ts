import type {StructureResolver} from 'sanity/structure'

/**
 * The Studio sidebar, organised the way somebody thinks about the website
 * rather than the way the data is stored.
 *
 * Previously this listed document types: an editor wanting to change a line on
 * the About page had to know it lived in a type called "aboutPage", and the
 * sidebar also showed fourteen internal types like "experiencePathway" and
 * "hostingPrinciple" that nobody edits on their own. Now the top level is
 * Pages, Experiences, Photos & People and Site Details, and everything
 * structural is reached through the page it belongs to.
 *
 * Anything not listed here is deliberately hidden. It is still in the schema
 * and still used by the site; it is just not something to browse.
 */

// One of each of these exists, so they open straight into the document
// instead of showing a list with a single row in it.
const SINGLETON_IDS = [
  'siteSettings', 'navigation', 'originStory',
  'featuredTourCollection', 'bookingFlow', 'aboutPage',
]

const single = (S: any, type: string, title: string, subtitle?: string) =>
  S.listItem()
    .title(title)
    .id(type)
    .child(S.document().schemaType(type).documentId(type).title(subtitle || title))

export const structure: StructureResolver = (S) =>
  S.list()
    .title('People & Places')
    .items([
      S.listItem()
        .title('Pages')
        .id('pages')
        .child(
          S.list()
            .title('Pages')
            .items([
              S.listItem()
                .title('Homepage')
                .id('homepage')
                .child(
                  S.list()
                    .title('Homepage')
                    .items([
                      S.listItem()
                        .title('The seven main sections')
                        .id('homepage-core')
                        .child(
                          S.documentTypeList('homepageSection')
                            .title('Homepage sections')
                            .defaultOrdering([{field: 'order', direction: 'asc'}]),
                        ),
                      // Kept separate from the seven above because it is a
                      // different kind of thing: those are the page's fixed
                      // narrative, this is anything else somebody wants to add.
                      S.listItem()
                        .title('Extra sections you can add')
                        .id('homepage-extra')
                        .child(
                          S.documentTypeList('flexibleSection')
                            .title('Extra homepage sections')
                            .defaultOrdering([
                              {field: 'placement', direction: 'asc'},
                              {field: 'positionWithinPlacement', direction: 'asc'},
                            ]),
                        ),
                    ]),
                ),
              single(S, 'aboutPage', 'About', 'About page'),
              single(S, 'bookingFlow', 'Contact & Booking', 'Contact and booking copy'),
              single(S, 'originStory', 'Our Story', 'Origin story'),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('Experiences')
        .id('experiences')
        .child(
          S.list()
            .title('Experiences')
            .items([
              S.listItem()
                .title('All experiences')
                .id('all-tours')
                .child(S.documentTypeList('tour').title('All experiences')),
              single(S, 'featuredTourCollection', 'Featured on the homepage'),
            ]),
        ),

      S.listItem()
        .title('Photos & People')
        .id('people')
        .child(
          S.list()
            .title('Photos & People')
            .items([
              S.listItem()
                .title('Team')
                .id('team')
                .child(S.documentTypeList('founderProfile').title('Team')),
              S.listItem()
                .title('Guest reviews')
                .id('reviews')
                .child(S.documentTypeList('review').title('Guest reviews')),
              S.listItem()
                .title('Guest stories')
                .id('stories')
                .child(S.documentTypeList('guestStory').title('Guest stories')),
            ]),
        ),

      S.divider(),

      S.listItem()
        .title('Site Details')
        .id('site')
        .child(
          S.list()
            .title('Site Details')
            .items([
              single(S, 'siteSettings', 'Contact details & hours'),
              single(S, 'navigation', 'Menu & footer'),
            ]),
        ),
    ])

export {SINGLETON_IDS}
