# Sprint 1 — Review Source Register

**Status:** Draft scaffold — not yet founder-approved
**Prepared:** July 2026
**Owner of final approval:** Founders, with Codex structuring

## Purpose

Every approved review excerpt must be source-mapped before it can appear on
any channel: reviewer display name, exact source text, selected excerpt,
rating, platform, review date, source URL, related experience, host names
mentioned, publication state, and any related media + permission.

Per the Brand Foundation (§16, §25), the four priority reviewers are Cynthia
Muldrow, Louis Cameron, Heather Harlin and Shy osler. This register maps
those four first, then flags a live conflict found in the current codebase
that must be resolved before any testimonial migrates.

## Source confirmed: Google Business Profile Takeout export

The founder-supplied Google Business Profile Takeout export
(`~/Downloads/Takeout/Google Business Profile/.../reviews.json`) has now
been read directly. It contains **15 reviews, every one rated FIVE stars**
— which also confirms the approved "5.0 average from 15 reviews" fact is
mathematically exact (a 5.0 average across 15 reviews is only possible if
literally all 15 are 5-star). Every review below now has full verbatim text,
exact timestamp and rating sourced directly from this export. The one gap
this export doesn't fill is a public-facing per-review URL — the `name`
field is an internal API resource path (e.g.
`accounts/.../reviews/Ci9DQ...`), not a shareable link. A public deep link
to each review would need to come from the live Google Maps listing itself.

## Priority reviewers

### 1. Cynthia Muldrow — featured guest story

| Field | Value |
| --- | --- |
| Reviewer display name | Cynthia Muldrow |
| Rating | 5 stars (confirmed from export) |
| Platform | Google |
| Review date | 2026-02-12 (exact timestamp confirmed) |
| Source URL | Still open — export has no public review permalink; would need to be pulled from the live Google Maps listing |
| Related experience | Assin Manso Slave River Site and Cape Coast Castle, plus a birthday lunch at Lemon Beach Resort arranged by Kojo |
| Host named | Kojo |
| Related tour record | Cape Coast Ancestral Tour (`slug: cape-coast`) — see Tour Inventory |
| Full source text | Confirmed verbatim in the export — a long, detailed review covering the "Last Bath" history at Assin Manso, a family reflection/prayer moment, a birthday lunch, the Cape Coast Castle dungeons experience, and a family wreath-laying arranged by Kojo. Ends with: "If you are looking for a company who is thoughtful, organized, culturally grounded, and truly invested in your experience, People & Places Tours is the one to book." |
| Selected excerpt (confirmed accurate) | "This was not just a tour — it was emotional, educational, spiritual, and incredibly meaningful for all of us." — **this exact sentence appears verbatim in the source.** The "thoughtful, organized, culturally grounded..." line is also verbatim, from the closing sentence — both excerpts are genuine, from the same single review. |
| Media | Family wreath / heritage-site imagery **only with confirmed family comfort/consent** (messaging brief §13) |
| Publication state | Ready to approve — full text, rating and date confirmed. Only the public source URL remains open. |

### 2. Louis Cameron — supporting review naming Kojo

| Field | Value |
| --- | --- |
| Reviewer display name | Louis Cameron |
| Rating | 5 stars (confirmed) |
| Platform | Google |
| Review date | 2026-02-07 (exact timestamp confirmed) |
| Source URL | Open — same permalink gap as above |
| Related experience | Accra city tour by car — W.E.B. Du Bois Center, Arts Centre, Black Star Square, Makola Market, Kwame Nkrumah Memorial |
| Host named | Kojo |
| **Dual-excerpt question — resolved** | Both candidate excerpts are confirmed genuine and from the **same single review**: "Kojo is an outstanding guide — knowledgeable, patient, and genuinely passionate about sharing Ghana with visitors." appears mid-review, and "People & Places Tours brings pride, warmth, and joy to their work." is the closing line. Either or both can be used. |
| Additional context in full review | The review specifically praises accessibility care for the reviewer's mother ("intentional he was about accessibility and comfort for my mom... That level of care did not go unnoticed") — strong supporting evidence for the "How you are hosted" section's accessibility claim |
| Media | None specified |
| Publication state | Ready to approve — full text, rating and date confirmed. Only the public source URL remains open. |

### 3. Heather Harlin — supporting review naming Nana

| Field | Value |
| --- | --- |
| Reviewer display name | Heather Harlin |
| Rating | 5 stars (confirmed) |
| Platform | Google |
| Review date | 2025-01-08 (exact timestamp confirmed) |
| Source URL | Open |
| Related experience | City Tour |
| Host named | Nana Yeboah (Isaac Yeboah) |
| Full source text | Confirmed verbatim — praises organization, "meticulously organized and well thought out," and Nana's warmth and local insight throughout |
| Selected excerpt (confirmed accurate) | "My tour guide Nana Yeboah was not only knowledgeable but also warm and genuinely passionate about sharing his expertise." |
| Media | None specified |
| Publication state | Ready to approve — full text, rating and date confirmed. Only the public source URL remains open. |
| Note | Brand Foundation §16 flags this as the **only** review focused specifically on Nana. Do not pair it with an unrelated review to manufacture symmetry with Kojo's review count. |

### 4. Shy osler — supporting team review naming both founders

| Field | Value |
| --- | --- |
| Reviewer display name | Shy osler |
| Rating | 5 stars (confirmed) |
| Platform | Google |
| Review date | 2025-03-21 (exact timestamp confirmed) |
| Source URL | Open |
| Related experience | Not specified in the review text itself |
| Hosts named | Kojo and Nana |
| Full source text | Confirmed verbatim — "5 out of 5 stars without hesitation... very flexible... very present, on time for pick ups, well informed about Ghana... payment for tour services was safe and uncomplicated" |
| Selected excerpt (confirmed accurate) | "The tag team who runs and operates the brand People & Places, Kojo & Nana… they hands down score high in my book!" |
| Media | None specified |
| Publication state | Ready to approve — full text, rating and date confirmed. Only the public source URL remains open. |

## Other reviews in the export — full inventory (all 15)

| Reviewer | Date | Names a host? | Notes |
| --- | --- | --- | --- |
| Cynthia Muldrow | 2026-02-12 | Kojo | Featured story — see above |
| Louis Cameron | 2026-02-07 | Kojo | Supporting — see above |
| Jacoya Miller | 2026-02-01 | — | Praises last-minute booking flexibility, Aqua Safari resort trip |
| Ben Nwokeleme | 2025-10-13 | — | Short, generic praise |
| **Precious Nwokeleme** | 2025-10-11 | — | **Real review** — see conflict below, current site quote does not match |
| **Tamaro Diallo** | 2025-05-29 | — | **Real review** — see conflict below, current site quote does not match |
| Shy osler | 2025-03-21 | Kojo, Nana | Supporting — see above |
| Heather Harlin | 2025-01-08 | Nana | Supporting — see above |
| Myra Mirabel Aboagye | 2024-05-08 | **Evans** (named directly, "Evans was very helpful...") | Cape Coast, solo trip on 1-day notice — good accessibility/safety proof |
| Iga Gawronska | 2024-02-26 | "Quojo" (alternate spelling of Kojo) | Shai Hills & Lake Volta — mentions professional photos taken for guests as a nice detail |
| Abre Conner | 2024-01-11 | — | No comment text, rating only |
| Sonora | 2023-12-31 | **Samuel** (a guide, not previously documented) | Praises Samuel's knowledge of Ghanaian history — **confirmed (2026-07-25): Samuel was a guide who helped with one tour**, not a standing team member. No further action needed — the review itself is genuine and doesn't need remapping, and Samuel doesn't need separate representation anywhere (the Team/founder content is about Isaac and Kojo specifically) |
| Denise Collins | 2023-08-11 | — | Four-day tour, group dynamics praised |
| Eman C | 2023-07-11 | Kojo | Shai Hills — candidate 5th excerpt if needed |
| Shirley Borah | 2023-07-11 | — | Short, generic praise |

## P0 conflict — now confirmed, not just suspected

`homepage-content.js` (testimonials section) currently publishes two
testimonials that **misattribute real reviewers' names to fabricated
quotes**. This is now confirmed against the actual source reviews, not just
suspected:

| Current site testimonial | Real source review (confirmed) | Verdict |
| --- | --- | --- |
| "People & Places turned what could have been a stressful trip into the best experience of my life. The guide knew every corner of Accra..." — attributed to **Precious Nwokeleme**, Lagos, Nigeria, stock portrait | Real Precious Nwokeleme review (2025-10-11): "It was a wonderful experience in Ghana. People and Places took care of everything and planned an excellent itinerary... My favorite part was definitely the food." | **Confirmed fabricated quote under a real name.** The location ("Lagos, Nigeria") also is not in the source data at all — invented. |
| "I came to Ghana not knowing what to expect. People & Places exceeded every expectation... last sunset at Ada Foah..." — attributed to **Tamaro Diallo**, Dakar, Senegal, stock portrait | Real Tamaro Diallo review (2025-05-29): "Our best trip in a long time! We discovered P&P through Melanin Travel Magic... from start to finish, we didn't have to worry about a thing — just enjoy the moment." | **Confirmed fabricated quote under a real name.** "Dakar, Senegal" is also invented — not in the source data. |

Both are now backlog status **Remove/Rewrite** (no longer "await evidence") —
the fix is straightforward: replace with the real verbatim quotes above (or
different real reviewers), remove the invented locations, remove the stock
portraits per the "reviewer portraits are optional, default to text-led"
rule.

## Fields still open — founder input required

- Public-facing source URL per review (the export doesn't include one —
  would need pulling from the live Google Maps listing for each review).
- ~~Confirmation of whether "Samuel" is a current guide~~ — **done**, he
  helped with one tour, not a standing team member.
- Confirmation of whether any of these reviewers have given photo permission
  (Brand Foundation §25 confirms permission was obtained generally for
  "customer photographs beside their reviews," but this needs to be
  connected to specific images per reviewer — the export's media files have
  no reviewer linkage).
