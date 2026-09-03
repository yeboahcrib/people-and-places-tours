# Storyblok Phase 3G.1 — final pre-3H hardening

Three authorized areas. Nothing deployed, nothing published, no production
credential created, production-authoritative mode not activated, and Phase 3H
not begun.

---

## Fallback-policy changes

The policy now distinguishes the two modes by what they *enforce*, not only by
what they read. Four changes:

1. **Migration mode no longer enforces the systemic threshold at all**
   (`enforcesSystemicThreshold: false`). It cannot fail a build on technical
   failures, at any proportion.
2. **The threshold rule is now an explicit majority** —
   `systemicThresholdFor(n) = floor(n / 2) + 1` — replacing the previous
   ratio-plus-floor pair. The `STORYBLOK_SYSTEMIC_FAILURE_RATIO` and
   `STORYBLOK_SYSTEMIC_FAILURE_FLOOR` constants are gone; the floor was only
   ever needed to stop small record counts tripping the rule, and with
   migration exempt there is no small-N case left to protect.
3. **Authentication and configuration failures fail production immediately**,
   independent of the record count (`failsOnAuthOrConfigFailure: true`).
4. **The adapter can now tell an auth rejection from an outage.** 401 and 403
   report as a new `unauthorized` source instead of `unavailable`. Without that
   distinction, a rejected token was indistinguishable from a dropped
   connection and could only be caught by the record threshold.

Editorial failures (`invalid-content`, `duplicate-slug`,
`duplicate-display-order`) are excluded from the transport count in both modes,
so a whole catalogue failing the content gate warns and never fails.
Intentional suppression is unchanged from Phase 3G: under published delivery an
absent story is classified as `withdrawn`, not as a gap to fill, so it cannot be
resurrected from stale fallback.

The assessment is now written to `health.json` as `storyblokFallback` — mode,
status, whether enforcement applies, the threshold, and the affected slugs by
category. Migration builds never fail, so the diagnostic is the only place the
result is visible after the fact.

## Exact production threshold

**7 of 13.** Verified by running the policy, not by reading it:

| Technical record failures (of 13) | Migration | Production |
| --- | --- | --- |
| 0 | ok | ok |
| 1 | warn | warn |
| 3 | warn | warn |
| 6 | warn | warn |
| **7** | warn | **fail** |
| 13 | warn | **fail** |

Seven is a majority of thirteen. The tests pin majority semantics rather than
"half" by asserting an even count where the two formulas diverge:
`systemicThresholdFor(12) === 7`, and a 6/6 split in production warns rather
than failing.

## Migration-mode behaviour

Fallback-friendly, unconditionally. Technical failures fall back per record,
emit a warning naming every affected slug and why, and appear in
`health.json`. The build completes.

Verified end to end, not only at unit level: a full build with the standard-tour
gate enabled and a deliberately invalid preview token produced —

```
Storyblok: 0 of 12 Storyblok records applied; 12 rejected the credential
(accra-city, accra-food, cape-coast, …) kept their committed fallback.
Migration builds do not fail on technical failures; these records are on
fallback by design.
Built 33 public root files and 2 public directories into dist/.
```

Every record failed authentication and the build still succeeded, which is the
decided behaviour for this mode.

The warning also distinguishes a rejected credential from an unreachable host.
It previously reported all transport failures as "unreachable", which would have
sent anyone debugging a bad token to look at the network instead.

## Authentication-failure behaviour

In production-authoritative mode, any of `unauthorized` (401/403),
`missing-configuration` (no published delivery token) or `unsupported-region`
fails the build immediately — one affected record is enough, well below the
threshold of seven. The message names the environment variable to check and the
content version expected, and never quotes a value; a test asserts that.

A missing token fails production even though no request was ever attempted. The
same condition in migration mode classifies as `inactive` — that is the normal
"not configured yet" state, not a failure.

A switched-off integration (`disabled`) is `inactive` in both modes and is never
treated as a credential failure.

Production mode remains **not activated**: `resolveStoryblokMode` throws if
asked for it, confirmed against a real build —

```
Error: Storyblok mode "production" is defined but not activated. It requires
STORYBLOK_PUBLIC_API_TOKEN and serves published content; activating it is a
separate decision from the migration and has not been taken.
```

## Price hydration — investigation and change

**The Phase 3G finding was wrong, and this correction matters.** Phase 3G
reported `hydrateTourDetailFromCatalog()` as "latent — its selectors match
nothing on the built tour pages". That conclusion came from probing
`/tours/<slug>.html`, which does not exist; the built pages are at the root
(`/cape-coast-tour.html`). Every probe returned a 404, so every selector
naturally matched nothing.

Measured against the real URLs, the function was **fully active on every tour
page**, and it had four responsibilities, not one:

| Selector | What it did | Status |
| --- | --- | --- |
| `.booking-card .big-price, .price` | overwrote the price from the catalogue | matched on all 8 pages checked |
| `.booking-card .price-sub` | overwrote "per person · duration" | matched on all 8 |
| `.trip-meta-item` (`From:`) | overwrote the price again | matched on 7 of 8 |
| `.booking-card .booking-btns a.btn-outline-white` | appended the `#booking-flow` anchor | matched on all 8, **and actively changed the href** |

So the price ownership was real, and the fourth item is a genuine live
responsibility: JavaScript rewrites `contact.html?tour=<slug>` to
`contact.html?tour=<slug>#booking-flow`, deep-linking the CTA to the booking
form. That anchor exists on the contact page.

The three price-owning blocks were removed and the booking-link block kept. The
function is renamed `linkBookingCtaToFlow` to match its single remaining job —
leaving a name promising catalogue hydration would mislead the next reader. No
other `script.js` change was made; the two pre-existing dead identifiers noted in
Phase 3G were again left alone.

The values agreed before this change, so nothing visible moved. What changed is
who wins when they disagree — and they only agreed because `tours.js` was kept in
step by hand.

`tests/tour-price-ownership.js` proves it. Across six tour pages it poisons
`window.PEOPLE_PLACES_TOURS` with an obviously wrong price and duration *after*
`tours.js` and the Storyblok overlay have run and immediately before `script.js`
initializes, asserts the poison actually landed (so the test cannot pass
vacuously), then asserts the price, sub-line and "From:" item all still match
what the build rendered — and that the booking CTA still keeps its slug and
still gains `#booking-flow`.

Mutation-verified: restoring the price overwrite fails with *"the server-rendered
price was replaced from the browser catalogue"*.

## Sanity credential conclusion

Already investigated in full; not repeated. The conclusion:

**No rotation outstanding — the credential has been revoked.** The reference was
to a personal Sanity CLI auth token whose value was printed into terminal output
by `sanity debug --secrets` earlier in this project. It was never in tracked
source, never in git history (all 1,191 text blobs across all refs scanned),
never in documentation, never in generated output, and never in shell history.
The only apparent matches were false positives: six npm `integrity` hashes in
`studio/package-lock.json`, and a placeholder in
`docs/storyblok-phase3b-local.md` that is seven hyphenated English words with no
digits.

The one real exposure was a single local session transcript. You ran
`npx sanity logout` on 3 September 2026 and I verified the credential is gone
from `~/.config/sanity/config.json` — both `authToken` and `authType` removed —
so the copy in that transcript is inert.

Separately, the project API token in the untracked, gitignored `.dev.vars` is the
`content-migration` token, which expired 27 August 2026 and which nothing in the
codebase reads. No git-history remediation is warranted.

## Files changed

| File | Why |
| --- | --- |
| `scripts/storyblok-fallback-policy.mjs` | mode enforcement flags, majority threshold, auth/config classification, message wording |
| `scripts/storyblok-tour-source.mjs` | 401/403 report as `unauthorized` |
| `scripts/build-static.mjs` | `storyblokFallback` added to `health.json` |
| `script.js` | price ownership removed; booking CTA link preserved |
| `tests/storyblok-fallback-policy.mjs` | rewritten for the decided semantics |
| `tests/tour-source.mjs` | auth classification assertion updated |
| `tests/build-output.mjs` | `unauthorized` added to the known-state set |
| `tests/tour-price-ownership.js` | new |
| `package.json` | `test:price-ownership` script |

## Tests run and results

| Suite | Result |
| --- | --- |
| `test:content` (12 suites incl. fallback policy) | pass |
| `test:price-ownership` (new) | pass — 6 tour pages |
| `test:packages-grid` | pass |
| `test:headers` | pass |
| `test:build` | pass |
| `test:layouts` | pass |
| `test:resilience` | pass |
| `test:smoke` | pass |
| `test:responsive` | pass |
| `test:a11y-static` | pass |
| `test:pathway-spotlight` | pass |
| `test:visual` | **not run to a pass; baseline deliberately not re-recorded** |

Mutation-verified, each by reintroducing the defect and confirming a named
failure: migration enforcing the threshold; production ignoring a bad
credential; the threshold using half instead of a majority; a content failure
counted as transport; and the price overwrite restored.

Also verified: no token or API endpoint reaches `dist/` (checked including after
the deliberately-bad-token build); 24 HTML routes unchanged; `tourCount` still
13; the 84 visual baseline files untouched since 26 August.

## Remaining blockers for 3H

- **Stale visual baseline** — 72 snapshots across 24 pages differ in height,
  predating Phase 3G and unrelated to it. Not touched, per instruction; slated
  for the Phase 3H staging verification strategy. Until it is resolved the
  visual suite cannot verify any change, because size mismatches stop it before
  pixel comparison.
- **Production mode is defined but unexercised end to end.** Its semantics are
  covered at unit level only, because it deliberately cannot be activated. The
  first real production-authoritative build will exercise it for the first time.
- **Three asset-blocked products** remain asset-blocked and not production-ready.
- **Founder photographs** still outstanding.
- Phase 3G and 3G.1 remain on `storyblok-phase-3`, unmerged and undeployed.
