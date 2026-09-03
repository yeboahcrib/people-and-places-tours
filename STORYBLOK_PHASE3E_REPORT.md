# Storyblok Phase 3E Report — Just Go Ghana / Multi-Day Tour

**Status:** **Stopped before provisioning — owner review required.**

## Outcome

Phase 3E began with the required deep audit of Just Go Ghana. The audit found
material content, approval, and asset conflicts. The Phase 3E authorization
requires these to stop rather than be silently selected, so no Storyblok
component, datasource, folder, asset, story, adapter, browser overlay, or
website code was changed.

The complete guest-facing field inventory is in
[`STORYBLOK_JUST_GO_GHANA_FIELD_INVENTORY.md`](STORYBLOK_JUST_GO_GHANA_FIELD_INVENTORY.md).

## Sources audited

- `just-go-ghana.html`
- `tours.js`
- `src/content/tour-pages.json`
- The active live Sanity `tour-just-go-ghana` record (`tailoredMultiDay`)
- `scripts/build-static.mjs`, `scripts/tour-source.mjs`, card rendering,
  browser interaction, booking logic, existing tests, and local generated
  output
- The approved Storyblok migration audit, architecture, Phase 3A plan, and
  Phase 3B–3D reports

## Current architecture confirmed

Just Go Ghana is a deliberate static-rendering exception:

```text
fixed Just Go Ghana page
  ← existing local/Sanity-backed catalogue record
  ← immutable just-go-ghana.html route map
  ← build-time static copy/shared-shell processing
  ← established browser catalogue/booking/accordion behaviour
```

It is not a safe fit for the standard `tour` page renderer. The right eventual
architecture remains:

```text
multi_day_tour Storyblok draft
  → validated normalized multi-day record
  → fixed Just Go Ghana renderer
  → existing static presentation and immutable route
```

No browser Storyblok request or browser-delivered token is needed for that
architecture. The existing one generated catalogue overlay can be extended
once a valid multi-day record exists; a per-tour overlay is not appropriate.

## Required owner decisions

| Blocker | Evidence | Why Phase 3E stopped |
| --- | --- | --- |
| Group size | Page: `Small Groups`; catalogue/live Sanity: `Any group size`; approved claim register: 1–12, with larger groups by arrangement | This is an actual guest-facing operating fact. |
| Included coverage | Page contains 10 items; Sanity/JSON include `Service charge` as an 11th | The CMS cannot truthfully decide whether it is included. |
| Vaccination wording | Page says `Vaccines (Yellow Fever required)`; Sanity/JSON say `Vaccinations` | This is a factual/legal travel requirement, not formatting. |
| Card image | No approved JGG image exists in Sanity or Storyblok; current card image is an external Unsplash URL without approval/rights metadata | The authorization prohibits unapproved or invented imagery. |
| Testimonials | The two page quotations are edited/truncated and are not approved review content | They must not be presented as approved Storyblok editorial records. |

The current generic page deposit note is compatible with the current policy's
$400-per-person rule because it names no amount or due date. To preserve the
existing presentation safely, a future model should keep the generic note or
leave payment mechanics policy-owned; it must not revive historical 30% copy.

The fixed related-card block also has stale price copies for Shai Hills and
Accra City. It remains untouched and should not be moved into the Just Go Ghana
story without a separate reconciliation decision.

## Proposed model, not provisioned

After the decisions above, the minimum model is:

- `multi_day_tour` Content Type, labelled **Multi-Day Experience**.
- Reused blocks: `faq_item`, `list_item`, `seo`; `price_option` only if a real
  approved alternative price appears.
- New blocks: `itinerary_day` (ordered title, safe rich-text description,
  ordered meal choices) and, only with approval, `testimonial_item` (quote and
  traveller name).
- No hero asset, gallery field, generic page builder, or global review system.
- The approved Free-plan-compatible options `activity_level` and `meal` can be
  added later; no other datasource is required.

The actual Space supports the standard Starter/Free building blocks needed for
that minimal model (content types, nestable blocks, folders, assets, ordered
blocks, validations, references, Datasources, CLI/Management API, Asset Manager
and Image Service). It does not require—or permit this phase to depend on—
conditional field rules, custom asset metadata, custom workflows, environments,
or native SEO Meta Tags. The existing reusable `seo` block remains the correct
approach.

## Tests run

- `node tests/tour-pages-content.mjs` — passed; confirms the committed
  eight-day itinerary baseline.
- `node tests/tour-source.mjs` — passed; confirms standard Storyblok migration
  still excludes Just Go Ghana.

A Storyblok-enabled Just Go Ghana build, multi-day adapter tests, and
desktop/mobile comparison were not run because there is deliberately no valid
multi-day story to apply. Creating one by picking a conflicting fact or using
an unapproved image would violate the Phase 3E stop conditions.

## Scope confirmation

No production deployment, Cloudflare/DNS/CSP change, route change, visual
redesign, Storyblok publication, Storyblok content provisioning, Sanity removal,
local fallback removal, standard-tour migration change, or other website-section
migration occurred.

## Next authorization needed

After the owner supplies the five decisions above (and an approved card asset),
Phase 3E can resume from the documented model, create one unpublished draft at
`Tours / Multi-day Experiences / Just Go Ghana`, implement the fixed build-time
adapter, and perform the requested local validation. Until then, Just Go Ghana
remains safely on its existing fallback path.
