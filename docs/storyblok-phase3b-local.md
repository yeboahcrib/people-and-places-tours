# Storyblok Phase 3B: local Cape Coast test

This is a local-only, build-time test for **Cape Coast Ancestral Tour**. It
does not enable Storyblok in Cloudflare and it does not change any other tour.

## Required values

Create an ignored local file named `.env.storyblok` in the repository root.
The existing `.gitignore` already ignores `.env.*`, so do not add this file to
Git or paste its token into chat, tickets, or source code.

```bash
STORYBLOK_CAPE_COAST_ENABLED=true
STORYBLOK_REGION=eu
STORYBLOK_PREVIEW_API_TOKEN=replace-with-the-Storyblok-preview-access-token
```

`STORYBLOK_PREVIEW_API_TOKEN` must be the **Preview access token** for the
People & Places Storyblok space. It is a Content Delivery API token that can
read the draft Cape Coast test story. It is not a personal/Management API token,
an asset token, or the public access token.

`STORYBLOK_REGION` is intentionally fixed to `eu` for this EU space. The
adapter declines to run for another region rather than making an ambiguous
request.

The build does not load `.env` files automatically. Run the local test in the
same shell as the following commands:

```bash
set -a
source .env.storyblok
set +a
npm run build
```

The token is sent only from the build process to Storyblok's Content Delivery
API. It is never written into the generated HTML, JavaScript, `health.json`, or
browser requests.

## Expected result

With the flag and valid token, `dist/health.json` contains:

```json
"storyblokCapeCoastSource": "applied"
```

With the flag unset or set to anything other than `true`, it contains
`"disabled"` and the build does not contact Storyblok. Missing, invalid, or
unavailable Storyblok content preserves the prior local/Sanity-backed Cape
Coast record instead.

## Baseline build

To make an explicit non-Storyblok comparison build, run:

```bash
STORYBLOK_CAPE_COAST_ENABLED=false npm run build
```

Do not set these variables in Cloudflare during Phase 3B. The required
production Content Security Policy work for Storyblok image URLs is also out of
scope until an explicitly authorized later phase.
