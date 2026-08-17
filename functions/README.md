# Cloudflare Pages Functions

These functions are **live in production** on Cloudflare Pages at
`https://peopleplacesgh.com`. They run only where a Pages Function runtime
exists: a plain static host, and a local `python3 -m http.server`, will not
execute this directory, which is why the contact form keeps a fallback path.

## Inquiry endpoint

`api/inquiry.js` handles `POST /api/inquiry` on Cloudflare Pages. It validates
and bounds untrusted input, checks an origin allow-list and honeypot, and sends
the inquiry through Resend without exposing email credentials to the browser.

Configure these encrypted/environment bindings in Cloudflare Pages:

- `RESEND_API_KEY` — secret Resend API key.
- `INQUIRY_TO_EMAIL` — verified operational recipient.
- `INQUIRY_FROM_EMAIL` — sender on a domain verified with Resend.
- `ALLOWED_ORIGINS` — comma-separated production/preview origins in addition
  to the function's own origin.
- `TURNSTILE_SECRET_KEY` — secret half of the Turnstile key pair. When set, a
  valid token is required and verification failures fail closed, including
  when Cloudflare's verify endpoint is unreachable. When unset, the endpoint
  still works and falls back to the honeypot, origin check and field limits;
  `/api/health` reports `botProtectionConfigured: false` so the gap is visible.

The public half is a **build** variable, not a runtime binding, because it is
injected into `contact.html`:

- `TURNSTILE_SITE_KEY` — set in the Pages build environment. Left unset, the
  form carries an empty `data-turnstile-sitekey` and never loads the widget
  script, which keeps a build with no Function behind it free of a challenge it
  could not verify against.

A request with no `Origin` header is refused outright. Browsers always send it
on a POST, so its absence means the caller is not a browser following our form.

Form mode is chosen at build time, not at runtime. `scripts/render-booking.mjs`
writes `data-inquiry-mode="cloudflare"` when `CF_PAGES` is set and `fallback`
otherwise, so Cloudflare production and `*.pages.dev` previews use this
endpoint while any other build keeps FormSubmit. The `fallback` value committed
in `contact.html` is correct and should be left alone.

Turnstile is configured and live (`/api/health` reports
`botProtectionConfigured: true`). **Cloudflare rate limiting on
`POST /api/inquiry` is still outstanding** and remains an open security
sign-off blocker; it cannot be verified from HTTP responses and must be checked
in the dashboard. The honeypot is a low-cost first filter, not a complete bot
defense.

## Health endpoint

`api/health.js` handles `GET /api/health`. It reports HTTP 200 only when the
inquiry delivery bindings are present; otherwise it reports HTTP 503 with a
minimal `degraded` response. It does not expose binding values or send synthetic
emails. See `../docs/availability-and-monitoring-runbook.md` for monitoring and
incident-response guidance.
