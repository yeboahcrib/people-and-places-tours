# Storyblok Phase 3H.1 — migration-authority registry and withdrawal fix

The Phase 3H defect is fixed: under authoritative delivery, a withdrawn tour now
leaves the catalogue instead of quietly reappearing from committed content.

Production-authoritative mode is **not** activated. Nothing was deployed,
published, or configured. No Cloudflare change, no DNS change, no route change.

---

## Registry location

`scripts/storyblok-migration-authority.mjs` — version-controlled, 13 entries,
two states, no editorial content.

It holds slug → authority and nothing else. No price, title, description, image
or copy, so it cannot become a second content source. Routes stay where they
already live: the committed catalogue owns `detailUrl`, and this file never
touches it.

A new file rather than an extension of an existing manifest, for two reasons.
`STORYBLOK_STANDARD_TOUR_REGISTRY` covers only the 12 standard tours and would
have split the concept across two lists to include Just Go Ghana. And the owner
has to flip these flags as each tour lands, which is friendlier in a 50-line
data file than inside a 750-line adapter.

## Initial mapping

| Authority | Products |
| --- | --- |
| `authoritative` (10) | accra-city, cape-coast, kumasi, ada-foah, quad-bike, volta, shai-hills, aburi, cape-coast-day, batik-workshop |
| `pending` (3) | accra-food, volta-community, just-go-ghana |

All three pending products have Storyblok drafts. None was promoted on that
basis — each is waiting on approved photography, and a test asserts they stay
pending.

Unknown slugs resolve to `pending`, so the safe answer — keep the fallback — is
the default for anything the registry does not name.

## Exact behaviour for a missing published story

| Registry | Delivery | Result | Catalogue |
| --- | --- | --- | --- |
| `authoritative` | authoritative | `withdrawn` | **Tour removed.** No fallback. |
| `pending` | authoritative | `pending-not-migrated` | Committed fallback kept |
| either | migration | `missing-story` | Committed fallback kept |

The removal is a filter on the tours the loader returns, so a withdrawn tour
disappears from the catalogue rather than being rebuilt from `tours.js`. It does
not acquire a new URL, and no redirect or route was touched.

Migration mode is deliberately exempt. Draft delivery cannot tell withdrawal
from work in progress, and pending tours have to stay testable locally, so a
migration build never drops a record — asserted by a test.

## Editorial suppression

`content.published` — the editor's "Show this experience" switch — is now read
*before* content validation rather than inside it. Under authoritative delivery,
an authoritative tour with visibility off reports `editorial-suppressed` and
leaves the catalogue, exactly like a withdrawal. It is not a transport failure
and not a build failure.

This is the smallest change that separates the two: the mappers were left alone,
and the check is one function called at the two call sites.

Under migration delivery, or for a pending tour, the previous behaviour stands —
the mapper rejects it and the record falls back as `invalid-content`.

## Content validation failures — a judgment call

If an authoritative story exists but fails structural validation, it **still
falls back** and reports `invalid-content`.

The brief pulled in two directions here: preserve the existing safety policy,
but do not silently resurrect stale content where that violates CMS ownership. I
kept the fallback, because a malformed story is a mistake rather than a decision,
and removing a live tour over a typo is a worse failure than briefly serving
slightly older content. Withdrawal is reserved for the two cases that are
unambiguously intentional — the story is gone, or the editor switched it off.

This is flagged rather than settled. If you would rather an authoritative tour
with broken content disappear too, that is a one-line change.

## Health diagnostics

`health.json` `storyblokFallback` now distinguishes: `applied`,
`pending-not-migrated`, `withdrawn`, `editorial-suppressed`, `invalid-content`,
`unavailable`, `unauthorized`, `missing-configuration`. Withdrawn and suppressed
records are listed under `withdrawn`; pending migrations under
`pendingMigration`, separately from technical fallbacks.

No credential and no editorial content appears in it. `tests/build-output.mjs`
was taught the three new states so an unknown one still fails the build.

## Tests

`tests/storyblok-migration-authority.mjs`, registered in `test:content`. All
nine required scenarios, plus registry integrity and migration-mode protection:

1. authoritative + valid story → applies
2. authoritative + missing → `withdrawn`, **no stale fallback** (asserts the
   committed title and the `$999 STALE` price never reach the output)
3. pending + missing → fallback, `pending-not-migrated`, not a systemic failure
4. pending + valid story → applies, in both modes
5. authoritative + visibility off → `editorial-suppressed`, no resurrection
6. one authoritative tour withdrawn → exactly one record leaves; the rest apply
7. asset-blocked pending tours → keep their fallback, nothing removed
8. 7 of 13 transport failures → still fails; 6 still warns
9. 401 and missing token → still fail production immediately

Plus: the registry names exactly the 13 catalogue slugs and no others; only two
states exist; the three asset-blocked products are pending; and migration builds
never drop a record.

**Mutation-verified**, four ways — each reintroduces the defect and the suite
fails:

| Mutation | Caught |
| --- | --- |
| authoritative missing story falls back | yes |
| withdrawn record kept in the catalogue | yes |
| editor suppression ignored | yes |
| every tour treated as authoritative | yes |

One supporting change: the Storyblok story fixture moved to
`tests/helpers/storyblok-tour-fixtures.mjs` and is now shared with
`tests/tour-source.mjs`. Duplicating it would have let the two definitions of
"a valid story" drift, and a drifted fixture would make the withdrawal tests
prove nothing.

## Migration-mode impact

None. `authoritativeDelivery` defaults to `false` everywhere, so every current
build behaves exactly as before: per-record fallback, existing vocabulary,
nothing removed. Verified by rebuilding — 24 routes, 22 sitemap URLs, 13 tours,
`_redirects` untouched, and the full suite green.

## Production-mode impact

The registry is the missing piece that makes published delivery safe. Production
mode is still `active: false` and still refuses to run. The build now resolves
the mode up front and passes `authoritativeDelivery` to the loaders, so the
semantics are in place and dormant.

## Files changed

| File | Why |
| --- | --- |
| `scripts/storyblok-migration-authority.mjs` | new — the registry |
| `scripts/storyblok-tour-source.mjs` | absence resolver, visibility check, catalogue filter, both loaders |
| `scripts/tour-source.mjs` | threads `authoritativeDelivery` |
| `scripts/build-static.mjs` | resolves the mode up front; `pendingMigration` in health |
| `scripts/storyblok-fallback-policy.mjs` | classifies the three new states |
| `tests/storyblok-migration-authority.mjs` | new — nine scenarios |
| `tests/helpers/storyblok-tour-fixtures.mjs` | new — shared fixture |
| `tests/tour-source.mjs` | uses the shared fixture; wording assertion |
| `tests/storyblok-fallback-policy.mjs` | wording assertion |
| `tests/build-output.mjs` | knows the three new states |
| `STORYBLOK_TOUR_MIGRATION_MANIFEST.md` | authority table |
| `package.json` | registers the new suite |

No unrelated change. The stale visual baseline was not touched and no screenshot
was regenerated.

## Remaining blockers for Phase 3H

1. **Nothing is published in Storyblok.** The Public Delivery token reads 0
   published stories — every tour is still a draft. The 10 authoritative tours
   need publishing before staging can exercise anything.
2. **Three products remain asset-blocked** — accra-food, volta-community and
   just-go-ghana are pending until approved photography exists.
3. **Production mode is still unexercised end to end.** Its semantics are now
   covered by tests, but no real build has run against published delivery.
4. **The stale visual baseline** still blocks pixel comparison, and is scheduled
   for Phase 3H after the published-delivery path exists.
5. **One open question** — whether an authoritative tour with invalid content
   should be withdrawn rather than fall back. Currently it falls back.
