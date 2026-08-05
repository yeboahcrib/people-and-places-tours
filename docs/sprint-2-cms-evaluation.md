# Sprint 2 — CMS Evaluation (Architecture Decision Record)

**Status:** ✅ Approved (2026-07-25) — Sanity selected
**Prepared:** July 2026
**Depends on:** `docs/sprint-2-information-architecture.md`,
`docs/sprint-2-tour-and-media-architecture.md`

## Decision (final)

**Sanity is approved as the CMS.** Hosting: **GitHub Pages stays the
development/preview host; Cloudflare Pages is the production deployment
target when the site cuts over.** Both are static hosts — this matters
enough to change the integration approach from what's described below, see
"Revised integration approach" at the end of this document. These
decisions are closed; do not revisit them unless a real blocker turns up
during implementation.

## Decision needed (historical — resolved above)

Which platform manages People & Places' content going forward, replacing
the current model where every update (a new tour, a swapped photo, a
corrected phone number) requires editing source code directly.

## Criteria (per the roadmap)

Ease of use for founders · tour/media publishing workflow · draft/preview/
publish/archive support · authentication and roles · media handling ·
structured review/trust fields · API quality · hosting compatibility ·
backup/export · cost · security/maintenance overhead · room for a future
booking/payment integration without forcing one now.

## Starting context that shapes this decision

The current site is 20 static HTML files with hand-written CSS/JS, hosted
on GitHub Pages (confirmed via the FormSubmit redirect URL in
`homepage-content.js`, pointing to `yeboahcrib.github.io`). There is no
build step, no framework, no server. Whatever gets chosen either needs to
work well *alongside* that architecture, or the founders need to accept a
larger migration. That tradeoff is the main thing separating the options
below.

## Candidates considered

### 1. Sanity — recommended

A hosted headless CMS: structured content lives in Sanity's database,
edited through "Sanity Studio" (a real application, not just a form), and
pulled into the site via API.

**Why it fits well:**
- The **free tier is genuinely usable at this scale**: 2 non-admin users
  (exactly matches a two-founder team), 20GB asset storage, 500K API
  requests/month, 10GB bandwidth. Paid tier only needed if the team or
  traffic grows well past current size ($15/seat/month if so).
- **Media handling is native, not bolted on** — built-in hotspot/crop
  (satisfies the "focal point" requirement directly), asset pipeline
  generates optimized derivatives automatically, alt text is a first-class
  field.
- **Schema flexibility directly supports the Trust-Aware Fields model** —
  source, verification date, consent state, approval state, etc. are just
  custom fields on a document type; this is exactly what Sanity's schema
  system is built for.
- Draft/publish states, scheduled publishing (Growth tier), and real
  role-based access are native.
- Strong API (GROQ query language + REST + GraphQL) — whatever the future
  frontend looks like, it can be built against a real, versioned content
  API.

**Cost of choosing it:** requires a real frontend rebuild — either the
existing static HTML/JS gets rewritten to fetch from Sanity's API, or (more
likely, for a small site with infrequent structural change) a build step
generates static pages from Sanity content, keeping the "just files on
GitHub Pages" hosting model. This is meaningful engineering work — it's not
a plugin you drop into the current site. This is Sprint 3A work, and it's
exactly the kind of work the Codex → Claude Code handoff exists for: Codex
defines the schema (this document), Claude Code implements the UI against
it once the schema and a real frontend plan are approved.

### 2. Git-based CMS (Decap CMS or TinaCMS)

Content lives as files in the same GitHub repo the site already uses;
editors get a web UI that reads/writes those files as commits. No separate
database or server.

**Why it's tempting:** this is the *lowest-disruption* path — the current
static HTML/JS architecture barely changes. `tours.js` and
`homepage-content.js` could become CMS-editable data files essentially as
they already are, with an admin UI layered on top authenticated via GitHub.
Free (Decap) or low-cost (Tina).

**Why it's the second choice, not the first:**
- **Decap CMS is in maintenance mode** — Netlify deprioritized it, release
  cadence is modest, and its editing interface is dated. Not a platform to
  build a multi-year business tool on.
- **TinaCMS is actively maintained and has a genuinely nice inline-editing
  experience**, but it's most naturally suited to React/Next.js sites, not
  a 20-file static HTML/JS site with hand-managed navigation — using it
  well here would still mean restructuring the site toward a framework,
  which erodes the "lowest disruption" advantage.
- **Media/consent fields are DIY.** Both tools support custom fields, so
  the Trust-Aware Fields model *can* be built, but there's no native
  hotspot/focal-point tooling or asset pipeline the way Sanity has it —
  more manual schema work to get the same compliance-grade result.

**When this would be the right call instead:** if minimizing engineering
rework is the overriding priority over the next few months, and the team
is comfortable with a simpler, more DIY media/trust-field setup for now.

### 3. Webflow — considered, not recommended as primary

A visual, no-code site builder with a built-in CMS (collections, media
fields, roles).

**Why it's appealing on paper:** genuinely founder-friendly visual editing,
built-in hosting, forms, and CMS in one product — no separate "frontend
rebuild" question the way Sanity or Tina raise, since Webflow *is* the
frontend.

**Why it's not the primary recommendation:** it means **replacing the
current custom-built site**, not extending it. The pill nav, the homepage
section renderer, the responsive work already done across 20 pages — all
of that would need to be rebuilt inside Webflow's builder (which does
support custom code, but at that point a lot of the current codebase's
value is being set aside rather than built on). Pricing also changed
recently (May 2026): Premium tier (needed for CMS + reasonable limits) is
$25/mo billed annually, with CMS item/collection caps that a growing tour
catalogue could eventually hit.

**When this would be the right call instead:** if the founders would
rather hand off ongoing design changes to a visual tool entirely and are
fine with a full rebuild — a legitimate choice, just a different project
than "add a backend to the current site."

### 4. Self-hosted options (Strapi, Payload, WordPress) — not recommended

All three were considered and set aside for the same reason: they require
either self-hosting a server/database (Strapi, Payload) with real ongoing
maintenance and security overhead, or taking on WordPress's plugin-update
treadmill — overhead disproportionate to a two-founder team without a
dedicated technical operator. Sanity and the git-based options both avoid
this by being fully managed.

## Comparison summary

| Criterion | Sanity | Decap/Tina | Webflow | Strapi/Payload/WP |
| --- | --- | --- | --- | --- |
| Founder ease of use | High (Studio UI) | Medium (Tina) / Low (Decap) | High (visual builder) | Low–Medium |
| Media handling incl. focal point/alt text | Native | DIY | Native | DIY/plugin-dependent |
| Trust-aware fields (source/consent/approval) | Native schema support | DIY custom fields | Partial (custom fields) | DIY |
| Draft/preview/publish/archive | Native | Native (git-based) | Native | Varies |
| Roles/auth | Native, free tier covers 2 users | Via GitHub/Git provider | Native | Self-managed |
| Keeps current site architecture | No — needs new frontend | Mostly yes | No — full rebuild | No |
| Hosting/maintenance overhead | None (managed) | None (managed) | None (managed) | High (self-hosted) |
| Cost at this scale | Free | Free (Decap) / low (Tina) | ~$25/mo+ | Server costs + time |
| Room for future booking/payment integration | Good (real API) | Limited | Limited (app ecosystem) | Good, but more DIY |

## Recommendation

**Sanity**, with the frontend rebuild treated as its own planned piece of
work (Sprint 3A/3C) rather than something to minimize at the cost of a
weaker content model. The trust-aware fields requirement is central to
this entire project — it's the mechanism that prevents Sprint 1's problems
(fabricated identities, contradicting claims, unconsented media) from
recurring — and Sanity is the only option here where that's a natural fit
rather than a workaround.

If the founders would strongly prefer to avoid a frontend rebuild in the
near term, TinaCMS is the reasonable fallback — actively maintained, real
inline editing, and it can be scoped down to editing the existing data
files without a full framework migration, accepting a more manual
trust-fields setup as the tradeoff.

## ~~Open decision for founders~~ — resolved

Sanity is approved. See below for how the static-hosting decision
(GitHub Pages now, Cloudflare Pages at cutover) actually simplifies the
integration compared to what was originally described above.

## Revised integration approach, given the hosting decision

Earlier in this document, Sanity's cost was described as needing "a real
frontend rebuild — either the existing static HTML/JS gets rewritten to
fetch from Sanity's API, or a build step generates static pages." Given
GitHub Pages now / Cloudflare Pages at cutover are both **plain static file
hosts, not app servers**, the simplest path — and the one that best fits
"optimize for simplicity, maintainability, and free tiers" — is:

**Client-side fetch from Sanity's free, CDN-cached read API, directly from
the existing static JS files.** Concretely: `homepage-content.js` and
`tours.js`'s hardcoded objects get replaced with a fetch call to Sanity's
`apicdn.sanity.io` endpoint (a GROQ query over HTTP), returning the same
shape of data the current render code already expects. No build step, no
framework migration, no server — the site stays exactly the kind of static
HTML/CSS/JS project it is today, hosted exactly the same way. This is a
meaningfully smaller lift than the "frontend rebuild" framing above
suggested, and it's the approach Sprint 3A should implement.

**Image optimization and responsive media** (called out as a first-class
requirement): Sanity's asset pipeline generates this for free via URL
parameters on every image (width, format, quality, auto-crop to the
focal point set in the Studio) — no separate image-processing service or
build step needed. This pairs naturally with the client-side-fetch
approach above: an `<img>` tag's `src` just points at a Sanity CDN image
URL with the right query parameters, computed at render time in the
existing JS.

This revision doesn't change the recommendation — it makes the case for
Sanity stronger, since the "cost" side of the earlier tradeoff was larger
than it needed to be once the hosting decision was known.

Sources consulted for current pricing/positioning (July 2026):
- [Sanity Pricing 2026](https://nayankyada.com/blog/sanity-cms-pricing-in-2026-free-plan-growth-and-when-you-need-enterprise)
- [Decap CMS vs TinaCMS comparison](https://unfoldcms.com/blog/decap-vs-tinacms-git-cms)
- [Webflow Pricing 2026](https://help.webflow.com/hc/en-us/articles/51059955082387-Updated-pricing-and-simplified-plans-for-May-2026)
