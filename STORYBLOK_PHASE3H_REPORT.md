# Storyblok Phase 3H — production-like staging rehearsal

> **Resumed 4 September 2026.** Both original STOPs were cleared — the Public
> Delivery token now exists, and Phase 3H.1 fixed the withdrawal defect. The
> rehearsal then reached **a third stop: nothing is published in Storyblok, and
> no credential on this machine can publish it.** The resumed results are at the
> end of this document, under "Resumed rehearsal". The original findings below
> are unchanged.

**Two STOP conditions were reached (original run).** Everything not blocked by them was
completed. Nothing was deployed, no DNS changed, no Storyblok content published,
no production configuration touched, Sanity and every fallback left in place.

---

## STOP 1 — No Published Delivery token exists

Section 3 requires production-authoritative mode to use a **Published Delivery
token** with `version=published`. No such credential exists:
`STORYBLOK_PUBLIC_API_TOKEN` is unset in the shell, absent from every local env
file, and absent from the repository. The only Storyblok credential on this
machine is the **Preview** token in the untracked `.env.storyblok`, which
production mode is explicitly forbidden from using and which the code refuses to
accept for that mode.

Without it, sections 3, 4, 6, and the live half of 5 cannot run: there is no way
to exercise published delivery, and therefore no basis for a staging deployment
that means anything.

**Owner action required** — in Storyblok, Settings → Access Tokens for the
People & Places EU space (`294832753590557`):

1. Create a token with access level **Public** (the Content Delivery token that
   serves `version=published`). Do not create a Preview or Management token.
2. Put it in a local file the repository already ignores — append a line to
   `.env.storyblok` in the form `STORYBLOK_PUBLIC_API_TOKEN=<value>`.
3. Tell me it is in place. **Do not paste the value into chat.**

For a later Cloudflare staging build it belongs in the **Preview** scope only,
never Production, so the two credentials stay separated.

## STOP 2 — Production mode resurrects a withdrawn tour

This is a fallback-policy defect, and it is the exact A-versus-B ambiguity
section 5 warned about. I did not change the semantics.

Exercised against the real adapter with a controlled test double: one tour is
unpublished, so the Published Delivery API 404s it.

```
withdrawn tour source     : missing-story
policy classifies it as   : withdrawn
is it still in the output : YES
what the page would show  : COMMITTED FALLBACK kumasi / $199 STALE
```

The policy *classifies* the record correctly, but **nothing acts on the
classification**. `loadStoryblokStandardTours` still returns the committed base
tour, so the card and its detail page keep rendering from `tours.js` with a
stale price. Phase 3G.1 claimed intentional suppression "cannot be resurrected
from stale fallback" — that was true of the *classification* and false of the
*output*. The gap is real.

Underneath it is a second problem the classification cannot solve on its own:

| Editorial state | What the Published API returns |
| --- | --- |
| A. Not migrated yet / asset-blocked | 404 |
| B. Deliberately withdrawn after cutover | 404 |

They are indistinguishable at the transport layer. Treating every 404 as
"withdrawn" would delete tours that simply have not been migrated; treating
every 404 as "not migrated" resurrects withdrawn ones. **The current policy
cannot separate them safely, and choosing between those two failure modes is a
decision about editorial intent, not a code change I should make unilaterally.**

The likely resolution — for a later phase, not this one — is an explicit
registry state per product (`migrated` vs `pending`), so a 404 on a record marked
migrated means withdrawal and a 404 on a pending record means fallback. That is
a design change and needs authorization.

---

## What was completed

### Starting state (section 1) — all nine verified

Phase 3G/3G.1 commits present with a clean tree; `renderPackageTours` gone from
`script.js`; price hydration gone and `linkBookingCtaToFlow` in its place; both
Storyblok hosts in `img-src`; timeout and retry present; migration and production
modes separated (`draft`/Preview/unenforced vs `published`/Public/enforced);
production threshold 7 of 13; 401/403 and missing-token failing production
immediately; branch unmerged and undeployed.

**Production is confirmed unaffected by anything in this phase.** Its live
`health.json` reports all 12 standard records as `disabled`, so Storyblok is
switched off in Cloudflare's Production scope. Publishing Storyblok content
could not have reached the live site — but nothing was published anyway.

### Publication readiness (section 4) — determined, nothing published

Determined empirically rather than by inspection. A full build with the gate
enabled and the real Preview token:

```
Storyblok: 10 of 12 Storyblok records applied; 2 rejected by the content gate
(accra-food, volta-community) kept their committed fallback.
```

| Records | State |
| --- | --- |
| 10 standard tours | pass the Phase 3E content gate — candidates for staging publication |
| Accra After Dark Food Tour | rejected by the gate, asset-blocked |
| Volta Community Tour | rejected by the gate, asset-blocked |
| Just Go Ghana | separately gated, photograph still missing |

The three asset-blocked products were not touched: no image invented, borrowed,
or placeheld, and none marked ready. Their fallback path was exercised and works
— they hold their committed content while their neighbours apply.

**Nothing was published**, because publication readiness cannot be finally
verified without the published-delivery path that STOP 1 blocks.

### Production-mode fallback semantics (section 5) — via test doubles

Real adapter, real registry, doubled transport. No failures simulated against
production infrastructure.

| Scenario | Production | Migration |
| --- | --- | --- |
| All records valid | ok | ok |
| 1 / 5 / 6 technical failures of 13 | warn | warn |
| **7 technical failures of 13** | **fail** | warn |
| 13 technical failures | fail | warn |
| 401 (bad token) | **fail immediately (credential)** | warn |
| 403 (wrong scope) | **fail immediately (credential)** | warn |
| Missing published token | **fail immediately** | inactive |
| 13 content-gate failures | warn | warn |

Every line matches the approved policy except the withdrawal case in STOP 2.

### CSP in a real browser (section 7)

The Storyblok-enabled build was served with the actual `Content-Security-Policy`
from `_headers` applied by the server, and checked through the browser's console
and network activity rather than by reading the header.

| Page | CSP violations | Storyblok imgs | Sanity imgs | Unsplash imgs | Failed |
| --- | --- | --- | --- | --- | --- |
| packages | 0 | 10 | 1 | 4 | 0 |
| kumasi-tour | 0 | 3 | 0 | 1 | 0 |
| cape-coast-tour | 0 | 6 | 0 | 1 | 0 |
| accra-food-tour | 0 | 3 | 0 | 1 | 0 |
| just-go-ghana | 0 | 0 | 0 | 2 | 0 |
| index | 0 | 0 | 13 | 0 | 0 |

Zero violations, zero failed image requests, and all three hosts loading
together. One image initially read as broken on cape-coast-tour; it is the
lightbox element, which carries an empty `src` until a gallery item is opened —
by design, not a defect. The CSP stays restrictive: no host was widened beyond
the two Storyblok asset domains.

This ran locally with the production header applied, not on Cloudflare. It
verifies the policy and the URLs; it does not verify Cloudflare's own header
delivery, which needs the staging deployment.

### User journey, booking, and devices (sections 8–10)

Against the Storyblok-enabled build:

**Packages** — 13 cards, all with title, price, badge, image and link; order
begins just-go-ghana, accra-city, accra-food. Category filter narrows to 1;
adding the Kumasi destination filter yields 0 with the empty state shown; reset
restores 13; `?category=nature` deep-links to 8.

**Tour pages** — hero, price, duration/locations/group meta, Included, Not
Included, Good to Know, FAQ, related tours ("Also Check Out"), and gallery where
one exists (Cape Coast, 3 images) all render. Title, meta description, canonical
and `og:image` present on every page checked.

**Booking path** — card → detail → CTA → contact, end to end:
`kumasi-tour` → price `$250` → `contact?tour=kumasi#booking-flow` → contact page
with the tour preselected as `kumasi` out of 15 options and the `#booking-flow`
anchor present. No inquiry was submitted. Storyblok-backed values were not
replaced by catalogue values — `test:price-ownership` covers this and passes.

**Breakpoints** — 375 / 390 / 430 / 768 / 1440 on packages and a tour page: zero
horizontal overflow at every width, navigation present, CTA rendered. All
measurements come from a headless Chromium at emulated widths; **no real device
or mobile browser was used**, so device-specific behaviour is unverified.

### Visual baseline investigation (section 11) — cause found, baseline not touched

The baseline was **not** regenerated.

Four findings, in order of what they rule out:

1. **Rendering is deterministic.** Two consecutive runs against the same build
   reported byte-identical sizes for all 72 snapshots. This is not a font,
   image-loading, animation, viewport or harness reproducibility problem.
2. **The baseline holds 28 pages; the site has 24.** Four —
   `akosombo-tour`, `elmina-tour`, `jamestown-tour`, `kente-tour` — are orphans
   for tours that no longer exist and are never compared. They were the only
   entries "not differing", which made the failure look partial. **Every page
   that actually exists differs: 24 of 24.**
3. **The uniform component is CSS.** Simple pages all shifted by exactly the
   same amount — +168px at 375, +95px at 768, +44px at 1440. Restoring
   `style.css` from the baseline-era commit `ba54d16` and rebuilding made those
   pages match the baseline **exactly**, and dropped the differing count from 72
   to 52. The global shift is legitimate stylesheet work from the 21 commits
   since 26 August.
4. **The remainder is content.** The other ~450px on tour pages, +443 on
   packages and +1691 on Cape Coast track the photography, gallery and section
   work landed in those same commits.

**Conclusion: the baseline is stale, not broken.** A new baseline is warranted —
but only once staging output has been independently verified correct, which STOP
1 prevents. Recommend re-recording as the first step *after* a verified staging
build, and deleting the four orphan pages at the same time.

### SEO and routes (section 12)

24 routes, unchanged from before this phase. Canonicals present on 22 pages, all
on `https://peopleplacesgh.com`; the two without are `404.html` and
`thanks.html`, which are `noindex` — correct, not a gap. Sitemap carries 22 URLs
and no Storyblok reference. **No Storyblok path leaks into public routing** — no
`href` anywhere resolves to a Storyblok URL or a `/tours/` path. Extensionless
routing was exercised through a Cloudflare-shaped resolver locally; real
Cloudflare behaviour needs the staging deployment.

### Health diagnostics (section 13)

`health.json` now carries `storyblokFallback` with mode, status, whether
enforcement applies, attempted and applied counts, the threshold, and the
affected slugs split by cause. On the Storyblok-enabled build it correctly
reported `warn`, 10 of 12 applied, and named `accra-food` and `volta-community`
as content-gate fallbacks.

No credential appears in it: the Preview token's value occurs zero times in
`health.json` and zero times anywhere in `dist/`, and `api.storyblok.com` appears
in no shipped file — the browser never touches the Storyblok API.

**Sufficient for an initial cutover, with one gap.** It reports state well, but
there is no `withdrawn` reporting that would surface STOP 2, and nothing external
watches it — a failing build is visible in Cloudflare's log, but a `warn` build
is only visible to someone who opens `health.json`.

### Rollback rehearsal (section 14) — rehearsed and working

| Step | Result |
| --- | --- |
| Storyblok-authoritative build | 10 of 12 records applied, 33 files, 24 routes |
| Remove `STORYBLOK_STANDARD_TOURS_ENABLED` | build succeeds, all 12 records `disabled` |
| Verify after rollback | 24 routes identical, every page HTTP 200 |

Every page checked after rollback kept its heading, price and CTA; the packages
grid still rendered 13 cards. The rolled-back build differs from the
Storyblok build on all 24 pages, and the difference is exactly what it should be
— image URLs revert from `a.storyblok.com` to `cdn.sanity.io`.

**Rollback returns Tours to Sanity, not to stale committed JSON**, so it costs
nothing in content freshness. The minimum procedure:

1. In Cloudflare Pages → Settings → Environment variables (Production), remove or
   set `STORYBLOK_STANDARD_TOURS_ENABLED` to anything other than `true`. Same for
   `STORYBLOK_MULTI_DAY_ENABLED`.
2. Trigger a redeploy (Deployments → Retry deployment, or any push to `main`).
3. Confirm `https://peopleplacesgh.com/health.json` shows the records as
   `disabled` and `storyblokFallback.status` as `inactive`.

One variable, one redeploy, roughly the length of a build. No code change, no
revert, no DNS.

---

## Problems found

| # | Problem | Classification |
| --- | --- | --- |
| 1 | No Published Delivery token exists | **BLOCKER BEFORE PRODUCTION** — needs owner action |
| 2 | Withdrawn tour resurrected from fallback in production mode | **BLOCKER BEFORE PRODUCTION** |
| 3 | `missing-story` cannot distinguish "not migrated" from "withdrawn" | **BLOCKER BEFORE PRODUCTION** — design decision needed |
| 4 | Three products asset-blocked, incl. Just Go Ghana's photograph | **BLOCKER** for those three only; the other 10 are unaffected |
| 5 | Visual baseline stale; 4 orphan pages inflate it | FIX BEFORE PRODUCTION IF PRACTICAL |
| 6 | No staging deployment yet; Cloudflare header delivery and extensionless routing unverified on real infrastructure | FIX BEFORE PRODUCTION IF PRACTICAL |
| 7 | No real-device testing; breakpoints verified by emulation only | FIX BEFORE PRODUCTION IF PRACTICAL |
| 8 | A `warn` build is visible only to someone who opens `health.json` | SAFE TO DEFER |
| 9 | Just Go Ghana carries 3 testimonials not sourced from Google | SAFE TO DEFER (pre-existing, previously flagged) |

## Production cutover checklist

| Item | Status |
| --- | --- |
| Phase 3G/3G.1 changes present and locally validated | **PASS** |
| Packages grid server-authoritative | **PASS** |
| Tour pricing server/CMS authoritative after JS | **PASS** |
| CSP permits both Storyblok hosts; no violations in a browser | **PASS** |
| Timeout and bounded retry | **PASS** |
| Migration vs production mode separation | **PASS** |
| Production systemic threshold 7 of 13 | **PASS** |
| Production auth/config failure fails immediately | **PASS** |
| No token in browser output; no browser-side Storyblok API access | **PASS** |
| Routes unchanged; no Storyblok path in public routing | **PASS** |
| Booking path end to end | **PASS** |
| Rollback rehearsed | **PASS** |
| Production confirmed unaffected (Storyblok disabled live) | **PASS** |
| Published Delivery token | **NEEDS OWNER ACTION** |
| Withdrawal semantics (A vs B) | **BLOCKED** — needs a design decision |
| Storyblok staging publication of the 10 ready tours | **BLOCKED** by the above |
| Cloudflare preview deployment | **BLOCKED** — pointless until published delivery works |
| Cloudflare header delivery and extensionless routing on real infrastructure | **NEEDS VERIFICATION** |
| Real-device mobile QA | **NEEDS VERIFICATION** |
| Visual baseline re-record | **NEEDS VERIFICATION** — cause understood, do it after a verified staging build |
| Three asset-blocked products | **BLOCKED** — photography outstanding |

## Recommendation

**READY FOR OWNER ACTIONS** — not ready for cutover.

The architecture held up everywhere it could be exercised. Ten of twelve records
apply cleanly, the content gate correctly holds back the two asset-blocked ones,
CSP passes in a real browser with all three image hosts live, the booking path
works end to end, pricing stays server-authoritative, rollback is one variable
and was rehearsed, and the stale visual baseline turned out to be ordinary
staleness rather than a reproducibility fault.

Two things stand between here and a controlled cutover. One is a credential only
you can create. The other is a genuine design gap: production mode cannot yet
tell a withdrawn tour from an unmigrated one, and until it can, publishing to a
production-authoritative build risks either resurrecting content an editor
removed or dropping tours that were never migrated.

Neither is fixed by trying harder at staging. Both need a decision from you.

Nothing was deployed. Nothing was published. Phase 3H stops here.


---

# Resumed rehearsal — 4 September 2026

## STOP 3 — Nothing is published, and I cannot publish it

Verified directly against the Published Delivery API with the Public token, one
request per product:

```
published stories retrievable: 0 of 13
```

Every one of the 13 returns 404. The migration created drafts; nothing has ever
been published.

Publishing requires a **Management API** credential. None exists on this machine
— no management or OAuth token in the environment or in `.env.storyblok` — and
the Phase 3C/3D staging scripts never had one either: they only prepare JSON
files, so the stories were created by hand.

**Owner action required.** Publish the 10 authoritative tours in the Storyblok
UI — open each story and press Publish:

| Publish these 10 | Do **not** publish |
| --- | --- |
| accra-city, cape-coast, kumasi, ada-foah, quad-bike, volta, shai-hills, aburi, cape-coast-day, batik-workshop | accra-food, volta-community, just-go-ghana |

The three excluded are asset-blocked and marked `pending` in the registry.

## Why publishing must come first — measured, not assumed

Production-authoritative mode was exercised against the real Published Delivery
API, with the Public token and `version=published`:

```
record states     : { withdrawn: 10, pending-not-migrated: 3 }
catalogue size    : 3 of 13 products
surviving products: accra-food, volta-community, just-go-ghana
```

The Phase 3H.1 semantics are working exactly as designed — and that is precisely
the danger. **If production-authoritative mode were switched on today, the site
would lose 10 of its 13 tours**, because the build would correctly conclude that
every authoritative story had been withdrawn.

Publishing is therefore a hard prerequisite for activation, not a step that can
run alongside it. That ordering is the single most important result of this
resumed run.

## A defect found and fixed: delivery was not actually wired to the mode

Step 1 asks for proof that authoritative delivery does not use the Preview token
and does use `version=published`. Both were false.

The adapter hardcoded `version=draft` and always read
`STORYBLOK_PREVIEW_API_TOKEN`, regardless of mode. Production-authoritative mode
would have sent a Preview token against draft content — the exact combination
the phase forbids — or, with a Public token, been rejected outright.

Fixed: both loaders now take `contentVersion` and `tokenEnvVar` from the caller,
and the build derives them from the resolved mode. Defaults are unchanged
(`draft` + Preview), so migration builds behave exactly as before.

Now verified by test, and mutation-verified both ways:

| Delivery | Content version | Credential |
| --- | --- | --- |
| authoritative | `published` | `STORYBLOK_PUBLIC_API_TOKEN` |
| migration | `draft` | `STORYBLOK_PREVIEW_API_TOKEN` |
| default (unspecified) | `draft` | `STORYBLOK_PREVIEW_API_TOKEN` |

A missing Public token under authoritative delivery reports
`missing-configuration` rather than silently falling back to the Preview
credential — also tested.

## Steps completed on resume

**1. Public Delivery credential — PASS.** Present, 24 characters,
`version=published` returns 200 and `version=draft` returns 401, which is the
correct signature: it cannot read unpublished content. Neither token appears
anywhere in `dist/` or the repository. One housekeeping fix: an empty duplicate
`STORYBLOK_PUBLIC_API_TOKEN=` line left over from an earlier paste was removed.

**2. Production still Storyblok-disabled — PASS.** Live `health.json` reports
all 12 standard records as `disabled`, built 2026-09-03. Publishing cannot
change the live site by itself.

**3. Pre-publication validation — PASS, publication BLOCKED.** A full build with
the gate enabled shows exactly the expected split:

```
10 of 13 Storyblok records applied; 3 rejected by the content gate
(accra-food, volta-community, just-go-ghana) kept their committed fallback.
```

The 10 authoritative tours are content-ready, asset-ready, visibility-enabled,
route-mapped and valid under the adapter. Publication itself is blocked by STOP 3.

**4. Published delivery verified — 0 of 13 retrievable.** Confirmed with the
Public token only; no Management or Preview credential was used. No draft
content leaked into the published result, because there is no published result.

**5. Production-authoritative mode exercised locally — see above.** It was *not*
activated in `resolveStoryblokMode`, and not enabled in Cloudflare. The 13-product
catalogue could not be verified because it requires published stories.

**6. Withdrawal semantics — PASS.** Covered by the nine-scenario suite from
Phase 3H.1 and confirmed end to end against the real API in the run above. No
legitimate story was unpublished to test this; test doubles proved the same
behaviour. The owner's decision on invalid content — controlled fallback plus a
prominent warning during the cutover period — matches the implemented behaviour
and was left unchanged.

**7–10, 12. Cloudflare preview, real staging QA, CSP on Cloudflare, device QA,
SEO on staging — BLOCKED.** All of these require a staging deployment serving
published content. With nothing published, a preview would show a 3-product
catalogue and prove nothing. Not attempted.

**11. Visual baseline — investigated in the original run, unchanged.** The cause
is understood: rendering is deterministic across runs, and the differences are
legitimate CSS and content changes since 26 August. No refresh is recommended
yet, because the staging output it should be recorded from does not exist. The
four obsolete baseline pages are `akosombo-tour`, `elmina-tour`,
`jamestown-tour` and `kente-tour` — tours that no longer exist, whose baselines
are never compared and should be deleted when the baseline is refreshed. When
authorized, the procedure is `npm run test:visual:baseline` against a verified
staging build, then delete those four page sets.

**13. Health diagnostics — PASS in structure, unverifiable in production mode.**
The diagnostic reports mode, status, enforcement, threshold 7, applied count and
the affected slugs by cause, with no credentials. It cannot yet show 10 applied
authoritative records, because none are published.

**14. Rollback — rehearsed in the original run and still valid.** One
environment variable and a redeploy returns Tours to Sanity, with all 24 routes
intact. Not re-run, because there is no Storyblok-authoritative staging
deployment to roll back from.

## Remaining blockers

1. **Nothing is published in Storyblok**, and publishing needs owner action in
   the Storyblok UI (STOP 3).
2. **Three products remain asset-blocked** — accra-food, volta-community,
   just-go-ghana. They stay `pending` and keep their fallbacks; this does not
   block cutover for the other 10.
3. **No staging deployment yet**, so Cloudflare header delivery, extensionless
   routing on real infrastructure, and real staging QA remain unverified.
4. **No real-device QA.** Breakpoints have only ever been checked by emulation.
   This remains an owner verification item.

## Optional cleanup, explicitly not done

- Refreshing the visual baseline and deleting the four obsolete page sets
- Removing Sanity, `tours.js`, the JSON fallbacks or the browser overlay — all
  deliberately retained until after a stable production period

## Recommendation

**READY FOR OWNER ACTIONS.**

The architecture is now complete and correct as far as it can be exercised
without published content. The withdrawal semantics work against the real
Published Delivery API, the credential and content-version separation is
enforced and tested, production is provably unaffected, and rollback is one
variable away.

One owner action stands between here and a real staging rehearsal: publish the
10 authoritative tours. Once that is done, steps 5 and 7 through 13 can run in
full, and the catalogue can be verified at 10 Storyblok + 3 fallback = 13.

Nothing was deployed, published, or configured. Phase 3H stops here again.

---

# Final resumed results — 10 tours published

STOP 3 is cleared. The owner published the 10 authoritative tours manually.

## Publication verification — exact match

Checked one request per product against the real Published Content Delivery API
with the Public token only. No Management or Preview credential was used.

```
published: 10 | unavailable: 3
matches the authority registry exactly: true
```

| Result | Products |
| --- | --- |
| Published (HTTP 200) | accra-city, cape-coast, kumasi, ada-foah, quad-bike, volta, shai-hills, aburi, cape-coast-day, batik-workshop |
| Unavailable (HTTP 404) | accra-food, volta-community, just-go-ghana |

The 10 published are exactly the 10 marked `authoritative`; the 3 unavailable are
exactly the 3 marked `pending`. No draft-only content can be returned — the
Public token receives 401 on `version=draft`, which is a structural guarantee
rather than a convention.

## Production-authoritative mode activated (locally)

Mode B was flipped from `active: false` to `active: true`. It was inactive
because it had never been exercised and its credential did not exist; both have
changed. **Activatable is not active** — reaching it still requires a deliberate
`STORYBLOK_CONTENT_MODE=production` plus the enable flags plus a Public token,
and none of those is set in Cloudflare. The default remains migration, asserted
by test.

## The build

```
Storyblok: 10 of 13 Storyblok records applied; 3 not yet migrated
(accra-food, volta-community, just-go-ghana) kept their committed fallback.
Built 33 public root files and 2 public directories into dist/.
```

**Catalogue: 10 Storyblok + 3 fallback = 13 products.** Verified in the built
page — 13 cards, and the card image source per product is exactly right:

| Source | Count | Products |
| --- | --- | --- |
| Storyblok | 10 | the authoritative ten |
| Unsplash fallback | 3 | accra-food, volta-community, just-go-ghana |

## Health diagnostics

| Field | Value |
| --- | --- |
| mode | `production` |
| status | `warn` |
| enforced | `true` |
| threshold | `7` |
| attempted / applied | 13 / 10 |
| pendingMigration | accra-food, volta-community, just-go-ghana |
| **withdrawn** | **`[]` — no false withdrawal** |
| transport failures / authOrConfig | none / none |

No credential appears in it. Neither token appears anywhere in the build, and
`api.storyblok.com` appears in no shipped file — the browser never contacts the
Storyblok API.

## CSP, verified in a browser with the real header

| Page | CSP violations | Storyblok | Sanity | Unsplash | Broken |
| --- | --- | --- | --- | --- | --- |
| packages | 0 | 10 | 1 | 4 | 0 |
| kumasi-tour | 0 | 3 | 0 | 1 | 0 |
| cape-coast-tour | 0 | 6 | 0 | 1 | 0 |
| accra-food-tour | 0 | 3 | 0 | 1 | 0 |
| just-go-ghana | 0 | 0 | 0 | 2 | 0 |
| index | 0 | 0 | 13 | 0 | 0 |
| contact | 0 | 0 | 1 | 1 | 0 |

Zero violations, zero failed image requests, all three hosts serving together,
extensionless routes resolving. Partial load counts at narrow widths are lazy
loading, confirmed by scrolling: 17/17 images load at 375px with zero HTTP
failures.

## User-journey QA

**Packages** — 13 cards, each with title, price, badge and link. Category filter
narrows to 1; adding the Kumasi destination gives 0 with the empty state; reset
restores 13; `?category=nature` deep-links to 8.

**Tour pages** — all 13 return 200 with a price, trip meta, Included, Not
Included, FAQ, related tours, `og:image`, a canonical on
`https://peopleplacesgh.com`, and no accidental `noindex`. Prices read from
published Storyblok for the ten: Kumasi $250, Cape Coast $160, Accra City $110,
Ada $150, Quad Bike $130, Volta $180, Shai Hills $140, Aburi $120, Cape Coast
Day $160, Batik $120. Just Go Ghana keeps its $3,000 fallback and its 8-day
itinerary. It has no "Good to Know" heading — that is its existing structure
("Trip Details"), not a regression.

**Gallery and lightbox** — Cape Coast is the only tour with a gallery: 3 images,
lightbox opens on a Storyblok image and closes on Escape.

**Booking** — card → detail → CTA → contact, end to end:
`cape-coast-tour` → "Cape Coast Ancestral Tour" $160 →
`contact?tour=cape-coast#booking-flow` → contact with `cape-coast` preselected
from 15 options and the anchor present. No inquiry submitted.

**Responsive** — 375 / 390 / 430 / 768 / 1440 on packages and a tour page: zero
horizontal overflow at every width, nav present, 13 cards, booking CTA rendered.
Emulated widths only; **no real device was used**, so device-specific QA remains
an owner verification item.

## SEO and routes

24 HTML routes, unchanged. 22 sitemap URLs, 22 canonicals on the live domain
(the two without are `404` and `thanks`, both `noindex` — correct). All 13 tour
routes present. **No Storyblok path leaks into public routing** — zero Storyblok
references in the sitemap and zero Storyblok or `/tours/` hrefs in any page.
`_redirects` untouched.

## Rollback rehearsed from the production build

| Step | Result |
| --- | --- |
| Production-authoritative build | 10 applied, 3 fallback, 24 routes |
| Remove `STORYBLOK_CONTENT_MODE` and the enable flags | build succeeds, all 13 `disabled`, mode `migration` |
| Verify | 24 routes, 13 cards, images revert to 11 Sanity + 4 Unsplash |

Rollback is one variable and a redeploy, and it returns Tours to Sanity rather
than to stale committed JSON.

## Visual baseline — investigated, refresh recommended, not performed

The stale baseline now has a complete explanation. Every difference is accounted
for and legitimate:

1. **Rendering is deterministic** — two runs of the same build produce identical
   sizes. Not a harness, font or reproducibility fault.
2. **Global +168 / +95 / +44px** (375/768/1440) on every page — stylesheet work
   since 26 August. Proven by restoring the baseline-era `style.css`, which made
   the simple pages match the baseline *exactly*.
3. **~+450px on tour pages** — photography and gallery work in the same commits.
4. **+49 / +117 / +115px on 9 of the 10 authoritative tours** — new in this run,
   caused by publishing. Storyblok carries richer copy than Sanity for the same
   field: `starting_point` is "Pickup and drop-off from Accra or your hotel,
   unless a different arrangement is requested." where Sanity had "Accra, Ghana".
   That is +24 words, which wraps to +117px at 375px. A content improvement.
   `cape-coast-day-tour` is unchanged because its copy already matched.
5. **Four obsolete baseline page sets** — `akosombo-tour`, `elmina-tour`,
   `jamestown-tour`, `kente-tour`: 3 files each, 12 files total, for tours that
   no longer exist. They are never compared, which is why the failure looked
   partial when it was total.

**Recommendation: refresh the baseline from a production-authoritative build,
once you are satisfied with the staging output.** Not performed — the phase
forbids committing one without explicit authorization. The procedure:

```bash
npm run test:visual:baseline
rm tests/visual-baseline/{akosombo-tour,elmina-tour,jamestown-tour,kente-tour}-*.png
```

## STOP 4 — Cloudflare preview needs owner action

A preview deployment that means anything requires Storyblok variables in
Cloudflare's **Preview** scope. There is no `wrangler` and no Cloudflare API
token on this machine, so the only route is pushing the branch — and a preview
built without those variables would serve the Sanity fallback site, proving
nothing about published delivery.

Rather than improvise, this stops here. **Owner action**, in Cloudflare Pages →
Settings → Environment variables, **Preview scope only**:

| Variable | Value |
| --- | --- |
| `STORYBLOK_CONTENT_MODE` | `production` |
| `STORYBLOK_STANDARD_TOURS_ENABLED` | `true` |
| `STORYBLOK_MULTI_DAY_ENABLED` | `true` |
| `STORYBLOK_REGION` | `eu` |
| `STORYBLOK_PUBLIC_API_TOKEN` | the Public Delivery token |

Then push this branch for a `*.pages.dev` preview. Do not add any of these to
the Production scope.

**Consequence:** all QA above ran locally against the production-authoritative
build with the real CSP header applied by the server. It verifies the policy,
the content and the URLs. It does **not** verify Cloudflare's own header
delivery or its extensionless routing on real infrastructure.

## Remaining blockers

1. **No Cloudflare preview** — needs Preview-scope variables (STOP 4).
2. **Cloudflare header delivery and routing unverified on real infrastructure.**
3. **Three products asset-blocked** — accra-food, volta-community,
   just-go-ghana remain `pending` on fallback. Does not block the other ten.
4. **No real-device QA.**

## Optional cleanup, deliberately not done

- Refreshing the visual baseline and deleting the 12 obsolete files
- Removing Sanity, `tours.js`, the JSON fallbacks or the browser overlay

## Recommendation

**READY FOR OWNER ACTIONS.**

The Tours architecture now works end to end on published Storyblok content. Ten
authoritative tours apply from the Published Delivery API, three pending
products hold their fallbacks, the catalogue is 13, no tour is falsely withdrawn,
CSP passes with all three image hosts, routes and canonicals are unchanged, the
booking journey works, and rollback is one variable away.

What is left is not architectural. It is one Cloudflare configuration step to
get a real preview, and the verification that only a real preview and a real
device can provide. After that, controlled production cutover is a reasonable
next phase to authorize.

Nothing was deployed to `peopleplacesgh.com`. No production variable was
changed. No further content was published. Phase 3H stops here.

---

# Staging deployment verified — 5 September 2026

STOP 4 is cleared. A non-production Cloudflare Preview is live and serving
published Storyblok content.

**Deployment:** `storyblok-phase-3e.people-and-places-tours.pages.dev`
Not `peopleplacesgh.com`. No DNS change, no Production-scope variable, no merge
to `main`. Production remains Storyblok-disabled and untouched.

## The gallery investigation

The first preview showed the Cape Coast card and hero correctly but no gallery.
Traced end to end; **every stage of the Storyblok pipeline was healthy**:

| Stage | Result |
| --- | --- |
| Published Storyblok story | 3 gallery items, each with filename and alt |
| Published Delivery API | returns all 3 |
| Production-mode adapter | maps all 3 |
| Generated HTML (current code) | 3 `gallery-item` figures |
| **Deployed preview** | **0 — no gallery block** |

**Cause: the preview was building Phase 3E code**, six commits behind. Its
`health.json` had no `storyblokFallback` field — that field arrived in Phase 3G —
and its `script.js` still contained `renderPackageTours` and
`hydrateTourDetailFromCatalog`, both removed in 3G/3G.1.

Two things compounded it:

1. **"Retry deployment" rebuilds the same commit.** It picks up new environment
   variables but never newer code, so three retries all produced Phase 3E. Only
   a new push creates a deployment at the branch head.
2. That old code reads only `STORYBLOK_PREVIEW_API_TOKEN`, so the Public token
   set in Preview scope was invisible to it — reporting `missing-configuration`
   for all 12 records while the enable flag was plainly set.

The renderer's three-image rule was never involved: it received zero images, not
two. The committed catalogue has never carried gallery data — `tours.js`
contains the word "gallery" zero times — which is why the fallback build shows
no gallery block at all, while the card image, a committed asset, loads fine.

Reproduced locally across all four build shapes, which isolates it exactly:

| Build | Gallery figures |
| --- | --- |
| Storyblok production + Sanity | 3 |
| Storyblok production, no Sanity | 3 |
| Storyblok disabled + Sanity | 4 |
| **Storyblok disabled, no Sanity** | **0** |

No code change was needed or made.

## Final preview health

| Field | Value |
| --- | --- |
| mode | `production` |
| status | `warn` |
| enforced | `true` |
| threshold | `7` |
| applied | **10 of 13** |
| pendingMigration | accra-food, volta-community, just-go-ghana |
| **withdrawn** | **`[]` — no false withdrawal** |
| transport / authOrConfig failures | none / none |
| tourCount | 13 |
| record states | `{applied: 10, pending-not-migrated: 3}` |

Exactly the shape the phase specified: **10 Storyblok + 3 fallback = 13**.

## Real staging QA

**Packages** — 13 cards, all with title, price and badge. 10 carry Storyblok
images; the 3 that do not are precisely just-go-ghana, accra-food and
volta-community. **Zero CSP violations.** Category filter narrows to 1; adding
the Kumasi destination gives 0 with the empty state; reset restores 13;
`?category=nature` deep-links to 8.

**All 13 tour routes** — every one returns 200 through Cloudflare's
extensionless routing, with a price and a canonical on
`https://peopleplacesgh.com`. Prices served from published Storyblok: Accra City
$110, Cape Coast $160, Kumasi $250, Ada $150, Quad Bike $130, Volta $180, Shai
Hills $140, Aburi $120, Cape Coast Day $160, Batik $120. The three pending hold
their fallbacks: Accra Food $90, Volta Community $230, Just Go Ghana $3,000.

**Gallery** — Cape Coast renders 3 figures, 627px tall, all three images loaded
and all three from Storyblok. The lightbox opens on a Storyblok image and closes
on Escape. 9/9 images load on the page with zero failed requests.

**Booking** — card → detail → CTA → contact on real staging:
`cape-coast-tour` → `contact?tour=cape-coast#booking-flow` → contact with
`cape-coast` preselected from 15 options and the anchor present. No inquiry
submitted.

**Breakpoints** — 375 / 390 / 430 / 768 / 1440 against the live preview: zero
horizontal overflow at every width, and the Cape Coast gallery renders all 3
figures at every width. Emulated widths; **no real device was used.**

## Previously blocked items now verified

- **Cloudflare serves the intended CSP header** — confirmed from the response
  headers on the live preview, and zero violations in the browser across
  packages and tour pages with Storyblok, Sanity and Unsplash images together.
- **Extensionless routing works on real Cloudflare** — all 13 tour routes plus
  `/packages` and `/contact` resolve without `.html`.
- **`STORYBLOK_MULTI_DAY_ENABLED`** is now set in Preview scope; Just Go Ghana
  reports `pending-not-migrated` rather than `disabled`, and the count reads
  13 rather than 12.

## Remaining blockers

1. **Three products asset-blocked** — accra-food, volta-community,
   just-go-ghana remain `pending` on fallback, awaiting approved photography.
   They do not block cutover for the other ten.
2. **No real-device QA.** All responsive verification is emulated. This remains
   an owner verification item.

## Optional cleanup, deliberately not done

- Refreshing the visual baseline and deleting the 12 obsolete files
  (`akosombo-tour`, `elmina-tour`, `jamestown-tour`, `kente-tour`)
- Removing Sanity, `tours.js`, the JSON fallbacks or the browser overlay

## Recommendation

**READY FOR CONTROLLED TOURS PRODUCTION CUTOVER.**

The Tours architecture has now been exercised end to end on real infrastructure
with real published content. Ten authoritative tours serve from the Published
Delivery API, three pending products hold their fallbacks, the catalogue is 13,
no tour is falsely withdrawn, CSP passes on Cloudflare with all three image
hosts, every route resolves, the booking journey works, the gallery renders, and
rollback is one variable away and rehearsed.

Two caveats on the evidence, neither architectural: responsive checks are
emulated rather than device-tested, and the three asset-blocked products will
stay on committed fallbacks until their photography exists.

Cutover would mean setting the same five variables in Cloudflare's **Production**
scope and merging to `main`. That has not been done and is not authorized by
this phase.

Nothing was deployed to `peopleplacesgh.com`. Phase 3H is complete.

---

# Final Real-Device QA and Phase 3H Closeout

Owner-completed QA on a real iPhone against the Cloudflare Preview. All results
below are owner-verified unless marked as an automated check.

## Real-device results

| Area | Result |
| --- | --- |
| Packages / Experiences | **PASS** |
| Just Go Ghana | **PASS** after the responsive fix |
| Trip Details | **PASS** after the responsive fix |
| Cape Coast gallery | **PASS** |
| Cape Coast booking | **PASS** |
| Just Go Ghana booking | **PASS** |

**Packages / Experiences.** Page loads correctly on iPhone; tour cards display
correctly; image crops appropriate; filters work; multiple tours opened
successfully; no card text overlap or cut-off observed.

**Cape Coast gallery.** Gallery visible, three photographs present,
gallery/lightbox usable.

**Booking.** Cape Coast Tour → Send Inquiry → contact flow with Cape Coast
correctly preselected. Just Go Ghana's CTA likewise carries and preselects Just
Go Ghana. **No real inquiry was submitted** in either case.

## Responsive defects found and corrected

Two defects were found on the real device that no emulated check had caught.

**1. Back link hidden behind the floating navigation (Just Go Ghana).**
The hero used a 2rem top padding on mobile where the fixed nav pill ends around
70px down, so `← Back to All Experiences` sat underneath it. Investigating found
**the same defect at every width above 600px, including desktop** — at 1440px the
link rendered inside the pill, overlapping the logo and nav links, and failed a
hit test at all three points across it. The padding now matches the generated
tour pages at both widths rather than only on mobile.
Fixed in **`8fcab14`**. Owner verified on the real iPhone that the link is fully
visible and usable.

**2. Long Storyblok Departure value colliding with its label.**
Storyblok sends *"Pickup and drop-off from Accra or your hotel, unless a
different arrangement is requested."* where the previous source held
*"Accra, Ghana"*. The content was **not** shortened.

This took two commits because two separate components show a label beside a CMS
value, both are called Trip Details, and both sit on the same page:

- **`dd6ca8d`** — the meta line under the hero title (`.trip-meta-item`). The
  value was a bare text node, so CSS could not address it and a long value
  wrapped underneath its own label.
- **`4a8c950`** — the Trip Details card in the sidebar (`.highlight-row`), which
  is the component the owner reported. It used `justify-content: space-between`
  with no gap at all, so a long value ran straight into its label. **This is the
  final commit for the Trip Details fix.**

Both now use the same space-driven rule with no breakpoint: the label never
shrinks, the value takes the room left beside it, and when that is not enough
the whole value moves onto its own full-width line where it left-aligns and
reads as a sentence. Which happens is decided by available space, not by the
field — Duration, Group Size, Local Guide and Transport still sit right-aligned
against their labels because they fit.

Owner subsequently verified the corrected presentation.

A note on process: the first two attempts fixed the wrong thing. The first
addressed only the widths that had been reported and left desktop broken; the
second separated the label and value by 2.4px, which passed a test asking only
whether the text had wrapped while still reading as one run of text on a phone.
The regression test now measures **both** components and demands real clearance,
and stress-tests each row with a value longer than anything currently in the
CMS — checking one component proved nothing about the other, which is precisely
how the card survived two rounds of fixes.

## Final Preview deployment

| | |
| --- | --- |
| URL | `https://storyblok-phase-3e.people-and-places-tours.pages.dev` |
| Commit | **`4a8c950a`** |
| Built | 2026-09-05T15:04:29Z |

Verified once more:

- It is a `.pages.dev` **Preview** deployment, **not** `peopleplacesgh.com`.
- **Production Storyblok configuration is unchanged** — the live site's
  `health.json` still reports all 12 standard records as `disabled` and carries
  no `storyblokFallback` field.
- **No merge to `main`** — `git branch --merged main` does not list the branch.
- Latest responsive fixes are present in the deployed build.

## Final health state

Every expected value matched. No discrepancy.

| Field | Expected | Actual |
| --- | --- | --- |
| mode | production | **production** |
| enforced | true | **true** |
| systemic threshold | 7 | **7** |
| tourCount | 13 | **13** |
| applied | 10 | **10** |
| attempted | 13 | **13** |
| pending | accra-food, volta-community, just-go-ghana | **all three** |
| withdrawn | none | **`[]`** |
| auth/config failures | none | **`[]`** |
| transport failures | none | **`[]`** |

Record states: `{applied: 10, pending-not-migrated: 3}`.

## Regression results

Full suite run against the final code state on a production-authoritative build.
Every suite below actually executed.

| Suite | Result |
| --- | --- |
| `test:content` (12 suites) | pass |
| `test:responsive` (13 pages × 7 widths) | pass |
| `test:packages-grid` | pass |
| `test:price-ownership` | pass |
| `test:headers` | pass |
| `test:build` | pass |
| `test:layouts` | pass |
| `test:resilience` | pass |
| `test:smoke` | pass |
| `test:a11y-static` | pass |
| `test:pathway-spotlight` | pass |
| `test:visual` | **not run — baseline deliberately stale, see below** |

Verified on the live Preview, not only locally:

- **Packages filtering** — 13 cards (10 Storyblok, all complete); craft filter → 1;
  + Kumasi destination → 0 with the empty state; reset → 13; `?category=nature` → 8
- **Tour cards** — all 13 carry title, price and link
- **Tour detail pages / routes** — 13/13 return HTTP 200
- **Canonicals** — 13/13 on `https://peopleplacesgh.com`
- **Sitemap** — 22 URLs, zero Storyblok paths
- **CSP** — zero violations, zero failed image requests; header served by
  Cloudflare with both Storyblok asset hosts
- **Gallery/lightbox** — 3 images, opens on a Storyblok image, closes on Escape
- **Booking selection** — Cape Coast and Just Go Ghana both preselect correctly
  with the `#booking-flow` anchor
- **Published-delivery behaviour** — 10 authoritative records applied from
  `version=published`
- **Fallback behaviour** — 3 pending products on committed fallback
- **Withdrawal behaviour** — covered by the nine-scenario suite in `test:content`
  using test doubles; no live story was unpublished to test it
- **Token non-exposure** — neither token, and no `api.storyblok.com` reference,
  appears in any page, `script.js`, or `health.json` on the Preview

## Visual baseline

**Unchanged, and deliberately not refreshed.** 84 files, untouched since
2026-08-26.

Its cause is already fully investigated and explained earlier in this report:
rendering is deterministic across runs; the global shift comes from stylesheet
work since 26 August; tour-page deltas come from photography and gallery work;
a further +49/+117/+115px arrived when publishing brought Storyblok's richer
`starting_point` copy; and four page sets (`akosombo-tour`, `elmina-tour`,
`jamestown-tour`, `kente-tour`) are orphans for tours that no longer exist.

A refresh may happen after production approval and stabilisation.

## Asset-blocked products — statuses unchanged

| Product | Status |
| --- | --- |
| Accra After Dark Food Tour | `pending` / fallback |
| Volta Community Tour | `pending` / fallback |
| Just Go Ghana | `pending` / fallback |

No photography added, nothing published, no status changed.

## Editorial guidance for future gallery photography

The owner observed that **portrait 4:5 photography suits the existing gallery
presentation particularly well**.

Recorded as a future editorial and image-composition guideline only. It is
**not** a code or schema change, and gallery assets are **not** to be forced to
4:5 — the gallery continues to accept the layouts the CMS provides.

## Rollback status

Rehearsed and working. Removing `STORYBLOK_CONTENT_MODE` and the enable flags
returns the build to migration mode: all records `disabled`, 24 routes intact,
13 cards, and images reverting from Storyblok to Sanity. One variable and a
redeploy, roughly the length of a build. Tours fall back to Sanity rather than to
stale committed JSON, so nothing is lost in content freshness.

## Remaining non-blocking items

- Refreshing the visual baseline and deleting the 12 obsolete files
- Photography for the three asset-blocked products
- Removing Sanity, `tours.js`, the JSON fallbacks or the browser overlay — all
  deliberately retained until after a stable production period

## Final cutover assessment

**READY FOR CONTROLLED TOURS PRODUCTION CUTOVER**

The architecture has been exercised end to end on real Cloudflare infrastructure
with real published content, and the two defects real-device QA exposed are
fixed, deployed and owner-verified. Ten authoritative tours serve from the
Published Delivery API; three pending products hold their fallbacks; the
catalogue is 13; no tour is falsely withdrawn; there are no authentication or
configuration failures; CSP passes with all three image hosts; routes,
canonicals and the sitemap are unchanged; booking works for both a standard tour
and the multi-day trip; and rollback is one variable away and rehearsed.

The remaining items are editorial or cleanup, not architectural, and none of
them blocks a controlled cutover.

Nothing was deployed to `peopleplacesgh.com`, no production variable was
changed, no merge to `main` occurred, and no further content was published.
Phase 3H is closed and awaits explicit production-cutover authorization.
