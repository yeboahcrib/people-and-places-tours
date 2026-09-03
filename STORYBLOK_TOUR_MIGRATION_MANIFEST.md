# Storyblok Standard Tour Migration Manifest — Phase 3D

**Status:** all 12 standard Tours are represented as Storyblok drafts for controlled local validation. This is **not** production approval.

## Readiness summary

| Measure | Count | Meaning |
| --- | ---: | --- |
| Standard Tours represented in Storyblok | **12 / 12** | One draft story exists at the approved path for every standard Tour. |
| Content Ready | **12** | Current, reconciled editorial fields are present. |
| Asset Ready | **10** | A suitable approved Storyblok card/hero asset is present. |
| Asset Blocked | **2** | Content is complete, but no approved photo exists. No substitute has been used. |
| Production Ready | **0** | All records remain drafts and the website remains local-only/fallback-capable. |
| Applied in the final local build | **10** | Independently validated Storyblok records. |
| Local fallback in the final local build | **2** | Asset-blocked stories fail closed, one Tour at a time. |

The `Content Ready`, `Asset Ready`, and `Production Ready` labels are migration-governance statuses recorded here; they are deliberately **not** speculative implementation fields exposed to editors.

## Immutable route and story record

The public route is always the existing `detailUrl` owned by the static site. A Storyblok path is CMS organisation only and never determines a browser route.

| Current title | Slug | Immutable public route | Storyblok story path | Content | Assets | Production | Final local build result | Reconciliation note |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Accra City Tour | `accra-city` | `/accra-city-tour.html` | `tours/day-short-experiences/accra-city` | Ready | Ready | Not ready | Applied | Existing Phase 3C draft retained. |
| Accra After Dark Food Tour | `accra-food` | `/accra-food-tour.html` | `tours/day-short-experiences/accra-food` | Ready | **Blocked** | Not ready | **Invalid-content fallback** | Draft has USD 90/person for 3–8 guests and an explicit USD 110/person option for two guests. No photo, hero, or social-image substitute is stored. |
| Cape Coast Ancestral Tour | `cape-coast` | `/cape-coast-tour.html` | `tours/day-short-experiences/cape-coast` | Ready | Ready | Not ready | Applied | Existing Phase 3B/3C draft retained; three-photo gallery remains the genuine gallery validation record. |
| Kumasi Cultural Tour | `kumasi` | `/kumasi-tour.html` | `tours/day-short-experiences/kumasi` | Ready | Ready | Not ready | Applied | Existing Phase 3C draft retained. |
| Ada Day Tour | `ada-foah` | `/ada-tour.html` | `tours/day-short-experiences/ada-foah` | Ready | Ready | Not ready | Applied | Existing Phase 3C draft retained; its legitimate two-photo gallery remains correctly hidden by the existing minimum-three renderer rule. |
| Quadbike & Waterfalls | `quad-bike` | `/quad-bike-tour.html` | `tours/day-short-experiences/quad-bike` | Ready | Ready | Not ready | Applied | Existing Phase 3C draft retained. |
| Volta Day Tour | `volta` | `/volta-tour.html` | `tours/day-short-experiences/volta` | Ready | Ready | Not ready | Applied | Owner-approved original photo uploaded. Removed only the incorrect rope-suspension-bridge FAQ; five remaining FAQs retain their original order. |
| Shai Hills & Boat Cruise | `shai-hills` | `/shai-hills-tour.html` | `tours/day-short-experiences/shai-hills` | Ready | Ready | Not ready | Applied | Existing Phase 3C draft retained. |
| Aburi Day Tour | `aburi` | `/aburi-tour.html` | `tours/day-short-experiences/aburi` | Ready | Ready | Not ready | Applied | Existing Phase 3C draft retained. |
| Cape Coast Day Tour | `cape-coast-day` | `/cape-coast-day-tour.html` | `tours/day-short-experiences/cape-coast-day` | Ready | Ready | Not ready | Applied | Existing Phase 3C draft retained. |
| Volta Community Tour | `volta-community` | `/volta-community-tour.html` | `tours/day-short-experiences/volta-community` | Ready | **Blocked** | Not ready | **Invalid-content fallback** | Draft contains valid content but no card, hero, or social image. No approved photo is currently available. |
| Batik & Pottery Workshop | `batik-workshop` | `/batik-workshop.html` | `tours/day-short-experiences/batik-workshop` | Ready | Ready | Not ready | Applied | Owner-confirmed standalone standard day Tour at USD 120; no add-on records were created. |

All 12 outer Storyblok records are **drafts** (`published: false`). The two asset-blocked records also have the editor-facing **Show this experience** field turned off. This makes their state clear to an editor while the build adapter independently enforces the card-photo requirement before a Tour can affect a website build.

## Phase 3D source decisions

- **Accra Food pricing:** the approved base price is USD 90 per person for 3–8 guests. Its one optional existing-model price option reads **For 2 guests (per person) — USD 110**. The group note preserves the current wording: “Minimum three travellers. Two can be accommodated at $110 per person.”
- **Volta FAQ:** only “What is the rope suspension bridge?” and its unrelated Mount Gemi/Tafi Atome answer were removed. The remaining order is: waterfall; drive; hike; lunch; what to bring.
- **Volta Community photography:** no image was invented, borrowed, or replaced with a placeholder.
- **Batik classification:** `experience_type: day`; it remains a Tour, not a Local Experience. The separate possible add-ons remain out of scope.
- **Description precedence:** the existing renderer already uses active Sanity `description` for both the card and detail overview. Local fallback wording sometimes differs by placement. Phase 3D retained that established live-source precedence rather than silently selecting between fallback copy variants; no factual claim was changed.

## Asset record

Two newly approved original assets were added to the controlled `Tours / Standard Tours` Asset Manager folder (ID `214693663802039`) and recorded in [storyblok/phase3c/asset-manifest.json](storyblok/phase3c/asset-manifest.json):

| Tour | Asset | Asset Manager ID | Source / focus |
| --- | --- | ---: | --- |
| Volta Day Tour | `tour-volta-card.jpg` | `215437298110775` | Approved Sanity production original; `2240x2520:2241x2521` focal point. |
| Batik & Pottery Workshop | `tour-batik-workshop-card.jpg` | `215441163723115` | Approved Sanity production original; `2220x1998:2221x1999` focal point. |

The two asset-blocked stories deliberately omit `card_image`, `hero_image`, and SEO social image. Their local fallback images are untouched and are **not** claimed as migrated/approved Storyblok assets.

## Schema and failure isolation

Two minimal schema adjustments were required, both staged reproducibly by [scripts/storyblok-phase3d-stage.mjs](scripts/storyblok-phase3d-stage.mjs):

1. `tour.card_image` changed from required to optional with editor-facing help: “Add an approved original photo before this experience can appear on the website. You may save a draft while photography is pending.” This enables genuine incomplete drafts on the Free plan, whose conditional-field support cannot provide a reliable draft-only required rule.
2. The shared `list_item` text limit changed from 120 to 160 characters. This is the smallest limit that preserves Accra Food’s existing approved 158-character guest fact; no wording was shortened or invented.

Neither adjustment weakens website safety. `mapStoryblokTour` still rejects a story without a valid, alt-bearing allow-listed card Asset or without `Show this experience` enabled. The final build therefore reports ten `applied` stories and only `accra-food`/`volta-community` as `invalid-content` fallbacks. The browser overlay receives only the ten validated public card records.

## Validation record

- Fresh scoped Storyblok pull: exactly **12 unique standard-tour stories** under `tours/day-short-experiences/`, plus their parent folder; all outer records remain drafts.
- Fresh Storyblok-enabled build: `storyblokStandardTourSummary` is **10 applied / 2 fallback** in `dist/health.json`.
- `npm run build`: passed JavaScript, headers, static accessibility, content contracts, static generation, and build-output checks.
- `node tests/tour-source.mjs`: passed, including the new asset-blocked-draft isolation regression coverage.
- Connected local-browser validation: all 13 cards (12 standard + unchanged Just Go Ghana), all 12 standard detail pages, their exact routes, filters, desktop/mobile overflow, and booking selection passed. Volta and Batik render focal-point Storyblok images with meaningful Asset alt text. The two asset-blocked Tours retain their existing local fallback pages.
- `npm run test:smoke` was attempted but cannot launch standalone Playwright in this desktop sandbox: macOS denies Chromium’s Mach-port rendezvous before any test assertion. This is a host limitation, not a test pass or a site regression; connected-browser QA supplied the local interaction evidence.
- The 75 public build files were scanned: no preview token, Storyblok Content API endpoint, or Storyblok browser-fetch implementation was found.

The old command-palette result list remains synchronised with all 13 public catalogue records. Its current static homepage output has no `cmd-bar-trigger`, so the palette cannot be opened through the existing UI; this is a pre-existing site issue unrelated to Phase 3D, and no UX/design change was made here.

## Documentation recovery

The exact approved copies that were missing during Phase 3C were safely found in intact local workspace outputs and recovered without inventing content:

- [Migration audit](docs/storyblok/STORYBLOK_MIGRATION_AUDIT.md)
- [Architecture](docs/storyblok/STORYBLOK_ARCHITECTURE.md)
- [Phase 3A plan](docs/storyblok/STORYBLOK_PHASE3A_PLAN.md)
- [Recovery index and original hashes](docs/storyblok/README.md)

The Phase 3B and Phase 3C reports remain at their original root paths. The non-secret ID record for the four reconciled stories is [storyblok/phase3d/story-manifest.json](storyblok/phase3d/story-manifest.json).

## Explicit stopping point

Before any production cutover, provide approved photography for Accra Food and Volta Community; decide and authorise a production integration/cutover; re-evaluate production CSP/asset policy only in that separate phase; and resolve the pre-existing command-palette trigger issue if desired.

No production deployment, Cloudflare/DNS/CSP/redirect change, Sanity change, local-fallback removal, Just Go Ghana migration, or non-Tour CMS migration occurred in Phase 3D.
