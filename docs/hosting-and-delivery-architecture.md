# Hosting and Delivery Architecture

**Status:** Active architecture record
**Verified:** August 17, 2026 (previous verification August 2, 2026, superseded)

## Current production state

The public website is hosted on Cloudflare Pages:

- Repository: `yeboahcrib/people-and-places-tours`
- Public URL: `https://peopleplacesgh.com`
- Source branch: `main`, via Cloudflare's GitHub integration
- Build command: `npm run build`
- Publish directory: `dist/`
- `_headers` applied: yes
- Pages Functions active: yes (`/api/inquiry`, `/api/health`)
- HTTPS: enforced
- GitHub Pages: switched off; `https://yeboahcrib.github.io/people-and-places-tours/`
  returns 404

Cloudflare builds the site itself. Merging to `main` is therefore the
deployment action — there is no separate publish step. Pushing any other branch
produces a `*.pages.dev` preview build, which is the intended place to verify a
change before merging.

### How this was verified

Re-checkable from outside the Cloudflare dashboard, which matters because the
previous version of this document asserted a host that had already changed:

- `GET /api/health` returns the deployed commit SHA. On August 17, 2026 it
  returned `05bb776`, the merge of PR #1, a commit present only on `main`.
- Production `/contact` carries `data-inquiry-mode="cloudflare"`.
  `scripts/render-booking.mjs` emits that value only when `CF_PAGES` is set,
  which Cloudflare sets during its own builds and nothing else does. A locally
  built `dist/` uploaded by hand would read `fallback`, so this is positive
  evidence that Cloudflare runs the build.
- Production response headers carry the full `_headers` policy — CSP, HSTS,
  `frame-ancestors 'none'` — which a static branch host cannot apply.

### Remaining unknown

Whether preview deployments are enabled for non-production branches cannot be
observed from outside; confirm in the Cloudflare dashboard. Cloudflare rate
limiting on `POST /api/inquiry` is likewise dashboard-only and is still an open
security sign-off blocker.

## Approved target state

Cloudflare Pages hosting is now in place. Sanity remains the approved editorial
CMS and is **not yet the live content source**.

```text
Sanity CMS
   │ published editorial content
   ▼
Static site build
   ├── shared layouts and components
   ├── generated tour and marketing pages
   └── validated public output in dist/
          │
          ▼
Cloudflare Pages CDN
   ├── static HTML, CSS, JavaScript and assets
   └── Pages Function for private inquiry processing
```

The site remains statically delivered. Sanity changes trigger a new build;
visitors receive generated HTML from Cloudflare's CDN rather than depending on
a live Sanity request for every page view.

## Responsibility boundaries

### Sanity

Sanity owns public editorial content such as tours, homepage sections, founder
profiles, reviews, trust facts, policies, navigation, and approved media.

Sanity must not hold:

- Customer inquiries
- Private contact details collected through the inquiry form
- Payment records or card information
- Future reservation and availability state

### Static frontend

The frontend owns presentation, accessible interactions, responsive behavior,
SEO output, and resilient fallback rendering. Essential public content should
be present in generated HTML rather than requiring browser JavaScript to create
the page from an empty mount.

### Inquiry service

Private inquiries pass through a narrowly scoped Cloudflare Pages Function. It
validates input, enforces size limits, applies bot controls, sends operational
notifications, and keeps private inquiry data out of Sanity.

The FormSubmit fallback remains in the committed source and stays operational
for any build that cannot run a Function. This is not vestigial: it is what a
non-Cloudflare build degrades to, and it must not be removed on the assumption
that every build has a Function behind it.

## Build boundary

`npm run build` creates `dist/` through an explicit allow-list. Public output
includes root HTML/CSS/browser JavaScript, `assets/`, `.well-known/`, `_headers`,
`robots.txt`, and `sitemap.xml`.

It excludes `docs/`, `tests/`, `studio/`, dependencies, Git metadata, package
manifests, and contributor instructions. This is a security and encapsulation
boundary: new internal directories are private by default.

## Host-specific behavior

| Capability | Cloudflare Pages (live) | GitHub Pages (retired) |
| --- | --- | --- |
| Static CDN | Yes | Yes |
| Publish input | `dist/` | Root of `main` |
| Runs `npm run build` | Yes | No |
| Applies `_headers` | Yes | No |
| Server-side form code | Pages Functions | No |
| Sanity build webhook | Not configured | Not configured |
| HTTPS | Enforced | Enforced |

The GitHub Pages column is kept as the record of what was given up at cutover,
not as an available fallback: Pages is switched off, and re-enabling it would
serve a host that cannot run the inquiry Function or apply `_headers`.

The Cloudflare `_headers` policy includes HTTPS enforcement, MIME-sniffing
protection, clickjacking prevention, a restricted Permissions Policy, opener
isolation, and a Content Security Policy. Inline JavaScript and HTML event
handlers are prohibited. Inline CSS remains temporarily permitted because the
current hand-written pages contain extensive `style` attributes; removing that
exception is part of the later shared-component/style encapsulation phase.

## Migration sequence

Steps 1–5, 7 and 8 are complete; the custom domain cutover to
`https://peopleplacesgh.com` has happened and Cloudflare is the live host.

1. ~~Keep the GitHub Pages site operational while audit fixes are made.~~ Done;
   Pages has since been switched off.
2. ~~Harden the inquiry experience without removing its working static-host
   fallback.~~ Done; the fallback is retained by build-time mode selection.
3. ~~Complete security, accessibility, responsive, rendering, and monitoring
   improvements.~~ Done, with the open items tracked in the security audit.
4. ~~Introduce shared templates/components and generate static pages.~~ Done for
   templates and build-time rendering; Sanity is not yet the live source.
5. ~~Configure Cloudflare Pages with `npm run build` and output directory
   `dist`.~~ Done.
6. Add a Sanity publish webhook that triggers a Cloudflare build. **Outstanding**
   — required only when Sanity becomes the live content source.
7. ~~Add and verify the Cloudflare inquiry function, notification delivery, and
   privacy disclosures.~~ Done; `/api/health` reports delivery and bot
   protection configured. **Rate limiting remains outstanding.**
8. ~~Validate preview and production, then switch the public domain
   deliberately.~~ Done.
9. Rollback capability: no longer a GitHub Pages revert. Roll back by
   redeploying a previous Cloudflare build or reverting the commit on `main`.

Hosted payments or a separate transactional booking service are a later phase.
They do not change the decision to keep public marketing and tour pages static.

### Shared-component migration status

The build now replaces each page's legacy navigation and footer copies with the
canonical `src/partials/navigation.html` and `src/partials/footer.html`
components. These are build-time includes, not
browser-side web components: navigation is present in the delivered HTML even
when JavaScript is unavailable. Active-page state is applied consistently by
`script.js`, including mapping tour-detail pages back to Packages.

Legacy page-level shell markup remains in the root HTML. The original reason —
that GitHub Pages published those source files directly — no longer applies now
that `dist/` is the production artifact, so this markup is a genuine cleanup
opportunity rather than a constraint. Removing it is safe only for pages whose
shell is fully build-generated; verify with `npm run test:resilience` and
`npm run test:visual` before deleting any of it.

The build also evaluates the existing homepage renderer in an isolated build
context and injects the resulting ten sections into `dist/index.html`. Tour
catalogue cards are generated into both the homepage and Packages page. Browser
JavaScript remains as a transition-time enhancement for filters and dynamic
state, but essential tour discovery no longer depends on it. A dedicated
JavaScript-disabled browser test protects this progressive-rendering contract.

Tour catalogue facts now pass through `scripts/tour-source.mjs`. With no Sanity
project configured it uses the validated local catalogue. With Sanity enabled,
active tour facts and the 3–5 item featured collection come from the CMS while
image URLs and legacy detail-page filenames remain local and are joined by
slug. This is an intentional transition boundary until the imagery/detail-page
work begins. A configured but unavailable or incomplete CMS fails the build so
stale prices and operational facts cannot be published silently.

Homepage primary copy now follows the same contract through
`scripts/homepage-source.mjs`. Sanity owns each section's eyebrow, headline,
body, order, and referenced calls to action. The richer local structures
(founder cards, pathways, reviews, planning steps, and current media) remain as
presentation data until their dedicated CMS models and imagery are approved.
All ten named sections must exist exactly once and in the approved order when
Sanity is enabled. Browser JavaScript does not overwrite the generated CMS
markup; it renders the local fallback only when the legacy source page is empty.

## Inquiry transition implementation

The repository contains `functions/api/inquiry.js`, which is live and serving
`POST /api/inquiry` in production.

`contact.html` in the repository still carries `data-inquiry-mode="fallback"`
alongside its FormSubmit action, and that is correct — the value is rewritten at
build time. `scripts/render-booking.mjs` sets it to `cloudflare` when `CF_PAGES`
is present and leaves it as `fallback` otherwise, so the host decides, not the
browser. A runtime hostname test was rejected deliberately: it cannot tell a
custom domain that has a Function from one that does not, and guessing wrong
routes real enquiries to the fallback with no error raised. Do not "fix" the
committed `fallback` value to `cloudflare`; that would break every non-Cloudflare
build, including local ones.

The function uses bounded server-side validation, a honeypot, same-origin or
allow-listed origin checks, non-cacheable responses, provider idempotency, and
Resend for email delivery. Secrets belong in Cloudflare environment bindings
and must never be committed. Cloudflare rate limiting and Turnstile remain
cutover gates; the honeypot alone is not sufficient protection for a public
production form.

## Availability signals

Each production build creates `dist/health.json` containing the build status,
revision, and timestamp. Cloudflare also exposes `/api/health` for the inquiry
service. These signals remain separate so an inquiry configuration failure does
not incorrectly make the static travel site unhealthy. Monitoring and response
procedures are defined in `docs/availability-and-monitoring-runbook.md`.

## Cutover checklist

Settings to enter when creating the Cloudflare Pages project. Framework preset
is **None** — this is a plain static build.

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Output directory | `dist` |
| Node version | read from `.nvmrc` (22) |

`.nvmrc` exists so the Node version is version-controlled rather than typed
into a dashboard. Cloudflare's default is older than this build needs, and the
failure it produces is a confusing syntax error rather than a clear message.

**Runtime variables** — used by the inquiry Function when a visitor submits:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Sends the notification email. Secret |
| `INQUIRY_TO_EMAIL` | Where enquiries arrive |
| `INQUIRY_FROM_EMAIL` | Must be on a Resend-verified domain |
| `ALLOWED_ORIGINS` | Origins permitted to post. Include the live domain and any preview host in use |
| `TURNSTILE_SECRET_KEY` | Server half of the spam check. Secret |

**Build variables** — read while the site is being generated:

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Canonical tags, sitemap, and the no-JS form redirect. Defaults to the live domain; **set it explicitly on preview environments** or previews will emit canonical tags pointing at production |
| `TURNSTILE_SITE_KEY` | Public half of the spam check |
| `SANITY_STUDIO_PROJECT_ID` | Only once the CMS goes live. Absent means the committed content is used |

### Order of operations

**This checklist was executed at cutover and is retained as the launch record.**
Steps 1–5 are complete: the domain is pointed, the Function is live, and
`/api/health` reports delivery and bot protection configured. Re-run it only if
the site is rebuilt on a new Cloudflare project or moved to another host.

1. Deploy without `SANITY_STUDIO_PROJECT_ID` first. This isolates hosting
   problems from CMS problems; adding both at once means a failure could be
   either.
2. Start Resend domain verification early — it waits on DNS propagation and is
   the most likely thing to hold up launch.
3. Submit a real enquiry on the `.pages.dev` URL before pointing the domain. At
   the time this was written the Function had never executed, because the
   previous host could not run it, making this its first real test and the one
   step with no prior evidence behind it.
4. Test with JavaScript disabled too. That path goes to FormSubmit rather than
   the Function, and it is the only way to check the fallback still works.
5. Point the domain last.

### Why the no-JS form still uses a third party

The Function requires a Turnstile token, and Turnstile needs JavaScript to
produce one. A visitor without JavaScript therefore cannot use the Function at
all — a submission would be rejected as unverified. FormSubmit remains their
fallback for that reason, not through inertia. Removing it would silently drop
those enquiries.
