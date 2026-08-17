# People & Places — Sanity Studio

This is the content-management backend approved in Sprint 2
(`docs/sprint-2-cms-evaluation.md`). It's a separate small project from
the main website — the website stays exactly the static HTML/CSS/JS site
it is today; this just gives the founders an authenticated place to edit
tours, media, reviews, and everything else in
`docs/sprint-2-information-architecture.md`.

**Nothing here is deployed yet.** This is the schema, ready to go once a
Sanity account exists.

## One-time setup (do this yourselves — needs your own free Sanity account)

**Don't run `npx sanity init` in this folder** — it tries to scaffold a
brand-new Studio from a template, and refuses because this folder already
has one (ours, hand-written). You don't need the scaffold, just a real
project ID and dataset to point our existing config at:

1. Create a free account at [sanity.io](https://www.sanity.io/manage) if
   you don't have one.
2. From this `studio/` folder:
   ```bash
   npm install
   npx sanity login
   npx sanity projects create
   ```
   The last command prompts for a project name (e.g. "People & Places")
   and prints a **project ID** — copy it.
3. **Do this before creating a dataset.** Point the existing config at your
   project via a `.env` file (don't hardcode it into
   `sanity.config.ts`/`sanity.cli.ts` — both already read from these env
   vars):
   ```bash
   echo 'SANITY_STUDIO_PROJECT_ID=<your-project-id>' > .env
   echo 'SANITY_STUDIO_DATASET=production' >> .env
   ```
   If you skip this step, `sanity.cli.ts` falls back to a placeholder
   value that isn't a valid project ID, and every CLI command below will
   fail with `projectId can only contain only a-z, 0-9 and dashes` —
   regardless of any `--project` flag you pass on the command line, since
   the CLI reads `sanity.cli.ts` for its config context first.
4. Now create the dataset:
   ```bash
   npx sanity dataset create production
   ```
5. Run the Studio locally to try it out:
   ```bash
   npm run dev
   ```
6. When ready to give the founders a real login (not just local dev),
   deploy the Studio itself as a hosted app:
   ```bash
   npm run deploy
   ```
   This gives you a URL like `people-and-places.sanity.studio` — that's
   the actual "secure CMS backend" login page, with Sanity's own
   authentication (Google login, email, etc.) and role management.

## How the website will publish this content

The website is hosted on Cloudflare Pages, built from `main`, and does **not**
need a server-rendered framework. The production integration is to query Sanity
during the Cloudflare build and generate static HTML into `dist/`. This keeps published
pages available even if Sanity is temporarily unavailable and ensures essential
content exists before browser JavaScript runs.

Sanity's CDN-cached read API can be queried by the build process:

```js
const query = encodeURIComponent(`*[_type == "tour" && active == true]`);
const url = `https://<project-id>.apicdn.sanity.io/v2024-01-01/data/query/production?query=${query}`;
const tours = await fetch(url).then((r) => r.json()).then((r) => r.result);
```

The returned records replace the hardcoded arrays in `tours.js` and
`homepage-content.js`, but should be rendered into the generated site rather
than making every visitor fetch essential content directly. Cloudflare Pages
will run `npm run build`, publish `dist/`, and later receive rebuild triggers
from a Sanity publish webhook. Images use Sanity's
built-in URL-based transforms for responsive/optimized delivery — e.g.
appending `?w=800&auto=format` to any asset URL — satisfying the "image
optimization as a first-class requirement" instruction without any
separate image pipeline.

See `../docs/hosting-and-delivery-architecture.md` for the complete transition
and responsibility boundaries. Private inquiries, payments, and future booking
records do not belong in Sanity.

## What's in this schema

See `docs/sprint-2-information-architecture.md` and
`docs/sprint-2-tour-and-media-architecture.md` for the reasoning behind
every field. Quick map:

- `schemaTypes/objects/trustFields.ts` — the shared source/verification/
  consent/approval field set used on Trust facts, Reviews, Guest stories,
  and Media.
- `schemaTypes/objects/mediaAsset.ts` — the media model (alt text, focal
  point via Sanity's native hotspot, consent, placeholder state).
- `schemaTypes/documents/*.ts` — one file per content type.
- `deskStructure.ts` — pins the four singleton types (Site Settings,
  Navigation, Origin Story, Featured Tour Collection) so editors see one
  document instead of a confusing "create new" list for things that should
  only ever have one record.

## What's deliberately NOT in this schema

- **Booking/inquiry data** — stays outside the CMS content model, as an
  operational concern (see the Manual Booking Workflow doc), not published
  content.
- **A stored deposit/payment field per tour** — payment terms are derived
  from `offerType` against the one universal policy, on purpose. Storing
  it per-tour is exactly how the original Just Go Ghana deposit conflict
  happened.
