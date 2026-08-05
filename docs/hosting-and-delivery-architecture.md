# Hosting and Delivery Architecture

**Status:** Active architecture record
**Verified:** August 2, 2026

## Current production state

The public website is hosted on GitHub Pages:

- Repository: `yeboahcrib/people-and-places-tours`
- Public URL: `https://yeboahcrib.github.io/people-and-places-tours/`
- Pages status: built and public
- Source branch: `main`
- Source path: repository root (`/`)
- Build type: legacy branch deployment
- HTTPS: enforced
- Custom domain: none

The active development work is on `codex/travel-site-starter`. GitHub Pages
does not publish that branch, so its changes are not public until they are
reviewed and reach `main`.

GitHub Pages currently serves the repository root directly. It does not run
`npm run build`, does not publish `dist/`, and does not apply the repository's
Cloudflare-style `_headers` file.

## Approved target state

Cloudflare Pages is the production hosting target. Sanity is the approved
editorial CMS.

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

During the Cloudflare phase, private inquiries should pass through a narrowly
scoped Cloudflare Pages Function. That function will validate input, enforce
size limits, apply bot/rate controls, send operational notifications, and avoid
placing private inquiry data in Sanity.

Until that function is deployed, the current GitHub Pages inquiry mechanism
must remain operational. Migration must not silently replace it with an endpoint
GitHub Pages cannot execute.

## Build boundary

`npm run build` creates `dist/` through an explicit allow-list. Public output
includes root HTML/CSS/browser JavaScript, `assets/`, `.well-known/`, `_headers`,
`robots.txt`, and `sitemap.xml`.

It excludes `docs/`, `tests/`, `studio/`, dependencies, Git metadata, package
manifests, and contributor instructions. This is a security and encapsulation
boundary: new internal directories are private by default.

## Host-specific behavior

| Capability | GitHub Pages now | Cloudflare Pages target |
| --- | --- | --- |
| Static CDN | Yes | Yes |
| Current publish input | Root of `main` | `dist/` |
| Runs `npm run build` | No | Yes |
| Applies `_headers` | No | Yes |
| Server-side form code | No | Pages Functions |
| Sanity build webhook | Not configured | Planned |
| HTTPS | Enforced | Required at cutover |

The Cloudflare `_headers` policy includes HTTPS enforcement, MIME-sniffing
protection, clickjacking prevention, a restricted Permissions Policy, opener
isolation, and a Content Security Policy. Inline JavaScript and HTML event
handlers are prohibited. Inline CSS remains temporarily permitted because the
current hand-written pages contain extensive `style` attributes; removing that
exception is part of the later shared-component/style encapsulation phase.

## Migration sequence

1. Keep the current GitHub Pages site operational while audit fixes are made.
2. Harden the inquiry experience without removing its working static-host
   fallback.
3. Complete security, accessibility, responsive, rendering, and monitoring
   improvements.
4. Introduce shared templates/components and generate static pages from Sanity.
5. Configure Cloudflare Pages with `npm run build` and output directory `dist`.
6. Add a Sanity publish webhook that triggers a Cloudflare build.
7. Add and verify the Cloudflare inquiry function, notification delivery,
   rate controls, and privacy disclosures.
8. Validate preview and production, then switch the public domain deliberately.
9. Retain rollback capability until the Cloudflare deployment is proven stable.

Hosted payments or a separate transactional booking service are a later phase.
They do not change the decision to keep public marketing and tour pages static.

### Shared-component migration status

The build now replaces each page's legacy navigation and footer copies with the
canonical `src/partials/navigation.html` and `src/partials/footer.html`
components. These are build-time includes, not
browser-side web components: navigation is present in the delivered HTML even
when JavaScript is unavailable. Active-page state is applied consistently by
`script.js`, including mapping tour-detail pages back to Packages.

Legacy page-level shell markup remains temporarily in the root HTML because the
current GitHub Pages deployment still publishes those source files directly.
It can be removed when Cloudflare `dist/` becomes the production artifact.

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

The repository contains `functions/api/inquiry.js` for Cloudflare Pages. It is
deliberately dormant on the current GitHub Pages host. `contact.html` retains
its working FormSubmit action and identifies that state with
`data-inquiry-mode="fallback"`. Cloudflare `*.pages.dev` previews select the
same-origin function automatically; a future custom domain requires switching
the form mode only after email credentials, origin controls, notifications,
rate limiting, and end-to-end delivery have been verified.

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
