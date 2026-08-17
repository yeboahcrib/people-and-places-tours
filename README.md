# People & Places Tours

Static website for People & Places Tours in Ghana.

## Hosting and content architecture

- **Public host:** Cloudflare Pages, live at `https://peopleplacesgh.com`.
- **Deployment:** Cloudflare is connected to this GitHub repository and builds
  from `main` with `npm run build`, publishing `dist/`. Merging to `main` is
  the deploy; other branches produce `*.pages.dev` previews for verification.
- **Retired host:** GitHub Pages is switched off; the old
  `yeboahcrib.github.io/people-and-places-tours/` URL returns 404.
- **Approved CMS:** Sanity, configured but **not yet the live content source**.
  Sanity is for public editorial content; it must not store private inquiry,
  payment, or future reservation data.
- **Rendering direction:** Sanity content is pulled during the site build to
  produce static HTML, so visitors receive generated pages from the CDN rather
  than making a live CMS request per page view.

See [`docs/hosting-and-delivery-architecture.md`](docs/hosting-and-delivery-architecture.md)
for the verified current state, transition plan, and deployment boundaries.

## Local development

The current site has no frontend framework. Serve the repository locally:

```bash
python3 -m http.server 8081
```

Then open `http://127.0.0.1:8081/index.html`.

## Production build

```bash
npm run build
```

The command validates all browser JavaScript, then creates an allow-listed
`dist/` deployment containing only public website files. Internal documentation,
tests, dependencies, CMS source, and contributor instructions are excluded.

Cloudflare Pages runs this build itself, configured as:

```text
Build command: npm run build
Output directory: dist
```

Building locally produces a deliberately different `dist/` from the production
one: the contact form stays in FormSubmit `fallback` mode and the Turnstile
widget is absent, because `CF_PAGES` and `TURNSTILE_SITE_KEY` are set only in
Cloudflare's build environment. That is the intended behaviour — a build with
no Function behind it must not point the form at one.

## Tests

```bash
npm run check:js
npm run test:smoke
```

The smoke test requires the Playwright Chromium browser and a local server.

## Repository areas

- Root HTML/CSS/JS — current public site source.
- `assets/` — public website assets.
- `scripts/build-static.mjs` — safe static deployment builder.
- `src/partials/` — canonical build-time shared components. The generated
  Cloudflare output uses these instead of page-by-page copies.
- `src/content/site.json` — validated local content fallback and the contract
  shape consumed by shared components before Sanity is configured.
- `scripts/tour-source.mjs` — tour content adapter. It uses local tour data
  when Sanity is not configured and CMS facts when it is, while retaining local
  image/detail-page mappings during the transition.
- `scripts/homepage-source.mjs` — homepage adapter for the ten ordered Sanity
  sections; rich structured blocks and imagery remain local during migration.
- `studio/` — Sanity Studio and content schemas; not part of the public site.
- `docs/` — internal architecture, content, policy, and product documentation;
  not part of the generated production site.
- `tests/` — browser smoke tests; not deployed.
