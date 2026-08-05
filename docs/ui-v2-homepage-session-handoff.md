# UI v2 Homepage — Session Handoff

> **Status: Active.** Written 2026-08-04 for the `codex/ui-v2-homepage` branch.
> Supersedes `docs/claude-homepage-handoff.md` for anything on this branch
> (that file describes an older homepage structure and is marked superseded).

## Where things stand

Branch: `codex/ui-v2-homepage` (not the live source — GitHub Pages serves root
of `main`). Nothing here is pushed.

```
f28f7a2  Tighten guest story section          <- committed
f328f4c  Add textured atmospheric treatment to hosted section  <- committed
dcec626  Balance hosted principles in card grid
95556bc  Refine homepage pathways section
9cd8a54  Rebalance founder story typography
73d8838  Refine homepage founder story
7464bd9  Prototype playful homepage UI v2
```

**Uncommitted work in the tree: the reviews section rebuild.** Touches
`homepage-content.js`, `homepage-sections.js`, `script.js`, `style.css`.
It is complete and verified — build and smoke pass — but the founder has not
yet answered whether to commit it. **Ask before committing.**

## Working agreement with the founder

- Isaac (co-founder, see `CLAUDE.md`) reviews changes himself in a browser.
  **Keep `python3 -m http.server 8081` running** and leave it up when you
  finish. Do not kill it as cleanup.
- He works **one section at a time** and has explicitly said not to touch
  other sections while working on one. Honour that even when a fix in a
  neighbouring section is obvious — raise it instead.
- He asks "what do you think" when he wants analysis, not code. Give the
  read first; implement after he says go.
- Off-limits without an explicit ask (from `CLAUDE.md`): the tour-page booking
  sidebar, the accordion itinerary, the included/not-included checklist, and
  the `packages.html` card grid.

## What was done this session

### 1. "How You're Hosted" — atmospheric treatment (committed `f328f4c`)

Layered onto `.ui-v2 .why-section` (`style.css` ~3513): gold + terracotta
radial glows, a faint 135° woven texture, a second cropped motif
(`renderWeaveMotif('hosted-lower')`), and a kente colour-rhythm strip via
`::before`. The strip's repeat tightens at ≤600px — at 124px it only fit
~3 times across 375px and read as blocks.

### 2. Guest story — decompression (committed `f28f7a2`)

Was 127% of viewport at 1440 with 13 lines of centred 32px display type.

- Split `guestStory.body` into `lede` (our third-person summary) + `body`
  (Cynthia's verbatim words). The old single `<blockquote>` wrapped both,
  attributing our copy to her.
- Trimmed the quote to its closing half. The opening sentence is already the
  proof quote on the first "How You're Hosted" card
  (`homepage-content.js`, `howHosted` principle 1) — it was running twice,
  ~800px apart.
- Left-aligned column, capped line lengths, scrim re-weighted horizontally,
  `object-position: center 78%`.

### 3. Reviews / "What Our Travellers Say" — rebuild (UNCOMMITTED)

**This section was broken in production, not just cramped.**
`script.js` ran a real carousel (`translateX(-N * 100%)` on a 6s timer) against
a CSS *grid* track inside `overflow: hidden`. Six seconds after scrolling into
view, all three reviews slid out of the wrapper and the section went blank.

Fixed by making the track a genuine 3-up grid ≥900px and a scroll-snap rail
below, with the dots reading *from* scroll position. Auto-advance removed
entirely. Also: 5.0 rating pulled out as an anchor, founders' names dropped
from the trust row (long value broke the shared baseline), doubled quote marks
reduced to one set, header scrim strengthened.

## Gotchas found the hard way — read before touching these

- **`.cultural-motif` uses `z-index: -1`.** It only renders because
  `.why-section` carries `isolation: isolate`, which creates a stacking
  context. Remove that and every motif disappears behind the section's own
  background. Verify motifs are actually visible; don't assume.
- **`grid-auto-columns: minmax(0, N%)` will not build a scroll rail.** The
  zero minimum lets tracks shrink to fit the scrollport, so it never
  overflows and never scrolls. Use a fixed percentage.
- **Later media queries silently override the testimonials rules.** There was
  a `.testimonials-track { grid-template-columns: 1fr }` at
  `style.css` ~1946 inside `@media (max-width: 768px)`, far below the
  testimonials block, which collapsed the rail. Grep the whole file for a
  selector before assuming your rule wins.
- **`.sec-img-head` is shared across pages.** Scope changes to it as
  `.testimonials-section .sec-img-head`, never bare.
- **`.testimonials-track` / `.trust-fact*` exist only on the homepage**
  (JS-rendered). Verified against all 20 HTML files — safe to change without
  propagating.
- **Nav markup is duplicated across all 20 HTML pages.** Markup changes must
  be propagated to every one; keep them byte-identical.

## How to verify (this is not optional — see `CLAUDE.md`)

Server must be running. Playwright is a devDep, but **it resolves from the
script's own directory** — put throwaway scripts in the repo root, not in
`/tmp`, or `require('playwright')` fails.

Force reveal animations off before measuring, or elements below the fold
screenshot blank:

```js
await page.addStyleTag({ content: '.reveal{opacity:1!important;transform:none!important} .nav{display:none!important}' });
```

Widths: **375 / 430 / 768 / 1024 / 1440**. Check document
`scrollWidth > clientWidth`, tap targets ≥32px, and section height as a
percentage of viewport. For text over photography, sample the composited
background with a canvas and compute contrast rather than eyeballing it —
that is how the guest-story scrim was set.

Element screenshots of a horizontally-scrolled container are unreliable
mid-scroll. Trust the numbers (`scrollWidth - clientWidth`, active dot index)
and screenshot at rest.

Before declaring done: `npm run build` and `node tests/smoke.js`.

## Open items

- **Reviews section is uncommitted and awaiting the founder's go-ahead.**
- Founders' names (Isaac Yeboah & Evans Yirenkyi) were removed from the
  reviews trust row. They have no home now. They belong somewhere in an
  About-flavoured section, but that was out of scope this session.
- `homepage-content.js` `guestStory.lede` and `reviewsAndTrust.ratingSummary`
  are new local-content fields. The Sanity path does not supply them; both
  render sites guard for absence. If the CMS mapping is extended
  (`tests/homepage-source.mjs` holds the contract), add them there.
- Reference scan this session: [sortedchale.com](https://sortedchale.com)
  uses a single-review carousel with **no** aggregate rating —
  their [Trustpilot](https://www.trustpilot.com/review/sortedchale.com) is
  mixed across ~30 reviews. [travelmo.com](https://travelmo.com) shows no
  homepage reviews at all. P&P's 5.0/15 is strong, so leading with the
  aggregate is a deliberate divergence from both, not an oversight.
