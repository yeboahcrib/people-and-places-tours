# Sprint 1 — Truth-Correction Backlog

**Status:** Draft scaffold — not yet founder-approved
**Prepared:** July 2026
**Owner of final approval:** Founders, with Codex structuring

## Purpose

Mark every current site item as Keep, Rewrite, Remove, Replace with sourced
proof, or Await evidence — per roadmap Sprint 1 item 6. This backlog was
built by grepping the live codebase for the specific conflict categories the
roadmap names (invented founders/team, false scale/founding claims, stock
testimonial identities, unsupported certification/safety claims, conflicting
hours, payment contradictions, broken policy links).

Every row below cites a real file location.

## P0 — Invented or unsupported people, statistics and claims

| Item | Location | Current claim | Disposition |
| --- | --- | --- | --- |
| Founding year | `about.html` line 78 | "Accra · est. 2012" (figure caption) | **Rewrite** — replace with approved "Founded in 2021" |
| Founding year (original, pre-edit) | was previously a floating "2012 / Founded in Accra" badge on the same figure | Same conflict | Already partially addressed by the uncommitted `about.html` edit currently in the working tree — confirm the new caption text also gets the year fixed to 2021, not just the visual treatment |
| Guest count | `about.html` line 69 | "we've welcomed over 1,200 travelers from more than 40 countries" | **Rewrite** — replace with approved "More than 300 individual guests served"; drop the "40 countries" figure entirely unless a founder can source it |
| Stats counter: travelers | `about.html` line 144 (`data-target="1200"`) | 1,200 | **Rewrite** — align to 300+ or remove the counter format entirely (roadmap discourages unsupported animated counters) |
| Stats counter: success rate | `about.html` line 148 (`data-target="98"`) | "98% Tour Success Rate" | **Remove** — no source, not in the approved claim register, not independently verifiable |
| Stats counter: positive reviews | `about.html` line 152 (`data-target="500"`) | "500 Positive Reviews" | **Remove** — directly contradicts the approved "15 Google reviews" fact |
| Stats counter: countries | `about.html` line 156 (`data-target="40"`) | "40 Countries Served" | **Await evidence** — only keep if founders can source an actual count of guest countries of origin |
| Superlative positioning | `index.html` line 9 (meta description) | "Ghana's premier tour company" | **Rewrite** — rejected superlative per Brand Foundation §13, §19 |
| Superlative positioning | `index.html` line 62 (hero subtitle) | "Ghana's premier tour company. Real experiences led by real locals, no stress." | **Rewrite** — same issue, also close to the discouraged "real tours, real people, real Ghana" pattern flagged in the messaging brief |
| Instagram tagline pattern | `homepage-content.js` (`instagram.tagline`) | "Real tours. Real people. Real Ghana." | **Rewrite** — this exact phrase is named as a pattern to reduce in the Brand Foundation (§13) |

## P0 — Unsupported certification and safety claims

| Item | Location | Current claim | Disposition |
| --- | --- | --- | --- |
| Guide certification | `about.html` line 248 (FAQ) | "Yes. All of our guides are certified by the Ghana Tourism Authority and hold first-aid certifications." | **Decided (2026-07-25): rewrite, don't claim certification.** No formal guide certifications exist yet — the GTA licence is still in process (confirmed again this session: registered with the Registrar General, but tourism-specific registration/licensing is not yet active). Replace with honest language centered on real hosting experience instead of invented credentials — see the drafted replacement below. |
| Vehicle standard | `about.html` line 109 | "All vehicles are maintained to international standards." | **Remove or rewrite** — "international standards" names no actual standard; Brand Foundation §16 lists this exact phrasing as a claim not approved without documentation |

**Drafted replacement for the guide certification FAQ:**

> "Our team doesn't hold formal guide certifications yet — we're in the
> process of completing our Ghana Tourism Authority licensing. What we
> bring is real, hands-on hosting experience, including welcoming guests
> from the diaspora across the US and beyond who've trusted us with a
> meaningful trip home."

Kept deliberately generic on the training/certification point (there isn't
one to claim), while being honest about what *is* real: hosting experience,
including specifically for diaspora guests reaching out from places like
the US — which is also the reasoning behind adding the international phone
number (see the Claim Register).

## P0 — Stock testimonial identity conflicts

See the Review Source Register for full detail. Summary:

| Item | Location | Issue | Disposition |
| --- | --- | --- | --- |
| Precious Nwokeleme testimonial | `homepage-content.js`, `testimonials.items[0]` | **Confirmed** against the Google Business Profile Takeout export (`reviews.json`): Precious Nwokeleme is a real reviewer (2025-10-11), but her real review ("It was a wonderful experience in Ghana... My favorite part was definitely the food.") is completely different from the quote on the site, and "Lagos, Nigeria" does not appear anywhere in her real review | **Rewrite** — replace with her real verbatim excerpt, remove the invented location, remove the stock portrait |
| Tamaro Diallo testimonial | `homepage-content.js`, `testimonials.items[1]` | **Confirmed** against the same export: Tamaro Diallo is a real reviewer (2025-05-29) whose real review ("...we didn't have to worry about a thing — just enjoy the moment.") is completely different from the quote on the site, and "Dakar, Senegal" does not appear anywhere in her real review | **Rewrite** — replace with her real verbatim excerpt, remove the invented location, remove the stock portrait |

## P0 — Conflicting hours, response times and phone numbers

| Item | Location | Current claim | Disposition |
| --- | --- | --- | --- |
| Response time | `contact.html` line 67 | "We typically respond within a few hours." | **Rewrite** — conflicts with approved "usually within one hour during business hours" |
| Response time | `contact.html` line 88 | "We reply within 24 hours" | **Rewrite** — same conflict, and internally inconsistent with the "few hours" claim two sections above |
| Response time | `contact.html` line 202 | "You'll receive an acknowledgment email within 2 hours" | **Rewrite** — a third, different number on the same page |
| Response time | `contact.html` line 209 | "reviews your preferences and crafts a personalized proposal within 24 hours" | **Rewrite** — reconcile with the one-hour "first response" promise; this may be describing a distinct second step (proposal vs. acknowledgment) and could survive as a *different* claim if clearly labeled as such — founders to confirm |
| Secondary/international phone | Site-wide grep found no occurrence of `+1 803 477 6489` anywhere in the 20 HTML pages | Approved international number is not published anywhere | **Add** — this is a gap, not a conflict; needs to be added once founders confirm placement (footer? contact page only?) |

## P1 — Kumasi duration conflict (catalogue vs. detail page)

| Item | Location | Issue | Disposition |
| --- | --- | --- | --- |
| Kumasi Cultural Immersion duration | `tours.js` (`duration: '2 Days'`) vs. `kumasi-tour.html` (price-sub and highlight-row both say "1 Day") | The catalogue summary and the actual tour page disagree with each other — same pattern as the Just Go Ghana deposit conflict, different field | **Rewrite** — fix `tours.js` to say "1 Day," matching the authoritative detail page. The detail page's own FAQ already correctly describes the overnight stay as an optional add-on, not part of the base duration |

## P1 — Payment contradictions

Full detail in the Policy and Payment Register.

**Decision made (2026-07-25): adopt a universal 30% deposit / balance-due
rule and drop the $400 flat figure entirely.** Full rule in the Policy and
Payment Register's "Adopted general rule of thumb" section, informed by
how comparable diaspora/Africa tour operators (Sorted Chale, TravelMo,
Buoyant Travel) structure theirs. Not yet implemented in code.

| Item | Location | Issue | Disposition |
| --- | --- | --- | --- |
| Universal deposit rate | `contact.html` line 286 | "A 30% deposit secures your booking" | **Keep** — this is now the adopted universal rule |
| Just Go Ghana deposit | `just-go-ghana.html` lines 399, 403, 440, 446 | "$400/person" deposit described in three places, conflicting with the same page's own "30%" instalment-table label | **Rewrite** — replace all $400 references with the adopted 30% rule |
| Payment methods | `contact.html` line 286 | "...and major credit/debit cards" | **Rewrite — remove.** No payment processor is in use; only bank transfer and Mobile Money are actually accepted. See `docs/manual-booking-workflow.md` for the full manual booking/payment process this reflects |

## P0 — Broken or missing policy links

| Item | Status | Disposition |
| --- | --- | --- |
| Privacy policy page | Does not exist anywhere in the 20 HTML pages | **Await evidence** — must be created before Sprint 6 launch readiness, ideally before Sprint 3B copy references it |
| Terms of service page | Does not exist | **Await evidence** — same |
| Cancellation policy page | Does not exist (only inline FAQ mentions on `just-go-ghana.html`) | **Await evidence** — same |
| Refund policy page | Does not exist | **Await evidence** — same |

## Homepage curation conflict (not in the roadmap's original list, found during this audit)

| Item | Location | Issue | Disposition |
| --- | --- | --- | --- |
| Featured-tour count | `tours.js` — 6 records carry `homeFeatured: true` (Just Go Ghana, Accra City, Cape Coast, Ada Foah, Wli Waterfalls, Shai Hills) | Brand Foundation §25 approves a homepage selection of **three to five** tours, not six | **Rewrite** — reduce to 3–5 once founders confirm the final set; see Tour Inventory for the motivation-balance recommendation |

## Newsletter value proposition

| Item | Location | Issue | Disposition |
| --- | --- | --- | --- |
| "Seasonal deals" in newsletter subtitle | `homepage-content.js`, `newsletter.subtitle` | "New tours, seasonal deals, and travel tips." | **Rewrite** — messaging brief §16 explicitly says to "Remove 'seasonal deals' from the primary value proposition" |

## Items already in progress (found as uncommitted working-tree changes)

The working tree currently has uncommitted edits to `about.html` and
`style.css` that appear to already be addressing part of the "est. 2012"
figure caption (changing its visual treatment from a floating badge to a
figcaption). **This does not yet fix the underlying year** — the caption
text still needs to change from "2012" to the approved 2021 founding year,
and the "over 1,200 travelers" line and the four stats counters on the same
page are untouched. Recommend finishing this about.html correction as one
unit rather than partially.

## Additional finding: fabricated "Kofi Asante, Founder" identity — on two pages, including the homepage

A second audit pass (checking `.js` files, not just `.html`) found that the
same fabricated founder is not confined to `about.html` — it also appears
on the **homepage itself**, which makes this the most severe single finding
in this backlog.

| Item | Location |
| --- | --- |
| `about.html` "Team" section — "Kofi Asante, Founder & Lead Guide" (the real founders are Isaac Yeboah and Evans Yirenkyi), plus three further invented staff — Ama Mensah, Kweku Boateng and Abena Darko — each with a stock Unsplash photo captioned as if it were a real employee | `about.html` team-asym section |
| Homepage "Why Travel With Us" section renders a pull-quote figure attributed to **"Kofi Asante, Founder & lead guide"** — same fabricated name, same "Founder" role — with a stock avatar photo, via `whyTravel.quote` in `homepage-content.js`, rendered by `renderWhyTravelSection` in `homepage-sections.js` | `homepage-content.js` (`whyTravel.quote`), rendered on `index.html` |

Both instances directly contradict the approved fact that the founders are
Isaac Yeboah and Evans Yirenkyi — the homepage instance is worse, because
it puts a fabricated quote in a fabricated founder's mouth on the page most
visitors see first. Also note: **no page or script on the current site
mentions the real founders' names anywhere** (confirmed by grepping all
`.html`/`.js` files for "Isaac", "Kojo", "Evans Yirenkyi", "Nana Yeboah" —
zero matches). The founders are currently invisible on their own site,
replaced entirely by an invented person.

This is logged here as a documentation finding only — no code has been
changed. Per this project's process, no website code should change until
the Sprint 1/2 foundation is reviewed and approved.

**Founder decision (2026-07-25): Remove.** Kofi Asante and the three other
invented staff (Ama Mensah, Kweku Boateng, Abena Darko) are to be removed
entirely — both from `about.html`'s Team section and from the homepage
quote in `homepage-content.js`. They are not replaced with stock photos
under the real founders' names. Per the Brand Foundation's placeholder
policy, the real founders (Isaac Yeboah, Evans Yirenkyi) should appear with
clearly-labelled neutral placeholders until real approved photos are
uploaded through the CMS (see below) — this matches the founders' confirmed
approach of using placeholders broadly during development. This is a
recorded decision, not yet implemented in code — per this project's
process, implementation waits until the Sprint 1/2 foundation is reviewed
and approved.

## Additional findings: two more unsupported/conflicting claims in `homepage-content.js`

| Item | Location | Issue |
| --- | --- | --- |
| "We confirm your spot same day" | `homepage-content.js`, `bookingSteps.steps[1].text` | The messaging brief (§15) explicitly lists "Same-day confirmation for every service" as a claim to defer — not documented as universally true |
| "Multi-day tours secured with a 30% deposit — pay the rest before tour day" | `homepage-content.js`, `bookingSteps.steps[1].text` | A **third** location (alongside `contact.html` and `just-go-ghana.html`) making the same 30% claim that directly conflicts with Just Go Ghana's own $400/person deposit language — see Policy and Payment Register |

## Additional finding: every tour's group-size range excludes solo travelers

`tours.js` gives all 15 tours a `groupSize` value starting at "2" (e.g.
"2–8 People", "2–15 People") or the vague "Small Groups." Founder
confirmation (2026-07-25): **solo travel is available on every current
tour** — the "2" floor is wrong across the entire catalogue, not just the
two "Small Groups" placeholders.

**Decision made:** lower every tour's minimum to 1. Ceilings follow a
tour-type framework rather than one blanket number — full detail in the
Tour Inventory's "Group-size framework" section:

- Standard day tours keep their existing per-tour maximum
- Equipment/safety-constrained tours (Quad Bike, Ada Foah canoe safari)
  keep their existing maximum pending confirmation it reflects actual
  equipment capacity
- Hands-on workshop tours (Kente Weaving, Batik & Pottery) stay modest
  (1–8) rather than scaling toward the top end
- Just Go Ghana becomes 1–12 for standard bookings, with larger
  community/reunion groups (up to 30, the largest hosted to date) available
  by arrangement

Not yet implemented in code — `tours.js` still shows every tour starting
at 2.

## Note on this document's status

Everything in this backlog remains a **documentation-only finding**. No
code has been modified as part of Sprint 1 work — that is intentional. The
plan for this project is to complete documentation and get founder
approval on the full foundation (claim register, tour inventory, policy
register, review/media registers, truth-correction backlog, and the
Sprint 2 architecture that follows) before any implementation touches the
live site. This keeps the eventual build systematic and avoids the site
breaking or drifting from source-of-truth later.

## Summary counts

- **Remove or rewrite immediately (P0, no founder input needed beyond
  confirming the approved facts already on record):** 2012 founding year, 40
  countries, 98% success rate, 500 positive reviews, "Ghana's premier tour
  company" (both locations), "Real tours. Real people. Real Ghana.",
  "seasonal deals," Precious Nwokeleme testimonial (real quote now sourced),
  Tamaro Diallo testimonial (real quote now sourced).
- **Decided, not yet implemented (P0):** fabricated "Kofi Asante" founder
  identity (about.html + homepage) — remove entirely, replace with real
  founders behind labelled placeholders; deposit conflict — adopt universal
  30% rule, drop the $400 figure (see Policy Register); all 15 tours'
  group-size minimum — lower from 2 to 1, per the adopted group-size
  framework. A legal-pages drafting pass (privacy policy, terms/booking
  policy, cancellation policy) has also started — see
  `docs/legal-pages-draft.md`.
- **Await founder evidence before deciding (P0):** guide certification
  claim, vehicle-standard claim, missing secondary phone number, Google
  Business hours precision (exact per-day hours vs. simplified Mon–Fri 9–5
  wording), Linktree booking link status.
- **Rewrite once founders confirm final wording (P1):** response-time
  claims (four conflicting numbers across two files), homepage
  featured-tour count (6 → 3–5).
