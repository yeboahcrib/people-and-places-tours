# Sprint 2 — Workflows, Roles and Acceptance Contracts

**Status:** ✅ Approved (2026-07-25)
**Prepared:** July 2026
**Depends on:** All prior Sprint 2 documents

## Purpose

The last three roadmap Sprint 2 deliverables: workflows and roles,
interfaces/acceptance contracts, and a new Claude Code implementation
brief. This is the document that turns the architecture into something
buildable and testable.

## 1. Publishing workflow

**Draft → editorial review → fact and permission check → preview →
publish → scheduled review → archive**

Mapped to the Trust-Aware Fields model from the Information Architecture
document:

| Stage | What happens | Which field(s) it touches |
| --- | --- | --- |
| Draft | Content created or edited | `publicationState = draft` |
| Editorial review | Someone checks tone/voice against the Brand Foundation | `approvalState` moves toward `approved` or `rejected` |
| Fact and permission check | Source and verification date confirmed for claims; consent confirmed for media | `source`, `verificationDate`, `permissionState` populated — **publish should be blocked without these on Trust facts, Reviews, and Media**, per the roadmap's non-negotiables |
| Preview | Content viewed as it will actually appear, before going live | No field change — a read-only rendering pass |
| Publish | Goes live | `publicationState = published` |
| Scheduled review | A future check-in date, e.g. re-verifying the Google rating quarterly | `expiryOrReviewDate` |
| Archive | Removed from public view without deleting the record | `publicationState = archived` |

This is not a heavier process than a two-person team can actually run — for
Trust facts, Reviews, and Media specifically, "editorial review" and "fact
and permission check" will often be the same person doing both in one
pass. The point of naming them separately in the schema is that the system
tracks *whether* both happened, not that they need to be different people.

## 2. Roles

Per the roadmap's minimum: **Administrator, Editor, Media contributor,
Reviewer/approver.**

Practical reality for a two-founder team: both Isaac and Evans are likely
**Administrators** at launch — there's no one else to assign Editor or
Reviewer to yet. The roles still belong in the schema now, for the same
reason the workflow stages are named separately above: so that adding a
third person later (a content help, a family member helping with
Instagram) doesn't require redesigning permissions, just assigning an
existing role.

| Role | Can do |
| --- | --- |
| Administrator | Everything, including managing other users' roles |
| Editor | Create/edit all content, move through Draft → Review → Preview, cannot publish alone if a stricter workflow is later wanted |
| Media contributor | Upload media, fill in alt text/caption/consent fields — cannot publish or edit non-media content |
| Reviewer/approver | Can approve or reject content and move it toward publish, cannot create new content types or manage users |

## 3. Content schemas and API contracts

**Done** — the actual schema now exists as real code in `studio/`
(a Sanity Studio project, schema validated with `sanity schema validate`:
0 errors, 0 warnings). See `studio/README.md` for setup. Every type from
the Content Model and the Trust-Aware Fields table is implemented as a
real Sanity schema type, not just described in prose.

The rest of this section is kept for reference on the reasoning behind
the schema, which followed from:
- The Content Model (Information Architecture document)
- The Tour and Media Architecture document
- The Trust-Aware Fields table (Information Architecture document)

Once a CMS platform is confirmed (CMS Evaluation document), the next
concrete step is writing these as real schema files (e.g. Sanity schema
types), not re-describing them in prose again here.

## 4. Page-to-content mapping

Every future page reads from named content types — no page should embed
final content directly in a component, per the Sprint 2 exit criteria.

| Page | Reads from |
| --- | --- |
| Homepage | Homepage sections, Featured-tour collection, Founder profiles, Guest stories, Reviews, Trust facts, Planning steps, Social/editorial stories, CTAs |
| About and hosts | Founder profiles, Origin story, Trust facts |
| Full tour catalogue | Tours (all active), Site settings (for filters/categories) |
| Day-tour detail | Single Tour record, related Media, related Guest story (if any) |
| Tailored multi-day detail | Single Tour record (tailored type), Pricing, Policies (deposit/cancellation) |
| Custom-tour planning | Experience pathways, CTAs, Contact/operating info |
| Guest stories | Guest story records, related Reviews, related Tours |
| Stories/field notes | Social and editorial stories |
| Contact and planning | Planning steps, Contact/operating info, Site settings |
| Policies | Policy records |

## 5. Media rules

From the Media Architecture document, restated as **publish-blocking
rules**, not just fields that exist:

- No media item can be published without alt text.
- No media item showing an identifiable person can be published with
  `consent = none` or `consent = requested` — only `granted` or `not
  required` (e.g. a landscape with no people) allows publish.
- A media item in `placeholder` state can be used in a draft or preview,
  but a page cannot go from `draft` to `published` while any of its
  launch-critical media slots (hero, founder photos, featured guest story,
  featured tours) are still placeholders — this directly implements the
  Brand Foundation's placeholder policy as an enforced rule, not a
  reminder.

## 6. Validation rules

- **Trust facts:** cannot publish without `source` and `verificationDate`.
- **Reviews:** cannot publish without `source`, `sourceURL` (or documented
  reason it's unavailable, per the Sprint 1 Review Register's per-review
  URL gap), `rating`, and `date`. Review text is locked as read-only after
  entry, to structurally prevent the "rewritten testimonial" problem found
  in Sprint 1.
- **Tours:** cannot publish without offer type, duration, price, group-size
  range, and starting-point info populated — the goal is that a repeat of
  "6 tours shipped with basically no operational detail" (the state
  `tours.js` was actually in) becomes structurally impossible, not just
  discouraged.
- **Featured-tour collection:** cannot save a 6th active item while 5
  already exist — enforced, not a warning.

## 7. Migration map from current files

| Current file | Becomes |
| --- | --- |
| `tours.js` (15 tour objects) | Tour content type records — one per tour, fields split per the Tour Architecture document (catalogue content / pricing / media references replace embedded Unsplash URLs) |
| `homepage-content.js` | Homepage section records, Founder profile (the `whyTravel.quote` fabricated content is **not** migrated — replaced per the Truth-Correction Backlog), Trust facts (the `stats` array), Reviews (testimonials, corrected per Sprint 1) |
| `homepage-sections.js` | Stays as rendering logic (or its future-framework equivalent) — reads from the CMS instead of `homepage-content.js` |
| Nav/footer markup duplicated across 20 HTML files | Site settings + Navigation/footer content type, referenced once instead of hand-copied 20 times |
| `docs/legal-pages-draft.md` | Policy content type records, once reviewed by counsel |
| Google Business Takeout `reviews.json` | Seed data for Review records (already fully transcribed in the Sprint 1 Review Register) |

**Explicitly not migrated:** the fabricated "Kofi Asante" content, the
false statistics, the mismatched testimonials, the "credit/debit cards"
payment claim, the $400 Just Go Ghana deposit figure — all already marked
Remove/Rewrite in the Truth-Correction Backlog and must not become seed
data for the new system.

## 8. Error and fallback states

- **Empty featured-tour collection:** homepage should not render a broken
  section — fall back to showing the most recently published tours, or
  hide the section, rather than erroring. (Founder decision needed on
  which — flagged below.)
- **Missing media (still placeholder):** render the labelled placeholder
  treatment, never a broken image or a stock photo standing in for a named
  person.
- **Unpublished/archived tour linked from elsewhere:** should 404 or
  redirect to the catalogue gracefully, not show stale content.

## 9. Preview behavior

Preview must show content exactly as it will appear live, including
placeholder states rendered honestly (not hidden) — so a founder previewing
a tour with a placeholder photo sees the placeholder, not a gap or a
guess at what the final image will look like.

## 10. Test contracts

Minimum automated checks once implementation begins (extends the existing
`tests/smoke.js` pattern already used in this repo):

- Homepage renders between 3 and 5 featured tours, never more, never zero
  once at least one exists.
- No published Review, Trust fact, or Media record is missing its required
  trust-aware fields.
- No page renders a `placeholder`-state media item in a launch-critical
  slot once the site is marked "launched."
- Nav/footer content matches across every page (structurally guaranteed
  once it's a shared content reference instead of 20 hand-copied blocks).

## 11. New Claude Code implementation brief (draft)

Per the roadmap, this replaces `docs/claude-homepage-handoff.md` once the
above is approved. Drafting it now so it's ready, not waiting until a
separate pass:

> **Scope:** Implement the approved 10-section homepage (and the
> associated page types above) reading from the CMS content model defined
> in this Sprint 2 documentation set, once a CMS platform is selected and
> schemas exist.
>
> **What Claude Code owns:** layout, responsive composition, component
> presentation, interaction patterns, visual hierarchy, accessibility
> implementation, browser-based visual/interaction QA — per the existing
> project responsibility boundary.
>
> **What Claude Code does not own:** brand positioning, section order,
> offer facts, review wording, trust claims, content schemas, CMS
> workflow, or founder-approved media meaning. Any of these needing to
> change routes back to founder/Codex review, not a UI judgment call.
>
> **Preconditions before this brief activates:** CMS platform selected,
> schemas implemented, real content migrated per the map above (with
> false content excluded), and founders have approved this Sprint 2
> documentation set.
>
> **Reference documents:** this file and the rest of the Sprint 2 set,
> plus every Sprint 1 register for the underlying facts.

**Status: ✅ Approved (2026-07-25).** This is now live guidance for Sprint
3 implementation.

## Resolved open items

1. **Validation rules** — kept as written. None of them add process
   overhead for a 2–3 person team; they're guardrails the system enforces
   automatically (e.g. "reviews are read-only after entry" is a schema
   setting, not an extra task for anyone to do).
2. **Featured-tour empty state** — resolved toward simplicity: **hide the
   section if the featured collection is empty**, rather than building
   separate fallback logic to surface recently-published tours. One state
   to build instead of two.
3. **CMS platform** — Sanity is confirmed (see CMS Evaluation). All schema
   references in this document apply directly, using Sanity's actual
   schema/document model.
