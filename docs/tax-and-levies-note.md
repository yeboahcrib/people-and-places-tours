# Tax and Levies — Research Note

**Status:** Research summary for founder review — not tax/legal advice
**Prepared:** July 2026

## ⚠️ Not tax advice

This is a research summary to give the founders an accurate starting point.
It is not tax advice. Confirm actual registration obligations and rates
with the Ghana Revenue Authority (GRA), the Ghana Tourism Authority (GTA),
and a Ghana-qualified accountant before charging any tax or levy to guests.

## What was found

### 1. VAT, NHIL and GETFund (Ghana Revenue Authority)

Effective **1 January 2026**, under the Value Added Tax Act, 2025 (Act
1151), Ghana restructured how these are charged:

- **Combined rate: 20%** — VAT (15%) + NHIL (2.5%) + GETFund (2.5%), all
  now calculated on the **same base** (the pre-tax price), rather than the
  old system where levies were added first and VAT then charged on top of
  that (which compounded the effective rate).
- The COVID-19 Health Recovery Levy (1%) was **abolished** as part of this
  reform.
- Sources report that **mandatory VAT registration now applies to all
  suppliers of services, regardless of turnover** — this is a change from
  the old threshold-based system (where the registration threshold for
  goods was recently raised to GH¢750,000). If accurate, this would apply
  to People & Places as a services business. **This needs direct
  confirmation with GRA or an accountant — it's significant enough that it
  shouldn't be assumed from a news summary alone.**

### 2. Tourism Development Levy (Ghana Tourism Authority — separate from GRA)

- A **1% Tourism Development Levy** funds the Tourism Development Fund and
  is administered by the **Ghana Tourism Authority**, not the Ghana Revenue
  Authority — the GRA has publicly stated the tourism levy is not one of
  its own taxes.
- It explicitly applies to **tour operators**, among other tourism-sector
  businesses (hotels, guest houses, car rental, event/conference venues,
  etc.).
- Ghana launched a **Ghana Tourism Information System (GTIS)** in 2026 for
  online licensing, levy payment and licence verification — likely the
  same system the pending GTA licence application would go through.

### 3. How this connects to what's already known

The Brand Foundation already notes the **Ghana Tourism Authority licence
is still being processed** and must not be described as active. The
Tourism Development Levy is tied to that same GTA relationship — it's
reasonable to assume levy registration tracks alongside licence approval,
but this should be confirmed rather than assumed, the same way the licence
itself is being treated.

## Recommendation for now

Do not charge VAT/NHIL/GETFund or the Tourism Development Levy to guests
until the business's actual registration status is confirmed with GRA and
GTA. Charging a tax a business isn't registered to collect is its own
compliance risk, separate from simply under-collecting it.

The receipt generator tool (see `docs/manual-booking-workflow.md`) includes
an optional, off-by-default tax line with the rates above pre-filled, so
it's ready to switch on the moment registration is confirmed, without
needing to redesign the tool later.

## Registration status (confirmed 2026-07-25)

- **General business registration:** confirmed — registered with the
  Registrar General's Department. This is the basic legal-entity
  registration, separate from tax and tourism-sector registration.
- **Tourism Development Levy / GTA licence:** confirmed **not yet
  active** — in process, tied to the same pending GTA relationship already
  noted in the Brand Foundation and Claim Register.
- **GRA VAT/tax registration:** still not confirmed — this is the one
  piece that remains genuinely open.

Do not charge either VAT/NHIL/GETFund or the Tourism Development Levy to
guests until GRA VAT status is confirmed and the GTA relationship is
active. The receipt generator's tax toggle stays off by default until then.

## Open questions for founders

1. Is People & Places currently VAT-registered with GRA? (The only
   remaining unknown from the above.)
2. Once GTA registration is active, which rate(s) should actually be
   charged to guests, and from what date?
