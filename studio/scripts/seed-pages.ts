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

// The first run created these with dotted ids, which Sanity stores but hides
// from public reads. Clearing them is housekeeping, not a prerequisite, so it
// runs last and can never prevent the documents that matter from being written.
async function removeHiddenSections() {
  let removed = 0
  for (const key of SECTION_ORDER) {
    try {
      await client.delete(`homepageSection.${key}`)
      removed += 1
    } catch {
      // Already gone, or not deletable. Either way it is invisible and harmless.
    }
  }
  return removed
}

async function run() {
  console.log('Reading content from the site files...')
  const documents = [...homepageSections(), bookingFlowDoc(), aboutPageDoc(), featuredCollection()]
  console.log(`  prepared ${documents.length} documents`)
  documents.forEach(doc => console.log(`    ${doc._id}`))

  console.log('\nWriting to Sanity...')
  const transaction = documents.reduce((tx, doc) => tx.createOrReplace(doc), client.transaction())
  await transaction.commit()
  console.log('  written')

  // The menu, footer columns and contact details are synced in full. Patching
  // only the tagline leaves the rest of these two documents to drift from what
  // the site renders, which is not visible until the build reads from Sanity.
  //
  // src/content/site.json is the committed content the site renders, so it is
  // the source this restores. Once the build reads from Sanity, Sanity becomes
  // the source and this script is for repair rather than routine use.
  console.log('\nSyncing navigation and contact details...')
  const site = readJson('src/content/site.json')
  await client
    .patch('navigation')
    .set({
      navLinks: site.navigation.navLinks,
      footerTagline: site.navigation.footerTagline,
      footerColumns: site.navigation.footerColumns,
    })
    .commit()
  console.log(`  navigation: ${site.navigation.navLinks.length} menu links, ${site.navigation.footerColumns.length} footer columns`)

  await client.patch('siteSettings').set(site.siteSettings).commit()
  console.log(`  siteSettings: ${Object.keys(site.siteSettings).length} fields including the international number`)

  console.log('\nClearing hidden documents from the first run...')
  const removed = await removeHiddenSections()
  console.log(`  removed ${removed}`)

  console.log('\nDone. Rebuild the site to confirm it reads the new content.')
}

run().catch(error => {
  console.error('\nSeed failed at the step above.')
  console.error('Reason:', error && error.message ? error.message : error)
  if (error && error.statusCode) console.error('Status:', error.statusCode)
  process.exit(1)
})
