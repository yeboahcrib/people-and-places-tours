# Availability and Monitoring Runbook

**Status:** Implementation baseline
**Prepared:** August 2, 2026

## What is monitored

The public website and inquiry service are separate availability units:

| Signal | Endpoint | Healthy result | Meaning |
| --- | --- | --- | --- |
| Static website | `/health.json` | HTTP 200 and `status: ok` | A complete, identified site build reached the CDN |
| Homepage journey | `/index.html` | HTTP 200 and expected homepage marker | Visitors can reach the main entry page |
| Inquiry configuration | `/api/health` | HTTP 200 and `status: ok` | The Cloudflare inquiry function has its required delivery bindings |
| Inquiry delivery | Resend delivery events/dashboard | Delivered | The email provider accepted and delivered operational mail |

`/api/health` is deliberately shallow: it does not send a test email every time
an uptime monitor calls it. Synthetic emails would create noise, consume quota,
and could hide real inquiries. Provider delivery events are the correct signal
for the final delivery stage.

## Recommended checks at Cloudflare cutover

Configure an external uptime monitor from outside Cloudflare to request:

1. `/health.json` every five minutes.
2. `/index.html` every five minutes and verify a People & Places page marker.
3. `/api/health` every five minutes after the inquiry service is activated.

Alert after two consecutive failures rather than a single failure. One failed
probe can be a temporary network issue between the monitor and Cloudflare;
repetition is a stronger availability signal and reduces false alarms.

Notifications should reach at least one channel independent of the website,
such as a founder email plus WhatsApp or SMS escalation.

## Failure response

### Static health or homepage fails

1. Check Cloudflare Pages deployment status.
2. Confirm the latest build completed and `dist/health.json` exists.
3. Roll back to the last known-good Cloudflare deployment if the latest release
   caused the failure. Either redeploy the previous build from the Cloudflare
   dashboard or revert the offending commit on `main`, which triggers a new
   build.
4. There is no longer a second host to fall back to: GitHub Pages is switched
   off, and it could not serve the inquiry Function or `_headers` even if it
   were re-enabled. A Cloudflare-wide outage means directing guests to the
   WhatsApp, phone, and email channels until service returns.

### Inquiry health is degraded

1. Keep the public website online; browsing is still available.
2. Verify `RESEND_API_KEY`, `INQUIRY_TO_EMAIL`, and `INQUIRY_FROM_EMAIL` in the
   Cloudflare production environment.
3. Check Resend domain verification and provider status.
4. Direct guests to the visible WhatsApp, phone, and email alternatives until
   delivery is restored.
5. Do not silently resubmit failed requests through multiple providers; that
   can create duplicate inquiries.

### Email accepted but not delivered

1. Use the inquiry reference and provider delivery record; do not ask the guest
   to resend sensitive details unnecessarily.
2. Check bounce, suppression, recipient, and sender-domain status in Resend.
3. Test with a controlled internal inquiry.
4. Use WhatsApp/phone as the operational fallback while resolving delivery.

## Data and logging rule

Health endpoints must not return secrets, email addresses, or inquiry content.
Operational logs should use request/reference identifiers and status metadata,
not full customer messages. Private inquiry data must not enter Sanity or public
analytics.
