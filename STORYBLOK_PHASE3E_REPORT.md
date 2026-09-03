# Storyblok Phase 3E Report — Just Go Ghana / Multi-Day Tour

**Status:** **Resumed and complete for local validation. Not approved for
production.** Just Go Ghana exists as an unpublished, content-ready,
asset-blocked Storyblok draft.

**Close-out:** 2 September 2026.

## Outcome

Phase 3E began with the required deep audit of Just Go Ghana. The audit found
material content, approval, and asset conflicts. The Phase 3E authorization
requires these to stop rather than be silently selected, so no Storyblok
component, datasource, folder, asset, story, adapter, browser overlay, or
website code was changed.

The complete guest-facing field inventory is in
[`STORYBLOK_JUST_GO_GHANA_FIELD_INVENTORY.md`](STORYBLOK_JUST_GO_GHANA_FIELD_INVENTORY.md).

## Resumed work

The owner supplied the five decisions on 2 September 2026. Four resolved
outright; the card photograph is still outstanding and is the reason this
record remains asset-blocked rather than production-ready.

| Decision | Applied as |
| --- | --- |
| Group size | Structured `1–12`, with the note *Larger groups available by arrangement.* `Any group size` is gone; `Small Groups` was not carried into the CMS as a fact. |
| Service charge | Included. The eleven-item list Sanity already held is correct; the page's ten-item list was the one missing it. |
| Vaccination wording | Not hard-coded. The excluded item reads *Vaccinations and travel health requirements*. Entry and health requirements stay with Travel Information, which was not touched. |
| Photography | None used. No stock, no placeholder, no other tour's photograph, no unapproved external image. |
| Testimonials | Not migrated. `multi_day_tour` has no testimonial field at all, so an unapproved quotation cannot be entered by accident. |
| Related tours | Not migrated. The component has no related-tour field, so the record cannot own another tour's price. |

### What was provisioned

- `itinerary_day` nestable block: day number, title, description, meals.
- `multi_day_tour` content type: 46 entries across 9 tabs. Deliberately without
  `hero_image`, `gallery`, testimonials, or related tours.
- Folder `tours/multi-day-experiences`.
- One unpublished story at `tours/multi-day-experiences/just-go-ghana`.

Reused rather than recreated: `list_item`, `faq_item`, `price_option`, `seo`.

### Readiness

| | |
| --- | ---: |
| Content Ready | **yes** |
| Asset Ready | **no** |
| Production Ready | **no** |
| Applied in a Storyblok-enabled build | **0** |
| Fallback retained | **1** |

### The gate, tested rather than assumed

The record was put through the mapper three ways:

| State | Result |
| --- | --- |
| As it stands — unpublished, no photograph | rejected |
| **Show this experience** on, still no photograph | **rejected** |
| Switch on and a photograph present | applied, with every decision correct |

The middle row is the one that matters. Turning the switch on is not enough;
the gate holds on the missing asset alone. The third row proves the rest of the
record is complete, which is what makes this content-ready rather than merely
unfinished.

### Local validation

A Storyblok-enabled build with only the multi-day flag set produces output
**byte-identical to a plain build on every visitor-facing file**. The single
difference is `health.json`, which reports `invalid-content` instead of
`disabled` — the diagnostics changing, not the website.

- `/just-go-ghana.html` unchanged, including its route, hero, related cards,
  booking behaviour and testimonials section.
- Standard tours unaffected: 10 applied, 2 asset-blocked, exactly as Phase 3D
  left them.
- No Storyblok reference, token, or API call reaches any shipped script from
  this phase.
- Build, content, build-output, responsive, smoke and resilience suites pass.

### Still blocking production

One thing: an approved Just Go Ghana photograph, with alt text, rights and a
focal point. Nothing else in this record is outstanding.

### Noted, not changed

Two consequences of the decisions describe the live website rather than the
Storyblok record, and are outside this phase:

- The two quotations on the live page are not approved content under the
  testimonial decision.
- The live page's included list still shows ten items, missing the service
  charge the owner has confirmed is included.

The related-card prices on that page were separately corrected on 2 September;
they had drifted ten dollars below the catalogue, which is the duplicate price
ownership the related-tour decision warns against.

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

> **Four of these five were answered on 2 September 2026** — see
> [`STORYBLOK_PHASE3E_DECISIONS.md`](STORYBLOK_PHASE3E_DECISIONS.md). Only the
> card image remains outstanding, so Phase 3E is still blocked.


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

## Proposed model, not provisioned *(historical — provisioned on 2 September, see Resumed work)*

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

Done, apart from the photograph. The draft exists, the adapter is implemented,
and the local validation has been performed.

Phase 3E stops here as instructed. Nothing was deployed or published, no
fallback was removed, Sanity is untouched, and no other section of the site was
migrated. Just Go Ghana remains safely on its existing fallback path and will
continue to until an approved photograph exists and someone explicitly
authorises the next step.
