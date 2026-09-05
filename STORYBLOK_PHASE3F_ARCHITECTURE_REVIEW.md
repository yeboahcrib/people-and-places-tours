# Phase 3F — Independent Pre-Production Architecture Review

**Scope:** the Tours portion of People & Places Ghana, reviewed against the
actual repository and the live EU Storyblok Space on 2 September 2026.
**Method:** adversarial and evidence-led. Every claim in the Phase 3A–3E reports
was re-derived from code or from a real build rather than accepted.
**Nothing was modified.** No code, no Storyblok content, no Sanity content, no
Cloudflare configuration, no deployment. This document is the only file created.

---

## Headline

The migration is **better engineered than most CMS cutovers I have read**. Per-record
failure isolation, a build-time-only CMS, immutable routes and a production gate
that refuses incomplete records are all genuinely well done.

It is **not ready for production**, for two reasons that are independent of the
three asset-blocked products:

1. **The Content Security Policy does not allow Storyblok's asset host.** Every
   Storyblok image would be blocked at cutover, silently.
2. **A client-side re-render discards CMS images on the packages page.** This is
   live today against Sanity, and the Storyblok overlay masks it only for
   Storyblok.

Both are fixable and neither invalidates the architecture.

---

## 1. Migration history, verified rather than summarised

Documents read: `docs/storyblok/STORYBLOK_MIGRATION_AUDIT.md`,
`STORYBLOK_ARCHITECTURE.md`, `STORYBLOK_PHASE3A_PLAN.md`, the 3B–3E reports,
`STORYBLOK_TOUR_MIGRATION_MANIFEST.md`, `STORYBLOK_JUST_GO_GHANA_FIELD_INVENTORY.md`,
`STORYBLOK_PHASE3E_DECISIONS.md`, and the manifests under `storyblok/`.

Claims checked against reality:

| Report claim | Verified? | Evidence |
|---|---|---|
| 12 standard tours exist as drafts | **Yes** | Management API lists 12 `tour` stories under `tours/day-short-experiences`, all `published: false` |
| 10 applied, 2 asset-blocked | **Yes** | A Storyblok-enabled build reports `{applied: 10, fallback: 2}` in `health.json` |
| Browser never contacts Storyblok | **Yes** | No shipped script contains `fetch`, an API origin or a token; only public field values |
| Routes are code-owned | **Yes** | `detailUrl` is never written by either mapper; `mergeDefined` cannot introduce it |
| Just Go Ghana untouched by 3C/3D | **Yes** | `tests/build-output.mjs:386` asserts its page contains no Storyblok asset |
| Production gate rejects assetless records | **Yes** | Independently reproduced — see §10 |

I found no false claim in the reports. The one documentation gap I did find is
recorded in §16 as Informational.

---

## 2. Complete tour data flow

**Standard tour**

```
Storyblok CDN  /v2/cdn/stories/tours/day-short-experiences/<slug>?version=draft
  → scripts/storyblok-tour-source.mjs  loadOneStory()          transport
  → mapStoryblokTour()                                          validation + mapping
  → scripts/tour-source.mjs  loadTourContent()                  merge over local/Sanity
  → scripts/build-static.mjs                                    static build
  → scripts/render-tour-cards.mjs  → dist/packages.html         server-rendered cards
  → scripts/render-tour-page.mjs   → dist/<slug>-tour.html      generated detail page
  → tours.js (committed, unmodified) → window.PEOPLE_PLACES_TOURS
  → dist/storyblok-standard-tours-overlay.js                    patches that catalogue
  → script.js:175  grid.innerHTML = …                           REBUILDS the grid
```

**Multi-day / Just Go Ghana**

```
Storyblok CDN  /v2/cdn/stories/tours/multi-day-experiences/just-go-ghana
  → mapStoryblokMultiDayTour()                                  rejects: no card asset
  → falls back to tours.js / Sanity
  → just-go-ghana.html is hand-authored and never generated
```

**Fallback**

Every failure mode returns `undefined` from the mapper, which leaves that one
tour on the source it already had. The catalogue is never partially rebuilt.

### The layer that should not be there

`script.js:175` replaces the entire server-rendered grid with markup rebuilt
from `window.PEOPLE_PLACES_TOURS`. The server render is therefore **discarded**
about a second after load. That is the root cause of finding **F2** and the
reason the browser overlay exists at all.

---

## 3. Source-of-truth audit

“Browser-final” is what the visitor actually sees on `/packages` after scripts run.

| Value | Current source | Browser-final | Target | Duplicates | Risk |
|---|---|---|---|---|---|
| title | Sanity → Storyblok | `tours.js` | Storyblok | tours.js, Sanity, Storyblok | **Medium** — agree only by discipline |
| slug | `tours.js` | `tours.js` | tours.js (correctly) | — | Low |
| public route | `tours.js` `detailUrl` | same | tours.js | — | **Low — correctly code-owned** |
| price | Sanity → Storyblok | `tours.js` | Storyblok | 3 sources | **High** — commercial value, silently overridable |
| card description | Sanity → Storyblok | `tours.js` | Storyblok | 3 | Medium |
| detail description | Sanity → Storyblok | server-rendered only | Storyblok | 3 | Low |
| duration | Sanity → Storyblok | `tours.js` | Storyblok | 3 | Medium |
| locations | Sanity → Storyblok | `tours.js` | Storyblok | 3 | Low |
| group size | Sanity → Storyblok | `tours.js` | Storyblok | 3 | Medium |
| categories / vibes | Sanity → Storyblok | `tours.js` | Storyblok | 3 | Medium — drives filtering |
| **card image** | **Storyblok/Sanity** | **`tours.js` (committed file)** | Storyblok | 3 | **Critical — see F2** |
| hero image | Storyblok (falls back to card) | server-rendered only | Storyblok | 2 | Low |
| gallery | Storyblok (≥3) | server-rendered only | Storyblok | 2 | Low |
| FAQs | Sanity → Storyblok | server-rendered only | Storyblok | 3 | Low |
| included / excluded | Sanity → Storyblok | server-rendered only | Storyblok | 3 | Low |
| Good to know | Sanity → Storyblok | server-rendered only | Storyblok | 3 | Low |
| itinerary | `tour-pages.json` → Storyblok | server-rendered only | Storyblok | 3 | Medium |
| related tours | **hard-coded in `just-go-ghana.html`** | same | catalogue-derived | 2 | **High — already drifted** |
| booking selection | `tours.js` via `script.js` | `tours.js` | Storyblok | 2 | Medium |
| SEO | `scripts/render-meta.mjs` + Storyblok `seo` | n/a | Storyblok | 2 | Low |
| contact / WhatsApp | `src/content/site.json` | fixed in markup | site settings | 2 | Low |

The pattern worth naming: **Storyblok appears to own many values that the browser
then overwrites from committed code.** They agree today only because `tours.js`
has been kept in sync by hand.

---

## 4. Transitional browser overlay

`scripts/storyblok-tour-browser-overlay.mjs` (84 lines) →
`dist/storyblok-standard-tours-overlay.js` (12.1 KB when 10 tours apply).

**Why it exists:** to stop `script.js` rebuilding the grid from stale committed
values. It is a **patch for F2**, not a feature.

**What it overrides:** 23 whitelisted public fields. `detailUrl` is deliberately
absent, so Storyblok cannot change a URL. Output is escaped for `<`, `>`, `&`,
U+2028 and U+2029.

Assessed against the questions asked:

- **Drift from generated HTML** — yes, structurally. Both are generated from the
  same validated records in one build, so they agree in practice, but nothing
  asserts it.
- **Ordering divergence** — low. Both sort on `packageOrder`, and duplicate
  orders are rejected before either is produced.
- **Fallback conflicts** — no. Only `appliedSlugs` are patched; a fallback record
  is untouched by design and this is correct.
- **Stale values reappearing** — yes, for **Sanity**. There is no Sanity overlay,
  so Sanity-managed card images are discarded (F2).
- **Hydration-like inconsistency** — yes. Server markup is replaced wholesale.
- **Performance** — 12 KB uncompressed, render-blocking-adjacent. Not a concern.
- **Information leakage** — none found. No token, no origin, no credential.

**Verdict: SAFE FOR TEMPORARY CUTOVER. SHOULD BE REMOVED AFTER CUTOVER** — but
only once `script.js` stops rebuilding the grid. Removing it first would make
things worse.

**Cleanest eventual architecture (not implemented):** let the server-rendered
grid stand and have `script.js` filter, sort and search the existing DOM rather
than re-render it. `data-tour-slug`, `data-categories` and `data-destination` are
already on every card, so the information needed is present. The overlay and the
`tours.js` catalogue then both become unnecessary for the packages page.

---

## 5. Adapter review

`scripts/storyblok-tour-source.mjs` — 616 lines, two mappers, two loaders.

**Handled well, verified:**

| Condition | Behaviour |
|---|---|
| Missing/null fields | Explicit checks on every required value; `undefined` → fallback |
| Malformed response | `invalid-response` |
| Duplicate slug | `duplicate-slug`, both records kept local |
| Duplicate display order | `duplicate-display-order`, **all** members dropped rather than one guessed |
| Unpublished / switch off | `content.published !== true` → rejected |
| Wrong experience type | Rejected (`day` vs `tailored_multi_day` are disjoint) |
| Missing card asset | Rejected — the production gate |
| Non-Storyblok asset host | `isStoryblokEuAssetUrl` restricts to `a.storyblok.com` / `a2.storyblok.com`, HTTPS only |
| Alt text | Required via `validAsset` |
| Wrong `full_slug` | Rejected — prevents a moved story hijacking a route |
| Nested block type | `component` checked on every block |
| Unexpected components | Whitelisted in schema and re-checked in code |
| API error / 404 | `unavailable` / `missing-story`; error text deliberately not logged, in case it carries a token |

**Gaps:**

- **No timeout and no retry** on the CDN fetch. `grep -cE "AbortSignal|retry"` on
  the adapter returns **0**. A hanging Storyblok request hangs the Cloudflare
  build until the platform timeout. (F3)
- **Ordering within a record is trusted** for standard tours. `itineraryDays` in
  the multi-day mapper checks days are `1..n` with no gaps; the standard mapper
  has no equivalent for its own ordered lists. Low risk today.
- **Future schema changes** are handled by rejection, which is the right default,
  but a renamed field would silently drop every tour to fallback with only a
  `health.json` change to show for it. See F5.

**Can invalid CMS content silently produce a broken public page?** I could not
construct one. Every path I traced ends in the whole record falling back, not in
a half-populated page. This is the strongest part of the implementation.

---

## 6. Failure and fallback policy

The current policy is: **always fall back, never fail the build.** Appropriate
for a migration; not appropriate unchanged for production.

| Scenario | Current | Recommended for production |
|---|---|---|
| Storyblok unreachable | fall back silently | **WARN** loudly; build succeeds |
| One story invalid | fall back | **WARN** — an editor needs to know |
| Several invalid | fall back | **WARN**, and consider a threshold |
| **All** requests fail | fall back | **FAIL** after cutover — a wholly stale site is worse than a failed deploy |
| Token invalid | `missing-configuration` | **FAIL** after cutover |
| Rate limited | `unavailable` | **RETRY** then warn |
| Image CDN down | build unaffected | CONTINUE (images are client-fetched) |
| Sanity also down | local fallback | CONTINUE |
| Local fallback stale | **used silently** | **WARN** — see F4 |
| Editor disables a tour | falls back to committed copy | **WARN** — the intent was probably to hide it |
| Editor changes a slug | `missing-story` → fallback | **WARN** — correct, but invisible |
| Editor removes an image | `invalid-content` → fallback | **WARN** |
| Schema change | mass fallback | **FAIL** after cutover |

The critical asymmetry: **"editor turned this tour off" and "Storyblok is broken"
currently produce the same silent outcome.** After cutover they need different
answers.

---

## 7. Security

**Good:**

- No token in any browser-delivered file. Verified across all of `dist/`.
- `.gitignore` covers `.env`, `.env.*` and `.storyblok/`; no credential is committed.
- The only token string in the repository is a placeholder in local setup notes.
- Error text from failed requests is deliberately not logged, because it can carry a token.
- Overlay output is escaped against `<`, `>`, `&`, U+2028, U+2029.
- Asset host allow-list is enforced in code, HTTPS only.
- No CMS-authored HTML or rich text is rendered — every string is escaped.
- CSP sets `script-src-attr 'none'` and no cookies.

**Findings:**

- **F1 — CSP omits Storyblok's asset host.** `_headers` allows
  `img-src 'self' https://images.unsplash.com https://cdn.sanity.io data:`.
  Storyblok assets are `a.storyblok.com`. **Every Storyblok image is blocked at
  cutover.** `tests/security-headers.mjs:35` asserts `cdn.sanity.io` is present
  and has no Storyblok equivalent, so no test catches this.
- **F6 — Preview token used for content.** The build reads
  `version=draft` with a Preview token. That is right for a migration, wrong for
  production: a published-content token and `version=published` are what make the
  publish switch meaningful.

No Management API credential is referenced by the build. Story creation used the
CLI session only, outside the build.

---

## 8. Image architecture

`storyblokImageUrl` composes `/m/<w>x<h>/filters:focal(...):quality(80)` and
falls back to the plain asset when dimensions are unknown. Focal points come from
the Storyblok asset. Card 1200×840, package 1200×825, hero 1920×1080.

**Strong:** one master per tour, focal point respected, host validated, alt
required, gallery capped and gated at three, dimensions derived defensively from
two possible shapes.

**Findings:**

- **F1** applies here first — none of this reaches a visitor until the CSP allows it.
- **F7 — no responsive `srcset`.** One fixed width per slot. A 1200px card is
  delivered to a 375px phone. Optional, not required.
- **F8 — no explicit social image.** Sharing falls back to the card. Acceptable.

Robust enough for production **once F1 is fixed**.

---

## 9. Routes and SEO

**Correctly protected.** `detailUrl` is never written by either mapper. A
Storyblok folder rename cannot move a public URL. `full_slug` is asserted against
the expected path, so a story moved in Storyblok is rejected rather than applied
to the wrong page. `_redirects` carries permanent 301s for four withdrawn tours,
with the reasoning recorded in comments.

`tests/build-output.mjs` asserts Just Go Ghana keeps its sitemap route and its
`<h1>`.

**Findings:**

- **F9 — sitemap and canonicals derive from `tours.js`, not the CMS.** Correct
  today and the safest default, but it means a tour added only in Storyblok would
  render no page and appear in no sitemap, silently. That is the right failure,
  but it should be a documented rule rather than an accident of layering.

I could construct no scenario in which CMS structure changes a live URL.

---

## 10. Just Go Ghana

The `multi_day_tour` model represents all thirteen required areas: eight
itinerary days with meals, group size, activity level, trip style, highlights,
pricing, deposit wording, accommodation, airport transfer, dedicated host,
inclusions and exclusions, FAQs and SEO.

Independently confirmed against the live Space:

| Requirement | State |
|---|---|
| Testimonials intentionally absent | **Confirmed** — the component has no such field, so it cannot be added by accident |
| Related-tour price ownership not duplicated | **Confirmed** — no related-tour field exists |
| Service charge represented | **Confirmed** — present in an 11-item included list |
| Travel-health wording not hard-coded | **Confirmed** — reads “Vaccinations and travel health requirements” |
| Missing photography fails safely | **Confirmed** — reproduced below |
| `/just-go-ghana.html` immutable | **Confirmed** — byte-identical output; only `health.json` differs |

**The gate, reproduced independently:**

| State | Result |
|---|---|
| As stored — unpublished, no photo | rejected |
| Visibility switch **on**, still no photo | **rejected** |
| Switch on and a photo present | applies, with every owner decision intact |

The middle row is the one that matters: turning the switch on is not sufficient.

**Unnecessary complexity:** none found. The model is smaller than `tour` and omits
four fields the page does not use.

**Missing content:** nothing essential. The overview is condensed relative to the
page's two paragraphs, which the field inventory anticipated as placement copy.

---

## 11. Build and performance

- **13 Storyblok requests per build**, issued with `Promise.all` in two groups.
  Well inside the Free plan's 100,000/month and its 3 calls/second Management
  limit (the build uses the CDN, not Management).
- No caching between builds. Fine at this volume.
- **No timeout, no retry** — F3.
- Overlay 12.1 KB uncompressed for 10 tours; roughly 15 KB at 13. Acceptable.
- Storyblok's Image Service does the resizing, so build time is unaffected by image work.
- Cloudflare compatible: the build is plain Node ESM with no native dependency.

**REQUIRED BEFORE PRODUCTION:** F3 (timeout).
**OPTIONAL:** caching, `srcset`, overlay size.

---

## 12. Test quality

The suites are unusually good for a static site: 13 page templates at six widths,
a JavaScript-free rendering pass, pixel regression, security headers, and
build-output assertions that name the exact failure they exist to prevent.

**But they do not prove the migration's most important guarantees.** Gaps:

| Gap | Why it matters |
|---|---|
| **No test asserts the CSP allows Storyblok assets** | F1 would have been caught at build time |
| **No test compares server-rendered cards with the post-script DOM** | F2 has been live against Sanity and no test notices |
| No test simulates a Storyblok timeout or 5xx | F3 is invisible |
| No test asserts the overlay agrees with the generated HTML | Drift would be silent |
| No test exercises a mixed applied/fallback catalogue in the browser | Filtering across mixed sources is unverified |
| No gallery or lightbox test for a Storyblok gallery | New surface, untested |
| No booking-selection test against Storyblok values | Commercial path |
| No Just Go Ghana browser test | Only build-level assertions exist |
| Visual baselines are gitignored | CI cannot regress-test appearance |

**Must be exercised in a real staging environment before cutover:** the browser
catalogue against a Storyblok-backed build, on a real device, with the CSP that
production will actually serve.

---

## 13. Free-plan compatibility

Nothing in the architecture depends on an unavailable feature. Phase 3A already
adjusted for the absence of custom metadata, custom roles and workflows.

Projected usage against Starter limits: 200 components (11 used), 100 folders (4),
2,000 assets (44), 20,000 stories (14), 10 datasources (0), 100,000 API
requests/month (~13 per build). No realistic concern.

One consequence to keep visible: **per-asset consent, ownership and approval are
folders and tags in Storyblok, not fields.** Those exist to keep an unapproved
photograph of a guest off the site. That is a governance downgrade, accepted
knowingly, and worth re-checking before cutover.

---

## 14. Cutover readiness

| Item | State |
|---|---|
| Content — 12 standard tours reconciled | **PASS** |
| Content — Just Go Ghana | **PASS** (content-ready) |
| Assets — 10 of 13 tours | **PASS** |
| Assets — Accra After Dark, Volta Community, Just Go Ghana | **BLOCKED** — no approved photograph |
| Storyblok publication (all stories are drafts) | **BLOCKED** |
| Published Delivery token + `version=published` | **BLOCKED** — F6 |
| Cloudflare secrets | **NEEDS VERIFICATION** |
| **CSP allows `a.storyblok.com`** | **BLOCKED — F1** |
| Routes and 301s | **PASS** |
| Sitemap and canonicals | **PASS** (F9 documented) |
| Images — focal points, crops | **NEEDS VERIFICATION** in a browser with production CSP |
| Desktop rendering | **NEEDS VERIFICATION** on staging |
| Mobile rendering | **NEEDS VERIFICATION** on a real device |
| Booking selection | **NEEDS VERIFICATION** against Storyblok values |
| Filters and search | **NEEDS VERIFICATION** with a mixed catalogue |
| **Server/client card parity** | **BLOCKED — F2** |
| Fallback policy for production | **BLOCKED** — decisions in §6 not yet made |
| Rollback path | **PASS** — one environment variable |
| Sanity retention | **PASS** — untouched |
| Monitoring and health | **PASS** — `health.json` reports per-tour state |
| Build timeout/retry | **BLOCKED — F3** |

**I do not authorise production.** Four blockers are mine to raise: F1, F2, F3
and the fallback policy. The rest are content and verification.

---

## 15. Post-cutover cleanup, in dependency order

Nothing here should be removed until the thing depending on it is proven gone.

1. **Fix `script.js` to filter rather than re-render** — everything else depends on this.
2. **Then remove the browser overlay** (`scripts/storyblok-tour-browser-overlay.mjs`
   and its emitted file). It exists only to correct the re-render.
3. **Then reduce `tours.js`** to routing and presentation only — `detailUrl`,
   `packageOrder`, `homeFeatured`. Its content fields become dead once the
   browser no longer rebuilds from them.
4. **Then remove Sanity tour queries** from `scripts/tour-source.mjs`, after an
   editorial verification period with Storyblok live.
5. **Then remove `src/content/tour-pages.json`** tour entries.
6. **Only then** remove the Sanity tour schema and studio entries.
7. **Keep** the migration manifests and phase reports. They are the record of why
   the content looks as it does, and cost nothing.

---

## 16. Findings

### F1 — Content Security Policy blocks every Storyblok image
**SEVERITY: Critical** · **AREA:** Security / cutover
**EVIDENCE:** `_headers` — `img-src 'self' https://images.unsplash.com https://cdn.sanity.io data:`.
`scripts/storyblok-tour-source.mjs:2` restricts assets to `a.storyblok.com` / `a2.storyblok.com`.
A Storyblok-enabled build emits 10 `a.storyblok.com` images into `dist/packages.html`.
`tests/security-headers.mjs:35` asserts `cdn.sanity.io` in `img-src` with no Storyblok equivalent.
**RISK:** At cutover every Storyblok image fails to load. Browsers report CSP
violations to the console only; the page renders with holes and the build passes.
**RECOMMENDATION:** Add the Storyblok asset host to `img-src`, and add it to the
`security-headers` assertion list so it cannot be removed later.
**WHEN:** Before production.

### F2 — Client-side re-render discards CMS card images
**SEVERITY: Critical** · **AREA:** Data integrity / architecture
**EVIDENCE:** `script.js:175` — `grid.innerHTML = packageTours.map(…)` rebuilds the
whole grid from `window.PEOPLE_PLACES_TOURS`, which is the committed `tours.js`
(`diff tours.js dist/tours.js` — identical; 0 CMS URLs in it).
Measured on **live production**, `/packages`:

| | cards | Sanity images | committed | stock |
|---|---|---|---|---|
| script.js blocked | 13 | **10** | 0 | 3 |
| script.js running | 13 | **0** | 10 | 3 |

**RISK:** The CMS is not authoritative for the packages grid in the browser. A
card photograph changed in Sanity today does not reach visitors there, and the
focal-point crops set in the CMS are replaced by static committed crops. Prices,
titles and badges are exposed to the same override — they agree only because
`tours.js` is kept in sync by hand. After cutover the Storyblok overlay masks
this for Storyblok tours; nothing masks it for anything else.
**RECOMMENDATION:** Have `script.js` filter and sort the existing server-rendered
DOM instead of re-rendering it. The needed attributes are already on every card.
**WHEN:** Before production. (The Sanity symptom is live now and worth fixing on
its own merits.)

### F3 — No timeout or retry on Storyblok requests
**SEVERITY: High** · **AREA:** Build reliability
**EVIDENCE:** `grep -cE "AbortSignal|setTimeout|retry|retries" scripts/storyblok-tour-source.mjs` → `0`.
`loadOneStory` awaits `fetchImpl(url)` with no signal.
**RISK:** A hanging Storyblok response hangs the Cloudflare build until the
platform timeout, turning a slow CMS into a failed deploy with an unhelpful log.
**RECOMMENDATION:** An `AbortSignal.timeout` per request and one bounded retry.
**WHEN:** Before production.

### F4 — “Editor turned it off” is indistinguishable from “CMS is broken”
**SEVERITY: High** · **AREA:** Operations
**EVIDENCE:** `sourcesBySlug` records the distinction (`invalid-content`,
`missing-story`, `unavailable`) but every one produces the same silent fallback,
recorded only in `health.json`.
**RISK:** A tour disabled by mistake keeps serving stale committed content
indefinitely, and nobody is told.
**RECOMMENDATION:** Adopt the per-scenario policy in §6, and warn at build time.
**WHEN:** During cutover.

### F5 — A schema rename would silently drop every tour to fallback
**SEVERITY: Medium** · **AREA:** Maintainability
**EVIDENCE:** Both mappers reject on any missing required field. A renamed
Storyblok field makes every record invalid at once.
**RISK:** The site keeps working on stale content while appearing healthy.
**RECOMMENDATION:** After cutover, fail the build when **all** records fall back.
**WHEN:** After stable production.

### F6 — Preview token and draft content are not production semantics
**SEVERITY: Medium** · **AREA:** Security / correctness
**EVIDENCE:** `loadOneStory` sets `version=draft` and uses `STORYBLOK_PREVIEW_API_TOKEN`.
**RISK:** In production this would publish unreviewed drafts, and the publish
switch would mean nothing.
**RECOMMENDATION:** A published Delivery token and `version=published` at cutover.
**WHEN:** During cutover.

### F7 — Fixed-width images, no `srcset`
**SEVERITY: Low** · **AREA:** Performance
**EVIDENCE:** `storyblokImageUrl` takes one width and height per slot.
**RECOMMENDATION:** Optional; the Image Service already supports it.
**WHEN:** After stable production.

### F8 — No explicit social image
**SEVERITY: Low** · **AREA:** SEO
**RECOMMENDATION:** Optional; the card is a reasonable default.
**WHEN:** After stable production.

### F9 — Sitemap and canonicals derive from `tours.js`
**SEVERITY: Low** · **AREA:** SEO / documentation
**RISK:** A tour created only in Storyblok is invisible to the site with no error.
**RECOMMENDATION:** Document the rule that `tours.js` owns the route inventory.
**WHEN:** During cutover.

### F10 — Just Go Ghana related-card prices duplicate the catalogue
**SEVERITY: Medium** · **AREA:** Data integrity
**EVIDENCE:** `just-go-ghana.html` hard-codes related-tour prices. They had
drifted to $130 and $100 against real prices of $140 and $110 and were corrected
on 2 September; a build guard now compares them to `tours.js`.
**RISK:** This is exactly the duplicate price ownership the Phase 3E decision
prohibits, and it drifted once already.
**RECOMMENDATION:** Derive those cards from the catalogue.
**WHEN:** After stable production.

### F11 — Phase 3C proceeded without its authorising documents
**SEVERITY: Informational** · **AREA:** Governance
**EVIDENCE:** `STORYBLOK_PHASE3C_REPORT.md` records that the audit, architecture
and 3A plan “were not present locally during this work”. They were recovered in
3D by SHA-256 and are now in `docs/storyblok/`.
**RISK:** Historical only. The report disclosed it rather than hiding it, which is
the right behaviour.
**WHEN:** No action.

---

## 17. Verdict

**A. Architecturally strong.** The CMS is a build-time input and never a runtime
dependency, so a Storyblok outage cannot take the site down. Failure isolation is
per record, so one bad tour cannot break a catalogue. Routes are owned by code
and cannot be moved from the CMS. The production gate refuses incomplete records
rather than rendering something half-formed. `health.json` reports per-tour
provenance, which is unusually good operational hygiene.

**B. Implemented well.** Duplicate display orders drop **all** members rather than
guessing. Error text is deliberately not logged in case it carries a token. The
overlay is a narrow whitelist that cannot express a URL. `full_slug` is checked so
a moved story cannot hijack a page. Asset hosts are validated. Alt text is
mandatory. The three asset-blocked products fail exactly as they should — I
reproduced the Just Go Ghana gate independently and it holds even with the
visibility switch on. Missing photography is handled correctly and is **not** an
architecture defect.

**C. Unnecessarily complex.** One thing, and it is not the migration's fault: the
browser rebuilds a grid the server already rendered. The overlay, the duplicated
content fields in `tours.js`, and the risk of silent divergence all descend from
that single decision. Remove the re-render and three layers become unnecessary.

**D. Must be fixed before production.** F1 (CSP blocks every Storyblok image),
F2 (client re-render discards CMS images), F3 (no timeout), and a decision on the
fallback policy in §6. Then the three asset-blocked products and publication.

**E. Can safely wait.** F5, F7, F8, F9, F10, the cleanup sequence, and every
optional optimisation.

**F. Suitable for a controlled cutover?** **Yes — after F1, F2 and F3.** The
foundations are sound and the failure behaviour is genuinely well designed. None
of the blockers is structural; two are one-line configuration and one is a
localised change to `script.js`.

**G. Recommended next phase.** Not another content migration. **Phase 3G:
server/client parity and cutover hardening** — fix the re-render, add the
Storyblok asset host to the CSP and to the header test, add a timeout and one
retry, decide the fallback policy, and add the two tests that would have caught
F1 and F2. Migrating the policy pages or the homepage before this would build
more on a foundation that has a known crack in it.
