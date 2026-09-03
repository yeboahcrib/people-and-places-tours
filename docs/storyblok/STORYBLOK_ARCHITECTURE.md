# Storyblok Architecture — Phase 2 Design

**Status:** design only. No website code, route, Sanity schema, build configuration, dependency, or Storyblok integration has been changed. This proposal uses the existing static website as the presentation contract. Paths are relative to `/Users/nana/Documents/Projects/People & Places`.

## Design decisions

1. Storyblok becomes the sole editorial source after a controlled cutover; it is **not** a page builder.
2. Pages have fixed content types and fixed, named fields. Only the four existing flexible homepage layouts may be inserted, and only in predefined slots.
3. Tours use one authoritative story per published tour. The frontend owns layout, URL rendering, filtering, image transformations, contact submission, and all security/deployment behaviour.
4. Storyblok Assets replace the reusable parts of Sanity `mediaAsset`: asset-level alt, copyright/source, focus point, folders/tags and publication lifecycle. Only caption and per-placement layout choice remain in content.
5. `just-go-ghana` is a `multi_day_tour` variant, not a forced fit into the current standard tour page.

Official capability basis: Storyblok stories/folders/content types and blocks are designed for constrained content models; blocks may be content-type, nestable or universal. [Stories](https://www.storyblok.com/docs/manuals/stories), [Blocks](https://www.storyblok.com/docs/concepts/blocks). Storyblok image assets expose alt, copyright, source, focus, tags, schedule/privacy and custom metadata; the Image Service can use the asset focus value in focal transformations. [Asset object](https://www.storyblok.com/docs/api/management/assets/the-asset-object), [focal point](https://www.storyblok.com/docs/api/image-service/operations/focal-point).

## 1. CMS boundary

### Editor-controlled

| Content | Authoritative Storyblok source | Evidence/current destination |
|---|---|---|
| Tours | Tour / Multi-day tour stories | `tours.js`, `tour-pages.json`, `tour-source.mjs`, `render-tour-page.mjs` |
| Tour price, details, cards, images, FAQs, gallery, related choices | Tour story | card renderer, generated template, contact/select/search |
| Homepage wording/media/reviews/pathways/featured selections | Home story plus constrained blocks/global curated list | `homepage-sections.js`, `homepage-source.mjs` |
| Experiences hero/add-on image/add-ons | Experiences story and local-experience stories | `packages.html`, `experiences-page-source.mjs` |
| About | About story | `about.html`, `about-source.mjs` |
| Contact copy/contact image/FAQ | Contact story; contact details from global settings | `contact.html`, `booking-source.mjs` |
| Policies | Five policy stories | `policy-source.mjs`, `render-policy.mjs` |
| Reviews | Review stories, referenced where selected | `review` schema/homepage model |
| Navigation/footer/contact/social | global settings + global navigation | `src/partials/*`, `content-source.mjs` |
| SEO | each page/tour SEO field block, with code fallbacks | `render-meta.mjs` |

### Code-controlled

Layout templates; CSS/design tokens/typography; breakpoints; animation/reduced-motion behaviour; lightbox; filters and query-string grammar; card/page component presentation; Image Service URLs and widths; fallback rendering rules; tour URL output mapping; sanitization; build/static generation; Cloudflare Functions; inquiry transport/email; Turnstile; CSP/security headers; redirects; sitemap/canonical generation; test and deployment logic. These are implementation contracts in `style.css`, `script.js`, `scripts/`, `functions/`, `_headers`, `_redirects`, and `tests/`—not editable CMS content.

## 2. Content tree

```text
Home
  └─ Home (single story)

Tours
  ├─ Day & short experiences (tour stories)
  └─ Multi-day experiences (multi_day_tour stories; Just Go Ghana here)

Pages
  ├─ Experiences
  ├─ About
  └─ Contact & booking

Policies
  ├─ Cancellation & refund
  ├─ Travelling to Ghana
  ├─ Travel insurance
  ├─ Booking terms
  └─ Privacy

Editorial
  ├─ Reviews
  ├─ Guest stories (create only when a public surface is approved)
  └─ Team members (create only when shared team records replace embedded About data)

Global
  ├─ Site settings
  ├─ Navigation & footer
  └─ Homepage featured tours

Assets
  ├─ Tours / Home / People / Pages / Brand
  └─ Tags: approved-photo, needs-consent, stock, placeholder
```

Folders match an editor’s task and current visible website groups. They do not dictate a frontend URL; current URLs remain code-owned and must not be changed by moving a Storyblok story. Use Stories for editorial records; global stories for singleton data; nestable blocks for structured repeated content; references for tour/review relationships. Use small datasources only for controlled options: `tour_category`, `tour_vibe`, `destination`, `currency`, `activity_level`, `meal`, `cta_tier`, and `policy_type`. Do not store navigation or tours as datasource values.

## 3. Tour editing experience

One `tour` content type handles day/short experiences. It has editor-facing tabs/groups below; labels deliberately avoid implementation jargon.

| Group | Field name — editor label | Type; requirement/validation/default | Frontend destination | Origin |
|---|---|---|---|---|
| Basics | `name` — Experience name | text; required; max 80 | card/detail/form/search | both |
|  | `slug` — Published URL key | slug; required; unique; immutable after launch without redirect review | route lookup | Sanity/local |
|  | `published` — Show this experience | boolean; default true | listing/filter/content build | Sanity |
|  | `offer_type` — Type of experience | single option; required; day/tailored/custom | editorial/payment policy | Sanity |
|  | `display_order` — Position in Experiences | number; required, integer ≥1 | listing/select/search | local |
| Card | `card_image` — Card photo | asset; required; asset alt required | 3:2 tour card | both |
|  | `card_badge` — Small label on card | text; optional; max 20 | card badge | local |
|  | `card_description` — Card description | textarea; required; 180–340 recommended chars | clamped card copy | both |
|  | `categories`, `vibes`, `destination` | multi/single options; category required, max 2 visible vibes | filters/tags/related | both |
|  | `search_summary` | textarea; optional; max 150 | command palette | both |
| Pricing & essentials | `price`, `currency`, `price_unit` | number ≥0 required; option default USD; text default Per Person | price/card/detail | both |
|  | `price_options[]` | `price_option` blocks; optional; label required/max 60, nonnegative price | detail alternatives | Sanity |
|  | `duration`, `locations[]`, `starting_point` | text required/max 50; list; text | card/details/hero | both |
|  | `group_min`, `group_max`, `group_note` | number ≥1; optional; note max 140 | card/details/price note | both |
|  | `availability_note`, `accessibility_notes` | textarea; optional | retain for future only until a visual slot exists | Sanity |
| Hero & overview | `hero_image` — Wide hero photo | asset; optional; falls back to card image | hero; Image Service wide crop | both |
|  | `hero_watermark` | text; optional/max 32 | hero background word | Sanity |
|  | `page_headline`, `overview` | text required/max 110; richtext/plain paragraphs required/max 1,200 | overview | both |
|  | `fun_facts[]`, `highlights[]` | list blocks; 0–5 / 0–8 | fun facts now; highlights only after code surface exists | Sanity |
| What is covered | `included[]`, `excluded[]` | list items; each 1–120 chars; both required/min 1 | coverage section | both |
| Gallery | `gallery[]` | gallery-item blocks; optional, max 12; current UI hides <3 | grid/lightbox | Sanity/local |
| FAQ | `faqs[]` | FAQ blocks; required/min 1/max 10; q ≤120/a ≤700 | detail accordion | both |
| Relationships | `related_tours[]` | story references; optional/max 3 | future explicit relationship; current code category-derives | Sanity/local |
| Governance | `editorial_note`, `last_reviewed` | textarea/date; optional; never public | internal | new simplification |
| SEO | `seo` | SEO block; required component, fields optional because automatic fallbacks apply | meta/sitemap control | new |

**Deliberate exclusions:** payment/deposit mechanics, WhatsApp number, CTA implementation, visual badge styles, image dimensions and automatic related-tour fallback stay in code. `itinerary[]` is not placed on the day-tour form because current day template does not render it. It belongs on `multi_day_tour`.

### `multi_day_tour` variant

Use the same Basics/Card/Pricing/Hero/Coverage/Gallery/FAQ/SEO groups, plus `activity_level`, `trip_style`, `accommodation_summary`, `meals_summary`, `airport_transfer_included`, `dedicated_host_included`, `trip_highlights[]`, `itinerary_days[]`, `testimonials[]`, `deposit_note`, and `related_tours[]`. This prevents the day-tour editor from presenting irrelevant fields while preserving shared card behaviour.

## 4. Image system

Storyblok native Asset metadata should own: **alt text, copyright/credit, source, focus point, assets folders/tags, privacy/publish scheduling and internal asset governance tags**. Keep a custom `gallery_item` only for a per-placement caption and optional layout override. Do not recreate `mediaAsset.relatedTour/relatedStory/relatedPeople`: Storyblok story references already express content relationships, and a photograph may legitimately serve more than one story. Do not expose `publicApprovalState` or `placeholderState` as fields on every image; use asset folders/tags and editorial workflow. Keep `consent` only as restricted asset metadata/tag (`needs-consent`, `consent-confirmed`) where identifiable people are involved. Preserve `owner`/credit only where legal provenance requires it.

| Role | Upload / frontend ratio | Desktop/mobile + focus | Alt/caption/fallback |
|---|---|---|---|
| Home hero | High-resolution landscape, ≥2400px wide, calm text-safe left/lower area | full viewport/min 640px, cover; mobile remains cover | alt required if meaningful; no caption; fallback to approved current hero |
| Tour card | Master ≥1600px wide; do not upload a pre-cropped duplicate | 3:2 cover; 360px/45vw/100vw sizes; Image Service focal crop | alt required; no caption; require card asset |
| Tour hero | Same master as card unless a distinct composition is needed | wide 1920px rendition; focus preserves title-safe composition | alt required; no caption; fallback to card asset |
| Gallery | ≥1600px longest edge, original orientation | responsive CSS grid/lightbox; transform to delivered slot | alt required; caption optional; omit gallery section under 3 assets |
| Experiences/contact hero | ≥2400px wide/text-safe left area | full-bleed cover; contact/experiences size differs | alt required where non-decorative; no caption; current local asset fallback |
| Add-on | ≥1600px, useful central subject | 4:5 desktop, 4:3 mobile | alt required; no caption; fallback local asset |
| Pathway | ≥1600px wide | 5:3 UI-v2 cover/card zoom | alt required; no caption |
| Team | ≥1200px portrait | 4:5/3:4 cover | alt required; initials fallback when absent |
| Review avatar | ≥400px square portrait | 44px circle/square UI crop | alt required if person is named; initials/no-image fallback |
| SEO/social | ≥1200×630 landscape | code produces social rendition | alt optional/non-public; fallback current generic OG image |

Frontend code will request explicit Image Service width/height/crop/focus variants. Editors upload **one best master**, set its asset focus point once, and do not create card/hero/mobile duplicates. If a different composition is genuinely required, `hero_image` may be different from `card_image`.

## 5. Gallery experience

`gallery[]` is an ordered blocks field, allowing only `gallery_item`: Asset (required), Caption (optional, max 180), Layout (automatic by default; optional `portrait` or `wide` override). The editor adds/removes/reorders items directly in the Tour story. Alt and focus are set once on the selected Asset, not copied into every use. The adapter should infer portrait/wide from source dimensions; provide override only for intentional composition exceptions because current `render-tour-page.mjs` derives `tall`. Keep current minimum 3, maximum 6 rendered gallery images initially; permit storage up to 12 for editorial planning but only publish the first approved/currently allowed items until a later design decision changes that contract. No carousel.

## 6. Controlled homepage architecture

[`homepage-source.mjs`](../../scripts/homepage-source.mjs) has seven fixed keys; [`homepage-sections.js`](../../homepage-sections.js) has bespoke renderers. Model them as one `home` story, not free blocks.

| Section | CMS status | Editable content |
|---|---|---|
| Hero | always exists | hero asset, headline, supporting copy, one CTA |
| Founder story | always exists | eyebrow/headline/body, selected founder mini-cards, CTA/trust note |
| Ways to experience | always exists | heading/copy, exactly 1–6 ordered pathway blocks; each title/text/image/filter key |
| Trip moments | always exists | heading/copy, ordered moment image/caption items |
| Reviews & trust | always exists | heading/title lines, rating summary, selected review references, trust image/CTA |
| Planning process | always exists | heading/copy, exactly 3 planning-step blocks with optional CTA |
| Final invitation | always exists | eyebrow/headline/body, primary CTA and optional secondary CTA |
| Flexible sections | optional | only `photo_beside`, `cards`, `quote`, `invitation`; enabled flag and predefined insertion slot: before hero or after a named fixed section |

Editors may change content and enable a permitted flexible section; they cannot delete/reorder the seven narrative sections, choose arbitrary layouts, or insert unapproved components. The “featured tours” selection is a global curated list of 3–5 Tour references, not a Home block, because it is an editorial selection reused by the homepage card renderer.

## 7. Other page models

| Model | Storyblok type | Fields/constraints |
|---|---|---|
| Experiences | single story | hero asset; add-on asset; listing title/copy/CTA; add-on intro/minimum group; references/order of active local experiences. Cards remain tour-driven. |
| About | single story | fixed groups matching current hero/story/mission/difference/team/impact/FAQ/CTA; team remains embedded initially to match the existing output. |
| Contact & booking | single story | contact hero, intro, two fixed form-step copy groups, trust points, confirmation copy and FAQs. Code owns inputs, endpoint and security. |
| Policy | five `policy_page` stories | type, title/date/intro, ordered `policy_section`→`policy_term`, contact intro/closing, optional internal legal-review flag. |
| Review | content-type story | reviewer, rating 1–5, original/source URL/date, selected excerpt, related tour, optional photo, internal permission/review date. Only selected references display. |
| Navigation & footer | one global story | ordered primary links, footer groups, legal links; validated internal/external link fields. |
| Site settings | one global story | business identity, phone/email/address/hours/WhatsApp/social/service area. |

## 8. Just Go Ghana

It differs materially from generated tours: [`just-go-ghana.html`](../../just-go-ghana.html) is hand-authored, uses an image placeholder, has five hero tags plus activity/trip-style metadata, eight collapsible itinerary days with meals, a distinct sidebar (accommodation/transfer/host), hard-coded testimonial cards, a deposit note, fixed related cards, and a closing invitation. `build-static.mjs` intentionally skips it; `tour-pages.json` only holds basic included/excluded/FAQ/itinerary fallback and cannot reproduce its complete layout.

**Recommendation:** make it the first `multi_day_tour` story, reusing common Tour fields and a dedicated current-layout renderer. Do not force it into standard `tour` and do not make every Tour editor see multi-day fields. To migrate without a visual change, capture every present hard-coded hero/meta/highlight/itinerary/meal/coverage/review/sidebar/related/CTA field, use fixed components for each already-visible section, and retain `/just-go-ghana` as its URL. Its current hero has no photo; retain the current visual fallback until an approved hero asset exists.

## 9. Target ownership model

| Category | Current source(s) | Target source of truth |
|---|---|---|
| Tour facts/copy/prices/images/order/routes | Sanity + `tours.js` + `tour-pages.json` + hand HTML | Tour/multi-day story; code-only immutable published route map during migration |
| Tour presentation/filtering/image URLs | JS/CSS/scripts | code |
| Home | Sanity + `homepage-content.js` + renderer | Home/global featured stories; code renderer |
| About/contact/policies | Sanity + JSON + static HTML | respective Storyblok stories; code templates/forms |
| Navigation/site footer/settings | Sanity + JSON + partials | global stories; code partial renderer |
| Add-ons | Sanity + JSON | Experiences/global local-experience stories |
| Reviews/team/stories | schema + some hard-coded content | Review/Team/Guest-story stories only when public use is approved |
| Assets | local + Unsplash + Sanity asset refs | Storyblok Assets, except logos/favicons kept static in code |
| SEO/meta/robots/sitemap | code | Storyblok per-story SEO values plus code defaults/generation |

The content adapter must have exactly one published editorial input for each target category after cutover. Code retains only value transformations and safe defaults—not competing text, prices, or images.

## 10. Component inventory

| Class | Components and purpose |
|---|---|
| Content types | `tour`, `multi_day_tour`, `review`, optional `guest_story`, optional `team_member`, `local_experience`; each is a standalone Story. |
| Page/global content types | `home`, `experiences_page`, `about_page`, `contact_booking_page`, `policy_page`, `site_settings`, `navigation_footer`, `featured_tours`. |
| Nestable blocks | `cta`, `faq_item`, `price_option`, `gallery_item`, `itinerary_day`, `policy_section`, `policy_term`, `pathway`, `moment`, `planning_step`, `founder_card`, `team_card`, `impact_stat`, `trust_point`, `flex_photo_beside`, `flex_cards`, `flex_quote`, `flex_invitation`, `seo`. |
| Relationships | Tour→related Tours; Review→Tour; Guest Story→Tour/Review; featured list→Tours; Home review selection→Reviews. |
| Asset usage | Storyblok Asset references, not a custom media document; caption/layout only in placement blocks. |

Avoid `page`, generic rich-content, generic hero, arbitrary grid, or arbitrary section blocks. They would create a page builder the existing renderer cannot safely support.

## 11. Visual Editor

### Required for migration

None. A static build-time Storyblok adapter, static production output and a content comparison workflow are sufficient. The migration must not depend on live visual editing.

### Optional future enhancement

Storyblok Visual Editor can work with this stack without a framework, but requires a dedicated draft preview build that fetches draft content, renders the existing HTML templates, outputs Storyblok block edit attributes (`data-blok-c`, `data-blok-uid`) on mapped sections, and loads the Preview Bridge only there. Storyblok documents draft fetching, editable block attributes, bridge events and a configured iframe Preview URL/Real Path. [Visual Editor](https://www.storyblok.com/docs/concepts/visual-editor). The preview must map Storyblok slugs to the site’s existing routes (especially tour filenames); its draft token must be handled safely. This is a future code feature, not a Phase 2 prerequisite.

## 12. SEO model

Attach one `seo` block to Home, Experiences, About, Contact, every Policy and each Tour variant:

| Field | Validation/default |
|---|---|
| SEO title | optional, recommended ≤60; fallback current generated title/name |
| Meta description | optional, recommended 120–160; fallback current description/intro |
| Canonical override | optional URL; use only for documented exceptions; fallback code-derived canonical |
| Social image | optional asset, 1200×630 recommended; fallback current generic OG image or hero |
| Indexing | option `index` default / `noindex`; code remains responsible for robots/sitemap application |

Do not expose raw robots directives, Open Graph markup, sitemap records, or canonical generation mechanics to editors.

## 13. Validation policy

- Required: Tour name, slug, published state, display order, card description/card asset, category, price/currency/unit, duration, overview, included/excluded ≥1, FAQ ≥1, gallery asset when an item exists.
- Sensible limits: name 80; badge 20; card copy 340; headline 110; FAQ question 120/answer 700; gallery caption 180; gallery 12 stored; max 3 related tours; max 2 visible vibes.
- Numeric constraints: price ≥0, group values integers ≥1, `max ≥ min` as implementation validation, display order positive integer, review rating 1–5.
- Fixed choices: category, destination, currency, meal, activity level, CTA tier and policy type come from datasource options.
- Asset rules: meaningful assets require asset-level alt; Storyblok focus must be set for hero/card/pathway assets; credit/source populated when not company-owned; consent tags reviewed before publication.
- Do **not** require a hero asset (card fallback is a current visual contract), gallery minimum (the UI intentionally hides small galleries), itinerary for day tours, or every newly modelled field that current templates do not render.

## 14. Detailed migration mapping

| Current | Storyblok target | Action |
|---|---|---|
| Sanity `tour.title`, local `title` | `tour.name` | **MERGE**; resolve factual differences manually |
| Sanity `slug`, local `slug/detailUrl` | `slug` plus code route-map | **MIGRATE + KEEP IN CODE** route-map until parity confirmed |
| local `packageOrder/homeOrder/homeFeatured`, Sanity featured collection | `display_order`, global `featured_tours.items[]` | **MERGE** |
| local `badge`, card/hero fallbacks, alt | card fields/assets | **MIGRATE**; manual rights/image review |
| Sanity/local price/duration/location/group/category/vibes/description | corresponding Tour fields | **MERGE**; manual reconciliation required |
| `tour-pages.json` included/excluded/FAQ/overview/itinerary | coverage/FAQ/overview/multi-day itinerary | **MIGRATE**; day itinerary stays hidden |
| Sanity cardPhoto/coverPhoto/media + `mediaAsset` | Asset refs + gallery items | **MERGE**; retain only caption/layout override custom fields |
| Sanity unused availability/accessibility/context/highlights/supplement/story ref | retained optional Tour fields | **REVIEW MANUALLY**; no current frontend output |
| `just-go-ghana.html` hero/meta/highlights/itinerary/reviews/sidebar/related/CTA | `multi_day_tour` | **MIGRATE** only after fixed renderer plan |
| homepage JS/Sanity sections | Home fixed groups | **MERGE** |
| About/Booking/Policy JSON + Sanity | page/policy stories | **MERGE** |
| navigation/site JSON + Sanity | global stories | **MERGE** |
| HTML/CSS/JS templates/functions/headers/redirects | code | **KEEP IN CODE** |
| duplicate fallback copy/images after verified cutover | none | **DEPRECATE** only in later authorized cleanup |

## 15. Final editor experience

| Task | Editor workflow / number of places |
|---|---|
| Update a tour price | Open one Tour → Pricing → save/publish. **One.** |
| Replace a cover photo | Update existing Asset focus/alt once; select it in Hero (or Card fallback). **One asset + one placement at most.** |
| Add gallery photos | One Tour → Gallery; add/reorder items; asset alt/focus once. **One story.** |
| Create a tour | New Tour, complete guided groups, select one card asset, publish only after route/QA workflow. **One story**, with code creating the mapped static page later. |
| Update homepage | One Home story; only the relevant fixed section/flexible approved slot. **One story.** |
| Add FAQ | Tour/About/Contact/Policy story’s own FAQ list. **One story.** |
| Update policy | One named Policy story. **One.** |
| Change contact details | Global Site Settings. **One**, updates shell/contact/policies. |

## 16. Implementation roadmap (not authorized to implement)

1. Approve this model and a Storyblok folder/role/workflow policy; freeze current routes/screenshots/content register.
2. Create the schema in a non-production Storyblok space; configure datasource options and asset folders/tags.
3. Inventory/reconcile all Tour fields across Sanity, `tours.js`, JSON and HTML; approve a canonical route map and Just Go Ghana record.
4. Migrate assets first, with credit/consent/focus/alt review; compare card/hero/gallery crops against baseline.
5. Import globals, page stories, policies, tours and multi-day tour into staging; retain Sanity/local sources unchanged.
6. In a separately authorized Phase 3, implement the build-time Storyblok adapter and preserve existing templates/routes. Add output-level content, screenshot, metadata and redirect comparisons.
7. Test preview/staging: desktop/mobile/no-JS, filters, lightbox, forms, CSP, sitemap/canonical, privacy/security headers and all redirects.
8. Switch production after editorial and visual parity acceptance. Keep rollback and Sanity read-only.
9. Add optional Visual Editor preview only after production static migration is stable.
10. Remove Sanity/fallback ownership only in an explicitly authorized cleanup phase.


