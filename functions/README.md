# Cloudflare Pages Functions

These functions are part of the planned Cloudflare Pages deployment. GitHub
Pages does not execute this directory.

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

The contact form remains in `fallback` mode on GitHub Pages. It automatically
uses this endpoint on a `*.pages.dev` preview. At custom-domain cutover, set
`data-inquiry-mode="cloudflare"` on the form after the endpoint and delivery
notifications pass end-to-end testing.

Cloudflare rate-limiting and Turnstile should be configured before the custom
domain cutover. The honeypot is a low-cost first filter, not a complete bot
defense.

## Health endpoint

`api/health.js` handles `GET /api/health`. It reports HTTP 200 only when the
inquiry delivery bindings are present; otherwise it reports HTTP 503 with a
minimal `degraded` response. It does not expose binding values or send synthetic
emails. See `../docs/availability-and-monitoring-runbook.md` for monitoring and
incident-response guidance.
