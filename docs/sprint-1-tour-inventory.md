# Sprint 1 — Master Tour Inventory

**Status:** Draft scaffold — not yet founder-approved
**Prepared:** July 2026
**Owner of final approval:** Founders, with Codex structuring

## Purpose

Per the roadmap, the current 15 tour records in `tours.js` are incomplete.
This document lists every current offer and, for each, the full field set the
roadmap requires before the record can be treated as trustworthy for the
redesign. Fields already populated come directly from the current
`tours.js` — they are **current published values, not verified facts** —
carried into their own column so it is obvious what already exists versus
what still needs a founder answer.

## Required field set (per offer)

- Public title
- Offer type: day / tailored multi-day / custom
- Active or inactive state
- Duration
- Available days or advance-notice rule
- Starting point or meeting arrangement
- Locations
- Intended audience and accessibility considerations
- Group-size rules
- Price and currency
- What is included and excluded
- Deposit and payment rules
- Cancellation and refund rules
- Operational owner
- Accurate media
- Cultural context and human story
- Homepage eligibility

## Current inventory (15 offers, from `tours.js`)

For each offer: what's already in the codebase, and what's still open.

---

### 1. Just Go Ghana (`slug: just-go-ghana`)

| Field | Current value | Status |
| --- | --- | --- |
| Offer type | Tailored multi-day | Confirmed (matches approved offer structure) |
| Duration | 8 Days / 7 Nights | Current site value, unverified |
| Location(s) | Accra, Cape Coast, Elmina, Kumasi, Kakum, Volta Lake | Current site value, unverified |
| Price | $3,000 per person | Current site value — **conflicts with policy register**: see deposit conflict below |
| Group size | **Decided (2026-07-25): 1–12 people for standard bookings; larger community/reunion groups by arrangement, up to 30 based on the largest group hosted to date.** Multi-day tours with accommodation logistics behave differently from day tours — see the Tour Inventory's group-size framework note below | Resolved |
| Active/inactive | **Confirmed active (2026-07-25)** — all 15 tours are current | Resolved |
| Available days / advance notice | Not stated | **Open** |
| Starting point / meeting arrangement | **Confirmed (2026-07-25): pickup and drop-off from Accra or the guest's hotel, standard**, unless the guest requests a different arrangement | Resolved |
| Audience / accessibility | Not stated | **Open** |
| Included / excluded | **Pickup/drop-off confirmed standard inclusion** (see Starting point). Meals/entrance-fee specifics still not itemized — "accommodation, meals, local guides, and airport transfers" in package description, no formal inclusion/exclusion list | Partially resolved |
| Deposit / payment rules | Superseded — see the adopted universal deposit rule in the Policy and Payment Register (30% deposit / balance 30 days out for tailored tours) | Resolved |
| Cancellation / refund | Superseded — see the adopted universal rule in the Policy and Payment Register | Resolved |
| Operational owner | **Confirmed (2026-07-25): not applicable.** No per-tour guide assignment exists — this is a two-founder operation, not something guests choose or that's tracked per tour | Resolved (not applicable) |
| Accurate media | Unsplash stock image | Placeholder — needs founder-approved original |
| Cultural context / story | Not written | **Open** |
| Homepage eligibility | Currently `homeFeatured: true`, `homeOrder: 1` | Pending confirmation against the 3–5 featured-tour decision |

---

### 2. Accra City Tour (`slug: accra-city`)

| Field | Current value | Status |
| --- | --- | --- |
| Offer type | Day tour | Confirmed |
| Duration | Half Day | Unverified |
| Location(s) | Accra (Makola Market, National Museum, Kwame Nkrumah Mausoleum, Jamestown lighthouse) | Unverified |
| Price | $100 per person | Unverified |
| Group size | 1–8 people | Minimum lowered to 1 — solo travel confirmed available (2026-07-25); max unchanged, still unverified |
| Active/inactive | Assumed active (homepage-featured) | Confirm |
| Available days / advance notice | Not stated — should inherit the approved day-tour rule ("any day with advance notice") | Confirm founders want this applied uniformly |
| Starting point | Not stated | Open |
| Audience / accessibility | Not stated | Open |
| Included / excluded | Not stated | Open |
| Deposit / payment | Not stated at tour level | Open — see Policy Register |
| Cancellation / refund | Not stated at tour level | Open |
| Operational owner | Not stated | Open |
| Accurate media | Unsplash stock | Placeholder |
| Cultural context / story | Not written | Open |
| Homepage eligibility | `homeFeatured: true`, `homeOrder: 3` | Pending confirmation |

---

### 3. Jamestown Heritage Walk (`slug: jamestown`)

| Field | Current value | Status |
| --- | --- | --- |
| Offer type | Day tour | Confirmed |
| Duration | 4 Hours | Unverified |
| Location(s) | Accra (Jamestown) | Unverified |
| Price | $85 per person | Unverified |
| Group size | 1–10 people | Minimum lowered to 1 — solo travel confirmed available (2026-07-25); max unchanged, still unverified |
| Active/inactive | Not currently homepage-featured | Confirm active/inactive for catalogue |
| Remaining fields | Not stated | Open — same field list as above |

---

### 4. Accra After Dark Food Tour (`slug: accra-food`)

| Field | Current value | Status |
| --- | --- | --- |
| Offer type | Day tour | Confirmed |
| Duration | Evening | Unverified |
| Location(s) | Accra | Unverified |
| Price | $110 per person | Unverified |
| Group size | 1–8 people | Minimum lowered to 1 — solo travel confirmed available (2026-07-25); max unchanged, still unverified |
| Remaining fields | Not stated | Open |

---

### 5. Cape Coast Ancestral Tour (`slug: cape-coast`)

| Field | Current value | Status |
| --- | --- | --- |
| Offer type | Day tour | Confirmed |
| Duration | Full Day | Unverified |
| Location(s) | Cape Coast, Elmina, Kakum | Unverified |
| Price | $160 per person | Unverified |
| Group size | 1–12 people | Minimum lowered to 1 — solo travel confirmed available (2026-07-25); max unchanged, still unverified |
| Active/inactive | `homeFeatured: true`, `homeOrder: 2` | Confirm — likely a strong heritage-tour candidate per the messaging brief's featured-tour mix |
| Cultural context / story | This is the site of the Cynthia Muldrow guest story per the Brand Foundation — should carry the strongest human context of any tour record | **Priority to complete** |
| Remaining fields | Not stated | Open |

---

### 6. Elmina Castle & Fishing Village (`slug: elmina`)

| Field | Current value | Status |
| --- | --- | --- |
| Offer type | Day tour | Confirmed |
| Duration | Full Day | Unverified |
| Location(s) | Cape Coast area (Elmina) | Unverified |
| Price | $130 per person | Unverified |
| Group size | 1–12 people | Minimum lowered to 1 — solo travel confirmed available (2026-07-25); max unchanged, still unverified |
| Remaining fields | Not stated | Open |

---

### 7. Kumasi Cultural Immersion (`slug: kumasi`)

| Field | Current value | Status |
| --- | --- | --- |
| Offer type | **Confirmed (2026-07-25): day tour** | Resolved |
| Duration | **Data conflict found and resolved: `tours.js` says "2 Days," but the actual tour page (`kumasi-tour.html`) says "1 Day" in two places** (price-sub and highlight-row). The tour page is authoritative — it's a 1-day tour. `tours.js`'s "2 Days" value is wrong and needs correcting when code work resumes | Resolved — `tours.js` is the one that's wrong |
| Location(s) | Kumasi | Unverified |
| Price | $250 per person | Unverified |
| Group size | 1–10 people | Minimum lowered to 1 — solo travel confirmed available (2026-07-25); max unchanged, still unverified |
| Overnight logistics | **Resolved — already answered on the tour page itself.** `kumasi-tour.html`'s own FAQ: "Can I stay overnight in Kumasi? Yes — and we'd recommend it to avoid the very long return drive. We can arrange a one or two-night stay as an add-on. Ask when booking." Overnight stay is optional, arranged and priced separately at booking — not included in the $250 base price | Resolved |
| Remaining fields | Not stated | Open |

---

### 8. Kente Weaving Village (`slug: kente`)

| Field | Current value | Status |
| --- | --- | --- |
| Offer type | Day tour | Confirmed |
| Duration | Full Day | Unverified |
| Location(s) | Kumasi (Bonwire) | Unverified |
| Price | $115 per person | Unverified |
| Group size | 1–8 people | Minimum lowered to 1 — solo travel confirmed available (2026-07-25); max unchanged, still unverified |
| Remaining fields | Not stated | Open |

---

### 9. Ada Foah Beach & Canoe Safari (`slug: ada-foah`)

| Field | Current value | Status |
| --- | --- | --- |
| Offer type | Day tour | Confirmed |
| Duration | Full Day | Unverified |
| Location(s) | Ada Foah | Unverified |
| Price | $150 per person | Unverified |
| Group size | 1–15 people | Minimum lowered to 1 — solo travel confirmed available (2026-07-25); max unchanged, still unverified |
| Homepage eligibility | `homeFeatured: true`, `homeOrder: 6` | Pending confirmation |
| Remaining fields | Not stated | Open |

---

### 10. Quad Bike & Waterfalls (`slug: quad-bike`)

| Field | Current value | Status |
| --- | --- | --- |
| Offer type | Day tour | Confirmed |
| Duration | Full Day | Unverified |
| Location(s) | Volta Region | Unverified |
| Price | $130 per person | Unverified |
| Group size | 1–8 people | Minimum lowered to 1 — solo travel confirmed available (2026-07-25); max unchanged, still unverified |
| Safety / accessibility | Quad biking implies physical-activity and safety considerations not currently documented anywhere | **Open — relevant to accessibility field and to the withheld safety-claim question** |
| Remaining fields | Not stated | Open |

---

### 11. Wli Waterfalls Hike (`slug: volta`)

| Field | Current value | Status |
| --- | --- | --- |
| Offer type | Day tour | Confirmed |
| Duration | Full Day | Unverified |
| Location(s) | Volta Region | Unverified |
| Price | $180 per person | Unverified |
| Group size | 1–12 people | Minimum lowered to 1 — solo travel confirmed available (2026-07-25); max unchanged, still unverified |
| Homepage eligibility | `homeFeatured: true`, `homeOrder: 5` | Pending confirmation |
| Physical accessibility | Described as a "guided jungle hike" — accessibility considerations for guests with mobility limitations not documented | Open |
| Remaining fields | Not stated | Open |

---

### 12. Shai Hills & Boat Cruise (`slug: shai-hills`)

| Field | Current value | Status |
| --- | --- | --- |
| Offer type | Day tour | Confirmed |
| Duration | Full Day | Unverified |
| Location(s) | Accra Area | Unverified |
| Price | $130 per person | Unverified |
| Group size | 1–10 people | Minimum lowered to 1 — solo travel confirmed available (2026-07-25); max unchanged, still unverified |
| Homepage eligibility | `homeFeatured: true`, `homeOrder: 4` | Pending confirmation |
| Remaining fields | Not stated | Open |

---

### 13. Aburi Day Tour (`slug: aburi`)

| Field | Current value | Status |
| --- | --- | --- |
| Offer type | Day tour | Confirmed |
| Duration | Full Day | Unverified |
| Location(s) | Aburi Hills | Unverified |
| Price | $100 per person | Unverified |
| Group size | 1–15 people | Minimum lowered to 1 — solo travel confirmed available (2026-07-25); max unchanged, still unverified |
| Remaining fields | Not stated | Open |

---

### 14. Akosombo Dam & Lake Volta Cruise (`slug: akosombo`)

| Field | Current value | Status |
| --- | --- | --- |
| Offer type | Day tour | Confirmed |
| Duration | Full Day | Unverified |
| Location(s) | Akosombo | Unverified |
| Price | $110 per person | Unverified |
| Group size | 1–12 people | Minimum lowered to 1 — solo travel confirmed available (2026-07-25); max unchanged, still unverified |
| Remaining fields | Not stated | Open |

---

### 15. Batik & Pottery Workshop (`slug: batik-workshop`)

| Field | Current value | Status |
| --- | --- | --- |
| Offer type | Day tour | Confirmed |
| Duration | 1 Day | Unverified |
| Location(s) | Accra | Unverified |
| Price | $120 per person | Unverified |
| Group size | **Decided (2026-07-25): 1–8 people** — kept modest and matched to Kente Weaving Village's range rather than extended toward the 30-person ceiling, since this is a hands-on workshop constrained by a single artisan's physical workspace | Resolved |
| Remaining fields | Not stated | Open |

---

## Cross-cutting gaps across all 15 offers

- **Deposit/cancellation — resolved.** All 15 offers now follow the
  universal rule in the Policy and Payment Register (30% deposit / balance
  30 days out for tailored tours; full payment / 48-hour cancellation
  window for day tours), replacing the old "only Just Go Ghana has payment
  language, and it conflicts with itself" gap.
- **Active/inactive — resolved.** All 15 tours confirmed active (2026-07-25).
- **Starting point and pickup/drop-off — resolved.** Standard across every
  offer: pickup and drop-off from Accra or the guest's hotel, unless the
  guest requests a different arrangement. Meals and entrance-fee inclusions
  are still not itemized per tour — that remains open, but it's a smaller
  gap than "nothing is documented."
- **Operational owner — resolved as not applicable.** This is a
  two-founder operation with no per-tour guide assignment; this field
  doesn't apply and can be dropped from the required field set for now.
- **No offer has accessibility or intended-audience notes.** Still open —
  this is content-production work (Sprint 3B), not a blocking fact gap.
- **No offer has cultural context or human story content**, despite this
  being a Brand Foundation priority (Pillar 1, Pillar 3). Still open, same
  reason — Sprint 3B territory.
- **Every image is Unsplash stock**, not an owned/approved photograph.
- **Group-size minimums resolved (2026-07-25): solo travel is available.**
  Every one of the 15 tours previously started its range at "2 people,"
  which would have meant the site was quietly telling solo travelers they
  couldn't book any tour. All ranges above have been corrected to start at
  1. This is a real site-wide correction, not just a formatting fix for the
  two "Small Groups" placeholders — see the Truth-Correction Backlog.

### Group-size framework (adopted 2026-07-25)

Rather than one blanket number, group-size ceilings follow the actual
operational constraint behind each tour type:

| Tour type | What sets the ceiling | Examples |
| --- | --- | --- |
| Standard day tours | Vehicle/logistics capacity for that specific route | Accra City, Cape Coast, Elmina, Jamestown, Aburi, Akosombo, Accra Food — existing max kept as-is, floor lowered to 1 |
| Equipment/safety-constrained day tours | Number of vehicles/seats/safety ratio, not just group logistics | Quad Bike & Waterfalls, Ada Foah Canoe Safari — existing max kept as-is pending confirmation of actual equipment capacity |
| Hands-on workshop tours | A single artisan's physical workspace | Kente Weaving Village, Batik & Pottery Workshop — kept modest (1–8) rather than extended toward the 30-person ceiling |
| Multi-day/tailored tours | Accommodation and multi-day logistics, but genuine demand for larger community/reunion trips | Just Go Ghana — 1–12 for standard bookings, larger groups (up to 30, based on the largest hosted to date) by arrangement |

The 30-person figure is the largest group hosted to date, not a target —
it applies specifically to Just Go Ghana-style multi-day bookings where
group/reunion demand is real, not as a blanket number across the catalogue.
Kumasi Cultural Immersion (2 days, also multi-day) should probably follow
the same "typical range + larger by arrangement" model once its overnight
logistics are confirmed (see below).
- Homepage-featured set currently includes **6** tours (`homeFeatured: true`
  on Just Go Ghana, Accra City, Cape Coast, Ada Foah, Wli Waterfalls, Shai
  Hills) — this exceeds the approved 3–5 range and needs founder
  reconciliation (see truth-correction backlog).

## Founder decisions needed before this inventory can exit Sprint 1

1. ~~Confirm active/inactive state for all 15 offers~~ — **done**, all 15
   confirmed active.
2. ~~Resolve the Just Go Ghana deposit conflict~~ — **done**, see Policy
   and Payment Register.
3. ~~Decide whether Kumasi Cultural Immersion is a day tour or tailored
   multi-day~~ — **done, it's a day tour.** Also found and resolved along
   the way: `tours.js` says "2 Days" but the tour's own page says "1 Day"
   — a real data conflict between the catalogue file and the detail page,
   not just an open question. The tour page is authoritative: 1 day, with
   an optional overnight add-on already described in its own FAQ.
4. ~~Supply group-size ranges~~ — **done**, see the group-size framework.
5. ~~Supply deposit, cancellation and refund rules per offer~~ — **done**,
   a single policy applies uniformly (Policy and Payment Register).
6. ~~Supply starting point / pickup policy~~ — **done**, standard pickup
   and drop-off from Accra or the guest's hotel across all offers.
7. ~~Supply operational owner per offer~~ — **done, not applicable** —
   no per-tour guide assignment in a two-founder operation.
8. Reduce the current 6-item `homeFeatured` set to the approved 3–5, per the
   messaging brief's motivation-balance guidance (heritage, food/city, craft,
   nature, tailored multi-day). Still open — this is a Sprint 3B decision
   per the roadmap, not a Sprint 1 blocker.
9. Supply accessibility and audience notes per offer, especially for
   physically demanding tours (Quad Bike, Wli Waterfalls hike). Still open
   — Sprint 3B content work.
10. Supply cultural context/story content, starting with Cape Coast
    (Cynthia's story) as the highest-priority record. Still open — Sprint
    3B content work.
