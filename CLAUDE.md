# People & Places Tours — Contributor Notes

Static HTML/CSS/JS site with no frontend framework. A lightweight deployment
build validates browser JavaScript and copies approved public files into
`dist/`; it does not bundle or transform the site. Twelve committed HTML pages
plus the tour pages generated from the CMS share
`style.css` and `script.js`; the homepage additionally uses
`homepage-content.js` + `homepage-sections.js` (data + renderer) and `tours.js`
(the tour catalog used across the site).

The site is live at `https://peopleplacesgh.com` on **Cloudflare Pages, built
from `main`**. Cloudflare is connected to the GitHub repository and runs
`npm run build` itself, publishing the allow-listed `dist/` output and applying
`_headers`. **Merging to `main` is the deploy** — there is no separate publish
step. Pushing any other branch produces a `*.pages.dev` preview, which is where
a change should be checked before it is merged. GitHub Pages is switched off;
the old `yeboahcrib.github.io` URL returns 404. **Sanity has been the live
content source since 21 August 2026** — `SANITY_STUDIO_PROJECT_ID` is set in
Cloudflare's Production scope, and a publish webhook rebuilds the site (~140s)
without anyone touching the dashboard. Previews still build from the committed
files. See
`docs/hosting-and-delivery-architecture.md` before changing deployment, forms,
headers, or CMS integration.

Two consequences worth knowing before editing `contact.html` or the build:
`scripts/render-booking.mjs` sets `data-inquiry-mode` to `cloudflare` only when
`CF_PAGES` is present, so the `fallback` value in the committed source is
correct and must stay — a build that cannot run a Function must not point at
one. Likewise `scripts/render-meta.mjs` defaults `SITE_URL` to the live domain,
so canonicals, `sitemap.xml`, and `robots.txt` are generated at build time; the
copies in the repository root are inputs, not what ships.

A more detailed architecture handoff lives at `docs/claude-homepage-handoff.md`.

## Standing rule: responsive checks before "done"

**Any new feature, new page, or significant visual change must be verified at mobile, tablet, and desktop widths before it is considered complete.** This is not optional and not an afterthought — it is part of finishing the work, in the same way that running tests is.

### Minimum breakpoints to check

| Class | Width | What to keep an eye on |
| --- | --- | --- |
| Mobile small | ~375px (iPhone SE / similar) | Text overflow, tap-target size (≥32px), the floating pill nav collapses to logo + hamburger correctly, the booking sidebar stacks below content on tour pages |
| Mobile large | ~430px (Pro Max / similar) | Same as above; long phone numbers or button labels don't break the pill nav |
| Tablet | ~768px | Multi-column grids start collapsing; image bands don't bleed off; hero copy still readable |
| Laptop | ~1024px | Sidebars come back; nav links visible; pill nav stays centered |
| Desktop | ~1440px | The intended design — confirm spacing and rhythm hold up |

### What to look for

- **Horizontal overflow** — no scrollbar should appear at any width. (`body { overflow-x: hidden }` is set; that protects users but can hide a real layout bug. Treat document `scrollWidth > clientWidth` as a real issue unless you can prove it's an off-screen decorative element clipped by `overflow: hidden` on a positioned ancestor — the watermark text behind tour-page hero titles is one such case.)
- **Tap targets ≥ 32px tall × 32px wide on touch breakpoints** (mobile-sm, mobile-lg). Stretched-link patterns (`<a>` with `position: absolute; inset: 0`) are fine even if the text itself is shorter — measure the click area, not the text.
- **Pill nav** — frosted blur + gold active pill must remain legible on both dark hero photos and light content sections; compresses to logo + hamburger ≤ 768px; mobile drawer drops below the nav as its own rounded pill; "Book a Tour" CTA stays inside the drawer, not in the collapsed pill, on mobile.
- **Sticky booking sidebar** on tour-detail pages stacks below content at ≤ 900px (inline media query in each tour page handles this).
- **Forms** — fields stack at mobile, labels don't clip, submit button stays reachable.
- **Accordions, filters, carousels** — actually tappable, not hover-only.
- **Spacing** — what looks comfortable at 1440 often becomes cramped at 375 or excessive at 768; nudge per breakpoint, don't assume one set of values works everywhere.

### How to actually do the check

A local server is required. Most useful flow:

```bash
# in one terminal
python3 -m http.server 8081
```

Then load each page you touched at the breakpoints above. The cheapest way to script this is Playwright (already a devDep — `tests/smoke.js` is a working example). A minimal audit pattern:

```js
const { chromium } = require('playwright');
const browser = await chromium.launch({ headless: true });
for (const w of [375, 430, 768, 1024, 1440]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, hasTouch: w < 768 });
  const page = await ctx.newPage();
  await page.goto('http://127.0.0.1:8081/<your-page>.html');
  // … overflow + tap-target checks, screenshot, etc.
  await ctx.close();
}
```

**`tests/smoke.js`, `tests/responsive.js`, `tests/resilient-rendering.js` and
`tests/visual-regression.js` all serve `dist/` themselves** through
`tests/serve-dist.js`, so they need `npm run build` first and no server of your
own. They have to: tour pages are generated from the CMS and have no file in
this repository, and the navigation and footer are injected at build time, so a
source server 404s on every tour page and cannot see a navigation change at
all. `BASE_URL` still overrides, for a build already being served.

That gap was not theoretical. Adding a fifth navigation link once pushed the
"Book a Tour" button off screen between 1024px and 1180px and every check
passed, because `body { overflow-x: hidden }` hides a clipped control from a
document-width test. The suite measures that button directly now.

`tests/smoke.js` runs an end-to-end happy-path check across the main pages — run it (`node tests/smoke.js` with the server up) before declaring work done.

`tests/resilient-rendering.js` is the exception to the "start a server first" rule: it checks what a visitor sees with JavaScript disabled, which is only meaningful against `dist/`, because the homepage sections and the packages grid are assembled at build time. It serves `dist/` itself on an ephemeral port, so run `npm run build` first and then `npm run test:resilience` with no server of your own. Setting `BASE_URL` overrides that and will point it at the raw source, where an empty homepage shell is expected and the failures are not real.

### Reporting the check

When finishing visual work, say what you checked, at what widths, and what you saw. Examples that are acceptable:

- "Checked at 375 / 768 / 1440 on home + about; pill nav collapses, no overflow, looks fine."
- "Checked desktop only — the change is server-side and there is no visible breakpoint impact."
- "Could not check tablet — viewport tooling unavailable in this environment, flagging for follow-up."

Examples that are **not** acceptable:

- Silently shipping a feature without resizing.
- Saying "responsive checks done" without naming what you actually checked.

If a breakpoint can't be checked in your current environment, say so explicitly so a human can follow up rather than discovering it broken in production.

## Other repo-wide conventions worth knowing

- **The homepage renders from a plan, not a fixed sequence.** `renderHomepageMarkup()` in `homepage-sections.js` walks `content.sectionOrder`, where each entry is `{key}` for one of the seven built-in sections or `{layout, ...}` for a section an editor added in Sanity. With no plan it falls back to the seven in their designed order. Four editor-facing layouts exist (`photoBeside`, `cards`, `quote`, `invitation`); adding a fifth means touching three files, and `tests/homepage-layouts.mjs` fails if they drift apart. See `docs/adding-homepage-sections.md`.
- Nav markup is duplicated across the committed HTML pages (no SSI / template engine), though the build replaces it from `src/partials/navigation.html` on every page. Style changes go in `style.css`. Markup changes need to be propagated across those files — keep them identical so a single Python pass can update them in future. Header comment in `style.css` explains this.
- Active-page highlight on the nav is set two ways: JS (`script.js` matches `location.pathname` against link hrefs) handles top-level pages; tour-detail pages get a static `class="active"` on the Packages link in markup because their URLs don't match a nav item.
- The booking sidebar on tour-detail pages, the day-by-day accordion itinerary, and the included/not-included checklist are **off-limits** for redesign unless explicitly requested — those work well functionally.
- The `packages.html` card grid is the strongest layout on the site and should not be restyled without explicit ask.
- **The contact-page booking flow is progressively enhanced and must stay that way.** `contact.html` ships both fieldsets as one continuous form that posts natively to FormSubmit. `script.js` adds `.booking-flow-ready` and drives step visibility purely through `data-booking-current` on the form — it does not move nodes. Consequences worth knowing: the step chrome (progress, Continue, Back) is CSS-hidden until JS runs; hidden steps use `display:none`, so their values still submit; and pressing Enter on step 1 advances rather than submitting. If you add a step, add its markup, its progress `<li>`, and its `[data-booking-actions]` block — nothing in JS is hard-coded to two.
- Booking-flow copy is CMS-backed. `src/content/booking.json` is the committed source of truth, `studio/schemaTypes/documents/bookingFlow.ts` is the matching Sanity singleton, and `scripts/render-booking.mjs` injects both into `contact.html` at build time via `data-booking-copy` / `data-booking-trust` / `data-booking-next-steps` / `data-booking-faqs`. Editing copy directly in `contact.html` works but will be overwritten by the build — change the JSON instead. `tests/booking-source.mjs` fails the build if a bound key has no content.
- **Design tokens are consolidated — use the semantic layer.** `var(--color-primary)`, not `var(--pap-yellow)`; `var(--sp-3)`, not `1.5rem`; `var(--motion-base)`, not `300ms`. The full reference is `docs/design-system.md`. Yellow as *text on a light surface* must use `--yellow-on-light`; `--color-primary` fails AA there.
- **Verify visual changes with `npm run test:visual`.** It pixel-compares 21 pages at three widths against a stored baseline and is tight enough (0.002%) to catch a single card's border radius. Re-record intentional changes with `npm run test:visual:baseline`; baselines are gitignored and take ~49s to regenerate.
- Brand colors live in `style.css` `:root` CSS variables: `--yellow`
  (`#FFB81C`, primary accent), `--pap-charcoal` (`#1A1A1A`), `--terracotta`
  (secondary accent for badges), `--white`, `--gray`.
- **Dark surfaces are two tokens, not five.** `--surface-dark` for every dark
  section and the footer, `--surface-raised` for cards. They replaced
  `--black-2`, `--black-3`, `--black-card`, `--forest`, `--forest-card` and a
  raw `#050505`, which between them held only two distinct values and measured
  1.03:1 to 1.22:1 against each other — the "alternate dark band" the old
  comment described was never visible on screen. Cards read by their 1px
  border and 24px radius, not by fill, so don't reach for a new dark value to
  separate a surface; reach for the border. `--black` remains, but it is ink:
  28 rules colour text with it.
- **There is green in the brand, and it is not a loose end.** `--pap-forest`
  (`#123F35`) is the second most-used brand colour after `--pap-charcoal` —
  more than `--pap-terracotta`, `--pap-soft-gold` or `--pap-cream`. The five
  `--pap-*` colours form one deliberate palette, most visibly in the kente
  stripe under the "How You're Hosted" section, which repeats yellow,
  terracotta, soft gold and forest-deep. Green also colours the Adinkra motif
  in the gold pathways section, the scrolled nav, the founder avatars and the
  pathways CTA.
- What green is *not*, since August 2026, is a 1,359px field. That section is
  cream now: it was ~17% of the homepage, and it sat between a gold section
  and a dark one, so gold → cream → dark reads as three bands where gold →
  dark → dark would have read as two. Removing green from a surface is not the
  same as removing it from the brand — check which one you mean before
  touching `--pap-forest`.
