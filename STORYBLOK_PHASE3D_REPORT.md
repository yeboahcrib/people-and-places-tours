# Storyblok Phase 3D Report — Standard Tour Reconciliation

**Close-out date:** 1 September 2026 local time  
**Status:** **Complete for local reconciliation and validation. Not approved for production.**

## Outcome

All **12 standard Tours** now exist in the EU Storyblok Space as draft `tour` stories in `tours/day-short-experiences/`. The existing static website has not been deployed or cut over. A fresh Storyblok-enabled local build applied ten individually valid records and safely retained the existing fallback for two content-ready but asset-blocked records.

| Readiness | Count |
| --- | ---: |
| Storyblok standard-tour drafts | **12** |
| Content Ready | **12** |
| Asset Ready | **10** |
| Asset Blocked | **2** |
| Production Ready | **0** |
| Applied in final local build | **10** |
| Per-Tour fallback in final local build | **2** |

Detailed route, asset, readiness, and source records are in [STORYBLOK_TOUR_MIGRATION_MANIFEST.md](STORYBLOK_TOUR_MIGRATION_MANIFEST.md).

## Reconciled Phase 3C manual-review Tours

| Tour | Final Storyblok state | Local result |
| --- | --- | --- |
| Accra After Dark Food Tour | Content-ready draft; **asset blocked**; no card/hero/social image | Existing fallback remains. CMS stores USD 90/person for 3–8 guests, plus **For 2 guests (per person) — USD 110**. |
| Volta Day Tour | Content- and asset-ready draft | Applied from Storyblok. The erroneous rope-suspension-bridge FAQ and only its unrelated answer were removed; the other five FAQs remain in their original order. |
| Volta Community Tour | Content-ready draft; **asset blocked**; no card/hero/social image | Existing fallback remains. No placeholder, stock, borrowed, or unapproved image was used. |
| Batik & Pottery Workshop | Content- and asset-ready standard day-Tour draft | Applied from Storyblok at **USD 120**. It remains a Tour, not a Local Experience; no add-on records were created. |

All four outer Storyblok stories remain unpublished. The two asset-blocked stories also have **Show this experience** turned off, so an editor can finish the legitimate draft without it becoming eligible for the local website adapter.

## Content reconciliation

The four records were reconciled against the live Sanity data, `tours.js`, `src/content/tour-pages.json`, and renderer expectations before staging. One copy pattern needed explicit handling rather than a silent choice: the current renderer already gives active Sanity `description` precedence for both the card and detail overview, while a local fallback can contain alternate placement copy. Phase 3D retained that already-live source rule; it did not introduce a factual or editorial change.

The staging script rejects a material mismatch instead of guessing. It also verifies the owner-approved Accra pricing transformation, isolated Volta FAQ removal, normal Batik classification, valid group bounds, ordered lists, and route mapping before any Storyblok CLI push.

## Asset migration and focal points

Only two owner-approved original photographs were added to `Tours / Standard Tours`:

| Asset | Storyblok asset ID | Result |
| --- | ---: | --- |
| `tour-volta-card.jpg` | `215437298110775` | Correct Asset Manager alt/source data and focal point `2240x2520:2241x2521`; reused for card, hero, and sharing. |
| `tour-batik-workshop-card.jpg` | `215441163723115` | Correct Asset Manager alt/source data and focal point `2220x1998:2221x1999`; reused for card, hero, and sharing. |

Desktop and 390px local-browser checks showed both Storyblok focal transformations, meaningful alt text, appropriate crop, and no horizontal overflow. The two missing images remain the only unresolved asset blockers:

- Accra After Dark Food Tour
- Volta Community Tour

Their pre-existing local fallback imagery was neither uploaded nor represented as an approved Storyblok asset.

## CMS adjustment

Two minimal CMS schema changes were made through the official CLI, from checked/reviewed staged component JSON:

1. **Card photo** is optional for a draft, with clear editor help that an approved original photo is required before the experience can appear on the website. This allows legitimate incomplete drafts on the Free plan without claiming they are production-ready.
2. The reusable **Item** text limit changed from 120 to **160** characters. Storyblok correctly rejected Accra Food’s three existing 147–158 character guest facts under the old limit. The increase preserves the approved factual wording; it does not add a new field or change the visual site.

The production-readiness gate was not weakened: the build-time adapter still rejects a Storyblok record unless it has a valid EU Storyblok card asset with alt text and its **Show this experience** switch is on. The two asset-blocked stories therefore report `invalid-content` and fall back independently in the final build.

## Generic adapter, routes, and browser catalogue

No Cape-Coast-specific implementation was added. The existing generic Phase 3C adapter and one generated browser overlay handled all standard Tour records. The renderer remains CMS-agnostic and owns routes.

The fresh build health result was:

```json
{
  "applied": 10,
  "fallback": 2,
  "fallbackSlugs": ["accra-food", "volta-community"]
}
```

All 12 standard Tour detail pages loaded locally at their existing `.html` source routes, retained a booking link for their own slug, and had no horizontal overflow. Booking selection correctly selected Volta, Batik, and unchanged Just Go Ghana. The Experiences page retained 13 cards (12 standard Tours plus Just Go Ghana) and its category filter still worked.

Just Go Ghana was neither added to the Storyblok registry nor migrated. Its local card and booking selection remained unchanged.

## Tests and local QA

Passed:

- `npm run build` — JavaScript syntax, headers, static accessibility, content contracts, static generation, and build-output checks.
- `node tests/tour-source.mjs` — includes the Phase 3D regression test proving an assetless Storyblok draft falls back by itself and is omitted from the browser overlay while a valid neighbour still applies.
- Fresh scoped Storyblok pull — exactly 12 unique standard-tour stories and their parent folder, all drafts.
- Connected local-browser QA at desktop and 390px — cards, filters, all standard detail routes, Volta/Batik crop/alt/focal behavior, fallback isolation, booking selection, and overflow checks.
- Public-build scan — 75 generated files contained no preview token, Storyblok Content API URL, or Storyblok browser-fetch implementation. Browser-visible Storyblok URLs were image-delivery URLs only.

Host limitation recorded, not hidden:

- `npm run test:smoke` attempted to launch standalone Playwright but macOS denied Chromium’s Mach-port rendezvous before assertions began. This is the existing desktop-sandbox limitation. No test was weakened; connected-browser validation supplied the interaction evidence.

The Cape Coast three-image gallery/lightbox validation remains the legitimate gallery baseline from Phase 3B/3C. No placeholder gallery image was added in Phase 3D.

The current homepage’s command-palette list remains populated with the whole catalogue, but its static output has no `cmd-bar-trigger`, so the palette cannot be opened through the existing UI. This is a pre-existing website issue, not a Storyblok regression; Phase 3D did not change UI or design to address it.

## Documentation recovery

The exact missing approved planning documents were located intact in local workspace outputs and organised under [docs/storyblok/](docs/storyblok/), with original hashes recorded in [docs/storyblok/README.md](docs/storyblok/README.md):

- [Migration audit](docs/storyblok/STORYBLOK_MIGRATION_AUDIT.md)
- [Architecture](docs/storyblok/STORYBLOK_ARCHITECTURE.md)
- [Phase 3A plan](docs/storyblok/STORYBLOK_PHASE3A_PLAN.md)

No document was recreated from memory. Phase 3B/3C records remain at their existing root paths; the non-secret story IDs are retained in [storyblok/phase3d/story-manifest.json](storyblok/phase3d/story-manifest.json).

## Remaining production-cutover blockers

1. Obtain approved original photography for Accra Food and Volta Community, then add Asset Manager metadata/focal points and revalidate their records.
2. Obtain explicit authorization for a production integration/cutover phase. This phase did not deploy anything.
3. Separately review any eventual production asset/CSP policy and the pre-existing command-palette trigger gap.
4. Keep Sanity and all local fallbacks until a separately approved production cutover validates the complete catalogue.

## Scope confirmation and stop

Phase 3D did **not** deploy production, alter Cloudflare/DNS/CSP/redirects, change production configuration, remove Sanity, remove fallbacks, migrate Just Go Ghana, migrate any other site section, or modify the visual design.

Phase 3D stops here. Wait for explicit authorization before any production work or further migration.
