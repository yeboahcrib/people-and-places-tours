# Emotional & Creative Storytelling Review — Post-Sprint 3C Homepage

**Status:** Draft — for founder review before any further code changes
**Prepared:** July 2026
**Role for this document:** Creative Director review, not a UI/engineering audit
**Scope:** The rebuilt homepage only (`index.html`, `homepage-content.js`, `homepage-sections.js`). Sprint 4B (tour pages, About, Contact) is a separate track and is not re-litigated here.

## Framing

This document answers a direct brief: read the Brand Constitution
(`docs/people-and-places-brand-foundation.md`), look at the live, rebuilt
homepage with a Creative Director's eye rather than a developer's, and
determine where the site is still an informational brochure rather than an
emotional experience.

It is not a rejection of the Sprint 3C rebuild. That rebuild fixed something
more urgent first: the homepage was lying (a fabricated founder, invented
statistics, mismatched testimonials). Sprint 3C made it *honest*. This
review is the next, different problem — an honest page is not automatically
a *felt* one. Sprint 0's original storytelling audit
(`docs/sprint-0-brand-experience-storytelling-audit.md`) predicted almost
exactly this outcome and is quoted throughout below, because its
"Deliverable 5 — Photography Strategy" and "Visual pacing direction"
sections already diagnosed the risk before a single section existed.

**One material discovery made during this review, not previously acted on:**
the founder's Google Business Profile Takeout export
(`~/Downloads/Takeout/Google Business Profile/.../location-.../`) contains
**32 real, high-resolution photographs** — not stock, not staged. A sampled
review of them found: Cape Coast Castle under a dramatic sky, two guests
laughing on the Kakum canopy walkway, a street scene in old Accra with
women walking past kiosk umbrellas, a multigenerational family seated
under a rustic forest shelter, a canoe's-eye view gliding through Ada's
mangroves, the Nkrumah Mausoleum, a beach lined with thatched gazebos, and
a group of seven guests posing joyfully at a cave-site entrance sign. This
directly confirms Sprint 0's suspicion: *"the business already appears to
hold stronger real material than the website uses."* The homepage rebuilt
today uses **none** of these. That is the single highest-leverage creative
opportunity in this review, and it requires no new photography, no
founder time for a shoot, and no CMS work to start planning around —
only curation, permission confirmation per Sprint 0's asset-register
discipline, and upload.

---

## 1. Emotional Journey Map

The approved 10-section order was built for a narrative arc. Mapping each
section's **intended** primary emotion (per the Brand Constitution §22 and
the homepage brief) against what it **currently delivers**:

| # | Section | Intended emotion | What it currently delivers | Gap |
| --- | --- | --- | --- | --- |
| 1 | Hero | Wonder / Invitation | A video hero with headline + subhead + one CTA. Reads correctly but the video's ownership is unresolved (Sprint 0 flag) and the moment is generic-cinematic rather than Ghana-specific. | Medium — the words are right, the image behind them isn't confirmed to be *ours*. |
| 2 | Founder Story | Connection / Trust | Two initials-in-a-circle placeholder cards next to real biographical copy. Honest, but an initial is not a face — it reads as an admin record, not a welcome. | Large — this is the single biggest emotional flattening on the page. A founder story with no founder faces cannot create connection. |
| 3 | Ways to Experience | Curiosity | Five text cards, identical shape, identical rhythm, no imagery. Informationally clear, emotionally flat. | Large — curiosity is created by glimpses, not category labels. |
| 4 | Available Tours | Adventure | The existing tour-card grid (photography-driven, already the site's best-performing visual pattern per `CLAUDE.md`'s explicit note that this grid is off-limits for redesign). | Small — this section already does more emotional work than most others, ironically because it's the one area with real image density (even if the images are currently stock). |
| 5 | How You're Hosted | Trust / Care | Four principle rows with a real review excerpt each. Well-sourced, well-written — and visually identical to section 3: label, heading, paragraph, indented quote, repeat four times. | Medium — the *content* is trustworthy; the *shape* is monotonous back-to-back with section 3. |
| 6 | Guest Story | Reflection / Pride | Cynthia's real, powerful story on a quiet cream card — text only. | Large — this is the most emotionally loaded material on the entire site (heritage, grief, healing, gratitude) and it is presented with the same restraint as a policy paragraph. |
| 7 | Reviews & Trust | Trust | Real reviews, real trust facts, dark textured section with one Unsplash header image of Ghanaian dancers. | Medium — the mood shift (into dark, into color) is the single best piece of visual rhythm on the page. The header photo is stock, not one of our real 32. |
| 8 | Planning Process | Reassurance | Three numbered steps, icon + text. Clean, but purely instructional. | Small — this section's job is calm reassurance, and calm/instructional is close enough to its intended emotion that the flatness is more forgivable here than elsewhere. |
| 9 | Stories (Instagram) | Belonging | A single centered card: icon, handle, tagline, button. Deliberately restrained because no real posts exist yet. | Acceptable as an interim state — flagged as pending founder-supplied content, not a design failure. |
| 10 | Final Invitation | Warmth / Readiness | Full-bleed yellow, bold headline, two CTAs, both phone numbers. The one section on the page that commits to a strong, saturated mood. | Small — this section is doing exactly what the brief describes. It's proof the rest of the page *can* commit to atmosphere; it just doesn't do so elsewhere. |

**Read across the table:** the emotional journey currently has one strong
peak (Final Invitation) and one accidental peak (the mood shift into
Reviews & Trust), surrounded by five sections (2, 3, 5, 6, and to a lesser
extent 8) that are structurally sound but emotionally silent. Sections 2
and 6 are the most damaging gaps because they are the two sections whose
entire *job* is connection and reflection — the two emotions hardest to
create with text alone.

---

## 2. Storytelling Audit

Per section, does it *show* or does it *explain*?

- **Hero** — Shows (video + short line). Correct mode already.
- **Founder Story** — Explains. "People & Places was founded in 2021 by two
  Ghanaians who kept hearing..." is a well-written *summary* of a story,
  not the story itself. The Brand Constitution's own voice principle #4
  ("Let emotion emerge from the story... show the circumstances") is not
  yet followed here — we tell the visitor the founders are real instead of
  showing a specific moment (the actual photograph that got the "I never
  knew Ghana looked like this" reaction is a real, existing, describable
  thing per the origin story — it is not on the page).
- **Ways to Experience** — Explains. Five category summaries. None of the
  five pathways shows a single specific scene (a Bonwire loom, a Kakum
  rope bridge, a Makola stall). This is the clearest "explanation where
  storytelling should live" gap on the page.
- **Available Tours** — Shows, imperfectly (real card-grid pattern, but
  the images inside it are stock, so the "showing" is showing something
  false).
- **How You're Hosted** — A hybrid: each principle *explains* a value, then
  *shows* proof via a real review line. This is actually a reasonably
  strong pattern — the fix here is visual, not structural (see §3, §5).
- **Guest Story** — Shows, via Cynthia's own words — but stops one layer
  short: it tells us what she said, not what the moment looked like. There
  is no image, no sense of place, no visual anchor for "Assin Manso" or
  "Cape Coast Castle" to hold the quote against.
- **Reviews & Trust** — Shows (real reviewer words, real facts). Good.
- **Planning Process** — Explains, and that's appropriate for this
  section's job.
- **Stories** — Neither yet; correctly deferred pending real content.
- **Final Invitation** — Shows confidence through commitment (color, scale,
  directness) rather than through imagery, and that's a legitimate way to
  close a page.

**Verdict:** 3 of 10 sections (Founder Story, Ways to Experience, Guest
Story) are explanation standing in for storytelling. All three are
fixable primarily through the real photography identified above, not
through new copywriting — the words are already honest and warm; they are
simply unaccompanied.

---

## 3. Visual Rhythm Audit

The brief's exact complaint — "white background → heading → paragraph →
button, repeated" — is verifiably true for a run of consecutive sections.
Walking the page in actual build order:

1. Hero — dark, full-bleed video. *Different.*
2. Founder Story — white card, headline, paragraph, button, two small
   avatar cards. *Pattern A.*
3. Ways to Experience — white, headline, paragraph, five identical cards.
   *Pattern A, variant.*
4. Available Tours — white, headline, filter row, photographic card grid.
   *Different (photography-driven) — the rhythm break the page needs, and
   it already exists here.*
5. How You're Hosted — white, headline, paragraph, four stacked rows.
   *Pattern A, variant.*
6. Guest Story — cream, headline, quote block, button. *Pattern A, close
   variant — same shape as 2 and 3, only the background tint changes.*
7. Reviews & Trust — dark/textured, photo strip, trust numbers, cards.
   *Different — genuine rhythm break.*
8. Planning Process — white, headline, paragraph, three-step row.
   *Pattern A, variant.*
9. Stories — dark, centered, minimal. *Different, but very quiet — reads
   as an interstitial rather than a section.*
10. Final Invitation — solid yellow, headline, paragraph, buttons.
    *Different — strong, deliberate break.*

**Finding:** sections 2, 3, 5, 6 and 8 — five of the ten sections, and
four of them **consecutive** (2→3→[4 breaks it]→5→6→[7 breaks it]→8) —
share the identical "light background, centered or left-aligned headline,
paragraph, content block" shape. The two genuine breaks in the entire page
(section 4's photography and section 7's dark mood shift) are both
inherited from work that predates today's session (the tour-card grid) or
happened almost by accident (the testimonials section's forest
background, which was a pre-existing style, not a deliberate rhythm
choice made during today's rebuild). Today's four *new* sections
(Founder Story, Ways to Experience, Guest Story, Final Invitation) added
one genuine rhythm break (Final Invitation) and three that reinforce the
existing monotony (Founder Story, Ways to Experience, Guest Story all
read as light-card variants of each other).

---

## 4. Photography Strategy

### Current state

Confirms Sprint 0's original assessment, essentially unchanged by
today's rebuild: the tour-card grid and the reviews header still use
Unsplash stock; the four new sections built today (Founder Story, Ways to
Experience, Guest Story, Stories) deliberately use **no imagery at all**,
because Sprint 1's truth-correction rules (no stock people standing in as
real founders/guests) made "no image" the only safe default at the time.

That default was correct *given no real assets were confirmed available*.
It is no longer the only safe option.

### What actually exists (sampled, not yet a full asset register)

From the Takeout export's 32 real photographs, a representative sample
shows:

- **Heritage/monument, quiet and dramatic:** Cape Coast Castle's weathered
  white walls under a heavy sky; the Kwame Nkrumah Mausoleum's marble
  towers against clouds.
- **Guest joy/adventure:** two young women laughing on the Kakum canopy
  walkway railing, jungle behind them; a group of seven guests posing at
  a cave-site entrance sign, mid-laugh, clearly a real, unposed-feeling
  moment.
- **Everyday life:** a street scene near Jamestown/central Accra — several
  women walking past Pepsi- and Royal Dutch-branded kiosk umbrellas,
  ordinary and specific in exactly the way the Brand Constitution's
  "editorial storytelling territories — the everyday" calls for.
- **Family/multigenerational:** a father, mother and two boys seated
  under a rustic wooden shelter mid-tour, candid rather than posed.
- **Nature, POV:** a canoe's prow gliding through Ada's mangrove channels,
  water and green reeds on both sides.
- **Coastal/relaxation:** a beach lined with thatched-roof gazebos and
  palms, a boardwalk leading to the shore.

This is not a curated "best of" — it is a plain sample. It already
contains at least one strong candidate for nearly every priority subject
Sprint 0's photography strategy called for (people in genuine interaction,
everyday life, family groups, landscape-with-human-scale), at the
recommended 70/20/10 mix of people/context/landmark, without commissioning
anything new.

### What's still genuinely missing

- **Isaac and Kojo themselves.** None of the sampled photos are confirmed
  to show the founders (the export is guest- and site-submitted Google
  Business media, not a founder photo library). The Founder Story section
  still needs real founder portraits from the founders directly — this is
  the one gap that photography-in-hand cannot solve, and it remains the
  single most important asset to source before public launch (Brand
  Constitution §18: hero, founders, featured tours and guest story are
  the four "must have accurate media" slots).
- **Close-up craft/food/hands.** The sampled 8 lean toward wide scenes
  (landscapes, group shots, architecture). Sprint 0's photographic story
  sequence calls for a "detail" frame (hands, food, texture) in a complete
  story — worth checking the remaining ~24 unsampled images for this
  before concluding it's absent entirely.
- **A specific, describable image behind the origin story.** The founders'
  own account (Brand Constitution §3) references photos and videos that
  provoked "I never knew Ghana looked like this" reactions — if any of
  those specific images still exist, they belong in the Founder Story
  section more than any generic image would.

### Recommended mapping to sections (no new shoot required to start)

| Section | Recommended real asset (from sample) | Effect |
| --- | --- | --- |
| Founder Story | Hold for real founder portraits — do not fill with a Takeout photo, since neither founder is confirmed present in the sample | Closes the largest single gap once sourced |
| Ways to Experience | One image per pathway card (e.g. the Kakum canopy photo for Nature & Adventure, the street scene for Food & City Life, Cape Coast Castle for Heritage & Ancestry) | Turns five identical text cards into five distinct, recognizable scenes |
| Guest Story | Cape Coast Castle photograph as the section's visual anchor (with consented, appropriately reflective treatment — this is the site of real grief and reflection, not a scenic backdrop) | Gives Cynthia's story a place to live, not just words on cream |
| Reviews & Trust | Replace the Unsplash dancer photo with the real cave-entrance group photo or another real guest moment | Removes the one remaining stock image from the page's most trust-critical section |

Full asset registration (owner, consent, story context, per Sprint 0's
register fields) should happen before any of these go live — this review
recommends *which* images solve *which* emotional gaps, not that they be
uploaded without the founders confirming rights and consent first.

---

## 5. Section-by-Section Creative Recommendations

For each section: emotional purpose, does it inspire travel, does it
build trust, does it tell a story, is it memorable, would removing it
weaken the journey — and the concrete creative direction.

### Hero
Inspires travel: yes. Builds trust: not its job. Tells a story: partially.
Memorable: video hero is a strong format if the video is genuinely ours.
**Direction:** confirm/replace the video's provenance before launch (Sprint
0 flag); otherwise the format is right and shouldn't change.

### Founder Story
Inspires travel: weakly. Builds trust: the *words* do, the *placeholders*
undercut it. Tells a story: no, summarizes one. Memorable: no — an
initial in a circle is the least memorable visual unit on the page.
Removing it would weaken the journey badly; it's structurally necessary.
**Direction:** this section should not ship its final form with initials.
Either hold the whole section back until real founder photos exist, or —
if the founders want to ship now — use one real, describable moment
(e.g., a specific already-existing photo of Isaac or Kojo hosting, not a
posed headshot) rather than a placeholder that reads as an org chart.

### Ways to Experience
Inspires travel: this is precisely the section whose job is to spark
"I want to do that" and it currently sparks nothing visually. Builds
trust: neutral. Tells a story: no. Memorable: no — five near-identical
cards. **Direction:** highest-priority visual fix on the page. One real
image per pathway (see §4 table) turns this from a filterable list into
a genuine invitation.

### Available Tours
Already the strongest section visually (real grid, real photography
pattern) even though the photos themselves are stock. **Direction:**
lowest priority to touch structurally; medium priority to eventually swap
stock tour images for real ones as that inventory is built out (Sprint 4B
territory, not this review).

### How You're Hosted
Builds trust strongly (real proof quotes). Tells a story in miniature,
four times. Memorable: the *words* are quotable; the *layout* is not.
**Direction:** don't change the content model (four principles + real
proof is a genuinely good pattern) — change the rhythm. This is a case
for a pull-quote treatment (per the brief's own suggestion) rather than a
fifth run of "icon, heading, paragraph."

### Guest Story
The single most emotionally loaded content on the site, visually the
quietest. Builds trust: yes. Tells a story: yes, in Cynthia's own words.
Memorable: the *words* are; the presentation undersells them. Removing
this section would be the single worst cut on the page — it's the
proof-of-concept for everything the brand claims about "culture with
context" (Pillar 3). **Direction:** highest-priority *treatment* upgrade
even before new photography — larger typographic pull-quote treatment,
more breathing room, and (once cleared) the Cape Coast image as an anchor.

### Reviews & Trust
Already doing real work — dark mood shift, real reviewers, real numbers.
**Direction:** swap the one remaining stock image (see §4); otherwise this
section is close to the brief's intent already and should be a template
for how other sections could feel.

### Planning Process
Reassurance, delivered plainly and appropriately. **Direction:** lowest
priority. A purely informational job done in a purely informational way
is not a mismatch here the way it is in Founder Story or Guest Story.

### Stories
Correctly minimal given no real content exists yet. **Direction:** no
creative work needed until the founders supply real posts; flag as
pending, not broken.

### Final Invitation
The page's one section that fully commits to atmosphere (saturated
color, scale, directness). **Direction:** none needed — if anything, use
this section as the internal reference for "what commitment to mood looks
like" when reworking the others.

---

## 6. Where imagery should replace text

- Ways to Experience's five category descriptions can each shrink by
  roughly half once a real image is doing part of the communicating.
- Guest Story's scene-setting sentence ("A family visit to the Assin
  Manso Slave River Site and Cape Coast Castle...") exists only because
  there's no image to establish place — a real photo removes the need for
  most of that sentence, leaving Cynthia's actual words with more room.

## 7. Where storytelling should replace explanation

- Founder Story's summary paragraph should eventually give way to a
  single specific, sensory moment (per Voice Principle #4) — the exact
  photograph and reaction described in the Brand Constitution's origin
  story is the strongest available candidate, if it still exists.
- How You're Hosted's four "text explains, quote proves" rows would read
  as more story and less framework if the founders' own real-time
  explanation ("we listen before recommending," in their own words) sat
  alongside the guest proof, rather than a Codex-drafted summary sentence.

## 8. Where layout should create stronger emotion

- Sections 2, 3, 5, 6 sharing one visual shape (see §3) is the single
  fixable-without-new-content improvement available: alternating a
  split-image-and-text layout with the current centered-text layout,
  even before any new photography arrives, would break the monotony using
  layout alone.
- Guest Story specifically deserves a full-bleed or near-full-bleed
  treatment (large pull-quote typography, generous vertical space) rather
  than its current card-on-cream treatment, which visually undersells its
  emotional weight relative to its content.

---

## 9. Prioritized Implementation Plan

Ordered by emotional impact per unit of effort, not by build convenience.

1. **Guest Story treatment upgrade** (layout/typography only, no new
   assets required). Highest emotional payoff for the lowest risk — it's
   a presentation change to content that's already correct and approved.
2. **Ways to Experience photography** — source founder sign-off on 5
   specific real images from the Takeout sample (or confirm alternates),
   register consent/rights per Sprint 0's asset fields, implement.
3. **Reviews & Trust stock-image swap** — replace the one Unsplash image
   with a real, cleared photo. Small effort, removes the page's last
   remaining "fake photography" instance.
4. **Visual rhythm pass across sections 2/3/5/6/8** — alternate layout
   shapes (split image/text, full-bleed quote, centered-card) so no two
   consecutive sections share a silhouette, using only the imagery
   secured in steps 2–3 plus existing content.
5. **Founder Story real photography** — gated on the founders supplying
   or approving real portraits; this is the one item on this list that
   cannot proceed on existing assets alone.
6. **Motion pass** (gentle fades, slow reveals) — deliberately last,
   since the brief itself says motion should support emotion already
   present, not manufacture it. Sequencing this before steps 1–5 would
   animate a page that still has the underlying flatness problem.

No step in this plan requires touching the truth-correction work, the
tour catalogue, or any of the off-limits components (`packages.html`
grid, booking sidebar, day-by-day accordion, checklist per `CLAUDE.md`).

---

## Final note

Per the brief: **nothing above has been implemented.** This is the audit
for review. Once you tell me which of the above you want to proceed
with — all of it, a subset, or a different order — I'll implement
incrementally, section by section, with the same responsive verification
discipline as the rest of this project.
