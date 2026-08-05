# Sprint 4B — Full-Site UI Audit

**Version:** 1.0
**Status:** Audit complete; founder review recommended before implementation begins
**Prepared:** July 2026
**Scope:** Every page outside the homepage and outside the off-limits components named in `CLAUDE.md`
**Implementation:** None. This document does not modify any site code — it is
the audit that Sprint 4B's rebuild work should be planned against.

## What was audited

- `about.html`
- `contact.html`
- `packages.html` (page shell only — hero, filter bar, footer; **the
  `#tours-grid` card grid itself is off-limits per `CLAUDE.md` and is not
  critiqued here**)
- The tour-detail page template, sampled via `aburi-tour.html` and
  `cape-coast-tour.html` (byte-identical structure/CSS apart from
  page-specific copy — confirmed with a direct diff), plus `just-go-ghana.html`
  as the one structurally distinct multi-day tour page
- `thanks.html`

**Explicitly out of scope, per `CLAUDE.md`'s off-limits list** — considered,
not critiqued:
- The `packages.html` card grid ("the strongest layout on the site").
- The tour-detail booking sidebar (`.booking-card`, `.content-right`).
- The day-by-day accordion itinerary (`.itinerary` / `.day-item` on
  `just-go-ghana.html`).
- The included/not-included checklist (`.inc-exc` / `.inc-list` / `.exc-list`).

Method: read every file listed above in full, diffed the tour-page template
against a second sample to confirm duplication, and screenshotted
`about.html`, `contact.html`, `packages.html`, `aburi-tour.html` and
`just-go-ghana.html` at 375/768/1440px for a visual cross-check. Screenshots
were scratch-only and are not part of this deliverable.

## Executive finding

**The site currently runs two unrelated design systems side by side, and the
older one is the majority by page count.** `index.html`, `about.html`,
`contact.html`, `packages.html` and `thanks.html` (5 pages) share `style.css`
and its class vocabulary — page-hero, footer-brand/footer-contact-item,
`.faq-section`/`.faq-list` with real `aria-expanded` buttons. All 15
tour-detail pages, including `just-go-ghana.html`, instead carry their own
~90–170 line inline `<style>` block in `<head>`, their own hero pattern, their
own footer markup, and their own FAQ markup — a second, parallel component
system that predates (and was untouched by) the nav unification and homepage
redesign work visible in recent git history. Visually this reads as two
different brands: about.html is a dark, generously-spaced editorial page;
the tour pages switch to a white-background, dense two-column brochure feel
the moment you scroll past the hero.

This is the single biggest thing Sprint 4B needs to resolve — not a series of
small polish items on individual pages, but one structural rebuild of the
tour-page template, because it accounts for 15 of the site's 20 pages.

---

## Page-by-page findings

### `about.html`

**Current state:** Uses the shared `style.css` system correctly (page-hero,
`.stats-section`, `.faq-section` with real `<button aria-expanded>` toggles,
`.footer-brand`/`.footer-contact-item` footer). Structurally sound. Just
received a content-accuracy pass (Sprint 1 truth corrections) that did not
touch layout.

**Issues found:**
- Heavy reliance on inline `style=""` attributes for typography and spacing
  throughout — e.g. `about.html:67-69` (three paragraphs with hand-set
  `font-size`/`color`/`line-height`/`margin-bottom` each), `about.html:196-210`
  (entire Mission Banner section styled inline, no classes at all). This
  isn't broken, but it means a future type-scale or spacing-rhythm change
  requires editing this file directly rather than `style.css` — the opposite
  of how `homepage-sections.js` is built.
- Footer legal links are dead: `about.html:337-338`
  (`<a href="#">Privacy Policy</a>`, `<a href="#">Terms &amp; Conditions</a>`)
  — same gap the truth-correction backlog already flagged (no policy pages
  exist yet), just noting it also shows up here structurally.
- The "Team" section (`about.html:163-193`) was just rebuilt with initials
  placeholders for the two real founders — functionally correct now, but
  visually it's the newest, sparest component on the page next to
  older, denser sections (why-grid, stats, FAQ). Worth revisiting once real
  founder photography exists so the whole page reads as one pass rather than
  "old page + one new section."

**Rebuild recommendation:** Convert the inline-styled sections
(Story, Mission Banner) into classed components matching the homepage's
spacing/typography scale. Keep the FAQ, stats, and footer structure as-is —
they already match the shared system and don't need re-architecture, only a
visual pass once the rest of the page is rebuilt so type scale and spacing
feel continuous.

---

### `contact.html`

**Current state:** Same shared-system foundation as about.html
(`.page-hero`, `.faq-section` with real buttons, `.footer-brand`/
`.footer-contact-item`). Just received the Sprint 1 response-time/deposit
content fixes.

**Issues found:**
- Same inline-style density as about.html — the entire "What Happens Next?"
  sidebar (`contact.html:198-227`) and the "Prefer to Talk?" callout
  (`contact.html:229-236`) are built from one-off `style=""` blocks with no
  reusable classes.
- Same dead footer legal links (`contact.html:385-386`).
- The map section (`contact.html:243-259`) is a static Unsplash image with a
  text overlay, not an actual embedded map — reads as a placeholder. Not
  flagged as broken (no functional claim is being made), but worth deciding
  whether a real embed is in scope for this rebuild or stays a placeholder
  by design.

**Rebuild recommendation:** Same treatment as about.html — externalize the
inline-styled blocks into shared classes. Lower urgency than about.html since
this page is more transactional (a form + FAQ) than narrative, and its
current structure already functions correctly.

---

### `packages.html` (shell only)

**Current state:** Nav, hero, filter-tab bar, and footer all match the
shared system exactly — byte-for-byte the same footer structure as
about.html and contact.html. No inline-style sprawl outside the (off-limits)
grid area. This page shell is in good shape.

**Issues found:** None outside the off-limits grid. The "Custom Itinerary"
CTA block (`packages.html:79-89`) uses inline styles but it's a single
one-off block, not a pattern repeated site-wide — low priority.

**Rebuild recommendation:** No structural rebuild needed. Revisit only for a
final visual-consistency pass once about.html/contact.html and the tour
pages are rebuilt, to confirm spacing/type scale still match.

---

### Tour-detail page template (`aburi-tour.html`, `cape-coast-tour.html`, and by extension all 15 tour pages)

**Current state:** Every tour page ships its own `<style>` block
(`aburi-tour.html:13-102`, 88 lines) that redefines `:root` colors locally
(`aburi-tour.html:14`: `--yellow`, `--black`, `--dark`, `--white`, `--gray`)
rather than inheriting from `style.css`'s `:root`. A direct diff of
`aburi-tour.html` against `cape-coast-tour.html` shows the CSS and markup
are identical except for page-specific copy — this is one template
copy-pasted 15 times, not 15 independent designs.

**Issues found:**
- **Color-drift risk, not just duplication.** The local `:root` values
  happen to match `style.css`'s current palette today (both say
  `--yellow:#FFB81C`), but nothing enforces that. If the brand palette in
  `style.css` changes again (it already changed once — see the "drop forest
  green" commit in git history), these 15 pages will silently go out of sync
  unless each is edited individually.
- **Different hero pattern than the rest of the site.** `.trip-hero` /
  `.hero-abbr` (`aburi-tour.html:27,38`) is a bespoke dark hero with a giant
  low-opacity watermark word — visually similar in spirit to `about.html`'s
  hero but implemented as an entirely separate component with its own CSS,
  not a shared `.page-hero` variant.
- **Different footer markup.** `aburi-tour.html:236-278` uses `<footer>`
  with no `role="contentinfo"`, a `.footer-inner` grid of `.footer-col`
  divs containing flat `<a>` tags — compare to the shared system's
  `<footer role="contentinfo">` with `<ul class="footer-links" role="list">`
  used on about/contact/packages. Same content (Quick Links, Packages,
  Contact), different markup, different semantics.
- **Different FAQ markup.** `aburi-tour.html:204-228` uses
  `<div class="faq-q">` with no `<button>` element and no `aria-expanded`
  in the markup — compare to `about.html`/`contact.html`'s
  `<button class="faq-question" aria-expanded="...">`. In practice this is
  **not a functional accessibility gap**: `script.js`'s
  `bindStandaloneToggle()` (script.js:399-418) progressively enhances these
  divs at runtime with `role="button"`, `tabindex="0"`, `aria-expanded`, and
  Enter/Space keyboard handling. It works, but it's more fragile than just
  using a real `<button>` to begin with, and it's a second FAQ
  implementation to maintain alongside the shared system's.
- **Visually a different brand once you scroll past the hero.** The hero
  is dark and similar in tone to about.html's; the moment the page reaches
  `.content-wrap` it switches to a white background with a dense, compact
  two-column brochure layout — smaller type, tighter spacing, plain black
  body text. Confirmed visually via screenshot comparison at 1440px: about.html
  stays dark and spacious through its "Story" section, while aburi-tour.html's
  equivalent content area is stark white and noticeably denser.
- `just-go-ghana.html` carries the same template family (identical `:root`
  redefinition pattern, same footer/FAQ markup) but is otherwise the most
  divergent single page, because it alone needs the day-by-day itinerary
  accordion and a testimonials block the other 14 pages don't have. That
  content structure is off-limits per `CLAUDE.md` and should stay exactly as
  is; only its shared chrome (hero, footer, FAQ, nav) should be brought in
  line with the rest of the rebuild.

**Rebuild recommendation:** This is the priority item for Sprint 4B. Build
one shared tour-detail template (or a small set of `style.css` classes) that
all 15 pages consume instead of duplicating a local `<style>` block. Concretely:
replace the local `:root` redefinition with the global one, replace the
bespoke footer with the shared `footer-brand`/`footer-contact-item` markup
already used on about/contact/packages, replace `.faq-q` divs with real
`<button aria-expanded>` elements (script.js's enhancement can be simplified
or removed once markup is semantic), and bring the hero and content-area
typography/spacing in line with the homepage's visual language — while
leaving the booking sidebar, checklist, and (on `just-go-ghana.html`) the
day-by-day accordion completely untouched, per `CLAUDE.md`.

---

### `thanks.html`

**Current state:** Minimal, correctly uses the shared `.page-hero` system,
`noindex` meta tag present (correct for a post-form thank-you page).

**Issues found:** No footer at all — this is the one page in the site
without one. Given it's a minimal utility page reached only after form
submission, this may be intentional rather than an oversight, but it's worth
a founder decision either way.

**Rebuild recommendation:** None needed structurally. Lowest priority in
this sprint — optionally add a minimal footer for consistency if the
founders want every page to carry one.

---

## Prioritized punch list

1. **Rebuild the tour-detail page template (all 15 pages + `just-go-ghana.html`'s shared chrome).** Highest priority by far: it's 15 of the site's 20 pages, it's the most visually divergent from the rest of the site, and it carries real technical debt (duplicated CSS, a silent color-drift risk, a non-semantic footer, a second FAQ implementation). One template fix here resolves 15 pages at once.
2. **Rebuild `about.html`'s inline-styled sections** (Story, Mission Banner). Second priority: it's the highest-traffic narrative page after the homepage, and the inline-style density makes it the hardest of the shared-system pages to keep in sync with future type/spacing changes.
3. **Rebuild `contact.html`'s inline-styled sections** (What Happens Next sidebar, Prefer to Talk callout). Same treatment as about.html, lower urgency since the page is transactional rather than narrative and nothing here is broken.
4. **Confirm `packages.html`'s shell** still matches once 1–3 are done — no rebuild needed, just a final consistency check.
5. **`thanks.html`'s missing footer** — founder call on whether it's intentional; lowest priority either way.
