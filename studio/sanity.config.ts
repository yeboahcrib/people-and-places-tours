import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {schemaTypes} from './schemaTypes'
import {structure, SINGLETON_IDS} from './deskStructure'

/**
 * Project ID and dataset come from studio/.env
 * (SANITY_STUDIO_PROJECT_ID / SANITY_STUDIO_DATASET) rather than being
 * hardcoded — see studio/README.md.
 *
 * The Studio is set up for people who are not developers:
 *
 * - The sidebar is organised by page, not by data type (see deskStructure).
 * - Vision, the raw query console, is not loaded. It is a developer tool and
 *   only invites confusion here; re-add `visionTool()` temporarily if you ever
 *   need to debug a query.
 * - Pages that should only ever exist once cannot be duplicated or deleted by
 *   accident. There is one Contact page, so the Studio does not offer to make
 *   a second one or to remove the only one.
 */

const SINGLETONS = new Set(SINGLETON_IDS)

export default defineConfig({
  name: 'people-and-places',
  title: 'People & Places',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'REPLACE_WITH_PROJECT_ID',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [structureTool({structure})],

  schema: {
    types: schemaTypes,
  },

  document: {
    // Remove the create/delete/duplicate actions on one-of-a-kind pages.
    actions: (input, context) =>
      SINGLETONS.has(context.schemaType)
        ? input.filter(({action}) => !['unpublish', 'delete', 'duplicate'].includes(action as string))
        : input,

    // Keep one-of-a-kind pages out of the global "create new" menu.
    newDocumentOptions: (prev) =>
      prev.filter((template) => !SINGLETONS.has(template.templateId)),
  },
})
