import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './deskStructure'

/**
 * Project ID and dataset come from your own Sanity project (free tier).
 * Create one at https://www.sanity.io/manage, then set these as
 * environment variables (SANITY_STUDIO_PROJECT_ID / SANITY_STUDIO_DATASET)
 * rather than hardcoding them here — see studio/README.md.
 */
export default defineConfig({
  name: 'people-and-places',
  title: 'People & Places — Content',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'REPLACE_WITH_PROJECT_ID',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
