# Sprint 1 — Policy and Payment Truth Register

**Status:** Draft scaffold — not yet founder-approved
**Prepared:** July 2026
**Owner of final approval:** Founders, with Codex structuring

## Purpose

Resolve and document deposit, payment, cancellation, refund, rescheduling,
weather/operational-change, guest-responsibility, accessibility/health,
privacy and terms policy — per roadmap Sprint 1 item 3. Nothing here may be
migrated to the new site until it is reconciled.

## P0 — The deposit conflict

The roadmap flags this by name: *"The existing universal 30% and Just Go
Ghana $400/30% conflict must not be migrated without resolution."*

Confirmed in the current codebase:

| Location | Deposit language |
| --- | --- |
| `contact.html:286` (general FAQ) | "A 30% deposit secures your booking, with the balance due before the tour date." |
| `homepage-content.js` (`bookingSteps.steps[1].text`, rendered on `index.html`) | "Multi-day tours secured with a 30% deposit — pay the rest before tour day." — a **third** location repeating the 30% figure |
| `just-go-ghana.html:440` (deposit note) | "A non-refundable deposit of **$400/person** reserves your dates." |
| `just-go-ghana.html:446` (instalment table cell) | Labels the deposit as **30%** in the same page as the $400 figure above |
| `just-go-ghana.html:399` (FAQ) | "After your $400 deposit, you can make monthly payments. Final balance must be cleared 30 days before arrival." |
| `just-go-ghana.html:403` (FAQ) | "The $400 deposit is non-refundable... Any trip cancelled less than 30 days before arrival is 100% non-refundable." |

$400 is 13.3% of the $3,000 Just Go Ghana price, not 30% — so even within
the single Just Go Ghana page, the $400 figure and the 30% figure describing
"deposit now" cannot both be true. **This must be resolved by the founders
before any deposit language is migrated.**

### Adopted general rule of thumb (2026-07-25)

Founder decision: rather than a different rule per offer, adopt **one
universal deposit/cancellation rule** and drop the flat $400 Just Go Ghana
figure entirely — it's the outlier (it appears nowhere else, doesn't match
its own page's 30% instalment-table label, and isn't even 30% of the $3,000
price). 30% is kept because it's already the majority figure on the site
(3 of 6 conflicting mentions).

This mirrors the pattern used by comparable diaspora/Africa tour operators
researched for this decision — [Sorted Chale](https://sortedchale.com/),
[TravelMo](https://www.travelmo.com/terms-and-conditions) and
[Buoyant Travel](https://buoyanttravel.com/terms-conditions) — all of which
use some form of: a deposit that becomes non-refundable shortly after
booking, a balance due on a fixed schedule before departure, an escalating
forfeiture window, a force majeure carve-out for company-side changes, and
a travel-insurance recommendation or requirement.

**The rule, as adopted:**

| Element | Rule |
| --- | --- |
| Deposit | 30% of total tour price, due at booking to confirm the reservation |
| Deposit refundability | Non-refundable once paid — this matches the existing "100% non-refundable" language already on the Just Go Ghana page and the pattern at all three researched competitors |
| Balance | Remaining 70% due 30 days before the tour/tour start date, for tailored multi-day and custom tours |
| Day tours | **Decided (2026-07-25):** full payment due at booking — no deposit/balance split. Day tours are lower-priced ($85–$250) and often booked with short advance notice, so a 30-day-out balance schedule doesn't fit. Cancellation: full refund if cancelled 48+ hours before the tour; non-refundable inside 48 hours of the tour |
| Cancellation by guest | Deposit is forfeited on any cancellation. If cancelled within 30 days of the tour/start date, the full amount (deposit + any balance paid) is non-refundable — matching the existing Just Go Ghana language, now applied universally |
| Cancellation by People & Places | Reserved only for genuine operational necessity or force majeure (weather, safety, government restriction) — offer a reschedule or full refund in that case, never a guest-side penalty |
| Payment methods | Bank transfer, Mobile Money (MTN, Vodafone Cash, AirtelTigo), major credit/debit cards — matches current site claim, still needs a yes/no confirmation that it's accurate |
| Travel insurance | **Superseded (2026-08-22): required, not recommended.** Every traveller must hold cover and send proof 30 days before departure, matching Buoyant Travel rather than TravelMo. Published at `/travel-insurance` |

**Day-tour payment window — resolved (2026-07-25):** see the row above.
Full payment at booking, full refund at 48+ hours out, non-refundable
inside 48 hours. This closes the last open item in this register.

## Payment schedule

**Decided (2026-07-25): no payment processor for now.** Booking requests
are submitted through the website, confirmed manually by the team, and
payment happens directly via bank transfer or Mobile Money — not through
an automated online payment system. Guests receive a booking reference and
send proof of payment (WhatsApp is the natural channel) for manual
reconciliation. Full workflow, hold windows, and an interim booking-log
structure are in `docs/manual-booking-workflow.md`. This replaces
"credit/debit cards" as a currently-accepted method below — card payments
aren't possible without a processor, so that claim needs to come off the
site until one is integrated.

| Question | Current site claim | Status |
| --- | --- | --- |
| Payment methods accepted | "bank transfers, Mobile Money (MTN, Vodafone Cash, AirtelTigo), and major credit/debit cards" (`contact.html:286`) | **Resolved (updated 2026-07-25): bank transfer, Mobile Money, and remittance services.** "Credit/debit cards" is not accurate without a payment processor and should be removed. Given the primary audience is the diaspora (Brand Foundation §8), many guests will realistically pay via a remittance service (e.g. WorldRemit, Sendwave, Wise, MoneyGram, Zeepay) rather than a Ghana bank account or Ghanaian Mobile Money line — this should be listed as its own accepted method, not assumed to be covered by "bank transfer" |
| Currency | Tour prices shown in USD ($) throughout `tours.js` and tour pages | Confirm this is the intended customer-facing currency, and how GHS transactions (if any) are handled |
| Instalment plans | Just Go Ghana FAQ describes "flexible payment plans" and "monthly payments" after the deposit | Superseded by the adopted universal deposit rule above — no separate instalment plan beyond the deposit/balance split |
| Exchange handling | Not documented anywhere | Open — relevant mainly for Mobile Money conversions, since bank transfer/MoMo rates fluctuate |

## Tax and levies

See `docs/tax-and-levies-note.md` for the full research. Summary: Ghana's
2026 VAT reform sets a combined 20% rate (VAT + NHIL + GETFund) on services,
and a separate 1% Tourism Development Levy (administered by GTA, not GRA)
applies to tour operators specifically. **Neither should be charged to
guests until the founders confirm actual GRA/GTA registration status** —
this is the same "don't claim it until it's true and documented" principle
already applied to the GTA operating licence and insurance in the Claim
Register.

## Cancellation, refund and rescheduling

| Policy area | Current site claim | Status |
| --- | --- | --- |
| Cancellation (Just Go Ghana) | "100% non-refundable" if cancelled <30 days before arrival (`just-go-ghana.html:403`) | Confirm applies uniformly or only to this offer |
| Cancellation (day tours) | `/cancellation-refund-policy` | **Published 22 August 2026** |
| Rescheduling | Not documented anywhere on any tour page | Open |
| Weather / operational changes | Not documented anywhere | Open |

## Guest responsibilities, accessibility and health

| Topic | Current site claim | Status |
| --- | --- | --- |
| Visa | "most international travelers require a visa... apply through your nearest Ghanaian Embassy" (`just-go-ghana.html:415`) | Unverified, general — not offer-specific |
| Vaccination | "A Yellow Fever vaccination card is mandatory... consult your doctor regarding Malaria prophylaxis" (`just-go-ghana.html`) | Unverified |
| Physical activity level | "Moderate level... plenty of downtime" (Just Go Ghana only) | Not documented for any single-day tour, including physically demanding ones (Quad Bike, Wli Waterfalls hike) |
| Accessibility accommodations | Not documented anywhere despite Brand Foundation review evidence citing "accessibility awareness" as a pillar proof point | **Open — should be resolved before the "How you are hosted" section can honestly claim this** |
| Safety framing | "Ghana is widely known as one of the friendliest and safest countries in Africa" (`just-go-ghana.html`) — avoid absolute "guaranteed safety" framing per Brand Foundation §16 | Confirm wording stays non-absolute when migrated |

## Privacy and terms

**No privacy policy, terms of service, cancellation policy or refund policy
page currently exists anywhere on the site** (checked all 20 HTML pages).
This is listed as a P0 exit blocker in the roadmap ("Real privacy and terms
pages") and must be resolved before Sprint 6 launch readiness, and ideally
before Sprint 3B production copy references these policies in booking
reassurance language.

## Exit checklist for this register

- [ ] Deposit conflict resolved with one documented rule (or documented
      per-offer-type rules).
- [ ] Payment methods and currency confirmed current.
- [x] Cancellation/refund policy documented for day tours — published 22 August 2026. Tailored tours still open.
      and custom tours (not just Just Go Ghana).
- [ ] Rescheduling and weather-change policy documented.
- [ ] Accessibility and health-conversation practice documented honestly
      (matches what hosts actually do, not aspirational language).
- [ ] Privacy and terms pages drafted or explicitly scheduled before launch.
