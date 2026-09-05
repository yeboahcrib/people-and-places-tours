# Storyblok Phase 3G — authorized remediation

Four items were authorized: the CSP gap (F1), the packages re-render (F2), the
unbounded Storyblok request (F3), and a stated fallback policy. Nothing else was
touched. No deployment, no publication, no production credential, no Cloudflare
change, and no further migration work was performed.

Seven files changed and four were added. Every one maps to one of the four
items or to a test supporting it.

---

## F1 — the CSP did not allow the hosts the adapter accepts

The tour adapter accepts images from `a.storyblok.com` and `a2.storyblok.com`,
but `img-src` listed neither. Any Storyblok photograph that reached a page would
have been blocked by the browser with no visible error — the card would simply
show nothing, and the build would have reported success.

**Change.** One line of `_headers`, adding both hosts to `img-src`.

**Why it cannot drift again.** `STORYBLOK_EU_ASSET_HOSTS` is now exported from
the adapter, and `tests/security-headers.mjs` asserts the CSP allows every host
in that set. The list the code accepts and the list the CSP permits are the same
list; adding a host to one without the other fails the test.

Mutation-verified: removing `a2.storyblok.com` from the header fails with
*"img-src must allow the Storyblok asset host a2.storyblok.com, which the tour
adapter accepts"*.

---

## F2 — the browser was discarding the CMS content the build had just rendered

`renderPackageTours()` rebuilt every card from `window.PEOPLE_PLACES_TOURS`
after each page load, replacing the server-rendered grid wholesale.

**Measured, on a local build with CMS credentials:**

| | cards | CMS photographs | committed photographs |
| --- | --- | --- | --- |
| Build output (JavaScript blocked) | 13 | **10** | 0 |
| After `script.js` ran (before the fix) | 13 | **0** | 10 |
| After `script.js` ran (after the fix) | 13 | **10** | 0 |

Ten CMS photographs were served in the HTML and discarded about a second later.
The same override applied to titles, prices and badges; those agreed only
because `tours.js` was kept in step by hand, which is a convention, not a
guarantee.

**Root fix, not a patch.** The rebuild is gone. The build renders the
authoritative cards and the browser filters the cards that are already there.
This was possible with no markup change because every server-rendered card
already carried what the filter reads — `data-tour-slug`, `data-destination`
and `data-categories` on all 13, plus the stretched link and reveal-delay
classes. The rebuild was redundant, not load-bearing.

Removed: `renderPackageTours()` and the five helpers used only inside it
(`delayClass`, `clockIcon`, `peopleIcon`, `pinIcon`, `cardImageSizes`), each
confirmed to have exactly one caller.

**What was deliberately kept.** `window.PEOPLE_PLACES_TOURS`, `tours.js` and the
Storyblok browser overlay all stay. Tracing the remaining consumers found three
that still need the catalogue in the browser:

- `renderCommandPaletteTours()` — the search palette's tour list
- `renderContactTourOptions()` — the contact form's tour select
- `hydrateTourDetailFromCatalog()` — booking-card prices on tour pages

The overlay exists so those see the same validated records as the static HTML,
and the comment in `scripts/build-static.mjs` that described the old re-render
has been corrected to say so.

**One thing found and deliberately not fixed.** `hydrateTourDetailFromCatalog()`
overwrites booking-card prices from the same catalogue — the same failure class
as F2. It is currently inert: its selector (`.booking-card .big-price, .booking-card .price`)
matches nothing on the built tour pages, verified across three of them. It is
latent rather than active, and fixing it is outside the authorized scope. It is
recorded here so the next phase can decide.

**Regression test.** `tests/packages-grid.js` (`npm run test:packages-grid`)
loads the page twice, once with `script.js` blocked, and asserts card count and
order, per-card image/title/price/badge/href parity, CMS-photograph count
parity, committed-fallback parity, category filtering, destination filtering,
the empty state, reset, and a `?category=` deep link. It passes both with CMS
credentials (10 CMS + 3 committed) and without (13 committed), so it does not
depend on a credential to be meaningful.

Mutation-verified: reintroducing a grid rebuild fails on *"card order must
survive initialization"*.

---

## F3 — a Storyblok request had no timeout and no retry

`loadOneStory()` awaited `fetch` with no `AbortSignal`. A hung connection would
stall the build indefinitely, and a single dropped packet dropped that tour to
its fallback with no second attempt.

**Change.** Each attempt is bounded at 10s, covering the body read as well as
the response, and one retry is allowed after 400ms.

**What is retried, and what is not.** A retry is only worth making when a second
attempt could plausibly give a different answer:

| Outcome | Retried | Reason |
| --- | --- | --- |
| Network error, dropped connection | yes | transient by nature |
| Timeout (request or body) | yes | the host may just be slow |
| 429, 408, 425, 5xx | yes | throttling or a server-side blip |
| 404 | **no** | the story is not there; asking again will not create it |
| 401, 403, 400 | **no** | the credential or request is wrong, and retrying only delays the fallback |
| Malformed JSON, 200 with no story | **no** | a bad answer, not a lost one |

An unreachable host still surfaces to the caller as a throw after the retry is
exhausted, so the per-record warning that has always been emitted still fires.
That was caught by an existing test during this work — the first version of the
fix swallowed the exception and silently lost the warning.

**Tests.** Nine scenarios in `tests/tour-source.mjs`: first-attempt success
(exactly one request), network failure then success, hang then success, a
permanently hung host terminating rather than stalling, each transient status
retried exactly once and then given up on, each permanent status not retried,
malformed JSON, a story-less 200, and per-record isolation — one unreachable
tour retries and falls back alone while its neighbour applies.

Mutation-verified four ways: removing the retry, making 404 transient, making a
malformed body retryable, and making 401 transient are each caught.

---

## Fallback policy

Per-record isolation is right for one bad tour and wrong for thirteen. If
Storyblok is unreachable or a token is rejected, every record falls back the
same quiet way and the build succeeds with a site made entirely of committed
content. It looks fine; it is however stale. Nothing previously distinguished
the two cases.

`scripts/storyblok-fallback-policy.mjs` states the policy.

**Two modes, one active.**

| | Mode A — migration | Mode B — production |
| --- | --- | --- |
| Status | **active**, runs today | **defined, not activated** |
| Credential | `STORYBLOK_PREVIEW_API_TOKEN` | `STORYBLOK_PUBLIC_API_TOKEN` |
| Content version | `draft` | `published` |
| A story that is absent | has not been written yet | has been withdrawn |

`resolveStoryblokMode()` defaults to the migration mode and throws if asked for
production delivery, naming what would have to be true first. It cannot be
activated by accident, and activating it stays a separate decision from
finishing the migration. No production token was created and no Cloudflare
variable was changed.

**Credential separation.** `storyblokTokenFor(mode, env)` reads only the
variable its own mode is entitled to. A Preview token cannot satisfy production
delivery, which is how draft content would otherwise reach the public site.

**Intentional hide must not resurrect.** This is the asymmetry between the two
modes, and the reason Mode B is written down now rather than later. Under draft
delivery every story is returned whether published or not, so absence means
"not migrated yet" and the committed fallback is correct. Under published
delivery, absence is an editor unpublishing a tour — and falling back would take
a tour someone deliberately withdrew and put it back on the site from the
committed copy. The policy classifies that as a withdrawal, not a gap to fill.

**Failure thresholds, over 13 products** (12 standard tours + 1 multi-day trip):

- `ok` — every attempted record applied
- `warn` — some records fell back; this is isolation working, and the build
  continues with a message naming which records and why
- `fail` — at least half the attempted records failed at the **transport**
  layer (floor of 2). That is one outage or one rejected credential, not
  thirteen separate problems, and the build now refuses rather than shipping a
  fully committed site without saying so.

Content failures are never systemic: thirteen tours failing the content gate is
thirteen editorial problems, each already isolated and each with its own fix.
Stopping the build for those would help nobody.

The build enforces this in `scripts/build-static.mjs`, across both gates
together. `tests/storyblok-fallback-policy.mjs` covers the modes, credential
separation, each classification, the threshold at and either side of the
boundary, the migration/production asymmetry, and that no policy message can
quote a token.

---

## Regression results

| Suite | Result |
| --- | --- |
| `test:content` (11 suites, including the two new ones) | pass |
| `test:headers` | pass |
| `test:build` | pass |
| `test:layouts` | pass |
| `test:packages-grid` (new) | pass |
| `test:resilience` | pass |
| `test:smoke` | pass |
| `test:responsive` | pass |
| `test:a11y-static` | pass |
| `test:pathway-spotlight` | pass |
| `test:visual` | **could not verify — see below** |

**Responsive check.** `packages.html` at 375 / 430 / 768 / 1024 / 1440: no
horizontal overflow at any width, 13 cards and all 10 CMS photographs present at
every width, category filtering working at every width. The short elements a tap
audit flags are `tour-card-stretched-link`, the pattern `CLAUDE.md` explicitly
approves, plus a pre-existing 160×29 book button at 1024px that this work did
not touch.

**The visual suite cannot currently see this change, and its baseline was not
re-recorded.** All 72 snapshots (24 pages at 375 / 768 / 1440) differ from the stored baseline
in *height*, from +44px on policy pages to +1502px on the Cape Coast tour. The
comparison reports a size change and never reaches a pixel comparison. To establish whether
Phase 3G caused this, the suite was run against the working tree with all Phase
3G changes stashed: the result was the same 72 snapshots (24 pages at three
widths), byte-identical to the post-3G run. **The staleness predates this work and is unrelated to it.**
Re-recording the baseline would have forced a pass while hiding whatever real
drift is behind those snapshots, so it was left alone for a phase that can
examine it properly.

**Credential safety.** No token value appears in any source file, and the built
output contains no Storyblok token and no API endpoint — only the two asset
hosts in the CSP and the diagnostic source names already present in
`health.json`.

---

## Explicitly not done

As instructed: F5, F7, F8, F9 and F10 were left alone; Sanity was not removed;
the JSON fallback and `tours.js` were not removed; the browser overlay was not
removed; the manifest was not cleaned up; the homepage, About, Contact, policy
pages and navigation were not migrated; nothing was published to Storyblok; no
Cloudflare configuration was altered; and nothing was deployed.

Two pre-existing dead identifiers in `script.js` (`arrowIcon`, `bySlug`) were
found and deliberately left in place — they were dead before this work and
removing them is not one of the four authorized items.

## Still open, outside this phase

- `hydrateTourDetailFromCatalog()` — latent, same failure class as F2
- The stale visual baseline across all 24 pages
- The three asset-blocked products remain asset-blocked and not production-ready
- Founder photographs; the leaked Sanity token still wants rotating
