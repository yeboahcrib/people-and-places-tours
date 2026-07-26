# Sprint 2 — Tour and Media Architecture

**Status:** ✅ Approved (2026-07-25)
**Prepared:** July 2026
**Depends on:** `docs/sprint-1-tour-inventory.md`, `docs/sprint-1-media-source-register.md`,
`docs/manual-booking-workflow.md`

## Purpose

Define the tour data model and the media data model — roadmap Sprint 2
items 4 and 5. The current `tours.js` mixes everything (catalogue content,
homepage curation, pricing, filters) into one flat array of 15 objects with
no provenance. This document separates those concerns so the eventual CMS
has a real schema instead of a bigger version of the same flat file.

## Part 1 — Tour architecture

### Why this needs separating

`tours.js` today conflates: what a tour *is* (description, duration,
locations), what it *costs and how you pay* (price, deposit — which Sprint
1 found actively conflicting in three places), whether it's *featured on
the homepage* (a single boolean with no expiry, no ordering rule, no limit
— which is exactly how the site ended up with 6 featured tours against an
approved 3–5), and *presentation strings* used differently on the homepage
card vs. the packages-page card vs. the detail page. One flat record can't
express "this is accurate, but not featured, and also its deposit rule
just changed" without a schema.

### The separated model

**Catalogue content** (what the tour is)
- Slug, public title, offer type (day / tailored multi-day / custom)
- Duration, locations, starting point/meeting arrangement (standard:
  pickup/drop-off from Accra or the guest's hotel, confirmed Sprint 1)
- Description (short + long), cultural context/story
- Group-size range, following the tour-type framework from the Tour
  Inventory (vehicle-limited / equipment-limited / workspace-limited /
  community-arrangement) rather than one field with no meaning behind it
- Included/excluded
- Active/inactive state
- Accessibility/audience notes

**Pricing** (separate from catalogue content because it changes on a
different cadence and has compliance weight — see the Tax and Levies Note)
- Base price, currency
- Applicable deposit/payment rule reference (see below — this should be a
  *reference* to the one universal policy, not a duplicated field per
  tour, so Sprint 1's deposit conflict can't recur structurally)
- Tax/levy applicability (off by default per the Tax and Levies Note)

**Booking/inquiry data** (operational, not editorial — see the Manual
Booking Workflow)
- This is intentionally **not** part of the CMS content model in the same
  sense as the rest — it's operational data (who booked, when, deposit
  status) rather than published content. Whether it lives in the eventual
  CMS or stays in a simpler operational tool (the interim booking log, or
  a lightweight booking table once real volume justifies it) is a CMS
  Evaluation question, not an information-architecture one.
- The one thing the content model *does* need: a stable tour reference
  (the slug) that booking records can point to, so "this booking is for
  the Cape Coast Ancestral Tour" doesn't depend on matching a free-text
  tour name.

**Search and filters**
- Category/vibe tags (already exist in `tours.js` — `categories`,
  `vibes`) — these stay lightweight tags for `packages.html` filtering,
  not a rigid taxonomy
- Destination region (already exists — `destination`)
- These are catalogue-page concerns, kept separate from the "experience
  pathways" editorial groupings in the Information Architecture doc, which
  serve homepage storytelling rather than filtering

**Operational availability**
- Day tours: "any day with advance notice" (approved fact) — modeled as a
  simple flag/text, not a calendar system, since there's no automated
  booking calendar
- Tailored/custom tours: no fixed availability model needed beyond the
  planning conversation

**Media**
- References into the Media model (Part 2 below), not embedded URLs —
  this is the single most consequential change from `tours.js`, which
  currently embeds raw Unsplash URLs directly in the tour record

**Story content**
- Cultural context/story field (per tour) plus a reference to a Guest
  Story record where one exists (currently only Cape Coast, via Cynthia)

### Featured-tour collections (replaces `homeFeatured`)

The roadmap is explicit that the current boolean should become an
editorial collection. Required behavior, based directly on what went wrong
in Sprint 1 (6 tours ended up featured against an approved 3–5, with no
one having decided that on purpose):

- **Enforced 3–5 item limit** — the system should refuse a 6th, not just
  discourage it
- **Manual order** — not insertion order or alphabetical
- **Start/end dates (optional)** — for seasonal or time-boxed featuring
- **Motivation balance** — a soft-check reminder (per the messaging brief:
  heritage, food/city, craft, nature, tailored multi-day), not a hard rule
- **Draft preview** — see a featured set before it goes live
- **Reason for feature** — a short internal note ("balances the set with a
  craft experience"), so a future edit doesn't have to reverse-engineer why
  a tour was chosen

## Part 2 — Media architecture

### Why this needs its own model

Sprint 1's Media Source Register found real, usable, non-stock photography
already exists (in the Google Business Takeout export) but currently has
zero metadata connecting it to a tour, a consent record, or an approval
state. Meanwhile every tour in `tours.js` points directly at an Unsplash
URL with no indirection — swapping in a real photo today would mean
editing source code. A CMS-managed media type fixes both problems at once.

### The model

| Field | Purpose |
| --- | --- |
| Original upload | The as-uploaded file |
| Optimized derivatives | Web-sized versions generated from the original, not hand-exported |
| Type | Image or video |
| Alt text | Required for publication, not optional |
| Caption | Public-facing, optional |
| Focal point | So responsive crops don't cut off the subject |
| Orientation | Landscape/portrait/square — matters for where a media item can slot into a layout |
| Credit | Photographer/owner, if applicable |
| Owner | Who's accountable for this asset's accuracy (ties to the Trust-Aware Fields owner concept) |
| Consent | None / Requested / Granted / Not required — critical for anything showing an identifiable guest |
| Related people | e.g. "Isaac Yeboah," "Cynthia Muldrow's family" — supports the Brand Foundation's requirement to record who's in a photo |
| Related place / tour / story | Which catalogue record(s) this media supports |
| Placeholder state | Is this a labelled development placeholder or approved final media — directly implements the Brand Foundation's placeholder policy (§18): a placeholder must never be presented as if it were a real named person |
| Public approval state | Draft / Approved / Rejected |

### How this connects to the founders' actual plan

Per the founders' decision this session: real photos will be uploaded
personally once the CMS exists, rather than being sourced from the Google
export in the meantime. That means, practically:

- Every tour and section starts in **Placeholder state** in this model
- The CMS needs to make uploading a replacement and flipping placeholder →
  approved genuinely simple — this is a founder-workflow requirement, not
  just a schema requirement, and should weigh into the CMS Evaluation
  document
- Nothing in this architecture requires the 24 uncharacterized Google
  Business photos to be processed first — the model works the same way
  whether the first real upload comes from that export or from a brand
  new photo

## Resolved (2026-07-25)

Both items below are accepted as proposed — the simpler option in each
case, per the general instruction to optimize for simplicity and not
revisit settled architecture without a real blocker.

1. Booking/inquiry data stays outside the CMS content model, as proposed.
2. The featured-tour collection rules (3–5 limit, manual order) stand as
   written.
