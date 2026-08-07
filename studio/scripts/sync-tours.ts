/**
 * Bring the fifteen tour documents in Sanity up to date with the catalogue the
 * live site renders.
 *
 * Sanity and the code own different halves of a tour. Sanity holds the parts an
 * editor changes — title, price, duration, group size, locations, description.
 * tours.js holds presentation: images, alt text, detail page URL, card order.
 * scripts/tour-source.mjs joins them. This script writes only the Sanity half.
 *
 * It exists because all fifteen tours had drifted. Sanity was still holding
 * descriptions and prices from months ago, so switching the build to read from
 * it would have quietly rewritten the whole catalogue with older copy. That was
 * found by building the site both ways and comparing, not by looking at Sanity.
 *
 * Deliberately uses patch().set() rather than createOrReplace: an editor may
 * have uploaded photographs or filled in fields the website does not read yet,
 * and replacing the document would silently delete them. Only the fields listed
 * below are touched.
 *
 * Run from studio/:  npx sanity exec scripts/sync-tours.ts --with-user-token
 */
import {getCliClient} from 'sanity/cli'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'

const client = getCliClient()
const root = join(__dirname, '..', '..')

function loadTours(): any[] {
  const source = readFileSync(join(root, 'tours.js'), 'utf8')
  const scope: any = {window: {}}
  new Function('window', source)(scope.window)
  const tours = scope.window.PEOPLE_PLACES_TOURS
  if (!Array.isArray(tours) || tours.length === 0) throw new Error('tours.js produced no tours')
  return tours
}

// "$3,000" -> 3000. tour-source.mjs formats the number back with Intl, so this
// has to be the plain value or the site would print "$$3,000".
function parsePrice(value: string): number {
  const amount = Number(String(value).replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(amount) || amount <= 0) throw new Error(`Cannot read a price from "${value}"`)
  return amount
}

// The site renders group size from three fields, so writing it back means
// undoing that. "1-8 People" splits into a min and a max; anything else — like
// "1–12 (larger by arrangement)" — is kept verbatim as the note, which is what
// tour-source.mjs falls back to. Note the en dash: both forms appear in the
// catalogue and only the hyphen form is a range.
function parseGroupSize(value: string): {groupSizeMin?: number; groupSizeMax?: number; groupSizeNote?: string} {
  const range = /^(\d+)-(\d+)\s+People$/i.exec(String(value).trim())
  if (range) return {groupSizeMin: Number(range[1]), groupSizeMax: Number(range[2]), groupSizeNote: undefined}
  const openEnded = /^(\d+)\+\s+People$/i.exec(String(value).trim())
  if (openEnded) return {groupSizeMin: Number(openEnded[1]), groupSizeMax: undefined, groupSizeNote: undefined}
  return {groupSizeMin: undefined, groupSizeMax: undefined, groupSizeNote: String(value).trim()}
}

async function run() {
  const tours = loadTours()
  console.log(`Read ${tours.length} tours from tours.js`)

  let transaction = client.transaction()
  for (const tour of tours) {
    const fields = {
      title: tour.title,
      duration: tour.duration,
      price: parsePrice(tour.price),
      currency: 'USD',
      priceUnit: tour.priceUnit || undefined,
      // tour-source.mjs joins this array with ", ", so split on the same thing.
      locations: String(tour.location || '').split(',').map((part: string) => part.trim()).filter(Boolean),
      destination: tour.destination,
      categories: tour.categories || [],
      vibes: tour.vibes || [],
      // The catalogue card uses packageDescription where it has one; that is the
      // text a visitor actually reads on the Experiences page.
      description: tour.packageDescription || tour.description,
      commandSummary: tour.commandSummary || undefined,
      active: true,
      ...parseGroupSize(tour.groupSize),
    }

    // Setting a field to undefined does not remove it — Sanity simply ignores
    // that key and the old value survives. It has to be unset explicitly.
    //
    // This mattered for group size. "Just Go Ghana" reads "1–12 (larger by
    // arrangement)", which is a note rather than a range, so the sync wrote the
    // note but left groupSizeMax: 12 in place from before. tour-source.mjs
    // prefers a max when it finds one, so the site kept printing "1-12 People"
    // and ignored the note entirely — a difference that survived the first sync
    // and only showed up in the build diff.
    const present = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined))
    const absent = Object.entries(fields).filter(([, value]) => value === undefined).map(([key]) => key)
    transaction = transaction.patch(`tour-${tour.slug}`, patch =>
      absent.length ? patch.set(present).unset(absent) : patch.set(present))
    console.log(`  tour-${tour.slug.padEnd(16)} ${tour.price.padEnd(7)} ${tour.groupSize}`)
  }

  console.log('\nWriting to Sanity...')
  await transaction.commit()
  console.log('  written')
  console.log('\nDone. The build should now produce an identical site from Sanity.')
}

run().catch(error => {
  console.error('\nSync failed:', error.message)
  process.exit(1)
})
