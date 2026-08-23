# Handoff — 21 to 23 August 2026

Written at the end of a long session. Everything below either shipped or is
sitting in an open pull request.

## Live on peopleplacesgh.com

**Four legal pages**, built on Buoyant Travel's structure rather than
TravelMo's — separate short pages under a **Legal** footer column:
`/booking-terms`, `/cancellation-refund-policy`, `/travel-insurance`,
`/privacy-policy`. All CMS-backed and editable under Pages in the Studio.

**`/travel-information`**, in the main navigation. Nine of the Google Site's
fourteen FAQs already existed on the new site; this holds the five that did
not — currency, SIM cards, packing, airport transfers, food.

**The catalogue matches the founders' tour document.** Ten day tours plus the
package. Jamestown withdrawn; Elmina, Kente Village and Akosombo folded into
the tours they belong to, with permanent redirects.

**Decisions the founders made, now published:**

- One securing payment for every trip: **$400 per person**, no percentages.
  Custom trips are planned and quoted free, and the payment is taken only
  after the traveller approves the itinerary.
- **Travel insurance is required**, proof due 30 days before departure.
- **Photography**: booking grants permission, with opt-out at any time and
  removal on request. Explicitly excludes marketing photography of guests at
  Assin Manso, Cape Coast Castle and the Door of No Return without asking on
  the day.
- **Rooms**: solo travellers are paired by gender or pay a supplement quoted
  before payment. A roommate we fail to find is our cost. A move requested
  over someone's conduct is at our cost; a move over preference is not.
- Day tour cancellations: full refund at 48 hours, none inside.
- Card payments go through **Taptap Send**; Vodafone Cash is now Telecel Cash.

## Open pull requests

| PR | What it is |
| --- | --- |
| [#8](https://github.com/yeboahcrib/people-and-places-tours/pull/8) | The package itinerary into the CMS, and a git snapshot of all migrated content |
| [#9](https://github.com/yeboahcrib/people-and-places-tours/pull/9) | Phase 3 — the tour page generator, off by default |

`preview-generated-tours` is a **review branch that must not be merged**. It
inverts the generation default so the Cloudflare preview shows generated
pages.

## Errors found and fixed, and what now prevents them

Every guard below was verified by reintroducing the bug.

| What was wrong | What stops it now |
| --- | --- |
| Four tours advertised lunch as included; the document excludes it everywhere | `tests/tour-pages-content.mjs` fails if any day tour stops excluding lunch |
| Catalogue said $110, the tour's own page said $100 | `tests/build-output.mjs` compares every card against the page it links to |
| A fifth nav link pushed "Book a Tour" off screen between 1024 and 1180px | `tests/responsive.js` measures that button against the viewport |
| The build truncated the policy page it rendered into | Rendering twice must be a no-op, and tags must balance |
| Cape Coast promised the Kakum canopy walk, which is a different tour | Guarded in the content test |
| Four assertions frozen at "15 tours" broke when a tour was switched off | All derive from the catalogue the build rendered |

**The visual baseline was re-recorded while a page was broken**, which blessed
the bug instead of failing on it. Look at what changed before re-recording.

## Two things that will bite the next person

**Sanity and code deploy on different clocks.** A CMS edit reaches production
in about two minutes; code waits for a merge. A change spanning both must land
code-first, or the live site contradicts itself — it did, for hours, on three
prices.

**Patching a Sanity array strips `_key` unless you select it.** Query the whole
document, not a projection, or the Studio reports missing keys. Repaired twice
on `navigation` and `bookingFlow`.

## Not done

- **Cape Coast Day Tour ($160)** and **Volta Community Tour ($230)** are sold
  and absent from the site. They are the first thing Phase 4 should add, and
  after the generator they are a form, not a page build.
- **Batik** still sells at $120; the founders chose to move it to Local
  Experiences with the other seven, which the site has no surface for yet.
- **Kumasi's $400 flight option** and **Cape Coast's $180 naming ceremony** are
  in the CMS and render nowhere.
- The **Just Go Ghana page is not generated** — it has the itinerary and needs
  its own template.
- **#Connect4Change** has no page, despite being a homepage pillar on the
  Google Site. Two of the four services — Hotel Accommodation, Travel
  Documentaries & Photography — are unmentioned. The Tamaro Diallo testimonial
  is unmigrated.
- **No Ghanaian lawyer has read the four legal pages**, and they are live.
- **Data Protection Commission registration** under Act 843 is unconfirmed. The
  privacy policy deliberately claims nothing about it.
- The site still runs on stock photography.
