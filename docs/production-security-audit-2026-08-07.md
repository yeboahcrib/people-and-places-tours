# People & Places — Production Security & Resilience Audit

**Audit date:** 7 August 2026  
**Production:** `https://peopleplacesgh.com`  
**Scope:** static site, Cloudflare Pages/Functions, inquiry flows, Sanity build integration, dependencies, headers, and controlled read-only production validation.

## 1. Executive summary

The public site has a deliberately small attack surface and a strong baseline: static delivery, an allow-listed build output, a same-origin JSON inquiry endpoint, Turnstile, bounded request bodies, escaped email and CMS output, a restrictive CSP, no public authentication/database/upload surface, and a working JavaScript-free fallback.

The audit fixed confirmed weaknesses in the inquiry Function: malformed JSON shapes causing uncontrolled failures, permissive/truncating field handling, forged structured booking values, browser-authoritative tour names, incomplete Turnstile context validation, unbounded provider waits, and duplicate delivery risk after an uncertain response. Regression tests cover each fix.

Production currently reports delivery and Turnstile configured and serves the expected security headers. The fixes in this audit were local when written and have since been deployed — see the status update in §10. Cloudflare rate limiting cannot be proven from HTTP responses and must be confirmed in the dashboard. The separate Sanity Studio dependency tree reports one critical, ten high, and eleven moderate advisories; it is not shipped to the public site, but must be upgraded and retested before Sanity becomes an active production workflow.

**Current decision: NOT READY FOR PRODUCTION SECURITY SIGN-OFF.** See §10 for the three blockers.

## 2. Attack-surface map

### Public routes

- Marketing/catalogue: `/`, `/about`, `/packages`, `/contact`, `/thanks`, and `/404`.
- Experience detail pages (15): `/just-go-ghana`, `/accra-city-tour`, `/jamestown-tour`, `/accra-food-tour`, `/cape-coast-tour`, `/elmina-tour`, `/kumasi-tour`, `/kente-tour`, `/ada-tour`, `/quad-bike-tour`, `/volta-tour`, `/shai-hills-tour`, `/aburi-tour`, `/akosombo-tour`, `/batik-workshop`.
- `.html` variants redirect to clean URLs with HTTP 308.

### Forms and state-changing paths

- One inquiry form on `/contact`.
  - JavaScript path: JSON `POST /api/inquiry` → Turnstile Siteverify → Resend.
  - JavaScript-free path: native POST to FormSubmit → fixed `/thanks` redirect.
- No login, account, checkout, payment, newsletter, webhook receiver, or public upload form.

### Server endpoints

- `POST /api/inquiry`: only public state-changing first-party endpoint.
- `GET|HEAD /api/health`: configuration/readiness signal; no synthetic email.
- Other methods return 405.

### User-controlled inputs

- Form: first name, last name, email, phone, tour slug, group-size choice, travel date, message, honeypots, Turnstile token, and an opaque retry UUID.
- Query strings:
  - `/contact?tour=` — accepted only when it matches a rendered tour option.
  - `/packages?category=`, `?experience=`, `?destination=` — allow-listed client-side filters.
- No URL-derived HTML interpolation, file paths, commands, GROQ fragments, redirect destinations, prices, or payment values.

### Rendering boundaries

- Browser catalogue/homepage templates use HTML escaping for data-derived values.
- Build-time Sanity/local renderers escape text and attributes and validate link/image shapes.
- Inquiry HTML email escapes every guest-controlled value.
- Remaining `innerHTML` uses are either escaped structured data or static templates; no confirmed DOM-XSS sink was found.

### Data stores and CMS

- No SQL or application database.
- Sanity Content Lake is read at build time through fixed GROQ queries; user input is not concatenated into GROQ.
- Dataset `production` is public, consistent with an unauthenticated build reading public editorial content.
- Sanity CORS currently lists only `http://localhost:3333`.
- No write token was found in tracked source, build output, or targeted Git history checks.

### External services

- Cloudflare Pages, Pages Functions, Turnstile, Web Analytics/email obfuscation.
- Resend for first-party inquiry delivery.
- FormSubmit for the no-JavaScript fallback.
- Sanity Content Lake/Studio (configured but not the live content source).
- Google Fonts/Maps, Unsplash imagery, WhatsApp, Instagram, and TikTok links.

### Environment variables

- Runtime: `RESEND_API_KEY`, `INQUIRY_TO_EMAIL`, `INQUIRY_FROM_EMAIL`, `ALLOWED_ORIGINS`, `TURNSTILE_SECRET_KEY`, `CF_PAGES_COMMIT_SHA`.
- Build: `SITE_URL`, `TURNSTILE_SITE_KEY`, `SANITY_STUDIO_PROJECT_ID`, `SANITY_STUDIO_DATASET`, `CF_PAGES`, `CF_PAGES_COMMIT_SHA`, `GITHUB_SHA`.
- Secret values are server-side. The Turnstile site key and Sanity project identifier are intentionally public identifiers.

## 3. Findings by severity

### Critical

No confirmed critical vulnerability in the deployed public application.

### High

#### H-01 — Vulnerable Sanity Studio toolchain (open)

- **Affected component:** `studio/package-lock.json`; Sanity Studio/CLI dependencies.
- **Actual risk:** `npm audit` reports one critical, ten high, and eleven moderate vulnerable packages, including archive path traversal/arbitrary write and resource-exhaustion advisories reachable through the Studio CLI dependency graph. These packages are excluded from `dist/`, so this is a developer/CMS supply-chain risk rather than a browser-runtime exploit.
- **Evidence:** `npm audit --json` in `studio/`; current direct versions are Sanity `^3.68.0` and Vision `^3.68.0`. Audit remediation points to a major upgrade.
- **Fix:** upgrade Sanity/Studio in an isolated branch, rebuild the Studio, run schema/sync/drift tests, and verify editorial workflows. Do not run an unreviewed automatic major upgrade against production.
- **Verification:** Studio build; `npm audit`; `npm run check:sanity`; read/write tests with a non-production test document; review CORS and role scopes.

### Medium

#### M-01 — Inquiry accepted malformed and forged structured input (fixed locally)

- **Affected component:** `functions/api/inquiry.js`.
- **Actual risk:** JSON primitives could cause uncontrolled exceptions; over-limit fields were silently truncated; impossible dates, arbitrary traveler counts, unknown fields, and forged tour values were accepted. A forged browser `tour-name` could mislabel an operational email.
- **Evidence:** source review and deterministic Function tests.
- **Fix:** require a plain JSON object and text values; reject unknown/over-limit fields; validate real non-past calendar dates, phone shape, group-size enum, tour-slug enum, control characters, and exact JSON media type; derive the tour name server-side; set source server-side.
- **Verification:** expanded `tests/inquiry-function.mjs`; `npm run test:inquiry` passes.

#### M-02 — Turnstile token context was not bound to this form (fixed locally)

- **Affected component:** `script.js`, `functions/api/inquiry.js`.
- **Actual risk:** Siteverify success was accepted without checking the widget action or hostname. This weakened isolation between Turnstile-protected surfaces/configurations.
- **Evidence:** prior handler checked only `result.success`.
- **Fix:** issue tokens with action `inquiry`; require both `action === "inquiry"` and the Siteverify hostname to match the already-approved request origin; add a 10-second verification timeout.
- **Verification:** regression tests reject successful tokens with a wrong action or hostname. This matches Cloudflare's current Siteverify guidance.

#### M-03 — Uncertain provider responses could produce duplicate enquiries (fixed locally)

- **Affected component:** inquiry client and Function.
- **Actual risk:** after delivery followed by a lost response, a manual retry generated a new server UUID, defeating provider idempotency and potentially delivering twice.
- **Evidence:** client retained no submission identity across retries; server always generated a new key.
- **Fix:** generate an opaque UUIDv4 per client submission attempt, validate it server-side, reuse it across uncertain retries, and clear it only after confirmed success. Resend remains authoritative for idempotency.
- **Verification:** regression test confirms the client UUID becomes the provider idempotency key; invalid identifiers return 400.

#### M-04 — No confirmed rate limit for the public email endpoint (open/dashboard)

- **Affected component:** Cloudflare zone protecting `POST /api/inquiry`.
- **Actual risk:** Turnstile materially reduces automated abuse but does not cap valid-token submissions, verification traffic, or provider cost. Source contains no stateful limiter, and dashboard rules are not externally observable.
- **Evidence:** code/config review; production health confirms Turnstile but cannot report WAF/rate-limit state.
- **Fix:** confirm a Cloudflare rate-limiting rule specifically for `POST /api/inquiry`; start conservatively (for example 5 submissions per 10 minutes per IP with a temporary block/managed challenge), monitor false positives, and add a broader hourly ceiling if abuse appears.
- **Verification:** dashboard screenshot/export, one controlled threshold test in staging, and confirmation that excess requests receive 429 without invoking the Function/provider.

#### M-05 — No-JavaScript fallback bypasses first-party controls (accepted/deferred)

- **Affected component:** FormSubmit native action on `/contact`.
- **Actual risk:** direct posts to the third-party endpoint do not traverse the Function's origin, Turnstile, enum validation, request limit, or Cloudflare rate rule. Honeypot behavior depends on FormSubmit. This path is necessary today for JavaScript-disabled visitors.
- **Evidence:** deployed form action and `data-inquiry-mode="cloudflare"`; `_captcha=false`; architecture handoff.
- **Fix:** retain while monitoring delivery/spam. Long-term, replace it with a same-origin form-encoded fallback endpoint protected by strict Cloudflare rate limits and honeypot/time-based checks, or document an accepted no-JS third-party risk.
- **Verification:** periodic no-JS delivery test; provider spam telemetry; incident threshold and removal/disable procedure.

#### M-06 — Privacy governance is incomplete (open)

- **Affected component:** inquiry workflow and legal documentation.
- **Actual risk:** the form collects identity/contact/travel intent and sends it through Resend or FormSubmit, but no published privacy policy or retention/deletion schedule was found. The inline note correctly discourages passports, payment, medical, and other sensitive data.
- **Evidence:** `docs/legal-pages-draft.md` exists, but no public privacy route; form/source review.
- **Fix:** publish an accurate privacy notice covering purpose, processors, retention, deletion/contact rights, cross-border processing, and the no-JS FormSubmit path; define mailbox/log retention.
- **Verification:** public link adjacent to the form/footer and an internal retention owner/schedule.

### Low

#### L-01 — Provider failures had no safe operational log (fixed locally)

- **Affected component:** `functions/api/inquiry.js`.
- **Actual risk:** a 502 was visible to the traveller but provider rejection/transport failure lacked a minimal server-side signal.
- **Fix:** log only the opaque request UUID and provider status/event; do not log customer fields or secrets.
- **Verification:** provider-failure regression test and Cloudflare log inspection after staging simulation.

#### L-02 — Local secret files were not comprehensively ignored (fixed locally)

- **Affected component:** `.gitignore`.
- **Actual risk:** `.env`/`.dev.vars` files could be accidentally staged later.
- **Fix:** ignore `.env`, `.env.*`, and `.dev.vars*`, while allowing a future `.env.example`.
- **Verification:** tracked-file and targeted current/history secret scans found no credential pattern.

#### L-03 — CSP still permits inline styles (accepted)

- **Affected component:** `_headers` CSP.
- **Actual risk:** `style-src 'unsafe-inline'` weakens CSS injection protection but does not permit script execution; `script-src` excludes `unsafe-inline`, `script-src-attr 'none'`, `object-src 'none'`, and `frame-ancestors 'none'` are strong.
- **Fix:** remove only after inline style attributes are migrated without UI regressions.
- **Verification:** CSP report-only rollout followed by browser suites.

#### L-04 — Health endpoint exposes a commit revision (accepted)

- **Affected component:** `/api/health`.
- **Actual risk:** minor deployment fingerprinting; no secrets, addresses, or inquiry data.
- **Fix:** optional removal if operational monitoring does not need it.
- **Verification:** production response review.

### Informational / positive controls

- No SQL, database, login, session, payment, public upload, or webhook attack surface.
- Fixed GROQ queries; validated project/dataset identifiers; no user-controlled GROQ.
- CMS/local content is escaped at output; no confirmed reflected, stored, or DOM XSS.
- No open redirect or path traversal was found.
- API uses no cookies/credentials; same-origin JSON plus Origin enforcement makes conventional CSRF inapplicable. Cross-origin JSON is also preflighted and no permissive API CORS response is present.
- Production headers include CSP, HSTS, clickjacking protection, MIME-sniffing protection, Referrer-Policy, Permissions-Policy, and COOP.
- Production returns real 404 responses and clean-URL 308 redirects.
- Public build output is allow-listed and excludes repository internals, tests, docs, Studio, manifests, and dependencies.
- Root dependency audit reports zero vulnerabilities.

## 4. Confirmed fixes implemented

- Strict JSON shape, type, unknown-field, and length rejection.
- Calendar/date, traveler-count, phone, tour-slug, and control-character validation.
- Server-authoritative tour names and inquiry source.
- Turnstile action/hostname validation and verification timeout.
- Resend timeout handling, stable non-disclosing 502s, and privacy-safe operational logging.
- Retry-safe UUID idempotency across uncertain responses.
- Expanded local secret-file ignore policy.

## 5. Regression/security tests added

`tests/inquiry-function.mjs` now covers:

- JSON primitives/arrays/null;
- unexpected and oversized fields;
- invalid group sizes, tour slugs, and calendar dates;
- forged display tour names;
- wrong Turnstile action and hostname;
- provider network failure handling;
- browser-generated idempotency UUID reuse and malformed UUID rejection;
- existing XSS escaping, origin, honeypot, configuration, reference, and delivery contracts.

## 6. Verification results

- `npm run build` — passed.
- `npm run test:inquiry` — passed.
- `npm run test:health` — passed.
- `npm run test:smoke` — passed.
- `npm run test:resilience` — passed against `dist/` with JavaScript disabled.
- `npm run test:responsive` — passed across six templates at 375/430/768/1024/1440 px.
- `git diff --check` — passed.
- Root `npm audit` — 0 vulnerabilities.
- Studio `npm audit` — 1 critical, 10 high, 11 moderate (open; H-01).
- Controlled production checks — `/`, `/contact`, `/api/health`, clean redirect, and 404 behavior verified without form submission.
- Production health — delivery configured and bot protection configured.

## 7. Cloudflare dashboard actions required

1. Confirm/create a rate-limiting rule for `POST /api/inquiry`; document threshold, mitigation duration, and owner.
2. Confirm Turnstile hostname management includes only the production/custom hostname and deliberate preview hosts; review Turnstile Analytics for unexpected hostnames/actions.
3. Confirm Cloudflare Managed Rules are enabled in an appropriate non-breaking mode; do not challenge static page views broadly.
4. Confirm Always Use HTTPS, minimum TLS 1.2+, and current certificate coverage. HSTS is already observed in production; add `includeSubDomains` only if every subdomain is HTTPS-ready.
5. Confirm `/api/health` and error routes remain `no-store`; current production responses do.
6. Configure alerts for Function 5xx/429 increases and Resend rejection logs. Do not log inquiry bodies.
7. Keep request-body enforcement at the Function (32 KB). A broader Cloudflare body rule is optional and must not affect unrelated routes.

## 8. Sanity configuration actions required

1. Remediate H-01 before making the CMS an active production workflow.
2. Keep the dataset public only while it contains public editorial data exclusively; never store inquiries, payment data, or private traveler records there.
3. Keep CORS to Studio origins only. Current CLI output shows only `http://localhost:3333`; allow credentials only for actual Studio origins and avoid wildcard credentialed origins.
4. Review project members and API tokens in the Sanity dashboard; remove unused tokens and ensure automation tokens have minimum read/write scope. No token value should enter client code or Cloudflare build output.
5. When CMS builds activate, use read-only unauthenticated access for the public dataset or a narrowly scoped server-side read token if the dataset becomes private.
6. Keep draft content out of production queries; current queries read the CDN published perspective and do not request drafts.

## 9. Deferred recommendations

- Replace FormSubmit with a first-party no-JS fallback when operationally justified.
- Publish the privacy notice and retention schedule.
- Remove CSP inline-style permission through a dedicated, regression-tested cleanup—not during this audit.
- Consider removing the revision from public health output if monitoring can identify deployments another way.
- Add a staging-only controlled rate-limit verification test; never threshold-test production aggressively.

## 10. Remaining sign-off blockers

1. Deploy and verify the local inquiry security/resilience fixes in production.
2. Confirm or create Cloudflare rate limiting for `POST /api/inquiry`.
3. Upgrade and re-audit the Sanity Studio dependency tree before enabling Sanity as an active production workflow.

### Status update — 17 August 2026

The three blockers above are as assessed on 7 August. Re-checked ten days later:

1. **Cleared.** The fixes were merged and deployed. Commits `6dd882b` and `ff5d6fb` are both ancestors of `origin/main`, which is the branch Cloudflare builds; the live commit reported by `/api/health` is `05bb776`, the merge that carried them. Production `/contact` serves `data-inquiry-mode="cloudflare"` and `/api/health` reports `deliveryConfigured: true, botProtectionConfigured: true`.
2. **Still open.** Cloudflare rate limiting cannot be observed from HTTP responses and must be confirmed in the dashboard. Nothing has changed this.
3. **Still open, unchanged.** `npm audit` in `studio/` on 17 August 2026 still reports 22 advisories: 1 critical, 10 high, 11 moderate — the same counts as the original audit. Sanity remains configured but is not the live content source, so this is not yet a production exposure.

Two blockers remain, so the verdict below stands.

## NOT READY FOR PRODUCTION SECURITY SIGN-OFF

