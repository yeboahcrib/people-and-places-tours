# Claude Code Handoff — 17 August 2026

Written when the founder moved this work from the Claude Code desktop app into
VS Code. Read `CLAUDE.md` first; this covers only what that file cannot know.

Supersedes nothing. `docs/claude-code-handoff-2026-08-14.md` is still the
authority on the homepage pathway section's design direction and its three
rejected treatments — read it before touching that section.

## 1. Where things stand

Branch: **`homepage-pathway-section`**, pushed to origin, four commits ahead of
`main`. Working tree clean at handoff.

| | |
| --- | --- |
| Live site | `https://peopleplacesgh.com` — Cloudflare Pages, built from `main` |
| Live commit | `05bb776` |
| This branch's preview | `https://homepage-pathway-section.people-and-places-tours.pages.dev` |
| Merged? | **No.** Production is untouched by everything below |

Merging to `main` is the deploy. There is no separate publish step.

## 2. What this session changed

1. `b9a9204` — the homepage pathway scroll animation, plus removal of ~160
   lines of dead `.pathway-spotlight*` CSS left by a rejected prototype.
2. `e57efb3` — corrected six documents that still described GitHub Pages as the
   live host. It has been Cloudflare since the August cutover.
3. `dc9378b` — `.gitignore` entries for `.env` and `.dev.vars`.
4. `3e208bf` — recorded what a Cloudflare preview can and cannot verify.

Nothing here is speculative: each hosting claim was checked against production
rather than inferred. The methods are written into
`docs/hosting-and-delivery-architecture.md` so they can be re-run cheaply.

## 3. The immediate next action

**Bind the inquiry secrets to Cloudflare's Preview environment.** The founder
has them configured, but in the Production scope only, and Pages keeps the two
scopes separate. Evidence, same project and same code:

- production `/api/health` → `deliveryConfigured: true, botProtectionConfigured: true`
- branch preview `/api/health` → `degraded`, both `false`

Because `CF_PAGES` is set on previews, `/contact` there still serves
`data-inquiry-mode="cloudflare"` — so the preview form posts to a Function that
cannot deliver. **The booking flow, the only path that costs money when it
breaks, is currently unverifiable before merge.**

In Settings → Variables and Secrets → *Preview* scope, add `RESEND_API_KEY`,
`INQUIRY_TO_EMAIL`, `INQUIRY_FROM_EMAIL`, `TURNSTILE_SECRET_KEY`, and
`TURNSTILE_SITE_KEY` (that last one is a **build** variable, not a runtime
secret). Then redeploy — variable changes do not reach existing deployments.

Two traps flagged to the founder and not yet acted on:

- Point preview `INQUIRY_TO_EMAIL` at a **test inbox**. Sharing the real
  operational address makes test submissions indistinguishable from genuine
  customer leads.
- The production Turnstile site key is hostname-scoped and will likely fail on
  `*.pages.dev`, and the Function fails closed — which looks like a code bug
  and is not one. Either add the pages.dev hostname to the widget or use
  Cloudflare's always-pass test pair (`1x00000000000000000000AA` /
  `1x0000000000000000000000000000000AA`).

Once set, re-run `/api/health` on the preview and submit a real enquiry through
it. That end-to-end check has never been possible pre-merge.

## 4. Two decisions waiting on the founder

**Sanity: turn it on, or shelve it.** It is configured, fully wired into the
build through five adapter scripts, and serving nothing. It carries 22
advisories including one critical — the sole reason the third security blocker
exists. Turning it on means upgrading the tree, re-auditing, and adding the
publish webhook; shelving it deletes the critical advisory outright. The
roadmap's non-negotiables call for founder-editable content, which argues for
turning it on, but that depends on how they actually work. **Do not decide this
unilaterally.**

**Homepage copy hierarchy.** The founder observed the site reads text-heavy for
travel. Three gallery/modal treatments have been rejected. The 14 August handoff
is explicit that the next step is a hierarchy decision — less visible copy,
photography dominant, detail revealed only for the active item — not a fourth
prototype. Do not write more code for that section before that conversation.

## 5. Open blockers and known state

- **Rate limiting on `POST /api/inquiry`** — still unconfirmed, dashboard-only,
  and one of the two remaining security sign-off blockers.
- **Sanity Studio dependencies** — 22 advisories (1 critical, 10 high, 11
  moderate), unchanged since the 7 August audit. Not shipped to the public site.
- The security audit's **first** blocker is cleared; its §10 carries a dated
  status update explaining why.

## 6. Verification state

All green on this branch at handoff: `build` (headers, static a11y across 21
pages, five content contracts, build output), `test:smoke`, `test:responsive`
(375/430/768/1024/1440 across six templates), `test:resilience`,
`test:pathway-spotlight`, and `test:visual`.

**The visual baseline was re-recorded this session** and verified green twice.
The previous baseline dated from 6 August and predated both the pathway
animation and the inquiry-flow changes, so `test:visual` had been failing on
`index` and `contact` for reasons unrelated to any current edit. It is a real
safety net again — treat a failure as a genuine regression.

Baselines are gitignored, so they live only on this machine. Same machine in VS
Code means they carry over; a different machine needs
`npm run test:visual:baseline` (~50s) before the test means anything.

Two flakes seen and not reproduced: `ada-tour-768` differing by 1px of height on
one run out of four, and one `ERR_NETWORK_IO_SUSPENDED` navigation timeout. Both
passed cleanly on retry. Worth remembering before chasing either as a real bug.

## 7. Things that look wrong and are not

- `contact.html` commits `data-inquiry-mode="fallback"`. Correct.
  `scripts/render-booking.mjs` rewrites it to `cloudflare` only when `CF_PAGES`
  is set. A build with no Function behind it must not point at one.
- Root `sitemap.xml` and `robots.txt` carry old `github.io` URLs. They are build
  inputs; `dist/` emits the live domain via `render-meta.mjs`.
- A local `npm run build` produces a deliberately different `dist/` from
  production — fallback form mode, no Turnstile — because `CF_PAGES` and
  `TURNSTILE_SITE_KEY` exist only in Cloudflare's build environment.

## 8. Resuming

```bash
git checkout homepage-pathway-section
python3 -m http.server 8081   # leave running; several tests need it
```

A server was left running on 8081 in the previous session; it will not survive
the move.

Re-verify any hosting claim in this document with:

```bash
curl -s https://peopleplacesgh.com/api/health
```

The `revision` it returns is the live commit.
