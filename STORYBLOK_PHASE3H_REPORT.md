# Storyblok Phase 3H — production-like staging rehearsal

**Two STOP conditions were reached.** Everything not blocked by them was
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
