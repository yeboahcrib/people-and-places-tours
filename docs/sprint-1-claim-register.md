# Sprint 1 — Canonical Claim Register

**Status:** Draft scaffold — not yet founder-approved
**Prepared:** July 2026
**Depends on:** `docs/people-and-places-brand-foundation.md`
**Owner of final approval:** Founders, with Codex structuring

## Purpose

This is the single source of truth for every public fact People & Places
uses across the website, Google Business, Instagram, WhatsApp and email. No
claim should be published on any channel unless it has a row here with
`Approved` status.

Each row records: Claim, Approved wording, Source, Owner, Verification date,
Expiry/review date, Approved channels, Status.

## How to use this register

- `Status` starts as `Draft` for anything not yet explicitly founder-approved,
  even if it is already live on the current site.
- `Withheld` means the claim must not be published anywhere until it moves to
  `Approved`.
- `Expired` means the verification date has passed its review window and the
  claim must be re-verified before continued use.
- When a claim changes, add a new row rather than silently editing the old
  one — keep the history.

## Initial approved facts

These already carry founder approval per the Brand Foundation (§2, §25).

| Claim | Approved wording | Source | Owner | Verified | Review by | Channels | Status |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Founding year | Founded in Ghana in 2021 | Founder approval, July 25, 2026 | Founders | 2026-07-25 | — | Website, Google, Instagram, email | Approved |
| Founders | Co-founded by Isaac Yeboah (Nana Yeboah) and Evans Yirenkyi (Kojo) | Founder approval | Founders | 2026-07-25 | — | All | Approved |
| Guests served | More than 300 individual guests served | Founder approval | Founders | 2026-07-25 | Re-verify each quarter | All | Approved |
| Google rating | 5.0 average from 15 Google reviews as of July 2026 | Google Business Profile export | Founders | 2026-07-25 | Re-verify on any new review or quarterly | Website, Google | Approved |
| Trade partnerships | We partner with other tour companies and travel partners to host their clients in Ghana | Founder confirmation, August 5, 2026 | Founders | 2026-08-05 | Re-verify each quarter | Website (About FAQ) | Approved |
| Business hours | Monday–Friday, 9:00 a.m.–5:00 p.m. | Founder approval | Founders | 2026-07-25 | — | All | Approved |
| Response expectation | Usually replies within one hour during business hours | Founder approval | Founders | 2026-07-25 | — | All | Approved |
| Day-tour availability | Day tours can be booked for any day with advance notice; not a fixed daily-departure schedule | Founder approval | Founders | 2026-07-25 | — | All | Approved |
| Solo travel | Solo travelers are welcome on every current tour; group-size ranges start at 1, not 2 | Founder approval | Founders | 2026-07-25 | — | All | Approved |
| Group sizes | Group-size ceilings vary by tour type: day tours keep their existing per-tour max; hands-on workshops (Kente, Batik & Pottery) stay modest (1–8); Just Go Ghana is 1–12 for standard bookings, larger community/reunion groups by arrangement up to 30 (the largest hosted to date) | Founder approval | Founders | 2026-07-25 | Re-verify if a larger group is hosted | All | Approved |
| Primary phone | +233 50 367 3473 | Founder approval | Founders | 2026-07-25 | — | All | Approved |
| International phone | +1 803 477 6489 | Founder approval | Founders | 2026-07-25 | — | All | Approved |
| Service area | Accra and the Adenta Municipality, with experiences across Ghana | Founder approval | Founders | 2026-07-25 | — | All | Approved |
| Languages spoken | English, Twi, Fante and Ga across the founding team; Isaac also speaks some Hausa | Founder approval | Founders | 2026-07-25 | — | All | Approved |
| Offer types | Day tours, tailored multi-day tours (e.g. Just Go Ghana) and custom tours | Founder approval | Founders | 2026-07-25 | — | All | Approved |
| Instagram handle | @peopleand.places | Brand Foundation | Founders | 2026-07-25 | — | All | Approved |

## Explicitly withheld until documented

| Claim | Current risk | Owner | Status |
| --- | --- | --- | --- |
| Ghana Tourism Authority licence | Application in progress, not active — **confirmed again 2026-07-25**: general business registration is done (registered with the Registrar General), but tourism-specific registration/licensing with GTA is not yet active | Founders | Withheld |
| Business insurance | Not currently held, in progress | Founders | Withheld |
| VAT / tax registration (GRA) | Status not yet confirmed — separate from the Registrar General business registration above. See `docs/tax-and-levies-note.md` | Founders | Await evidence |
| Tourism Development Levy (GTA) | Not yet registered — confirmed 2026-07-25, tied to the same pending GTA relationship as the licence | Founders | Withheld |
| Guide certifications (GTA-certified, first-aid) | **Resolved (2026-07-25): no formal certification exists to claim.** Replaced with honest language centered on hosting experience instead — see Truth-Correction Backlog for the drafted replacement | Founders | Decided — not withheld, rewritten |
| Guide certifications — question retired | **Retired 24 August 2026.** The founders asked for no mention of the Ghana Tourism Authority licence and no mention of Google reviews. That left an answer to "Are your guides certified?" that could not address certification at all — and silence under that question reads as a yes, which is the unsupported claim removed in July arriving by implication. The question was replaced with "Who will be guiding me?", which can be answered fully and truthfully: Ghanaian guides, 300+ guests since 2021, and the co-founder who runs the trips. **Do not reintroduce a certification question while the licence is not held.** |
| "All vehicles maintained to international standards" | **Resolved (2026-07-25): same treatment as the guide-certification claim** — drop the specific unsupported claim, replace with plain honest language (e.g. "reliable, well-maintained vehicles suited to each route") | Founders | Decided |

## Claims live on the current site that need a register row

Found in the current codebase; not yet reconciled with the approved facts
above. These should not be migrated as-is (see the Truth-Correction Backlog
for full detail and file references). **This is a documentation finding
only — no code has been changed.** Implementation waits until the Sprint 1
foundation is reviewed and approved, and then proceeds through the normal
Sprint 2/3 process rather than as ad hoc fixes.

| Current claim | Found in | Conflict |
| --- | --- | --- |
| "Founded... est. 2012" | `about.html` (figure caption) | Conflicts with approved 2021 founding year |
| "1,200 travelers from more than 40 countries" | `about.html` stats section | No source; not the approved "300+ individual guests" wording |
| "98% Tour Success Rate" | `about.html` stats section | No source, unverifiable, not in approved facts |
| "500 Positive Reviews" | `about.html` stats section | Contradicts the approved "15 Google reviews" fact |
| "Ghana's premier tour company" | `index.html` meta description + hero subtitle | Superlative rejected in Brand Foundation §13, §19 |
| "All guides are certified by the Ghana Tourism Authority and hold first-aid certifications" | `about.html` FAQ | Licence is not active; unsupported claim |
| "All vehicles are maintained to international standards" | `about.html` why-section | No documented standard |
| "Safety Guaranteed" / "Luxury is our standard" / "portion of every booking" / "24/7... reachable around the clock" | `about.html` why-grid (4 cards) | Each names a claim on the Brand Foundation's "not approved" list |
| Response time: "within a few hours" / "24 hours" / "within 2 hours" (three different claims) + "Available daily, 7am–8pm GMT" | `contact.html` (multiple locations) | Conflicts with each other and with the approved "usually within one hour during Monday–Friday, 9am–5pm" facts |
| Precious Nwokeleme / Tamaro Diallo testimonials (unsourced identity + a real reviewer's name paired with a fabricated quote and stock photo) | `homepage-content.js` | See Review Source Register for full detail |
| Fabricated "Kofi Asante, Founder" identity — appears on **both** `about.html` (Team section, plus 3 other invented staff: Ama Mensah, Kweku Boateng, Abena Darko) and the **homepage itself** (`homepage-content.js` `whyTravel.quote`, rendered on `index.html`) | `about.html`, `homepage-content.js`/`index.html` | **Decision made (2026-07-25): Remove entirely.** Replace with the real founders (Isaac Yeboah, Evans Yirenkyi) behind clearly-labelled neutral placeholders until real approved photos go through the CMS — not yet implemented in code, see Truth-Correction Backlog |
| "We confirm your spot same day" | `homepage-content.js` (`bookingSteps`) | Messaging brief §15 lists same-day confirmation as a claim to defer, not a documented fact |
| Secondary phone not shown anywhere on site | site-wide | **Decided (2026-07-25): add it, labelled for diaspora/international guests** (e.g. "US contact line"). Placement: footer and contact page, same locations the primary number already appears — a reasonable default, matching existing patterns rather than a new decision to litigate. Not yet implemented in code |
| No privacy, terms, cancellation or refund pages exist | site-wide | Sprint 1 §3/§6 requires these before stronger booking promises |

## Confirmed directly from the Google Business Profile Takeout export

The founder-supplied Takeout export (`~/Downloads/Takeout/Google Business
Profile/...`) has been read directly, confirming/refining several facts:

| Field | Exact value from the export | Note |
| --- | --- | --- |
| Regular hours | Mon–Thu 9:00 a.m.–5:30 p.m.; **Fri 9:30 a.m.–5:00 p.m.** | Slightly different from the approved simplified "Mon–Fri 9–5" wording — Friday actually opens later (9:30) and the other four days close later (5:30). Founders should confirm whether to publish the exact per-day hours or keep the simplified version. |
| Additional phone on Google | 024 226 3681 | Confirms the Brand Foundation's note that this needs reconciling with the approved +1 803 477 6489 international number — these are different numbers entirely (024 226 3681 is a second Ghana line, not the international one) |
| Google Business opening date | 2022-01-08 (exact date) | Confirms founding-year note: this is the Google listing date, not the true 2021 founding year |
| Current Google website link | `https://sites.google.com/view/peopleandplacestours/home` | Old Google Sites page — confirmed stale, to be replaced with the production URL (Sprint 5) |
| Current Google Business description | "People & Places is a travel company that curates unique travel experiences for our community..." | Generic, no Ghanaian-perspective/personal-hosting language — matches the roadmap's Sprint 5 note to rewrite this |
| Category | Tour agency | Confirmed, matches approved fact |
| Service types listed | City tours, Group tours, Private tours, **and "Tires"** | The "Tires" service type looks like a Google categorization glitch, not an actual offering — worth removing from the Business Profile |
| Service area | Accra, Ghana + Adenta Municipality, Ghana | Exact match to the approved fact |
| Instagram (from Business Profile attributes) | `instagram.com/peopleand.places` | Matches approved handle |
| Additional booking link found | `https://linktr.ee/Peopleandplaces_1` | Not previously documented — a Linktree currently associated with the Business Profile's "book now" action. Founders should confirm whether this is still active/intended, since it's a live customer-facing link |
| Licence/insurance | Not present in this export at all | Expected — Google Business doesn't track this; must still come from founders directly |

## Fields still open — founder input required

- Business registration public wording (roadmap "Required decisions" table).
- Confirmation of when to re-verify the Google review count/average going
  forward (recommend: on every new review, and quarterly at minimum).
- Whether "usually within one hour" applies identically to WhatsApp, email
  and the website contact form, or differs by channel.
