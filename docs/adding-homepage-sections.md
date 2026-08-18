# Adding a Homepage Section

Written 17 August 2026, when the founder asked for someone to be able to
"genuinely add a page or section one day" and have it follow the site's theme.

This covers **homepage sections**. Whole new pages are a separate, larger job —
see "What this does not do" at the end.

## For whoever edits the site

You do not need a developer, and you cannot break the homepage.

In the Studio: **Pages → Homepage → Extra sections you can add → New**.

Then four questions:

1. **Name this section.** Only you see this. It is how you find it again.
2. **What should it look like?** Four choices, described below. Each already
   matches the site — you choose the shape, and the fonts, colours, spacing and
   animation are handled for you.
3. **Where on the page?** A list of positions: at the top, after the founder
   story, after the reviews, at the bottom, and so on.
4. **Show this section on the website?** Leave it **off** while you write.
   Nothing appears to visitors until you turn it on.

Fill in the content, switch it on, publish. It appears the next time the site
builds.

### The four layouts

| Layout | What it is | Good for |
| --- | --- | --- |
| **Photo beside text** | A picture on one side, a heading and paragraph on the other. You choose which side. | Introducing a place, a person, an idea |
| **Row of cards** | Two to four boxes, each with an optional photo, a heading and a line of text. Cards can link somewhere. | Listing things |
| **Quote** | One large quote with a name under it. | A single powerful review or statement |
| **Invitation** | A heading, a line of reassurance, and one or two buttons. | Prompting someone to get in touch |

Each can be **light** (black on white) or **dark** (white on charcoal). Try to
alternate rather than putting two dark sections next to each other.

### Things worth knowing

- **A photo has to be approved.** Uploading it is not enough — set it to
  "Yes, publish it". A photo still under review is skipped, and for the "photo
  beside text" layout the section will show its words without the picture.
- **An unfinished section stays off the page.** If you switch a section on but
  it has nothing to show — a quote layout with no quote, a card row with no
  cards — it is left off and the reason is written into the build log. It does
  not appear half-built and it does not break anything else.
- **A broken button costs you the button, not the section.** A link that is not
  a page on this site or a full `https://` address is dropped; everything else
  still publishes.
- **Two sections in the same position** are ordered by the number in
  "which comes first?", then alphabetically. Never randomly.
- **Deleting a section removes it.** So does switching it off, which is the
  safer way to take something down temporarily.

## For whoever maintains the code

### How it fits together

The seven original sections are the site's narrative spine. Each has bespoke
markup in `homepage-sections.js` because each does something no other section
does. That is right for them and wrong as a general rule — it is why adding an
eighth section used to mean writing one.

`renderHomepageMarkup()` no longer calls seven renderers in sequence. It walks
a **plan**: a list where each entry is either `{key}` for a built-in section or
`{layout, ...content}` for one an editor added. Content with no plan falls back
to the seven in their designed order, which is exactly what the committed
homepage does today — so nothing changed for the existing site.

`scripts/homepage-source.mjs` builds that plan in `planSections()`. Placement
values are `top` or `after:<builtInKey>`, which is why an added section can sit
anywhere without needing to know about decimal ordering.

### Why the layouts stay on-theme

Every layout is composed from the vocabulary the fixed sections already use —
`container`, `section-pad`, `white-lift`, `eyebrow`, `section-title`, `btn`,
`reveal` — and the CSS in the `EDITOR-ADDED SECTIONS` block of `style.css` is
written entirely in design tokens. An added section therefore inherits the
site's type scale, colour, spacing, elevation and motion rather than carrying
its own. That is the mechanism behind "it follows the theme"; it is not a
convention anyone has to remember.

### Adding a fifth layout

Three places, and a test that fails if you miss one:

1. A renderer in `homepage-sections.js`, added to `FLEX_LAYOUTS`.
2. The name in `FLEX_LAYOUTS` in `scripts/homepage-source.mjs`, plus a
   renderability rule in `isFlexSectionRenderable()` and a sentence in
   `FLEX_NEEDS` explaining what it needs.
3. An option in the `layout` list in
   `studio/schemaTypes/documents/flexibleSection.ts`, and any layout-specific
   fields (use the existing `showFor(...)` helper to hide them for other
   layouts).

`tests/homepage-layouts.mjs` asserts all three lists agree, and that every
layout renders a `<section>` carrying the shared classes without leaking
`undefined` into the markup. `npm run test:layouts` runs it; it is also part of
`npm run build`.

### Verification when this was built

- Schema: `sanity schema validate` — 0 errors, 0 warnings.
- All four layouts rendered at **375 / 430 / 768 / 1024 / 1440** in both light
  and dark tones: no horizontal overflow, no tap target under 32px, no console
  errors, all images loading at every width.
- `test:visual` — no change across 63 screenshots. The existing homepage is
  byte-identical, because with no added sections the plan is the original seven.
- `check:sanity` — still 21 pages identical against the live dataset.
- `build`, `test:smoke`, `test:responsive`, `test:resilience`,
  `test:pathway-spotlight` — all green.

One cosmetic fix came out of actually looking at the render rather than the
numbers: a card with no photo, sitting in a row beside cards that have one,
left a void beneath its text that read as a broken image. Its body is now
vertically centred.

## What this does not do

- **It does not create new pages.** The build discovers pages by scanning the
  repository for `.html` files, so a new page is still a developer task.
  Generating pages from Sanity is feasible — the shell, navigation, footer and
  meta machinery already exist in `scripts/shared-shell.mjs` and
  `scripts/render-meta.mjs` — and a page is largely "a shell plus a list of
  sections", which is the thing this work just built. It would also need to
  touch the navigation and `sitemap.xml`.
- **It does not add sections to other pages.** About, Packages and the tour
  pages are hand-written HTML with no mount point for editable sections.
- **It does not offer free-form design.** That is deliberate. The four layouts
  are what keeps an added section looking like it belongs; an editor who can
  set arbitrary colours and spacing can also make a section that does not.
