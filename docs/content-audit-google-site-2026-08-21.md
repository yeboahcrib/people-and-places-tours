# Content Audit — Google Site vs the New Website

**21 August 2026.** Phases 1–4 of the founder's audit brief: crawl, inventory,
compare, map. **Nothing has been changed.** This document is the thing to
argue with before any content is edited.

Source of truth crawled: `https://sites.google.com/view/peopleandplacestours/`
— ten pages, including two not reachable from the navigation
(`/cancellation-refund-policy` and `/travel-packages/feelin-ghana-booking-form`).

## 1. What the Google Site actually contains

| Page | What is on it |
| --- | --- |
| Home | Four "why travel with us" pillars: Local Expertise, Flexible Bookings, Safety & Security, Local Community |
| Travel Packages | One package card — "Feel'in Ghana", 8 days/7 nights, **$2,400 p/p** |
| Just Go Ghana Package | Full 8-day itinerary with per-day meals, inclusions/exclusions, pricing, payment options, cancellation summary, 2 testimonials, **14 answered FAQs** |
| Day Tours | **Nine** day tours, name and price only — no descriptions, no durations |
| Private Experiences | **Empty.** Heading only |
| Gallery | Images |
| Project | #Connect4Change digital-literacy initiative — problem, solution, how to help |
| About | Who We Are (4 paragraphs) + four services |
| Cancellation & Refund Policy | A complete, specific policy — tiers, fees, liability, contact |
| Feel'in Ghana booking form | Form only |

## 2. Tour reconciliation

The Google Site sells **one package and nine day tours**. The new website
lists **fifteen tours**. Prices agree wherever both sites name the same tour.

### Matched — nine day tours, all prices agree

| Google Site | New site catalogue | New site page heading | Price |
| --- | --- | --- | --- |
| Accra City Tour | Accra City Tour | Accra City Tour | $100 ✓ |
| Cape Coast Ancestral Tour | Cape Coast Ancestral Tour | Cape Coast Ancestral Tour | $160 ✓ |
| Shai Hills & Boat Cruise | Shai Hills & Boat Cruise | Shai Hills & Boat Cruise | $130 ✓ |
| Kumasi Cultural Tour | Kumasi Cultural **Immersion** | Kumasi Cultural **Tour** | $250 ✓ |
| Quadbike & Waterfalls | Quad Bike & Waterfalls | Quadbike & Waterfalls | $130 ✓ |
| Aburi Day Tour | Aburi Day Tour | Aburi Day Tour | $100 ✓ |
| Volta Day Tour | **Wli Waterfalls Hike** | Volta Day Tour | $180 ✓ |
| Ada Day Tour | **Ada Foah Beach & Canoe Safari** | Ada Day Tour | $150 ✓ |
| Batik & Pottery Workshop | Batik & Pottery Workshop | Batik & Pottery Workshop | $120 ✓ |

**The new site disagrees with itself.** For four tours, the name in the
catalogue (`tours.js` — which feeds the packages grid, the homepage cards, the
contact dropdown and site search) is not the name on the tour's own page. A
visitor clicks "Wli Waterfalls Hike" and lands on a page titled "Volta Day
Tour". That is a bug regardless of which name is correct.

### Unmatched — six entries with no basis on the Google Site

| New site | Price | Assessment |
| --- | --- | --- |
| Elmina Castle & Fishing Village | $130 | On the Google Site, Elmina is an **optional add-on inside the Cape Coast day**, not a separate tour. Strong candidate for the "one tour split into two" problem |
| Akosombo Dam & Lake Volta Cruise | $110 | The Google Site sells "Shai Hills **& Boat Cruise**" as one $130 day, and the package's Day 6 is Shai Hills *and* Akosombo together. Second strong split candidate |
| Kente Weaving Village | $115 | Bonwire is outside Kumasi; plausibly part of the Kumasi Cultural Tour rather than standalone |
| Jamestown Heritage Walk | $85 | No trace on the Google Site |
| Accra After Dark Food Tour | $110 | No trace on the Google Site |
| Just Go Ghana (package) | $3,000 | Real — but see the price conflict below |

I cannot tell from the Google Site alone whether these six are inventions or
real offerings that were never added to the old site. **This is the single
biggest question in this audit** and only the founders can answer it.

## 3. Factual conflicts

**The package price contradicts itself on the Google Site.** The Travel
Packages card says **$2,400 p/p**; the package's own page says **from $3,000
per person**. The new website says $3,000, matching the detail page. Likely a
stale card, but it needs confirming — it is the largest number on the site.

**The package has two names.** The card calls it "Feel'in Ghana"; the page and
the new site call it "Just Go Ghana". The booking form URL is still
`feelin-ghana-booking-form`.

**Deposit terms.** The Google Site is specific: a **$400 non-refundable**
deposit per person, balance due 30 days before arrival. The new site
deliberately avoids naming a figure — this traces back to the documented
"$400 vs 30%" conflict that the truth-correction sprint flagged. The Google
Site now states $400 unambiguously, which resolves that conflict, but the
committed policy register still says otherwise and should be reconciled.

**Durations are unverifiable.** The Google Site gives no durations for any day
tour. Every duration on the new site ("Half Day", "4 Hours", "Evening") is
therefore unsourced. Not necessarily wrong — just not confirmable from the
stated source of truth.

## 4. Content on the Google Site that is missing entirely from the new site

**The cancellation and refund policy.** The new website has no policy page of
any kind — no cancellation, no refund, no privacy, no terms. The Google Site
carries a complete one: a 60+ / 31–59 / ≤30-day refund ladder, a $150
rescheduling fee, a 45-day rescheduling deadline, what happens when *we*
cancel, liability, and participant-conduct terms. A tour business taking
deposits with no published cancellation terms is the most serious gap this
audit found, and it is a legal exposure rather than a content one.

**#Connect4Change.** The digital-literacy initiative has its own page on the
Google Site and is one of the four homepage pillars ("Local Community", "a
percentage of your payment goes towards providing digital literacy skills for a
child"). It appears **nowhere** on the new website. This is a differentiator
competitors cannot copy and it is currently invisible.

**Fourteen answered FAQs.** Visa, yellow-fever requirements, travel insurance,
currency and USD bill-date advice, SIM cards and Wi-Fi, packing list including
the white outfit for ancestral ceremonies, airport-transfer procedure, activity
level, food. The new site's FAQs are thinner and partly overlap. This is the
richest reusable content on the old site.

**The four services** — Immersive Tours, Customized Travel, Hotel
Accommodation, Travel Documentaries & Photography. The last two are business
lines that the new site does not mention at all.

**Testimonial.** Tamaro Diallo ("discovered P&P through Melanin Travel Magic")
is on the Google Site and not in the new site's review set.

## 5. What the new site does better, and must keep

The Just Go Ghana page is the clearest case: its day-by-day itinerary matches
the Google Site's facts closely while reading far better. Also worth
protecting: the packages card grid, the booking sidebar, the accordion
itinerary, the included/not-included checklist, the "Did You Know" treatment,
and the progressive-enhancement work on the contact flow. None of these exist
on the Google Site and none should be traded away for it.

## 6. Content mapping

| Google Site | Destination in the new architecture |
| --- | --- |
| Day Tours (9 entries) | `tours.js` / Sanity `tour` documents — names and prices |
| Just Go Ghana itinerary | Already in `just-go-ghana.html`; belongs in the `tour` schema once the itinerary fields from the CMS tour-page plan exist |
| 14 FAQs | The `tour` schema's FAQ field (also not yet built) plus a site-wide travel-information section |
| Cancellation & Refund Policy | The `policy` Sanity type — currently registered but read by nothing, and a new page the site does not have |
| About / Who We Are | `aboutPage` |
| Four services | About page or homepage |
| #Connect4Change | A new page, plus a homepage mention |
| Home pillars | Compare against the existing "how we host" principles |
| Contact details | `siteSettings` — WhatsApp +233 50 367 3473 and peopandplaces@gmail.com are stated publicly on the old site |

Two of these destinations do not exist yet: tour FAQs and itineraries are
Phase 1 of `docs/plan-cms-generated-tour-pages.md`, and the `policy` type has
no page to render into. **The audit and that plan are the same piece of work**
— the content has nowhere to live until the schema does.

## 7. Deliberately not migrated

- **Gallery images.** Ownership and subject consent are unclear, and the new
  site's photography direction gates publication behind approval states.
- **The $2,400 price.** Contradicted by the same site's detail page.
- **The empty Private Experiences page.** Nothing to migrate.
- **"COPYRIGHT ©2024"** and other Google Sites chrome.

## 8. Questions only the founders can answer

1. **Are Jamestown, Accra After Dark, Elmina, Kente Village and Akosombo real
   tours you sell?** If yes, they need real prices and descriptions confirmed.
   If no, they should be removed or folded back into the tours they were split
   from. This blocks everything else.
2. **Is the package $3,000 or $2,400?**
3. **Is it "Just Go Ghana" or "Feel'in Ghana"?**
4. **Is the $400 non-refundable deposit current and correct for all bookings**,
   or does it apply only to the package?
5. **Which name is right** for Volta/Wli, Ada/Ada Foah, and Kumasi
   Tour/Immersion — and do you want the day tours renamed to match the Google
   Site, or the Google Site names updated to the newer ones?
6. **Should the cancellation policy be published as-is** pending a lawyer's
   review, or held back until reviewed?
