# Plan — Legal & Trust Pages

**22 August 2026.** Written after the founders asked whether to follow
[TravelMo](https://www.travelmo.com/terms-and-conditions) or
[Buoyant Travel](https://buoyanttravel.squarespace.com/) on splitting policies
into separate pages. Nothing here is built yet.

## What the two references actually do

**TravelMo — one page, everything on it.** A single "Booking Policy & Terms"
document with roman-numeral sections: Itineraries, Cancellation, Payments,
Photography Release, Roommate Policy, Airfare, Authority on Trip & Client
Responsibility, Travel Documents, then a COVID-19 waiver and a liability
waiver. Insurance is one clause buried inside the cancellation section.

It is thorough. It is also a wall — a traveller looking for "what happens if I
cancel" has to read past a photography release to find it, and there is no
privacy policy at all.

**Buoyant Travel — three legal pages, plus FAQs.** Their footer carries a
**Legal** column: Terms & Conditions, Travel Insurance, Privacy Policy. The
practical traveller questions live separately again, on a FAQs page.

The Travel Insurance page is the interesting one. It is not a legal document —
it is an operational requirement, and it is short:

- Every traveller **must** provide proof of insurance, due **30 days before
  departure**
- It must cover medical emergency (including repatriation, evacuation, air
  ambulance) and trip inconvenience (delay, baggage, cancellation)
- It names the traveller's responsibility to check their own policy covers
  every activity on the itinerary
- It names three insurers to consider

## Recommendation

**Adopt Buoyant's structure. Use TravelMo as the checklist of what to cover.**

Separate pages win for three reasons that matter to this business specifically.

**A traveller reads one thing at a time.** The single most-read policy is
"what happens if I cancel" — that page already exists and is live. Burying it
inside a nine-section terms document, as TravelMo does, makes the most
important page harder to find, not easier.

**Privacy is legally separate here.** Ghana's Data Protection Act 2012 (Act
843) expects a privacy notice as part of data-controller compliance. It is not
a section of a booking contract, and mixing it in makes both documents worse.
See `docs/legal-pages-draft.md`, which already carries a full draft.

**The machinery now exists.** The cancellation page shipped with a CMS-backed
`policy` type, a source adapter, a renderer and a page template. The schema
already offers `privacy` and `terms` as policy types. Each new page is content
plus a thin page file — not a new system.

Where TravelMo is better is **coverage**. Five things they publish that the
People & Places drafts do not fully address: a photography and video release,
a roommate/single-occupancy policy, airfare responsibility, an explicit
"authority on trip" clause letting the host remove a disruptive guest, and
travel-document responsibility. The drafts cover photography and conduct;
roommates and airfare are missing.

## Proposed structure

| Page | Address | Status |
| --- | --- | --- |
| Cancellation & Refund Policy | `/cancellation-refund-policy` | **Live** |
| Booking Terms & Conditions | `/booking-terms` | Drafted in `legal-pages-draft.md`, not built |
| Travel Insurance | `/travel-insurance` | Not drafted |
| Privacy Policy | `/privacy-policy` | Drafted in `legal-pages-draft.md`, not built |
| Travel Information / FAQs | `/travel-information` | Content exists on the Google Site — 14 answered questions |

Grouped in the footer under a **Legal** heading, as Buoyant does. The current
footer puts the cancellation policy under Quick Links, which will not scale to
four.

**Cancellation stays its own page.** The terms document should link to it, not
restate it. Two documents describing the same refund ladder is how they end up
disagreeing — which is exactly the `$400 vs 30%` conflict this project already
had once.

## Phases

**Phase 1 — Travel Insurance page.** Smallest, highest value, and it protects
the business more than any other page here. Needs one founder decision (below).
Roughly a session.

**Phase 2 — Booking Terms & Conditions.** The draft exists; it needs the five
TravelMo gaps closed, the cancellation section replaced with a link, and the
open questions in the draft answered. The longest content job.

**Phase 3 — Privacy Policy.** Blocked on a real-world action, not on writing:
confirm whether People & Places is registered as a data controller with
Ghana's DPC. Publishing a privacy notice while unregistered describes a
compliance posture that does not exist.

**Phase 4 — Travel Information / FAQs.** The 14 Google Site answers, which are
currently the richest un-migrated content on the old site. Buoyant treats this
as a trust page rather than a legal one, and it belongs in the main navigation
rather than the footer.

## The decision that matters most

**Do you require travel insurance, or recommend it?**

Today the cancellation policy "strongly recommends" it. Buoyant *requires* it,
with proof due 30 days out. The difference is not wording — it decides who
absorbs the loss when a traveller has a medical emergency in Ghana, or cancels
inside 30 days and has paid in full.

Requiring it costs a small amount of friction at booking and removes a category
of dispute the business cannot otherwise win. Recommending it keeps booking
frictionless and leaves the exposure where it is now.

This is a business decision, not a drafting one, and it changes what the
Travel Insurance page says.

## Other decisions needed

- **Roommate / single-occupancy policy.** Just Go Ghana pricing already varies
  by room occupancy. What happens when a solo traveller is matched with a
  stranger and it goes badly?
- **Photography release.** Guest photographs are used in marketing. Does
  booking imply consent, with an opt-out?
- **Authority on trip.** The cancellation policy already says disruptive
  behaviour can mean removal without refund. Terms should say who decides.
- The five open questions already listed at the end of
  `docs/legal-pages-draft.md` — payment processor, cookies, DPC registration,
  lawyer review, public contact address.

## What not to copy

TravelMo's COVID-19 liability waiver is a 2021 artefact. Buoyant's terms lean
heavily on chargeback and arbitration language written for a US company; the
governing-law position for a Ghana-registered business is different and is one
of the things a Ghanaian lawyer should settle.
