# Manual Booking Workflow (Pre-CMS / Pre-Payment-Processor)

**Status:** Draft process for founder review — not implemented in code
**Prepared:** July 2026
**Depends on:** `docs/sprint-1-policy-payment-register.md` (deposit rule),
`docs/legal-pages-draft.md` (booking terms)

## Why this exists

There is no payment processor integration planned for the near term. The
actual flow is: a visitor picks a tour on the website, submits a booking
request, the team confirms availability and takes payment manually (bank
transfer or Mobile Money), and the booking is marked confirmed once payment
is received. This document defines that flow clearly so it's consistent,
doesn't rely on memory, and doesn't quietly create the same kind of
contradiction problem found elsewhere in Sprint 1 (e.g. the deposit
conflict) — every guest should have the same experience regardless of who
on the team handles their request.

This also feeds directly into Sprint 2's architecture work — the roadmap
already calls for "booking or inquiry data" to be modeled separately from
catalogue content and pricing. This manual process is effectively the
first version of that model, run by hand instead of by a CMS.

## The flow, end to end

1. **Discovery** — Guest browses tours on the website, picks one (or starts
   a custom-tour conversation).
2. **Request** — Guest submits a booking request via a form (see "What the
   form should capture" below) or starts the conversation on WhatsApp.
3. **Acknowledgment** — Guest receives an automatic confirmation that their
   request was received (this can reuse the existing FormSubmit-based email
   flow already on the site) stating: what happens next, and the approved
   response expectation (usually within one hour during business hours).
4. **Availability check** — Team confirms the date/tour is actually
   available (manually, against whatever calendar or booking log is in
   use — see "Interim booking log" below) and replies to the guest.
5. **Payment instructions** — Once confirmed, team sends:
   - A **unique booking reference** (see below)
   - Bank transfer and Mobile Money details
   - The exact amount due (deposit or full amount, per the adopted rule)
   - A payment deadline (see "Holding a date" below)
6. **Payment** — Guest pays directly via bank transfer or Mobile Money, and
   sends proof of payment (screenshot or receipt) via WhatsApp or email,
   whichever's easiest for them.
7. **Reconciliation** — Team manually matches the payment to the booking
   reference and marks the booking confirmed in the booking log.
8. **Confirmation** — Guest receives a confirmation message/email with
   final details (meeting point, what to expect, any preparation notes).
9. **Tour day** — Tour happens. For day tours where full payment was taken
   upfront, no further payment step is needed.

## What the booking form should capture

At minimum, to make manual confirmation and reconciliation possible without
back-and-forth:

- Name
- Email and phone/WhatsApp number
- Which tour (or "custom tour" with a free-text description)
- Preferred date(s) — ideally more than one, since day tours depend on
  availability
- Group size
- Any accessibility or comfort notes (ties into the "How you are hosted"
  brand pillar — asking this upfront, not as an afterthought, is itself a
  trust signal)
- How they'd prefer to be contacted (WhatsApp vs. email) — reduces friction
  since the team can reach out on the guest's preferred channel immediately

This is a content/data requirement, not a code change — it should inform
whichever form exists now or is built during Sprint 2/3.

## Booking reference scheme

A simple, human-typeable reference avoids payment-matching errors — the
single biggest risk in a manual system. Suggested pattern:

```
PP-[YYMM]-[sequential number]
e.g. PP-2607-014
```

Short, easy to read back over WhatsApp or write on a bank transfer note,
and sortable by month for the interim booking log.

## Holding a date

Without a payment processor charging automatically, there's a real risk of
a date being "held" indefinitely for a guest who never pays, blocking other
guests. Recommended holds, consistent with the adopted deposit/cancellation
rule:

- **Day tours:** hold for **48 hours** after payment instructions are sent.
  If payment/proof isn't received in that window, the date opens back up.
- **Tailored multi-day and custom tours:** hold for **72 hours** for the
  deposit. Given these are higher-value, more involved bookings, a slightly
  longer window avoids losing a serious guest over a short delay, while
  still preventing indefinite unpaid holds.

These windows should be stated plainly in the payment-instructions message
so guests know there's a real deadline, without it reading as pressure —
consistent with the brand voice's "confidence without absolutes" principle.

## Interim booking log (until a CMS exists)

Sprint 2/3A will eventually define a proper CMS-backed booking/inquiry
model. Until then, the team needs *something* to avoid double-booking a
date and to track payment status. A shared spreadsheet (Google Sheets, one
row per booking) is the obvious lightweight answer:

| Column | Purpose |
| --- | --- |
| Booking reference | e.g. `PP-2607-014` |
| Guest name/contact | |
| Tour | |
| Date(s) | |
| Group size | |
| Amount due | |
| Amount received | |
| Status | Requested → Awaiting Payment → Confirmed → Completed / Cancelled |
| Notes | Accessibility notes, special requests |

This isn't a website feature — it's an operational tool the team uses
directly, and it's worth setting up regardless of CMS timing, since it's
also exactly the kind of real operational data that will make the eventual
CMS's booking model requirements concrete rather than theoretical.

## What this means for the legal/terms draft

`docs/legal-pages-draft.md` has been updated to describe this manual
process accurately: no card data is collected through the website, payment
happens via direct bank transfer/Mobile Money after a booking request is
confirmed, and a booking reference is used to match payment to booking.

## Resolved (2026-07-25)

Both WhatsApp and email work fine for proof of payment — no need to pick
one as "primary." Reconciliation ownership and the exact hold-window
numbers are day-to-day operating calls for the team, not something that
needs a written protocol here — this document is meant to fix the *shape*
of the process (reference numbers, a booking log, honest terms language),
not manage how the founders run their own operation.

## Receipt generator (built 2026-07-25)

Since there's no payment processor or CMS to generate receipts
automatically, a standalone fillable/printable receipt tool was built to
match this manual process — published as a Claude Artifact, **not part of
the website codebase** (it doesn't touch any file in this repo, so it
doesn't conflict with the project's no-code-before-approval process).

It's modeled on a reference design the founders supplied, restyled to the
actual People & Places brand system (Archivo Black + Inter, brand yellow
`#FFB81C`, the real "P" pin symbol as a watermark) rather than the
reference's placeholder styling, and wired directly to the decisions in
this document and the Policy and Payment Register:

- Reference field auto-suggests the `PP-YYMM-` prefix from the booking
  reference scheme above (staff fill in the sequence number from the
  booking log)
- A Full payment / 30% deposit toggle that computes the amount due and,
  for deposits, shows the balance-due note automatically
- Payment method limited to Bank transfer / Mobile Money (MTN, Vodafone
  Cash, AirtelTigo) — no card option, matching the corrected payment-method
  claim (see Truth-Correction Backlog)
- A status field (Awaiting payment / Deposit received / Paid in full)
  matching this document's booking states
- Print/Save-as-PDF button; nothing is sent to a server or saved anywhere
  — it's a local, fill-in-per-booking tool until a real CMS/backend exists

This is meant as a **now-usable stand-in**, not the final system — once a
CMS and/or payment processor are selected in Sprint 2/3A, receipt
generation should move into that system so it's tied to real booking
records instead of filled in by hand each time.
