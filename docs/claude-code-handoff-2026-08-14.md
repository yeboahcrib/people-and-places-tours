# Claude Code Handoff — “What Pulls You In?” exploration

Date: 2026-08-14

## User intent

The user is refining only the homepage section titled **“What Pulls You In?”**
(`data-home-section="waysToExperience"`). Do not redesign unrelated homepage
sections or the separate Experiences/package-card page.

The user likes the current scroll behavior but is still thinking about whether
the section has too much text for a travel website. They may ask for another
visual-gallery concept, but the most recent gallery prototype was explicitly
rejected and has been removed.

## Current accepted direction

The existing yellow section and its six original pathway cards are intact.

As the section enters the viewport:

- The **whole yellow section** begins at `0.86` scale and expands to `1`.
- The six existing photo cards begin with small offsets/rotations and settle
  into their normal grid positions as scroll progress reaches `1`.
- After the visitor scrolls past it, the section remains fully expanded.
- Scrolling back upward reverses the animation and returns the smaller state.
- `prefers-reduced-motion: reduce` receives the normal fully expanded layout.
- There is no modal, overlay, focus trap, close button, or sessionStorage rule
  in the current accepted treatment.

Implementation:

- `script.js`, near `HOMEPAGE PATHWAYS — SCROLL EXPANSION`
- `style.css`, `.ui-v2 .pathways-section` and
  `.ui-v2 .pathways-section .pathway-card`
- Dedicated regression test: `tests/pathway-spotlight.js`
- Test script: `npm run test:pathway-spotlight`

## Rejected iterations — do not restore without asking

1. **Dark editorial modal/spotlight**
   - Featured only “History & Memory.”
   - Appeared over the section with a route-line animation.
   - User rejected the pop-open/full-size behavior.

2. **Scroll-growing dark overlay**
   - Started smaller and expanded over the page.
   - User clarified that the animated object should be the whole yellow section.

3. **Horizontal editorial gallery**
   - Six large alternating image/text slides with arrow controls.
   - User said “dont like it.”
   - This prototype has been removed; do not recreate the same split-panel rail.

## Important cleanup opportunity

`style.css` still contains an **unused** block beginning with:

```css
/* First-scroll editorial spotlight; ... */
.pathway-spotlight-stage { ... }
```

It is approximately around lines 3507–3668. The corresponding markup and
JavaScript no longer exist, so this entire `.pathway-spotlight*` block can be
removed safely with no visual change. Preserve the later `.pathways-section`
scroll-expansion rules.

## Content/data source

The section content lives in `homepage-content.js` under
`waysToExperience.pathways`. There are six records:

- History & Memory
- Food & Everyday Life
- Nature & Stillness
- Adventure
- Craft & Tradition
- The Longer Story

Each record already owns its title, description, image, alt text, and filtered
`packages.html?category=...` URL. Preserve this data model and all URLs.

Markup is rendered by `renderWaysToExperienceSection()` in
`homepage-sections.js`.

## Design discussion still open

The user correctly observed that the site is text-heavy for a travel/tourism
website. If revisiting a gallery, avoid simply moving the same paragraphs into
larger text panels. A better next exploration would reduce visible copy first:

- Keep the yellow expanding section.
- Keep photography dominant.
- Use category title + one short evocative line on each image.
- Keep essential links visible.
- Reveal longer existing descriptions only for an active/selected item.
- Avoid autoplay and avoid trapping vertical scroll.
- Mobile must remain swipe/touch friendly without horizontal page overflow.

Discuss the information hierarchy with the user before implementing another
large structural gallery.

## Project architecture and instructions

- Static HTML/CSS/JavaScript; no frontend framework.
- Read `CLAUDE.md` before editing.
- Homepage shell: `index.html`.
- Homepage data: `homepage-content.js`.
- Homepage renderer: `homepage-sections.js`.
- Behavior: `script.js`.
- Styling and design tokens: `style.css` and `docs/design-system.md`.
- Tour catalog: `tours.js`.
- Local preview: `python3 -m http.server 8081` then
  `http://127.0.0.1:8081/index.html`.

Use semantic tokens (`--color-*`, `--sp-*`, `--motion-*`) and honor reduced
motion. Do not add an animation dependency.

## Verification completed

The restored accepted version passed:

- `npm run check:js`
- `npm run build`
- `npm run test:smoke`
- `npm run test:responsive`
- `npm run test:resilience`
- `npm run test:pathway-spotlight`

Responsive checks cover 375 / 430 / 768 / 1024 / 1440 px. The dedicated test
checks small-to-expanded behavior, photo movement, persistent expanded state,
reverse scrolling, overflow, reduced motion, and console errors.

Earlier, `npm run test:visual` reported baseline mismatches only on untouched
About/Contact pages; the homepage was clean. Do not update visual baselines
without confirming those unrelated differences.

## Working tree safety

At handoff time, these unrelated pre-existing user changes are present:

- Modified `.gitignore`
- Untracked `docs/production-security-audit-2026-08-07.md`

Do not overwrite or delete them.

Task-related uncommitted changes are currently in:

- `script.js`
- `style.css`
- `package.json`
- `tests/pathway-spotlight.js` (new)
- this handoff document (new)

No commit, push, PR, or deployment has been performed.
