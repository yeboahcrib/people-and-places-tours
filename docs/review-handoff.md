# Review Handoff

Context for an independent reviewer of this codebase. Written 7 August 2026,
after the site went live on its custom domain.

**Delete this file once the review is complete.** It describes a moment, not
the project.

---

## 1. What this is

The public website for People & Places Tours, a Ghana-based tour operator with
Ghanaian founders. Static HTML, CSS and JavaScript with **no frontend
framework**, assembled by a Node build script and deployed to Cloudflare Pages.

| | |
| --- | --- |
| Live at | `https://peopleplacesgh.com` |
| Hosting | Cloudflare Pages, deploys from `main` |
| Pages | 21 |
| Build scripts | 13 in `scripts/` |
| Test suites | 14 in `tests/` |
| Serverless | 2 Cloudflare Pages Functions in `functions/api/` |
| CMS | Sanity, configured and current, **not yet the live source** |

The site is **live and in use**. Enquiries from it reach a real inbox.

---

## 2. What is being asked of the review

A final independent check before the project is considered closed. Priorities,
in order:

1. **Correctness of the booking flow** — this is the only path on the site that
   costs money when it breaks. It has two independent routes (§5).
2. **Anything that fails silently.** Every significant bug found in this project
   presented as success: the form said "sent" and delivered nothing, the
   navigation simply stopped highlighting, an enquiry arrived with no address to
   reply to. Static analysis found none of them.
3. **Security of the Function and the content security policy.**
4. **Anything genuinely dead** that the cleanup in `30e726b` missed.

**The owner has closed the site to further change.** Report findings; do not
apply fixes unless asked. If something looks wrong, check §6 first — several
surprising things are deliberate.

---

## 3. How it is built

```
source (*.html, style.css, script.js, tours.js, src/content/*.json)
        │
        ├── scripts/build-static.mjs   assembles everything
        │      ├── shared nav and footer injected from src/partials/
        │      ├── homepage sections rendered from homepage-content.js
        │      ├── tour cards and the experience dropdown rendered from tours.js
        │      ├── booking copy and contact details injected into contact.html
        │      ├── SEO metadata, sitemap.xml and robots.txt derived per page
        │      ├── internal links rewritten to clean URLs
        │      └── CSS and JS references stamped with a content hash
        │
        └── dist/   ← what Cloudflare serves
```

Content comes from the committed files **or** from Sanity, decided by whether
`SANITY_STUDIO_PROJECT_ID` is set at build time. Both produce identical output
today; `npm run check:sanity` proves it.

Run `npm run build` for the full pipeline — it runs the syntax check and four
test suites before writing `dist/`, so a failure stops the deploy.

---

## 4. Verifying a change

```
npm run build            # syntax + headers + a11y + content, then builds
npm run test:smoke       # needs a server on :8081 (see note below)
npm run test:responsive
npm run test:resilience  # renders with JavaScript disabled
npm run test:visual      # 21 pages x 3 widths, pixel comparison
npm run test:inquiry     # the booking Function, in isolation
npm run test:health
npm run check:sanity     # is the CMS still in step with the files
```

`test:smoke` reads `BASE_URL`, defaulting to `http://127.0.0.1:8081`, and does
**not** start its own server. The other browser suites serve `dist/` themselves.

`test:visual` compares against baselines in `tests/visual-baseline/`, which are
gitignored and therefore local-only. Regenerate with
`npm run test:visual:baseline` before trusting a first run on a fresh checkout.
Tolerance is `0.00002` — effectively exact.

---

## 5. The booking flow, which is the part that matters

Two independent routes, and they behave differently on purpose.

**With JavaScript** — posts JSON to `/api/inquiry`, a Cloudflare Pages
Function. Verifies a Turnstile token, checks the origin, validates, then sends
through Resend. Returns a guest-facing reference like `PP-K7M2QX`.

**Without JavaScript** — the form's native action posts to FormSubmit, a third
party, which redirects to `/thanks`.

The fallback exists because **Turnstile cannot run without JavaScript**, so
those visitors cannot use the Function at all. It is not redundancy; it is the
only route available to them.

Which route is used is decided **at build time** and written into
`data-inquiry-mode` on the form. See §6.

Both routes have been tested end to end against the live domain, including the
selected tour arriving in the email.

---

## 6. Deliberate decisions that look like bugs

Please read this before filing anything in these areas.

**Turnstile runs before the honeypot, not after.** Reversing it saves a
verification call on obvious bots, but browsers autofill hidden fields, so an
unconditional honeypot check discards genuine enquiries — silently, with the
visitor seeing success. `functions/api/inquiry.js`.

**Two identifiers per enquiry.** The Resend idempotency key is a full UUID; the
guest reference is short and omits `0`, `O`, `1`, `I` and `L` because it is read
aloud over the phone. They have opposite requirements and must not be merged.

**`novalidate` is set by JavaScript, not written in the markup.** In the markup
it would also apply when the script fails to load, leaving nothing validating.

**`data-inquiry-mode` is decided by the build, not the runtime.** A hostname
test cannot distinguish a custom domain with a Function from one without.
Getting this wrong routes enquiries to the fallback with no error raised — it
happened once, on the day the domain went live.

**Some CSS classes are assembled at runtime and look unused.**
`cultural-motif--*`, `reveal-delay-*`, `pathway-delay-*`, `testimonial-delay-*`
and `why-row-delay-*` are built by template literals and arithmetic such as
`${index * 2 + 3}`. A static search reports them as dead. They are not.

**Three hosts in `_headers` appear nowhere in the markup and must stay:**
`challenges.cloudflare.com` (Turnstile — needs script-src, frame-src *and*
connect-src), `cdn.sanity.io` (CMS images), `*.cloudflareinsights.com`
(analytics, injected by Cloudflare whether or not the policy allows it).

**CSS and JS URLs carry a content hash.** Cloudflare caches these for four
hours and the `_headers` rule intended to shorten it is not applied — responses
carry `max-age=14400` regardless. Without the hash, a returning visitor runs
stale JavaScript against new HTML after a deploy.

**Internal links carry no `.html`.** Cloudflare serves `/about` and
308-redirects `/about.html`. `pageKey()` in `script.js` normalises both forms
because the page identity check must survive either.

**`hrefForPage` is named that way to avoid a collision** with a local
`const pageHref` in the navigation block, which would place every call in that
constant's temporal dead zone.

**Sanity: setting a field to `undefined` does not remove it.** It has to be
unset explicitly, or a stale value survives. See `studio/scripts/sync-tours.ts`.

**The build fails when Sanity is configured but unreachable.** Deliberate — a
failed deploy leaves the previous version serving, which is better than
publishing stale contact details.

---

## 7. Known and accepted

- **A 16th tour would 404.** Detail pages are 15 hand-written files; a tour
  added in Sanity appears in the grid and links to a page that does not exist.
  Known, and the reason the CMS is not yet the live content source.
- **Sanity is not switched on.** `SANITY_STUDIO_PROJECT_ID` is deliberately
  absent from the Cloudflare build. Everything is verified and ready.
- **All imagery is licensed placeholder stock** until the founders' own shoot.
  Intentional — see `docs/phase-2c-photography-direction.md`. Not a defect, and
  no AI-generated imagery is permitted even temporarily.
- **The hero is a still image**, not video. The previous video was hotlinked
  from a third party with no confirmed usage rights.
- **The logo wordmark is live text in a licensed font**, so it substitutes a
  different typeface on machines without it — including on the live site. A
  branding issue, not a code one. Documented in
  `docs/brand-identity-and-communications.md`.
- Minor, already logged: a missing hover lift on Experiences cards, and the
  phrase "perfect blend" on `shai-hills-tour.html`.

---

## 8. Traps worth knowing

**Regex against markup broke this site three times.** A non-greedy match
truncated a container, a `</div>` pattern closed the wrong element in
production, and a selector matched the tail of a longer one. Every remaining
build-time rewrite is deliberately **attribute-scoped** so it cannot disturb
element structure, and `tests/accessibility-static.mjs` walks the tag stack and
fails the build on mis-nesting.

**Comments containing element names in angle brackets break two things** — the
markup checker and the footer replacement both scan raw HTML. `thanks.html`
carries a note about this.

**One health probe is not proof of a deploy.** Cloudflare keeps the previous
deployment serving during rollout, so `/api/health` flips between revisions for
a few minutes. Require several consecutive agreeing probes.

**Do not run `sanity debug --secrets`.** It prints the CLI auth token to
stdout. `npx sanity projects list` confirms authentication without exposing
anything.

**The project path contains `&`.** Unquoted shell paths fail confusingly.

---

## 9. Where to look first

| Concern | File |
| --- | --- |
| Booking submission, spam, email | `functions/api/inquiry.js` |
| Form behaviour, navigation, page identity | `script.js` |
| Build pipeline and all rewrites | `scripts/build-static.mjs` |
| SEO, canonical URLs, sitemap | `scripts/render-meta.mjs` |
| Security headers and CSP | `_headers` |
| No-JavaScript behaviour | `tests/resilient-rendering.js` |
| Architecture and deployment | `docs/hosting-and-delivery-architecture.md` |

`CLAUDE.md` holds contributor notes and is a reasonable second read after this
file.

---

## 10. What would be most useful

Findings this project would genuinely benefit from:

- A path where the booking form reports success without delivering
- A way the Function can be abused: origin handling, rate limiting, payload
  size, header injection through form fields
- Anything in the CSP that is too permissive, or missing and silently failing
- A page that breaks with JavaScript disabled in a way `test:resilience` misses
- Accessibility failures the static checks do not cover — focus order, keyboard
  traps, screen-reader labelling
- Genuinely dead code the cleanup missed, **checked against §6 first**

Least useful: style preferences, framework suggestions, or refactors of working
code. The site is finished and closed; the goal is confidence in what exists.
