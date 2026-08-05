# Sprint 2 — Information Architecture

**Status:** ✅ Approved (2026-07-25)
**Prepared:** July 2026
**Lead:** Codex (this session standing in for Codex, per project process)
**Depends on:** All Sprint 1 registers, `docs/homepage-messaging-brief.md`,
`docs/people-and-places-brand-foundation.md`

## Purpose

Define page responsibilities, the content model, and trust-aware fields —
the first three of Sprint 2's eight deliverables per the roadmap. This is
the schema the eventual CMS will implement and the eventual UI will read
from. Nothing here is implemented in code; it's the contract everything
else gets built against.

## 1. Page responsibilities

The current site already has 20 pages. The table below maps every one of
them to the roadmap's minimum required page set, states its single primary
job, and flags what changes structurally (not just content) versus what
stays as-is.

| Current page(s) | Roadmap page type | Primary job | Structural change? |
| --- | --- | --- | --- |
| `index.html` | Homepage | Tell the founder-led story, build trust, offer a small curated set of tours, invite a conversation | Yes — full re-sequence to the approved 10-section order (Sprint 3C) |
| `about.html` | About and hosts | Introduce the real founders, the true origin story, and how hosting works | Yes — remove the fabricated team, correct the false stats/claims already logged in Sprint 1 |
| `packages.html` | Full tour catalogue | Let a visitor browse/filter every active day tour | No — CLAUDE.md already flags this as the strongest layout on the site; keep its grid, feed it from the new tour content model instead of `tours.js` |
| 13 individual day-tour pages (`accra-city-tour.html`, `cape-coast-tour.html`, etc.) | Day-tour detail | Answer: what is this, who's it for, how long, what's included, how do I book it | No layout change implied yet — becomes a single templated page type driven by the tour content model, rather than 13 separately hand-maintained HTML files |
| `just-go-ghana.html` | Tailored multi-day detail | Same job as day-tour detail, plus payment-plan/instalment presentation | Becomes its own tailored-tour page type — richer than a day-tour detail (deposit schedule, itinerary-by-day, group/reunion framing) |
| *(new)* | Custom-tour planning | Let a visitor describe what they want instead of picking a fixed product | Does not exist today — the site has no custom-tour path beyond the general contact form. New page needed |
| *(new)* | Guest stories | Carry Cynthia's story (and future guest stories) as its own page, not just a homepage section | Does not exist today |
| *(new)* | Stories or field notes | Editorial home for founder notes, cultural context, Instagram-adjacent content | Does not exist today — currently simulated by a stock Instagram strip |
| `contact.html` | Contact and planning | Explain the planning process, set response expectations, start a conversation | No layout change implied — content corrected per Sprint 1 (response-time claims, hours) |
| *(new)* | Policies | Privacy, terms/booking policy, cancellation/refund | Does not exist today — drafted in `docs/legal-pages-draft.md`, needs real pages |
| `thanks.html` | Confirmation/thank-you | Confirm a form submission landed | No structural change — content should match the corrected response-time language |

**Net new pages needed:** custom-tour planning, guest stories, stories/field
notes, and the policy pages (privacy, terms, cancellation). Everything else
is a content-model migration of an existing page, not a new one.

## 2. Content model

Required managed types, per the roadmap, with the fields each one actually
needs based on what Sprint 1 uncovered:

### Site settings
Business name, public descriptor (currently none approved), primary/
international phone, email, hours, response-time promise, service area,
Instagram handle, social links.

### Brand identity
Logo assets (already exist in `assets/`), color tokens, type tokens — this
one can likely just reference the existing `style.css` `:root` variables
rather than being reinvented as CMS-managed data; brand tokens change
rarely enough that code-level ownership is fine.

### Navigation and footer
Nav links, footer columns, footer tagline, social icons — currently
duplicated across 20 HTML files by hand (per CLAUDE.md). This is the
single highest-leverage item to move into a shared template/CMS-managed
structure, since it eliminates the "propagate by Python script across 20
files" maintenance pattern entirely.

### Homepage sections
One record per section (hero, founder story, ways to experience Ghana,
tours, hosting, guest story, reviews, planning, stories, invitation),
matching the approved 10-section order. Each section record needs:
eyebrow, headline, body copy, media reference(s), CTA(s), and a manual
order field (even though the order is currently fixed, a field beats a
hardcoded array so a future re-sequence doesn't require a code change).

### Founder and host profiles
Name, role, languages, background, bio, photo, quote (only if real and
approved) — one record each for Isaac Yeboah and Evans Yirenkyi. Structure
this as its own type (not folded into "team") since there may eventually be
guides beyond the two founders (see "Samuel," Sprint 1 Review Register) —
but nothing forces adding them until real profiles exist.

### Origin story
The "I never knew Ghana looked like this" narrative — long-form text +
media, referenced from both the homepage founder-story section and the
About page, so it's written once.

### Experience pathways
The five "ways to experience Ghana" categories (heritage/homecoming, food/
city, craft/tradition, nature/adventure, celebrations/personal trips).
Each: title, description, representative image, and a link/filter into the
tour catalogue — these are editorial groupings, not a tour field, so they
shouldn't be modeled as a `tours.category` enum alone (a tour can belong to
a pathway without the pathway needing to be a rigid taxonomy).

### Tours
Full detail in the Tour and Media Architecture document (Sprint 2, part 2).

### Featured-tour collections
Replaces `homeFeatured: true`. See the Tour Architecture document — this is
where the "3–5 items, manual order, motivation balance" rule lives.

### Hosting principles
The four "how you are hosted" proof points (context before checklists,
care you can feel, time shaped around you, Ghana beyond the obvious).
Title, description, and optionally a linked review/quote as proof.

### Guest stories
Cynthia's story (and future ones): guest name, story text, related
tour, related review (if any), media, publication state, consent state.

### Reviews
Full detail below under Trust-Aware Fields — this is the type with the
most compliance-sensitive structure.

### Trust facts
Value, label, source, verification date, public display status — directly
matches the Claim Register's structure from Sprint 1. This type is
essentially "the claim register, productionized."

### Planning steps
The 3-step planning process — title, description, CTA per step.

### Social and editorial stories
Instagram/owned content references — post URL or owned asset, caption,
context, publish state. Explicitly not "6 Unsplash images" — every item
needs a real source.

### Calls to action
CTA label + destination, structured centrally so the CTA hierarchy from the
messaging brief (Explore → Learn → Converse → Inspect → Confirm → Book) can
be enforced consistently rather than copy-pasted per page.

### Contact and operating information
Phone(s) — including the new diaspora-labelled international number —
email, hours, response-time promise, service area. This overlaps with
"Site settings" above; in practice these can be the same record, just
listed separately here because the roadmap lists them separately.

### Policies
Privacy, terms/booking policy, cancellation/refund — long-form text +
last-updated date + version. Simple type, but needs a real workflow since
policy changes have compliance weight.

### Media
Full detail in the Tour and Media Architecture document (Sprint 2, part 2).

## 3. Trust-aware fields

This is the schema that turns Sprint 1's manual audit work into something
the CMS enforces automatically instead of relying on someone remembering
to check. Every type that carries a public claim — **Trust facts, Reviews,
Guest stories, Media** — gets this same field set:

| Field | Purpose |
| --- | --- |
| Source | Where the claim/quote/image actually comes from (e.g. "Google Business Profile export, reviews.json") |
| Verification date | When someone last confirmed this is still true |
| Permission state | None / Requested / Granted / Not required — especially for media showing identifiable people |
| Approval state | Draft / Approved / Rejected — an editorial sign-off, distinct from publication |
| Publication state | Draft / Published / Archived |
| Owner | Who's accountable for this record staying accurate |
| Expiry or review date | When this should be re-checked (e.g. the Google rating should be re-verified quarterly per the Claim Register) |
| Channel eligibility | Which channels this is approved for (website / Instagram / Google / etc.) — not every approved fact is approved everywhere |
| Revision history | For policies and trust facts specifically — what changed and when, since these have compliance weight |

This directly operationalizes the Claim Register, Review Source Register,
and Media Source Register from Sprint 1 — those documents are effectively
the seed data for this schema, not separate artifacts that get thrown away
once a CMS exists.

## Resolved (2026-07-25)

Both items below are accepted as proposed, per the general instruction to
optimize for simplicity and not revisit settled architecture without a
real blocker.

1. The "net new pages" list (custom-tour planning, guest stories, stories/
   field notes, policy pages) stands as written.
2. Founder/host profiles remain their own content type, separate from a
   general "team" concept.
3. CMS platform: Sanity — see `docs/sprint-2-cms-evaluation.md`.
