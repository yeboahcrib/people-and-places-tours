# Just Go Ghana — Phase 3E Field Inventory

**Status:** audit complete; provisioning intentionally stopped pending owner decisions.

This is a parity inventory of the existing `just-go-ghana.html` experience. It
is not a new source of truth and does not change the website, Sanity, or
Storyblok.

## Sources reviewed

- Current hand-authored page: `just-go-ghana.html`
- Current catalogue record: `tours.js`
- Current detail snapshot: `src/content/tour-pages.json`
- Current live Sanity record: `tour-just-go-ghana` (`offerType:
  tailoredMultiDay`)
- Build/render path: `scripts/build-static.mjs`, `scripts/tour-source.mjs`,
  `scripts/render-tour-cards.mjs`, `script.js`, and generated `dist/` output
- Approved architecture and Phase 3A plan under `docs/storyblok/`

## Route and rendering contract

| Contract | Current value | Phase 3E handling |
| --- | --- | --- |
| Public source route | `/just-go-ghana.html` | Immutable. Storyblok paths must never derive or replace it. |
| Canonical production route | `/just-go-ghana` | Existing clean-URL/canonical handling remains code-owned. |
| Catalogue detail URL | `just-go-ghana.html` | Preserve in `tours.js` and any future browser overlay. |
| Detail renderer | Hand-authored page, explicitly skipped by the standard generated-tour loop | Requires a dedicated fixed multi-day adapter/renderer, not the standard `tour` template. |
| Hero visual | Decorative `GHANA` placeholder; no hero photograph | Preserve exactly. Do not add a Storyblok hero field or invented photo. |
| Browser behaviour | Catalogue/filter/search/booking read `window.PEOPLE_PLACES_TOURS`; itinerary and FAQ headers are keyboard-toggle controls | A future adapter may use the one existing token-free catalogue overlay, but must not add browser API calls. |

## Guest-facing content inventory

| Existing surface | Current guest-facing value / count | Intended editor model | Reconciliation status |
| --- | --- | --- | --- |
| Catalogue identity | `Just Go Ghana`; optional short title `Just Go Ghana - 8 Days`; Featured; position 0 | Name, optional card title, badge, display position | Aligned |
| Catalogue facts | USD `$3,000` per person; `8 Days / 7 Nights`; `Accra, Ghana`; destination `accra` | Price, currency, price per, duration, locations, destination | Aligned |
| Categories and vibes | Categories: Multi-day, Culture, Adventure, Nature, Relaxation. Vibes: Multi-Day, Culture, Adventure. | Existing category/vibe/destination datasources | Aligned |
| Card copy/search | Card and package descriptions plus command summary in `tours.js` | Separate card description and search summary | Separate placement copy, not a factual conflict |
| Card photo | External Unsplash image only, with generic alt | Optional native Asset field for a draft; mandatory for any applied card | **Blocked:** no approved JGG Storyblok/Sanity/local asset |
| Hero/meta | Five tags; title; `8 Days / 7 Nights`; departure `Accra, Ghana`; activity `Moderate`; trip style `Immersive Cultural Adventure` | Fixed hero fields; activity level and trip style | Aligned, except group-size field below |
| Overview | Heading `The Motherland Is Calling. Just Go.` plus two paragraphs | Heading and ordered overview paragraphs/text | HTML has more detailed copy than Sanity; retain placement-specific copy rather than overwrite it |
| Highlights | 8 ordered labels: Culture, Adventure, Safari Valley, Workshops, Boat Cruise, Beach, Accommodation, Welcome Dinner | Ordered reusable list items; code maps the existing icons | Aligned with current page; icons remain code-owned |
| Itinerary | 8 ordered accordion days, each with title, description, and meals: D1 Dinner; D2–4 Breakfast/Lunch; D5 Breakfast; D6–7 Breakfast/Lunch; D8 Breakfast | `itinerary_day` blocks, exactly 8, ordered by the editor | Aligned. Day 5 contains an inline link to `packages.html#add-ons` that a future safe renderer must preserve. |
| Included | 10 page entries | Ordered reusable list items | **Blocked:** Sanity/JSON contain an additional `Service charge` entry. |
| Not included | 6 page entries | Ordered reusable list items | **Blocked:** page says `Vaccines (Yellow Fever required)`; Sanity/JSON say only `Vaccinations`. |
| Pricing/sidebar | `Starting at $3,000`; generic deposit note; duration, departure, activity, group, meals, hotel (7 nights), airport transfer, local guide | Price fields, non-numeric booking note, trip-detail fields | Price and most sidebar copy align. Group-size wording requires a decision. Do not add a numeric deposit rule to the story. |
| FAQs | 4 ordered questions and answers | Existing `faq_item` blocks | Aligned |
| Testimonials | 2 ordered five-star quotes attributed to Precious Nwokeleme and Tamaro Diallo | Local `testimonial_item` blocks only if approved | **Blocked:** existing edited/truncated quotations are not approved review content. |
| Related cards | Fixed Cape Coast, Shai Hills, and Accra City cards | Keep code-owned until separately reconciled | **Do not migrate:** Shai is `$130` vs current `$140`; Accra is `$100` vs current `$110`. |
| CTAs | Contact links for Book Now, Ask a Question, Plan This Trip; fixed WhatsApp message | Code-owned fixed CTA URLs/text | Aligned; no speculative CTA component required |
| SEO | Hard-coded title/description; shared fallback OG image | Existing optional `seo` block, preserving code fallbacks | No current JGG-specific approved sharing asset |

## Fields that require owner review

| Field | Conflicting current evidence | Decision needed |
| --- | --- | --- |
| Group size | Detail sidebar: `Small Groups`; `tours.js` and live Sanity: `Any group size`; approved claim register: 1–12 for standard bookings, up to 30 by arrangement | Confirm the exact guest-facing wording and whether numeric bounds should appear. |
| Included coverage | Detail page has 10 entries; Sanity/JSON add `Service charge` as an 11th entry | Confirm whether service charge is included and should be visible. |
| Vaccinations exclusion | Detail says `Vaccines (Yellow Fever required)`; Sanity/JSON say `Vaccinations` | Confirm legally/factually correct public wording before migration. |
| Card image | Current Unsplash URL has no approved asset/right/credit record; live Sanity and Storyblok have no JGG photo | Provide an approved original/licensed card image, with alt, source/copyright and focal point, or explicitly approve a documented existing asset. |
| Testimonials | Two current page quotes are edited/truncated and not approved review records | Approve exact source-backed excerpts/attribution, replace them, or remove the testimonial section in a separately authorised content change. |

## Minimal model to apply only after those decisions

No component, folder, datasource, asset, or story has been provisioned from
this proposal.

- Content Type: `multi_day_tour` — **Multi-Day Experience**.
- Reuse: `faq_item`, `list_item`, `seo`; use `price_option` only if an actual
  alternate price is approved. Do not add `gallery_item` or a hero-image field:
  Just Go Ghana currently has neither a gallery surface nor a real hero photo.
- New nestables only:
  - `itinerary_day` — title, safe rich-text description (paragraph/link only),
    and controlled meal choices; its block order is the day number.
  - `testimonial_item` — quote and traveller name, only after source approval.
- Editor groups: Basics; Card; Trip overview; Pricing; Trip details; Highlights;
  Itinerary; What's included; What's not included; Testimonials; Questions; SEO
  & sharing. Keep the related-card/CTA layout code-owned.
- The approved architecture calls for controlled `activity_level` and `meal`
  options. The Free Space has four existing datasources, so these two can be
  added later within the documented Starter limit; no route, review, CTA, or
  image-layout datasource is needed.
- Use a `Tours / Multi-day Experiences` content folder and an equivalent asset
  folder only when the owner approves the record/image migration.

## Validation baseline

- `node tests/tour-pages-content.mjs` passed: the committed snapshot retains
  all eight ordered itinerary days.
- `node tests/tour-source.mjs` passed: the existing standard-tour Storyblok
  adapter still excludes Just Go Ghana.

No Storyblok token, browser API call, production setting, website route,
frontend presentation, Sanity query, or local fallback was changed during this
audit.
