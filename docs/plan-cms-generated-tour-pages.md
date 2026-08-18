# Plan — Tour Pages Generated From Sanity

Written 17 August 2026, after the founder asked what it would take to add a new
tour or experience through the CMS.

## The problem in one paragraph

Tours are half in the CMS. Add one in Sanity today and it appears in the
packages grid, the homepage cards, the contact dropdown and site search — but
its "View Experience" link goes nowhere, because each tour's detail page is a
hand-written HTML file and there are fifteen of them. Adding a tour therefore
still needs a developer, which is the one thing the CMS was meant to remove.

## What is already in place

Three things make this smaller than it sounds.

**The fifteen pages are near-identical.** Twelve of the fifteen are 290–295
lines with the same structure: hero, meta row, tag row, highlights card, FAQ
list, "you may also like" cards, booking sidebar. `just-go-ghana.html` (542
lines) is the outlier because it adds a day-by-day itinerary.

**Most tour content is already in Sanity** — name, price, duration, locations,
what is and is not included, group sizes, starting point, description, the
cultural-context story, photos, categories, region.

**The page-generation machinery exists.** `scripts/build-static.mjs` already
injects navigation, footer, canonical URLs and inquiry mode into every page,
and `scripts/render-meta.mjs` already generates `sitemap.xml`. None of that
needs inventing — it needs pointing at a new source of pages.

## What is missing

| Missing | Where it lives now | Notes |
| --- | --- | --- |
| Highlights | Hard-coded per page (~5 rows each) | No schema field |
| FAQs | Hard-coded per page (6–7 each) | No schema field |
| Day-by-day itinerary | `just-go-ghana.html` only (8 days) | No schema field; needed for multi-day |
| Meals per day | Same page | Part of the itinerary |
| "You may also like" | Hard-coded 3 cards per page | Should be derived, not authored |

That is the real content work: roughly 15 × 5 highlights and 15 × 6 FAQs to
move across, plus one itinerary.

## The plan

### Phase 1 — Schema (small, no site change)

Add to the `tour` type: `highlights` (list of short lines), `faqs` (question +
answer pairs), and `itinerary` (day number, title, description, meals) shown
only when the trip is multi-day. Reuse the `showFor(...)` hidden-field pattern
already used in `flexibleSection`, so a day tour is never asked for an
itinerary.

Nothing on the live site changes. Ships independently.

### Phase 2 — Move the content across

Write a one-off script that reads the fifteen HTML files and writes the
highlights, FAQs and itinerary into their matching Sanity documents. Doing it
by script rather than by hand keeps it verifiable and re-runnable.

Then check every tour in the Studio against its live page. This is the phase
that needs a human eye, and it is where the time actually goes.

### Phase 3 — One template, fifteen pages

Build `scripts/render-tour-page.mjs`, generating a page per active tour at the
address in its `slug`. The build gains a step: for each tour, render the
template, run it through the existing nav/footer/meta injection, and write it
to `dist/`.

Two things stay exactly as they are, per the standing instruction in
`CLAUDE.md`: the booking sidebar and the included/not-included checklist. They
work; the template reproduces them rather than redesigning them.

**Verification before the old files are deleted:** generate the pages
alongside the existing ones and diff them. `check:sanity` already proves the
generated homepage matches the committed one — the same technique applies here,
and the fifteen generated pages should match the fifteen hand-written ones
before anything is removed.

### Phase 4 — Delete the fifteen files, connect the loose ends

Once the diff is clean: delete the HTML files, point "you may also like" at the
catalogue instead of hard-coded cards, and confirm `sitemap.xml` picks up
generated pages. Add a test that a tour switched off in Sanity leaves the site
and is not left as an orphaned page.

## Risks worth naming

- **Slugs are addresses.** Changing a slug after launch breaks existing links
  and search rankings. The schema now says so; a redirect rule would be safer
  still.
- **The visual baseline covers 21 pages.** Generated pages must be added to it,
  or the safety net has a hole exactly where the new machinery is.
- **A tour with missing content should fail visibly.** The homepage merge model
  falls back to committed content; there is no committed fallback for a tour
  page, so an incomplete tour should keep its page off the site rather than
  publish a page with gaps in it.

## Effort

Phase 1 is an hour. Phase 3 is the bulk of the engineering. Phase 2 is the bulk
of the *elapsed* time, because it needs reviewing rather than writing. Realistically
three or four working sessions, and it is best done as four separate merges
rather than one — each phase is independently safe to ship.

## What this unlocks

After it: adding an experience is filling in a form and switching it on. The
page, the cards, the search entry, the dropdown and the sitemap all follow.

It is also the groundwork for editable pages generally — a page is a shell plus
content, and Phase 3 builds exactly that.
