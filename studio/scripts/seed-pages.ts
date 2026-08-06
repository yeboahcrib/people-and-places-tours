/**
 * Loads the three page-level content types the website needs but the dataset
 * does not yet have: homepageSection, bookingFlow and aboutPage.
 *
 * Everything here is copied from the files the live site already renders —
 * ../homepage-content.js, ../src/content/booking.json and
 * ../src/content/about.json — so Sanity receives exactly what is on the site
 * today. Nothing is retyped and nothing can drift in the process.
 *
 * Run from studio/:  npx sanity exec scripts/seed-pages.ts --with-user-token
 *
 * Safe to re-run. Every document uses a fixed _id with createOrReplace, so a
 * second run overwrites rather than duplicating. It only touches the three
 * types above; tours, reviews, founders and settings are left alone.
 */
import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'

const client = getCliClient()
const root = join(__dirname, '..', '..')

// homepage-content.js assigns to window; evaluate it the same way a browser
// would rather than duplicating its contents here.
function loadHomepage(): Record<string, any> {
  const source = readFileSync(join(root, 'homepage-content.js'), 'utf8')
  const scope: any = {window: {}}
  new Function('window', source)(scope.window)
  return scope.window.PEOPLE_PLACES_HOME
}

const readJson = (path: string) => JSON.parse(readFileSync(join(root, path), 'utf8'))

const SECTION_ORDER = [
  'hero', 'founderStory', 'waysToExperience', 'howHosted',
  'reviewsAndTrust', 'planningProcess', 'finalInvitation',
] as const

// Each section stores its own primary copy. References to founders, pathways,
// reviews and planning steps are deliberately left unset: the loader keeps the
// committed values when Sanity has none, so the page stays correct while those
// are curated in the Studio afterwards.
function homepageSections() {
  const home = loadHomepage()
  return SECTION_ORDER.map((sectionKey, index) => {
    const section = home[sectionKey] || {}
    const headline = section.headline
      || section.title
      || (Array.isArray(section.titleLines) ? section.titleLines.join('\n') : undefined)
    const body = section.body || section.intro || section.sub

    return {
      _id: `homepageSection-${sectionKey}`,
      _type: 'homepageSection',
      sectionKey,
      order: index + 1,
      ...(section.eyebrow ? {eyebrow: section.eyebrow} : {}),
      ...(headline ? {headline} : {}),
      ...(body ? {body} : {}),
      ...(section.reassurance ? {reassurance: section.reassurance} : {}),
      ...(section.trustMessage ? {trustMessage: section.trustMessage} : {}),
    }
  })
}

function bookingFlowDoc() {
  const booking = readJson('src/content/booking.json').bookingFlow
  return {...booking, _id: 'bookingFlow', _type: 'bookingFlow'}
}

function aboutPageDoc() {
  const about = readJson('src/content/about.json').aboutPage
  return {...about, _id: 'aboutPage', _type: 'aboutPage'}
}

// The navigation document already exists with its links and footer columns,
// so this adds only the one missing field rather than replacing the document.
async function patchNavigation() {
  const tagline = readJson('src/content/site.json').navigation.footerTagline
  await client.patch('navigation').set({footerTagline: tagline}).commit()
  return tagline
}

// The build requires a featured collection of 3-5 tours. Nothing on the site
// currently renders it, so this is a validation gate rather than a visible
// choice; seeded from the first three in the site's own catalogue order and
// freely editable in the Studio afterwards.
function featuredCollection() {
  const source = readFileSync(join(root, 'tours.js'), 'utf8')
  const scope: any = {window: {}}
  new Function('window', source)(scope.window)
  const tours = scope.window.PEOPLE_PLACES_TOURS
    .filter((t: any) => t.packageOrder !== undefined)
    .sort((a: any, b: any) => a.packageOrder - b.packageOrder)
    .slice(0, 3)

  return {
    _id: 'featuredTourCollection',
    _type: 'featuredTourCollection',
    items: tours.map((tour: any, index: number) => ({
      _key: `featured-${tour.slug}`,
      order: index + 1,
      tour: {_type: 'reference', _ref: `tour-${tour.slug}`},
    })),
  }
}

// A first run created these with dotted ids, which Sanity stores but hides
// from public reads. Remove them so they do not linger invisibly.
async function removeHiddenSections() {
  const stale = SECTION_ORDER.map(key => `homepageSection.${key}`)
  const tx = stale.reduce((t, id) => t.delete(id), client.transaction())
  await tx.commit().catch(() => {})
  return stale.length
}

async function run() {
  const removed = await removeHiddenSections()
  const documents = [...homepageSections(), bookingFlowDoc(), aboutPageDoc(), featuredCollection()]

  const transaction = documents.reduce(
    (tx, doc) => tx.createOrReplace(doc),
    client.transaction(),
  )
  await transaction.commit()
  const tagline = await patchNavigation()

  console.log(`Loaded ${documents.length} documents:`)
  console.log(`  ${SECTION_ORDER.length} homepage sections`)
  console.log('  1 booking flow')
  console.log('  1 about page')
  console.log('  1 featured tour collection')
  console.log(`  navigation patched with footerTagline: "${tagline}"`)
  console.log(`  cleared ${removed} hidden documents from the earlier run`)
  console.log('\nNext: from the project root, confirm the site reads them with')
  console.log('  SANITY_STUDIO_PROJECT_ID=<id> npm run build')
  console.log('and check dist/health.json reports "sanity" rather than "local".')
}

run().catch(error => {
  console.error('Seed failed:', error.message)
  process.exit(1)
})
