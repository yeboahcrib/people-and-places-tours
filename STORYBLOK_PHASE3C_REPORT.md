# Storyblok Phase 3C Report — Standard Tour Migration and Local Validation

**Close-out date:** 2026-08-30 local time (the final Storyblok verification completed 2026-08-31 UTC)  
**Status:** **Complete for controlled local standard-tour migration. Not approved for production.**

## Scope kept

Phase 3C migrated only safe, standard day/short-experience records into the existing Storyblok `tour` model and validated them through the unchanged static-site architecture. It did not deploy the site, alter Cloudflare/DNS/CSP/redirects, remove Sanity, remove local fallbacks, add browser-side Storyblok access, change a website route, or redesign the presentation.

**Just Go Ghana was not migrated.** It remains on its existing source and is reserved for the separately approved future `multi_day_tour` work.

The Phase 3C authorization names `STORYBLOK_MIGRATION_AUDIT.md`, `STORYBLOK_ARCHITECTURE.md`, and `STORYBLOK_PHASE3A_PLAN.md`. Those files were not present locally during this work. This report does not recreate or presume their contents; the available [Phase 3B report](STORYBLOK_PHASE3B_REPORT.md), actual repository, and actual EU Storyblok Space were used as the available basis. The missing approved-document copies remain a production-decision documentation gap.

## Standard-tour inventory and outcome

There are 12 current standard Tours. Eight were safely migrated as Storyblok drafts. Four were correctly isolated for manual review rather than silently changed.

| Tour | Existing public route | Storyblok path | Final Phase 3C status |
| --- | --- | --- | --- |
| Accra City Tour | `/accra-city-tour.html` | `tours/day-short-experiences/accra-city` | Migrated draft; locally applied |
| Accra After Dark Food Tour | `/accra-food-tour.html` | Not created | Needs manual review; local fallback |
| Cape Coast Ancestral Tour | `/cape-coast-tour.html` | `tours/day-short-experiences/cape-coast` | Normalized as a draft; locally applied |
| Kumasi Cultural Tour | `/kumasi-tour.html` | `tours/day-short-experiences/kumasi` | Migrated draft; locally applied |
| Ada Day Tour | `/ada-tour.html` | `tours/day-short-experiences/ada-foah` | Migrated draft; locally applied |
| Quadbike & Waterfalls | `/quad-bike-tour.html` | `tours/day-short-experiences/quad-bike` | Migrated draft; locally applied |
| Volta Day Tour | `/volta-tour.html` | Not created | Needs manual review; local fallback |
| Shai Hills & Boat Cruise | `/shai-hills-tour.html` | `tours/day-short-experiences/shai-hills` | Migrated draft; locally applied |
| Aburi Day Tour | `/aburi-tour.html` | `tours/day-short-experiences/aburi` | Migrated draft; locally applied |
| Cape Coast Day Tour | `/cape-coast-day-tour.html` | `tours/day-short-experiences/cape-coast-day` | Migrated draft; locally applied |
| Volta Community Tour | `/volta-community-tour.html` | Not created | Needs manual review; local fallback |
| Batik & Pottery Workshop | `/batik-workshop.html` | Not created | Needs manual review; local fallback |

Each of the eight CMS records was re-pulled after the controlled CLI push. The final audit found exactly those eight records under `tours/day-short-experiences/`; all have outer Storyblok state `published: false` with unpublished changes, while their editor-facing **Show this experience** content field is `true`. Cape Coast was normalized in place rather than duplicated.

## Manual-review records and unresolved conflicts

| Tour | Reason it was not migrated | Required resolution |
| --- | --- | --- |
| Accra After Dark Food Tour | No approved Storyblok-safe card/hero/gallery image was available. Its current rule is USD 90 per person for three or more guests and USD 110 per person for two guests. | Approve appropriate media and confirm the precise alternative-price presentation. |
| Volta Day Tour | The FAQ headed “What is the rope suspension bridge?” has an unrelated answer about Mount Gemi/Tafi Atome. | Confirm the factual question/answer or explicitly approve its replacement/removal. |
| Volta Community Tour | No approved Storyblok-safe card/hero/gallery image was available. | Approve appropriate media. |
| Batik & Pottery Workshop | Current website material presents a USD 120 day Tour, while prior reconciliation says it became a Local Experience for groups of four or more with no fixed price. | Resolve product type, booking model, and price before a Storyblok record is created. |

These Tour fallbacks are intentional failure isolation, not migration failures. Their existing local/Sanity-backed content remains available and no unapproved asset was imported for them.

## Content model and asset migration

The existing editor-facing Tour Content Type remains the model. Its Phase 3C parity adjustment adds **Good to know** as an ordered required list (one to six items), because that information is visible in every existing tour page. The gallery limit is six, matching the established renderer contract. No generic page builder, route field, or speculative field was introduced.

The eight draft stories contain the editor-facing fields required for current presentation: card/photo information, categories, vibes, destination, price and alternative prices where applicable, duration, places, group-size bounds, overview, included/excluded lists, Good to know facts, FAQs, gallery, and SEO/sharing fields.

The controlled asset set contains twelve referenced Storyblok assets: nine approved assets uploaded for the seven new safe records, plus three established Cape Coast assets. A single approved master photo is reused for card/hero composition where appropriate; no desktop/mobile duplicate uploads were made. Ada retains its two legitimate ordered gallery photographs, but the existing site correctly continues to hide that gallery below the established three-image minimum.

The newly uploaded Asset Manager records and the three established Cape Coast assets carry meaningful alt text, title/source metadata, and focal-point data where available. Cape Coast’s three gallery items therefore render with non-empty Asset Manager default alt text; placement-specific captions remain optional and do not replace that alt text.

## Generic adapter and browser catalogue changes

Phase 3B’s Cape-Coast-only logic was refactored into one generic standard-tour adapter.

- The build-time adapter has an explicit registry for the 12 standard Tour slugs and expected Storyblok paths; it deliberately excludes Just Go Ghana.
- It requests draft content only during an explicitly enabled local build, validates each record independently, applies only valid data to the established renderer-facing Tour shape, and never changes the local `detailUrl`.
- It preserves ordered FAQs, gallery images, price options, category/vibe/destination values, focal-point transformations, Asset Manager alt text, and the existing category-derived related-Tour behaviour.
- Missing, malformed, unsafe, duplicate, or disabled Storyblok data falls back only for the affected Tour.
- One generated `storyblok-standard-tours-overlay.js` now replaces the Cape-only overlay. It carries only mapped public catalogue data, loads after `tours.js` and before the unchanged browser script, preserves the local catalogue order, and does not exist as one overlay per Tour.

This overlay is transitional migration compatibility for the existing browser code that rebuilds its catalogue from `window.PEOPLE_PLACES_TOURS`. It should be simplified only in a separately authorised phase after Storyblok is genuinely authoritative.

## Route preservation

The generic adapter maps content into the existing internal representation rather than deriving routes from CMS paths. The local build-output checks verify the card link, generated HTML file, canonical URL, and sitemap entry for every standard Tour, including the non-pattern routes:

- `/ada-tour.html`
- `/batik-workshop.html`

All other existing standard routes listed in the inventory remain exact. Just Go Ghana remains `/just-go-ghana.html`, remains outside the standard-tour registry, and receives no Storyblok asset or content change.

## Final local build health and fallback behaviour

The final Storyblok-enabled local build produced the following `dist/health.json` source state:

| Source state | Slugs |
| --- | --- |
| `applied` (8) | `accra-city`, `cape-coast`, `kumasi`, `ada-foah`, `quad-bike`, `shai-hills`, `aburi`, `cape-coast-day` |
| `missing-story` fallback (4) | `accra-food`, `volta`, `volta-community`, `batik-workshop` |

The health summary is **8 applied / 4 fallback**. The complete catalogue remains 13 records because Just Go Ghana remains present and unchanged. A bad or absent Storyblok record therefore cannot make the rest of the catalogue disappear.

## Gallery and lightbox validation

Cape Coast is the legitimate three-photo gallery validation record. Its final Storyblok draft contains exactly three ordered gallery entries; the generic adapter maps that order into the existing grid/lightbox contract and preserves asset alt text, captions, wide/portrait/automatic layout data, and focal-point image transformations.

The Phase 3B connected-browser review established the visual baseline for Cape Coast. Phase 3C re-exercised the same data path through the generic adapter in the connected browser at 1440px and 390px: the existing grid, spacing, responsive layout, image order, focal crops, alt text, captions, lightbox opening/close behaviour, desktop navigation, keyboard navigation, and mobile swipe behaviour passed without a design change. It did not redesign the gallery or lightbox.

The automated screenshot baseline was not treated as a passing visual signal in this environment. `npm run test:visual` exited 1 with 72 screenshot dimension mismatches against the August 26 baseline because that harness blocks external `a.storyblok.com` image loading. No baseline was replaced or weakened. Repeated host-bound Chromium/Playwright launches also remain constrained by the desktop sandbox’s MachPort restriction. These are test-host limitations, not evidence of a website regression; they remain an explicit limitation on fresh automated visual capture for this local pass.

## Tests and safety checks

The controlled story migration used a dry run, a controlled CLI push, and a final scoped Storyblok pull. The final pull confirmed eight and only eight standard-tour drafts at the expected CMS paths.

The Storyblok-enabled local build and expanded automated coverage validate:

- Multiple valid Storyblok records plus four independent fallback records.
- Missing/invalid individual Story, duplicate slug, and duplicate display-order isolation.
- Existing route, card link, canonical, and sitemap preservation for all standard Tours.
- Storyblok EU asset-host allow-listing, focal-point URLs, meaningful alt text, FAQ ordering, gallery ordering, and price-option/category/vibe/destination mapping.
- Browser catalogue synchronisation through one generic overlay, preserving local catalogue order and leaving fallback Tours and Just Go Ghana unchanged.
- Absence of a Storyblok Content API endpoint, browser-side Storyblok `fetch`, Preview-token name/value, or token query parameter in public build output.

The normal build gates retain their existing JavaScript, security-header, static-accessibility, content-contract, static-generation, and build-output checks. No test was removed or weakened for Phase 3C. The visual-run limitation above is recorded rather than hidden.

## CMS UX result

The resulting editor workflow reads as a travel-experience form rather than a database: Basics; Card; Pricing & group size; Tour overview; What’s included; What’s not included; Gallery; Questions; and SEO & sharing. An editor can change price, photo, overview, duration, guest bounds, included/excluded items, FAQs, gallery order, focal point, and SEO without needing renderer terminology. **Good to know** is a visible guest-facing list, not an implementation field.

No additional datasource was needed: the existing category, vibe, destination, and USD datasource entries cover the migrated records. No image tag taxonomy was added because the Tours/Standard Tours folder, readable title/alt/source metadata, and focal-point support are sufficient for current needs.

## Production-readiness blockers and explicit non-changes

This phase is not a production authorisation. Before a future production phase, resolve the four manual-review Tours, retrieve/reconcile the locally missing approved architecture documents, make a separate decision on published-content credentials and any required image CSP allowance, and authorise any eventual simplification of the local/Sanity fallback and transitional overlay.

No production deployment occurred. No production Cloudflare variables, DNS, routes, redirects, CSP, Sanity dataset, or production build configuration was changed. The scoped local build adapter is the Phase 3C validation mechanism; `tours.js`, `tour-pages.json`, and every non-Tour CMS area remain unchanged. Home, About, Contact, policies, navigation, footer, reviews, guest stories, team, site settings, and Just Go Ghana remain outside this phase.

## Recommendation and stopping point

Phase 3C has completed its controlled local objective: Storyblok is now the validated draft source for the eight safe standard Tours, while four material conflicts remain intentionally on per-Tour fallback. Stop here.

Do not deploy, publish these draft stories for production use, migrate another Tour, migrate Just Go Ghana, remove Sanity/fallbacks, or expand Storyblok ownership without explicit approval for the next phase.
