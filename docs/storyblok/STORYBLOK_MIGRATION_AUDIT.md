# Storyblok Migration Audit

**Scope:** repository-wide, read-only audit of `/Users/nana/Documents/Projects/People & Places` on 27 August 2026. No website, CMS, dependency, or deployment file was changed. Findings describe checked-in source, not assumed production state. Unless stated otherwise, paths in this report are relative to that audited project root.

## 1. Technology stack

| Area | Actual implementation |
|---|---|
| Frontend | Static hand-authored HTML, CSS and browser JavaScript; no React, Next.js, TypeScript frontend, bundler, or UI library. [`README.md`](../../README.md), [`package.json`](../../package.json) |
| Styling/motion | One custom [`style.css`](../../style.css), Google Fonts, CSS variables/media queries/keyframes, native `IntersectionObserver`, `requestAnimationFrame`, `matchMedia`; no animation package. |
| Images | Local JPEG/SVG assets, hard-coded Unsplash URLs, and Sanity CDN URLs at build time; plain `<img>`, no Next/Image or image library. |
| Build/test | Node custom ESM scripts; Playwright, pixelmatch, pngjs. |
| CMS | Separate Sanity Studio v3 under [`studio/`](../../studio/), TypeScript schemas and `sanity`, `sanity/structure`, `sanity/cli`. Root site calls Sanity HTTP CDN directly, so it has no root Sanity package. |
| Hosting/forms | Cloudflare Pages runs `npm run build`, deploys `dist/`; two Pages Functions in [`functions/api`](../../functions/api). FormSubmit is fallback; Turnstile is build-injected. |

## 2. Architecture

The site builds static HTML. `scripts/build-static.mjs` reads local fallback data, optionally overlays Sanity responses, injects shared HTML/metadata and writes `dist/`. The visitor never requests Sanity.

```text
HTML/CSS/browser JS (root)
├─ assets/                 public JPG/SVG
├─ src/content/            committed CMS-shaped fallbacks
├─ src/partials/           navigation/footer templates
├─ src/templates/          tour/holding-page templates
├─ scripts/                adapters, validators, renderers, static build
├─ functions/api/          health + inquiry functions
├─ studio/                 independent Sanity Studio, schema, seed scripts
├─ tests/                  content/build/browser/security tests
├─ docs/                   internal, not deployed
└─ dist/                   generated artifact
```

Key components: [`src/partials/navigation.html`](../../src/partials/navigation.html) and [`footer.html`](../../src/partials/footer.html) are rendered by [`shared-shell.mjs`](../../scripts/shared-shell.mjs); [`tours.js`](../../tours.js) retains presentation/routing fields even while Sanity is enabled; browser [`script.js`](../../script.js) owns cards, filters, form UX, lightbox and interactions.

## 3. Complete route inventory

Cloudflare serves extensionless versions in production; source uses `.html`.

| Route/file | Purpose/components | Content source |
|---|---|---|
| `/` / `index.html` | Homepage rendered by `homepage-sections.js`. | `homepage-content.js`, or Sanity `homepageSection`/`flexibleSection` merged at build. |
| `/packages` | Tour listing, filters, add-ons; card injector. | Tour adapter, `localExperience`, `experiencesPage` photos. |
| `/just-go-ghana` | Hand-authored eight-day package. | Static HTML; explicit generator exception. |
| 12 generated tour routes | `accra-city-tour`, `accra-food-tour`, `cape-coast-tour`, `kumasi-tour`, `ada-tour`, `quad-bike-tour`, `volta-tour`, `shai-hills-tour`, `aburi-tour`, `cape-coast-day-tour`, `volta-community-tour`, `batik-workshop`. | Tour template + `tour-pages.json` + tours/Sanity merge. |
| `/about` | Story, mission, team, stats, FAQ, CTA. | `about.json` or `aboutPage`. |
| `/contact` | Booking enquiry flow and FAQ. | `booking.json` or `bookingFlow`; submission code stays outside CMS. |
| Five policy routes | cancellation/refund, travel info, insurance, booking terms, privacy. | `policy.json` or `policy` by `policyType`. |
| `/thanks`, `/404` | Confirmation / not found. | Static. |

There are no destination pages, blog/article pages, dynamic server routes, ISR, or CMS preview mode. `destination` is a card filter value. Existing legacy redirects are in [`_redirects`](../../_redirects).

## 4. Sanity architecture

Studio config is [`studio/sanity.config.ts`](../../studio/sanity.config.ts); project/dataset come from `SANITY_STUDIO_PROJECT_ID`/`SANITY_STUDIO_DATASET`, dataset fallback `production`. [`deskStructure.ts`](../../studio/deskStructure.ts) defines singleton documents. Build adapters query `https://{project}.apicdn.sanity.io/v2026-08-02/...`, retried by [`sanity-fetch.mjs`](../../scripts/sanity-fetch.mjs). Sanity is optional and documented as not yet live in [`README.md`](../../README.md); `npm run check:sanity` compares local and Sanity builds.

### Schema inventory and initial Storyblok mapping

Required means explicitly validated by Sanity.

| Sanity type | Fields | Reference/current use | Storyblok equivalent |
|---|---|---|---|
| `mediaAsset` object | image+hotspot; altText **required**; publicApprovalState; caption/credit/owner/consent; relatedTour/People/Story; video; placeholderState | Nested photo metadata; only approved/non-placeholder media may render. | `media_asset` block + Asset, alt/rights/approval/focus fields. |
| `trustFields` object | source, verification date, permission/approval/publication state, owner, review date, channel eligibility | Nested governance; not directly public. | Hidden editorial-governance block. |
| `siteSettings` | businessName, primaryPhone, email, address, hours **required**; WhatsApp/social/service area | global shell/contact/policies | Global `site_settings`. |
| `navigation` | primary links, footer groups/links, legal links | global shell | Global `navigation`; reusable link item. |
| `homepageSection` | sectionKey/order **required**; section-specific copy, CTA, rich nested lists/media | seven fixed homepage sections | One Home story with constrained fixed blocks. |
| `flexibleSection` | active, layout, placement/order, title/copy/media/cards/quote/CTAs | homepage; four supported layouts | split/cards/quote/invitation blocks. |
| `experiencePathway` | title/filterKey/order **required**; description/image/relatedTours[] | homepage pathway data | `experience_pathway` block. |
| `experiencesPage` | coverPhoto, addOnPhoto | packages hero/add-on photo | Experiences page story/global. |
| `tour` | complete table below | cards/details/forms/search/featured refs | `tour` content type. |
| `featuredTourCollection` | 3–5 items: tour ref/order **required**, reason/date range; balance note | homepage feature membership/order | Global curated `featured_tours`. |
| `hostingPrinciple` | title **required**, description/icon/proofReview | defined, not queried | defer/archive or reusable principle. |
| `guestStory` | guestName **required**, headline/story, tour/review refs, media/trust | defined, not fetched | `guest_story` type. |
| `review` | reviewerName/sourceText/rating/date **required**; excerpt/platform/source/ref/media/trust | homepage/testimonial source | `review` type/nested testimonial. |
| `trustFact` | label/value/trust **required**; display status | defined, not standalone queried | governance global. |
| `planningStep` | stepNumber **required** 1–3, title/description/CTA ref | modelled, not separate query | `planning_step` block. |
| `socialStory` | post URL/media/caption/context/publication state | defined, not queried | defer or type. |
| `cta` | label/destination **required**, tier/external | reusable model, some inline CTA data | `cta` block. |
| `localExperience` | name/order **required**, active | Packages add-ons | item type/global list. |
| `policy` | policyType/title/date/intro/sections/contact intro/closing **required**; section→terms, term/text **required**, lawyer flag | five policy pages | `policy_page`, `policy_section`, `policy_term` blocks. |
| `bookingFlow` | required intro, 2 form-step, trust, confirmation and FAQ fields; cover photo | Contact injection | Contact/booking story, FAQ/trust/step blocks. |
| `aboutPage` | required hero, story/mission/difference/team/impact/FAQ/CTA fields with list bounds | About injection | About story, constrained blocks. |
| `founderProfile` | name **required**, preferred name/role/languages/background/bio/photo/quote/founder | modelled; About currently uses embedded team | optional `team_member` type. |
| `originStory` | headline, short/full version, media[] | modelled singleton, not current query | global origin story/block. |

No Portable Text type exists. All body fields are strings/text/arrays. No per-page Sanity SEO object exists. Schema previews are Studio-only.

### Tour schema (field table)

| Field | Type/required | Current frontend role | Storyblok field |
|---|---|---|---|
| title, slug | string **required**; slug **required** | cards; title; joins Sanity to `tours.js` | name, slug |
| offerType, active | enum **required**; boolean default true | query filter/payment intent | option, boolean |
| duration, locations, startingPoint | required text; string list; default text | cards/detail details | text/list/text |
| groupSizeMin/max/note | number/number/text | normalized display string | numbers + note |
| included, excluded | string arrays | generated coverage; required by renderer | list items |
| accessibilityNotes, availabilityNote | text/default text | modelled, not currently rendered | text |
| price/currency/priceUnit | price number **required**; defaults USD/Per Person | cards/detail | number, option, text |
| priceOptions, smallGroupSupplement | label+price required item; number | alternatives render; supplement unrendered | price-option blocks/number |
| highlights, heroWatermark, pageHeadline/pageIntro, funFacts | arrays/text | watermark/intro/fun facts render; highlights not rendered | list/text/richtext/list |
| faqs, itinerary | FAQ q/a required; day/title/description required nested items | FAQ renders; itinerary currently does not | `faq_item`, `itinerary_day` |
| description, culturalContext | text/text | cards/fallback; context unrendered | text/richtext |
| cardPhoto/coverPhoto/media | media object(s) | card/hero/conditional gallery | asset ref(s) with focal metadata |
| relatedGuestStory | reference | modelled, unrendered | story relation |
| categories/vibes/destination/commandSummary | string arrays/string/string | filters/tags/related/search | options/text |

## 5. CMS-to-frontend flow

```text
Sanity document → GROQ HTTP CDN request → source adapter/validator
→ build-static.mjs → renderer/injector → dist static HTML → Cloudflare CDN
```

| Feature | Exact chain |
|---|---|
| Site shell | `siteSettings` + `navigation` → [`content-source.mjs`](../../scripts/content-source.mjs) → [`shared-shell.mjs`](../../scripts/shared-shell.mjs) → every page. |
| Tours | active `tour` + `featuredTourCollection` → [`tour-source.mjs`](../../scripts/tour-source.mjs) → joins `tours.js` by slug → cards, contact select, command palette, generated pages. |
| Home | `homepageSection` + `flexibleSection` → [`homepage-source.mjs`](../../scripts/homepage-source.mjs) → merge `homepage-content.js` → homepage renderer. |
| About/contact/policy | respective singleton/document → `about-source`/`booking-source`/`policy-source` → matching `render-*` injector → source page. |
| Packages extras | `experiencesPage` → `render-page-photos`; active `localExperience` → `render-local-experiences`. |

Major weakness: the CMS is a transition overlay, not authoritative. A new active Sanity tour without a `tours.js` slug fails the build; many authored schema fields are never projected into HTML.

## 6. Tour content and rendering

Cards render title, `packageDescription`/description, duration, locations, group size, price/unit, badge, first two vibes, filter categories/destination and card image/alt. Generated details render hero watermark/title/vibes/duration/start/price; overview intro/facts; included/excluded; price options/group note; FAQs; an approved 3–6 photo gallery; and category-derived related tours. `highlights`, `itinerary`, cultural context, availability/accessibility, small-group supplement and guest-story relation are modelled but not rendered. [`src/content/tour-pages.json`](../../src/content/tour-pages.json) fills detailed fallback content. `just-go-ghana.html` is the hard-coded exception.

## 7. Image audit

- Local `assets/photos/*.jpg` and SVGs are untransformed. Unsplash URLs use `auto=format`, `fit=crop`, widths/heights and `q=80`.
- Sanity media permits hotspots. [`sanity-image.mjs`](../../scripts/sanity-image.mjs) builds `auto=format`, `fit=crop`, `q=78`, 2× CSS width (capped at master) and focal-point parameters. Tour adapter asks for 1200×840/825 card and 1920×1080 hero crops.
- Images usually have width/height, lazy loading, async decoding and sometimes `sizes`, but no `srcset`, `<picture>`, blur placeholders or automatic fallback. Critical heroes are eager/high-priority. CSS normally uses `object-fit: cover`; CSS does not map focal metadata to `object-position`.

| Role | Field/source | Component/ratio | Desktop/mobile behaviour / risk |
|---|---|---|---|
| Homepage hero | home section/local | `.v-hero`, full viewport cover | min 640px, scrim; preserve focal crop. |
| Pathways | pathway/home media | current UI-v2 5:3 cover | lazy/zoom/responsive grid. |
| Experiences/contact hero | `experiencesPage.coverPhoto` / `bookingFlow.coverPhoto` | full-bleed cover | text sits left; requires safe crop. |
| Add-on | `addOnPhoto` | 4:5, then 4:3 under 768px | one asset needs two crops. |
| Tour card | `cardPhoto` / local fallback | CSS 3:2, 800×550 markup | lazy, 360px/45vw/100vw `sizes`; requested Sanity ratios differ slightly. |
| Tour hero | `coverPhoto`, card fallback | wide hero | card fallback is widened, can degrade composition. |
| Gallery | `tour.media[]` | responsive grid/lightbox | only 3–6 approved assets. |
| Team/review | mediaAsset | 4:5/3:4 or avatar | cover; people initials fallback. |
| 404/insurance/logos | Unsplash/static SVG | hero/chrome | not CMS controlled. |

## 8. Tour cards

[`render-tour-cards.mjs`](../../scripts/render-tour-cards.mjs) creates flex-column, rounded bordered cards with a 3:2 cover image, badge/vibe overlays, two-line clamped description, metadata row, bottom-pinned price/action. Hover lifts 5px, scales image 1.04 and changes accent colors. Cards are client-filtered using categories/destination query state; no CMS fetch occurs.

Storyblok needs name/slug or published URL, card image+alt+focal point, display copy, duration/location/group size, price/currency/unit, two vibes, categories/destination, optional badge/highlight, plus a canonical display order. Today, route, order, badge and image fallbacks are often only in `tours.js`.

## 9. Tour detail, display order

| Order | Section | Fields/image |
|---|---|---|
| 1 | global navigation | settings/navigation |
| 2 | hero | title/watermark/vibes/duration/start/price, cover/card photo |
| 3 | overview | pageHeadline/pageIntro/funFacts |
| 4 | trip details and coverage | duration/start/group, included/excluded; guide/transport are hard-coded |
| 5 | price/CTA | price/duration/group note/options; WhatsApp phone is hard-coded in renderer |
| 6 | FAQ | `faqs[]` |
| 7 | conditional gallery | approved 3–6 media assets with alt/caption/layout |
| 8 | related tours | inferred from shared categories |
| 9 | footer | global data |

## 10. Gallery system

No carousel. `renderTourPage()` renders `<figure>` items in `.tour-gallery-grid`; `script.js` supplies lightbox behaviour. The adapter exposes only 3–6 approved images, array order is retained, alt/caption render, and a derived `tall` value controls grid layout. Images are lazy/async; no `srcset` or mobile crop field. Storyblok needs ordered gallery items, required alt, optional caption, portrait/wide layout signal, focus point and approval state. Do not replace this grid/lightbox with a carousel for parity.

## 11. Hard-coded content

| Area | Location |
|---|---|
| Tour presentation/routing/order/badges/fallback imagery and much copy | [`tours.js`](../../tours.js) |
| Tour detail fallback / exceptional multi-day detail | [`src/content/tour-pages.json`](../../src/content/tour-pages.json), [`just-go-ghana.html`](../../just-go-ghana.html) |
| Homepage copy/order/layout | [`homepage-content.js`](../../homepage-content.js), [`homepage-sections.js`](../../homepage-sections.js) |
| Shell and identity | partials, CSS, SVG logos/favicons |
| Page fallbacks | JSON in [`src/content`](../../src/content) |
| Booking submission, fields, errors, success | `contact.html`, `script.js`, `functions/api/inquiry.js`—not CMS content |
| SEO | [`render-meta.mjs`](../../scripts/render-meta.mjs), fixed OG image |
| Tour WhatsApp phone | [`render-tour-page.mjs`](../../scripts/render-tour-page.mjs) |

## 12. Reusable content

The existing content that is already shared or should become shared is: site settings/contact/social data; navigation/footer/legal links; CTA, FAQ, media, gallery and policy-term objects; tour-card presentation; review/guest-story governance; and the four flexible homepage layouts. Keep the booking transport/security code, CSS design system and SVG identity assets code-owned.

## 13. Initial Storyblok migration mapping

| Category | Recommended parity-first structure |
|---|---|
| Content types | `tour`, `policy_page`, optional `review`, `guest_story`, `team_member`, `local_experience`. |
| Page stories | Home, Experiences, About, Contact/Booking, five policies; dedicated Just Go Ghana story until its exception is decomposed. |
| Reusable blocks | `cta`, `faq_item`, `media_asset`, `gallery_item`, `price_option`, `trust_point`, `policy_term`, link item. |
| Nestable blocks | fixed home sections, flexible split/cards/quote/invitation, `itinerary_day`, `policy_section`. |
| Globals | `site_settings`, `navigation`, `featured_tours`, optionally origin story/trust facts. |
| Assets | Storyblok asset plus alt/caption/credit/consent/approval/placeholder and focal metadata. |
| SEO | New explicit SEO block: title, description, canonical override, social image, robots; retain existing automatic fallback metadata. |

Do not put inquiry payloads, Turnstile configuration, payment/reservation data, or delivery secrets in Storyblok.

## 14. Migration risks

| Risk | Level | Reason/mitigation |
|---|---|---|
| Split ownership and slug join | **HIGH** | Tour adapter requires local mapping; make Storyblok canonical only after a verified route/order map exists. |
| Detail routes | **HIGH** | Current `detailUrl` is local and not always slug-derived; preserve all published URLs/redirects. |
| Crops/hotspots | **HIGH** | Sanity URL focal crops must be reproduced per card/hero/gallery component. |
| Unrendered model fields | **HIGH** | Migration may expose itinerary/highlights/context unexpectedly; parity first. |
| Just Go Ghana exception | **HIGH** | Hand-authored and excluded from generator. |
| CMS build availability | **MEDIUM** | Current configured CMS failure fails build; decide Storyblok failure policy explicitly. |
| CSP | **MEDIUM** | [`_headers`](../../_headers) permits Sanity/Unsplash; add Storyblok image CDN host before cutover. |
| SEO/redirects | **MEDIUM** | No SEO model, existing `_redirects`; preserve canonicals/sitemap/301s. |
| Preview/drafts | **MEDIUM** | No current preview; Storyblok preview needs an intentional safe build path. |
| Richtext | **LOW–MEDIUM** | No Portable Text today; begin with plain text/list parity. |
| ISR/caching | **LOW** | No ISR/runtime CMS request exists; preserve static build/CDN approach. |
| Governance/assets | **MEDIUM** | Preserve `mediaAsset`/`trustFields` consent/approval or lose editorial safeguards. |

## 15. Safest migration sequence

1. Freeze route/content/image inventory and current static build as visual baseline.
2. Approve the parity-first Storyblok model, including a separate Just Go Ghana decision and explicit treatment of currently unrendered fields.
3. Migrate/test assets with alt, rights/approval and component-specific focus/crop checks.
4. Migrate globals and stable singleton/page content while keeping current renderers.
5. Migrate tours with an explicit URL/order/badge/fallback map; verify all cards, select options, search, related cards and generated details.
6. Migrate fixed/flexible homepage blocks without changing layout.
7. In a separately authorized coding task, add a build-time Storyblok adapter; compare full builds/screenshots and update CSP.
8. Test staging: routes/301s/sitemap/canonicals/meta, responsive crops, no-JS output, accessibility and inquiry flow.
9. Switch production only after parity acceptance; keep Sanity read-only plus rollback path through an editorial verification period.
10. Remove Sanity only in a separately authorized cleanup task.

## Executive summary

This is a custom static Cloudflare Pages site, not a framework application. Sanity is a build-time, optional overlay on committed fallback data—not the sole source. Images are a mixed local/Unsplash/Sanity system, with important Sanity focal-crop and approval rules.

The most important weaknesses to resolve before a Storyblok cutover are split tour ownership, non-slug detail URL mappings, the hand-authored Just Go Ghana exception, image crop parity, and schema fields that are authored but currently invisible. Move editor-controlled page/tour/global content and governed asset metadata to Storyblok; keep booking delivery, security settings and presentation code outside it. Next investigation: the actual current Sanity dataset, publication/rights status of every asset, canonical route contract, and Storyblok asset-focus/preview/token capabilities.

