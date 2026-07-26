import type {StructureResolver} from 'sanity/structure'

/**
 * Singletons (siteSettings, navigation, originStory, featuredTourCollection)
 * get a pinned single-document entry instead of a list — there should only
 * ever be one of each.
 */
const SINGLETONS = [
  {id: 'siteSettings', type: 'siteSettings', title: 'Site Settings'},
  {id: 'navigation', type: 'navigation', title: 'Navigation & Footer'},
  {id: 'originStory', type: 'originStory', title: 'Origin Story'},
  {id: 'featuredTourCollection', type: 'featuredTourCollection', title: 'Featured Tour Collection'},
]

const SINGLETON_TYPES = new Set(SINGLETONS.map((s) => s.type))

export const structure: StructureResolver = (S) =>
  S.list()
    .title('People & Places Content')
    .items([
      ...SINGLETONS.map((s) =>
        S.listItem()
          .title(s.title)
          .id(s.id)
          .child(S.document().schemaType(s.type).documentId(s.id)),
      ),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (listItem) => !SINGLETON_TYPES.has(listItem.getId() as string),
      ),
    ])
