# Storyblok Phase 3B Report — Cape Coast Test Tour

## Status

**Phase 3B is complete and fully accepted locally, including final gallery verification.** Cape Coast Ancestral Tour (cape-coast) was retrieved from the approved Storyblok EU space during a local static build and rendered through the existing website presentation. The fallback path was also verified.

No production deployment, Cloudflare configuration, DNS, route, visual design, or global CMS ownership changed. This is the Phase 3B stopping point; do not begin Phase 3C without explicit approval.

## Scope kept

- Only Cape Coast Ancestral Tour can use Storyblok.
- All other tours, homepage, navigation, About, Contact, policies, Sanity, fallback JSON, and the source tours.js file remain in their existing roles.
- Storyblok is contacted only during an opted-in local static build.
- Browser visitors receive ordinary static HTML, images, and a small public-content overlay. Browser JavaScript never calls the Storyblok API and never receives an access token.

## Files changed

- scripts/storyblok-tour-source.mjs — narrow Storyblok Content Delivery API adapter and Phase 3A schema validation for Cape Coast only.
- scripts/tour-source.mjs — applies a valid Storyblok Cape Coast result on top of the established local/Sanity result, without changing another tour.
- scripts/storyblok-tour-browser-overlay.mjs — generates a public, token-free browser catalogue overlay for Cape Coast only.
- scripts/build-static.mjs — emits and hash-stamps that overlay only when the adapter has applied, and records the narrow adapter status in dist/health.json.
- scripts/render-tour-cards.mjs — permits only allow-listed Storyblok EU asset URLs in addition to the existing image sources.
- scripts/render-tour-page.mjs and src/templates/tour-page.html — use mapped Storyblok hero Asset Manager alt text without changing visual presentation.
- scripts/render-meta.mjs — maps the existing internal SEO shape into the established metadata renderer.
- tests/tour-source.mjs and tests/build-output.mjs — adapter, overlay, asset-safety, and generated-output coverage.
- docs/storyblok-phase3b-local.md — local non-secret setup instructions.

## Adapter and browser architecture

1. loadTourContent gets the existing local/Sanity catalogue first.
2. It requests one draft Storyblok story only when the Cape Coast switch is enabled, the region is EU, a local Preview token exists, and the existing catalogue contains cape-coast.
3. The adapter validates the exact Phase 3A story path and component shapes, then maps approved fields into the website's existing tour shape.
4. The static builder renders the normal card and tour page from that mapped shape.
5. The existing script.js later rebuilds package cards and booking price details from window.PEOPLE_PLACES_TOURS. When the adapter has applied, the build emits dist/storyblok-cape-coast-overlay.js after tours.js and before the unchanged script.js. It replaces exactly the cape-coast catalogue entry with mapped public fields.

The overlay contains no API endpoint, token, or fetch logic. It is not emitted when Storyblok is disabled or fails validation. The source tours.js file remains unchanged.

## Local configuration

| Variable | Purpose |
| --- | --- |
| STORYBLOK_CAPE_COAST_ENABLED=true | Explicitly enables the one-tour local test. Any other value keeps Storyblok off. |
| STORYBLOK_REGION=eu | Confirms the approved EU space. Any other region fails closed. |
| STORYBLOK_PREVIEW_API_TOKEN | Read-only Preview token used by the local build to retrieve the draft test story. |

The token stays in the ignored local .env.storyblok file or a local secret store. It is not committed and is not a personal/Management API token, asset token, or public access token. See docs/storyblok-phase3b-local.md for local setup.

## Storyblok API behavior and fallback

The adapter requests only the draft Content Delivery API story:

tours/day-short-experiences/cape-coast

The editor-facing **Show this experience** state is a hard source-selection gate. If configuration is missing, the region is wrong, the tour is unavailable, the response is incomplete, the show state is off, or an asset is unsafe, the existing Cape Coast source remains in use. The build continues and unrelated tours cannot be affected.

dist/health.json reports this independently as storyblokCapeCoastSource; it contains neither an access token nor a request URL.

## Field mapping

| Storyblok editor field | Existing website behavior |
| --- | --- |
| Experience name, slug, show state, display order | Existing title, validated cape-coast route, source gate, and Experiences ordering |
| Card photo, badge, description | Card image, Asset Manager alt text, badge, and existing card description |
| Categories, vibes, destination | Existing filters and category-based related-tour behavior |
| Price, currency, price per, price options | Existing price card and alternative-price display |
| Duration, places, start, group minimum/maximum/note | Existing card meta, tour meta, and booking detail fields |
| Hero photo, watermark, overview heading and overview | Existing tour-page hero and overview presentation; hero Asset alt text is preserved |
| Included, excluded, FAQs | Existing ordered lists and FAQ presentation |
| Gallery | Existing ordered gallery only when it has at least three images |
| SEO and sharing | Existing title, description, canonical override, indexing, and social-image metadata pipeline |

No related-tour field was provisioned in Phase 3A. The existing renderer derives related tours from the mapped categories, so no speculative editor control was added.

## Image and accessibility behavior

- Storyblok Europe images are allow-listed to a.storyblok.com and a2.storyblok.com; arbitrary CMS URLs are rejected.
- Card rendition: 1200x840; Experiences-card rendition: 1200x825.
- Hero rendition: 1920x1080, falling back to the card photo where needed.
- Gallery rendition: 900x1125, in Storyblok editor order.
- Asset Manager focal-point data is passed to every Storyblok Image Service crop.
- Card, hero, and gallery default to Storyblok Asset Manager alt text.
- The existing gallery minimum remains: the test story now has three photos, so the existing gallery and lightbox render.

## Validation completed

- Successful Cape Coast mapping and generated output.
- Disabled and missing configuration, wrong region, unavailable response, incomplete/unsafe content, and editor show-state fallback paths.
- Image allow-listing, focal-point transformation, Asset Manager alt text, gallery ordering, the three-image gallery threshold, FAQ ordering, price options, slug preservation, and non-Cape-Coast isolation.
- A Storyblok-enabled npm run build passed JavaScript, static accessibility, content contracts, static generation, and build-output checks.
- A disabled local build passed and emitted neither a Storyblok browser overlay nor a browser API/token reference.
- `npm run test:resilience` passed after the final enabled build. The targeted gallery source/build-output tests also passed. The standalone smoke runner remains unable to launch Chromium in this desktop sandbox because macOS denies its Mach-port registration; the final desktop and mobile checks were therefore run in the connected local browser.
- Generated public files were checked to confirm that no Preview token, Content API endpoint, or token= request appears in browser-delivered content.

## Local comparison results

The enabled output was compared with the saved disabled baseline and inspected in a real local browser at 375px and 1440px.

| Check | Result |
| --- | --- |
| Route and canonical URL | Unchanged: /cape-coast-tour |
| Experiences catalogue | Still 13 cards; Cape Coast card text, price, duration, locations, and group size match the existing presentation |
| Runtime card rendering | Passed: the unchanged browser renderer uses the Storyblok image after its normal catalogue rebuild |
| Tour page | Title, price, overview, included/excluded, six FAQs, alternative price, and three related tours rendered correctly |
| Storyblok images | Card, hero, and social image use Storyblok Image Service focal-point renditions; card and hero loaded successfully in the browser |
| Accessibility | Storyblok Asset Manager alt text is present on the card and hero |
| Gallery | Three Storyblok images render in CMS order, satisfying the existing three-image minimum without changing the grid or lightbox design |
| Responsive layout | No horizontal overflow at 375px or 1440px; existing layout and styling remained intact |

The expected content differences from the Storyblok test record are the editor-supplied starting point and SEO title, description, and social image. They are content changes, not presentation or route changes.

The repository's older npm run test:visual reference set remains stale: it fails unrelated pages as well, and several files labelled 375px are 720px wide. It was not changed or weakened. Targeted local browser screenshots and the repository's responsive checks were used for this Phase 3B comparison.

## **Final Gallery Verification**

**Status: passed.** A fresh Storyblok-enabled local build retrieved three Cape Coast gallery images, in exactly the Storyblok editor order. The third Asset Manager alt text was supplied before this verification.

- **Desktop result:** The existing 1440px three-column grid, 16px gap, captions, spacing, and styling were unchanged. All three images loaded and no horizontal overflow occurred.
- **Mobile result:** At 375px, the existing one-column responsive gallery rendered all three images at 335px × 223px with no horizontal overflow.
- **Crop and focal-point result:** The portrait and wide CMS images used their Storyblok focal-point transformations and visually appropriate crops. The automatic-layout image had no focal point supplied, so it used the expected ordinary Storyblok image rendition.
- **Alt text and captions:** All three images carry Storyblok Asset Manager alt text. The first two CMS captions render in order; the third has no supplied caption and therefore renders no empty caption element.
- **Layout behavior:** Portrait, wide, and automatic layout values reached the existing gallery correctly. The existing wide class applies only to the second image; the pre-existing mobile crop behavior remains unchanged.
- **Lightbox result:** Each of the three gallery images opens its corresponding lightbox image with the correct alt text. Desktop next/previous buttons work, and keyboard ArrowRight/ArrowLeft navigation cycles in CMS order. At 640px and below, the on-screen next/previous arrows are deliberately hidden and a horizontal swipe advances or returns through the images. The close button and Escape restore normal page scrolling. The mobile lightbox image stays within its 90vw/90vh constraint. The existing figures were not keyboard-focusable before this work and remain so; supported keyboard behavior begins once the lightbox is open.
- **Browser safety:** Static-output inspection found no Content API endpoint, browser `fetch` logic, access-token reference, or local Preview token in `dist/`. The browser receives Storyblok Image Service asset URLs only; it makes no Storyblok Content API request.
- **Scope safety:** The generated overlay remains Cape-Coast-only. No Cloudflare or production configuration changed, no other tour changed, and Sanity was not modified.

### Minimum Phase 3B fix applied

The third image exposed one separate, visual-neutral integration issue: generated gallery figures did not carry the existing `.gallery-item` hook required by the site's lightbox. `scripts/render-tour-page.mjs` now renders `gallery-item` while preserving the existing `figure` and optional `is-wide` classes. There is no `.gallery-item` CSS rule, so the grid, spacing, crop behavior, and visual styling are unchanged. A regression test verifies all three rendered gallery items, the wide layout class, and CMS ordering.

### Tests run for this pass

- Storyblok-enabled `npm run build` — passed, with `storyblokCapeCoastSource: applied`.
- `node tests/tour-source.mjs` — passed, including three-image mapping, ordering, focal-point URL generation, caption behavior, and the lightbox hook regression check.
- `node tests/build-output.mjs` — passed.
- `npm run test:resilience` — passed.
- Connected local browser checks — passed at 1440px and 375px, including image loading/order, captions, focal crops, overflow, lightbox image mapping, desktop buttons, mobile swipe navigation, and supported keyboard behavior.
- `npm run test:smoke` could not start its standalone headless browser in this desktop sandbox because macOS denied Chromium's Mach-port registration. This is an environment-launch restriction, not a site assertion failure.

### Changes required

The legitimate third image required one visual-neutral integration fix: generated gallery figures now include the pre-existing `.gallery-item` lightbox hook while preserving the existing figure and optional `is-wide` classes. After editor review, the mobile lightbox was refined to hide on-screen arrows and use horizontal swipe navigation below 640px. The viewer controls were then distilled: the close control is a small SVG X, desktop navigation uses quiet SVG chevrons without circular decoration, and the dialog—not the close control—receives initial focus, avoiding a heavy automatic focus frame. The user's Asset Manager alt text completed the content prerequisite. **Phase 3B can now be considered fully accepted locally.**

## Outstanding items for a later authorized phase

1. Before any production rollout, explicitly authorize and test an _headers Content Security Policy update that permits Storyblok's image domain in img-src. This Phase 3B work intentionally did not change it.
2. Before production, use an appropriately scoped published-content Delivery token rather than a draft Preview token, and keep all secrets in the approved environment secret store.
3. Do not deploy, migrate another tour, remove Sanity, or broaden Storyblok ownership until Phase 3C is explicitly approved.

## Final recommendation

Phase 3B has demonstrated that one Storyblok tour, including a complete three-image gallery and the existing lightbox, can feed the existing static site without changing its frontend architecture or presentation. Stop here and request explicit Phase 3C authorization before any production-readiness or migration-expansion work.
