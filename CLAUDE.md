# People & Places Tours — Contributor Notes

Static HTML/CSS/JS site with no frontend framework. A lightweight deployment
build validates browser JavaScript and copies approved public files into
`dist/`; it does not bundle or transform the site. 20 HTML pages share
`style.css` and `script.js`; the homepage additionally uses
`homepage-content.js` + `homepage-sections.js` (data + renderer) and `tours.js`
(the tour catalog used across the site).

Hosting is verified as GitHub Pages from the root of `main`; the current
development branch is not the live source. Cloudflare Pages is the approved
production target and Sanity is the approved editorial CMS. `npm run build`
creates the allow-listed `dist/` output that Cloudflare will publish. GitHub
Pages currently does not run that build or apply `_headers`. See
`docs/hosting-and-delivery-architecture.md` before changing deployment, forms,
headers, or CMS integration.

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

`tests/smoke.js` runs an end-to-end happy-path check across the main pages — run it (`node tests/smoke.js` with the server up) before declaring work done.

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

- Nav markup is duplicated across all 20 HTML pages (no SSI / template engine). Style changes go in `style.css`. Markup changes need to be propagated across all 20 files — keep them identical so a single Python pass can update them in future. Header comment in `style.css` explains this.
- Active-page highlight on the nav is set two ways: JS (`script.js` matches `location.pathname` against link hrefs) handles top-level pages; tour-detail pages get a static `class="active"` on the Packages link in markup because their URLs don't match a nav item.
- The booking sidebar on tour-detail pages, the day-by-day accordion itinerary, and the included/not-included checklist are **off-limits** for redesign unless explicitly requested — those work well functionally.
- The `packages.html` card grid is the strongest layout on the site and should not be restyled without explicit ask.
- Brand colors live in `style.css` `:root` CSS variables: `--yellow` (`#FFB81C`, primary accent), `--pap-charcoal` (`#1A1A1A`, dark sections), `--terracotta` (secondary accent for badges), `--white`, `--gray`. The `--forest*` variables are kept for compatibility but currently resolve to off-blacks (no green in the brand).
