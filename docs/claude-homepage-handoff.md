# Claude Code Homepage Handoff

> **Status: Superseded — do not use for implementation.** This document
> describes an older homepage structure and conversion direction. It is kept
> only as historical repository context. A new Claude Code handoff must be
> created after the Sprint 0 strategy is approved and Codex completes the
> content and CMS architecture defined in
> `docs/people-and-places-prioritized-roadmap.md`.

## Current Homepage Architecture

This is a static HTML/CSS/JavaScript site. There is no React/Vue/build step.

Homepage shell:
- `index.html` owns the document head, navigation, footer, command palette shell, and the `#homepage-root` mount.
- `homepage-content.js` owns homepage copy, links, images, stats, testimonials, CTA content, and form configuration.
- `homepage-sections.js` renders the homepage sections into `#homepage-root`.
- `tours.js` owns the tour catalog used by homepage tour cards, package cards, contact dropdowns, and search.
- `script.js` owns behavior: mobile nav, tour rendering, filters, stats counters, testimonials slider, newsletter validation/submission, command palette, reveal animations.
- `style.css` owns all visual presentation.

## Section Map

Rendered by `homepage-sections.js`:

- `renderHeroSection` -> `data-home-section="hero"`
  - Full-screen video hero, eyebrow, tagline, scroll button, bottom headline strip.

- `renderMarqueeStrip` -> `data-home-section="marquee"`
  - Destination marquee immediately under hero.

- `renderPaymentStrip` -> `data-home-section="payment-strip"`
  - Deposit/payment reassurance row.

- `renderToursSection` -> `data-home-section="tours"`
  - Section heading, filter buttons, and `#trips-grid` placeholder.
  - Actual tour cards are data-driven from `tours.js` by `script.js`.

- `renderWhyTravelSection` -> `data-home-section="why-travel"`
  - Why travel with us header and four value cards.

- `renderStatsSection` -> `data-home-section="stats"`
  - Counter stats row.

- `renderBookingStepsSection` -> `data-home-section="booking-steps"`
  - Three-step booking process.

- `renderTestimonialsSection` -> `data-home-section="testimonials"`
  - Review header image, testimonial cards, slider dots.

- `renderCommunitySection` -> `data-home-section="community"`
  - WhatsApp community CTA and chat mockup.

- `renderNewsletterSection` -> `data-home-section="newsletter"`
  - Newsletter background image and FormSubmit email form.

- `renderInstagramStrip` -> `data-home-section="instagram"`
  - Instagram photo strip and CTA.

## Data-Driven vs Hard-Coded

Data-driven:
- Homepage section copy/images/links: `homepage-content.js`.
- Homepage section markup: component functions in `homepage-sections.js`.
- Tour card content: `tours.js`.
- Contact dropdown tour options: `tours.js`.
- Command palette tour items: `tours.js`.

Still hard-coded:
- Navigation and footer in `index.html`.
- Command palette shell in `index.html`.
- SVG icon markup inside `homepage-sections.js`.
- Form provider details in `homepage-content.js`.
- Most non-homepage pages are still static HTML.

## Fragile Layout Areas

- Hero video:
  - `.v-hero`, `.v-hero-video-wrap`, `.v-hero-bottom-strip`, and `.v-hero-scroll` depend on absolute positioning.
  - Be careful with viewport height changes on mobile.

- Tours section:
  - `#trips-grid` must remain present because `script.js` renders cards into it.
  - `.trip-filter-tag` and `data-trip-filter` must remain for filtering.

- Testimonials:
  - `.testimonials-track`, `.testimonial-slide`, and `.testimonials-dot` are used by `script.js`.
  - If redesigning this section, either keep these hooks or update the slider logic.

- Stats:
  - `.stat-num[data-target]` is required for the counter animation in `script.js`.

- Newsletter:
  - `.email-form`, `.email-input`, and `.email-submit` are used by `script.js`.
  - Preserve FormSubmit hidden field names unless changing the form provider.

- Reveal animations:
  - `.reveal` and `reveal-delay-*` are used throughout the current visual behavior.

## Recommended UI Refinement Targets

Start here:
- Hero section: strengthen first impression, improve CTA clarity, consider stronger destination signal.
- Tours section: refine card hierarchy and filter ergonomics.
- Why travel section: improve visual rhythm; current card grid is structurally clean but visually plain.
- Booking steps: make the three-step flow more conversion-focused.
- Testimonials: improve review card layout and slider behavior.
- Community/WhatsApp section: make this feel like a primary conversion path, not a secondary block.
- Newsletter: simplify visual density and clarify value.

Avoid changing first:
- `tours.js` data contract unless also updating `script.js` and tests.
- `#trips-grid`, `#cmd-list`, `.email-form`, `.testimonials-track`, `.stat-num`.
- FormSubmit action/hidden fields unless replacing the form backend.

## Validation

Run this after UI changes:

```bash
npm run test:smoke
```

The smoke test checks homepage section order, tour rendering, filters, image attributes, contact prefill, mobile nav, FAQ behavior, and page hero image structure.
