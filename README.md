# People & Places Tours

Static website for People & Places Tours in Ghana.

## Hosting and content architecture

- **Current public host:** GitHub Pages at
  `https://yeboahcrib.github.io/people-and-places-tours/`.
- **Verified GitHub Pages source:** `main` branch, repository root (`/`),
  legacy branch deployment, HTTPS enforced, no custom domain.
- **Planned production host:** Cloudflare Pages.
- **Approved CMS:** Sanity. Sanity is for public editorial content; it must
  not store private inquiry, payment, or future reservation data.
- **Rendering direction:** Sanity content will be pulled during the site build
  to produce static HTML. Cloudflare Pages will publish the generated `dist/`
  directory to its CDN.

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

GitHub Pages does not currently run this build because it still publishes the
root of `main`. Cloudflare Pages will use:

```text
Build command: npm run build
Output directory: dist
```

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
- `scripts/tour-source.mjs` — tour content adapter. It uses local tour data for
  GitHub Pages/current development and CMS facts when Sanity is configured,
  while retaining local image/detail-page mappings during the transition.
- `scripts/homepage-source.mjs` — homepage adapter for the ten ordered Sanity
  sections; rich structured blocks and imagery remain local during migration.
- `studio/` — Sanity Studio and content schemas; not part of the public site.
- `docs/` — internal architecture, content, policy, and product documentation;
  not part of the generated production site.
- `tests/` — browser smoke tests; not deployed.
