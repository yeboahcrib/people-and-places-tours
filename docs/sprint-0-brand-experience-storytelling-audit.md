# People & Places Sprint 0 Brand Experience & Storytelling Audit

**Version:** 1.0  
**Status:** Strategy audit complete; founder approval required before implementation  
**Prepared:** July 25, 2026  
**Scope:** Brand experience, storytelling, homepage narrative, photography,
messaging, trust, competitive positioning and premium-brand opportunities  
**Implementation:** None. This document does not authorize a redesign,
component refactor, layout change or style change.  

## Executive conclusion

People & Places has the foundations of a distinctive brand, but the current
customer experience does not yet express them consistently.

The real brand is visible in three places:

- The founders' reason for starting the company: people kept responding to
  their photographs with “I never knew Ghana looked like this.”
- The perspective of Isaac Yeboah and Evans Yirenkyi, who know Ghana through
  lived experience rather than a generic “local guide” claim.
- Google reviews that describe cultural context, warmth, flexibility,
  communication, accessibility and care.

The current website hides those strengths behind a conventional tour-company
experience. It leads with packages, promotional labels, stock media, generic
benefits and transaction language. More seriously, some pages use invented
people, rewritten or unsupported testimonials, contradictory operating facts
and unverified claims as trust evidence.

The strategic opportunity is not to make People & Places sound more luxurious,
more transformational or more “authentic” than competitors. It is to make the
brand more specific, more human, more attentive and more truthful.

The recommended territory is:

> **Ghana made personal through the people who host you.**

This is internal positioning shorthand, not a proposed permanent tagline.

Premium should mean that guests feel known, informed and cared for. It should
be demonstrated through calm communication, cultural context, thoughtful
pacing, accurate information, original media and real human proof—not through
the repeated use of “luxury,” “best,” “ultimate” or “unforgettable.”

## Audit verdict at a glance

| Area | Current assessment | Strategic implication |
| --- | --- | --- |
| Category clarity | A visitor can infer that this is a Ghana tour company, but the hero does not name Ghana | Clarify Ghana and the hosted offer immediately |
| Distinctiveness | “Local” hosting is claimed but the real founders are invisible | Put Isaac and Kojo at the centre of the story |
| Emotional pull | Energetic and visually assertive, but commercially paced | Build curiosity and connection before product comparison |
| Trust | Strong real evidence exists, but it is weakened by false and unsupported material | Truth correction is the first future implementation priority |
| Ghanaian identity | Present mainly as destination subject matter | Express identity through voices, context, relationships and everyday life |
| Premium quality | Claimed through polish, convenience and “luxury” language | Demonstrate premium through attention, restraint and reliability |
| Photography | The site relies heavily on stock; uploaded business media contains stronger real material | Inventory and map existing owned media before commissioning a shoot |
| Cross-channel consistency | Website, Google and operating facts tell different versions of the company | Establish one claim register and one content source of truth |
| Content management | All content requires source-code changes | A managed backend is a launch requirement for the future site |

## Evidence and limitations

### Sources reviewed

- Current static website repository, including the homepage, About, Packages,
  Contact, Just Go Ghana and individual tour pages.
- Homepage copy in `homepage-content.js`.
- Homepage render order in `homepage-sections.js`.
- Tour catalogue in `tours.js`.
- Shared styles and documented interaction behaviour.
- Founder-supplied Brand Discovery responses.
- Founder story and founder profiles.
- Founder decisions made during Sprint 0.
- Google Business Profile Takeout data, reviews and uploaded media.
- Fifteen Google reviews dated July 2023 through February 2026.
- Thirty-two high-resolution Google Business photo files.
- Five founder-selected Instagram post and reel links.
- Official websites of seven relevant Ghana and heritage-travel competitors.

### Evidence boundary

The in-app browser was unavailable during the final audit pass. Website visual
observations are therefore based on markup, content, CSS, component behaviour
and media-source inspection rather than a fresh rendered desktop and mobile
review. These observations are strong enough for brand and content strategy,
but a rendered visual, responsive and accessibility validation must occur
before UI implementation is approved.

Instagram pages could not be reliably rendered in this session. The selected
links are recorded as founder-approved references, but their complete visual
language, captions, comments and relationship to the rest of the account were
not independently audited. No conclusion in this document depends on
pretending otherwise.

A representative sample of the Google Business photographs was visually
reviewed. The sample includes real guests, families, groups, destination
context and visible emotion. The complete library still needs image-by-image
identification, rights, consent and story mapping.

Competitor descriptions below summarize what each company publishes on its
official website. Awards, licences, review totals, insurance, impact and
founding dates were not independently verified.

### Source-of-truth hierarchy

When sources conflict, use this order:

1. Current founder-approved operational facts.
2. Verbatim Google review and Google Business export evidence.
3. Reviewed legal, registration, policy and operational documents.
4. The Brand Foundation and approved messaging brief.
5. Existing website content.

The current website is evidence of the present customer experience. It is not
automatically evidence that a claim is true.

---

## Deliverable 1 — Brand Experience Audit

### The present experience

The current website communicates an energetic Ghana tour business with a broad
catalogue. Its full-screen film hero, bold type, high-contrast yellow and
charcoal palette, strong calls to action and tour-card system create immediate
commercial energy.

That energy is not yet organized around the intended brand. The experience
feels closer to an activity marketplace than a premium destination brand:

- Products appear before the founders or point of view.
- Prices, filters, badges and “Book Now” language invite comparison early.
- Generic benefits make claims that many competitors could make.
- The most important human evidence arrives late or not at all.
- Stock photography stands in for founders, reviewers and Instagram content.
- Different pages present conflicting versions of the company's history,
  scale, people, service and availability.

The result is a split identity:

> The company the founders describe is personal, culturally grounded and
> thoughtful. The company the current site presents is bold, package-led and
> promotional.

### Cross-touchpoint experience

| Touchpoint | Story currently told | Experience created | Required alignment |
| --- | --- | --- | --- |
| Homepage | Energetic local tour company with six featured offers | Fast browsing, price comparison and adventure | Founder-led invitation into Ghana, followed by selective offers |
| About page | Large, long-established luxury operator with a broad team | Apparent scale, but serious credibility risk | True 2021 origin, Isaac and Kojo, real roles and sourced proof |
| Packages and tour pages | Broad inventory of bookable activities | Useful product clarity, but generic and inconsistent copy | Accurate day, tailored multi-day and custom offer structure |
| Contact page | Multiple response and booking promises | Easy access, but uncertainty about hours, timing and policies | One clear response expectation, service-area wording and process |
| Google Business | Real reviews and business presence, with outdated details and generic copy | Strong external proof followed by inconsistent information | Current website, hours, approved phones, focused description and services |
| Instagram | Potential source of real people, movement and current Ghana | Cannot be fully assessed in this session | Curated real stories that connect back to the website |
| Website Instagram strip | Six Unsplash images presented beneath the real handle | Simulated social proof | Real linked posts or approved owned media only |
| WhatsApp | Direct and human contact route | High-potential conversational conversion | Accurate availability, business hours and consistent tone |
| Email | Functional inquiry channel | Professionalism depends on response quality | Clear response standard and, when practical, an owned-domain address |

### What supports the intended brand

- “People & Places” is a strong name with a natural storytelling structure.
- The public phone and WhatsApp route make the company accessible.
- The current visual system is recognizable and energetic.
- The tour inventory spans history, food, craft, cities, nature and adventure.
- More than 300 individual guests have been served.
- The Google export contains 15 five-star reviews, 14 with written comments.
- Reviews repeatedly describe real human care and local context.
- The founder story provides an ownable reason for the company to exist.
- The uploaded Google media contains high-resolution, people-led material.
- Website content, homepage rendering, tour records and behaviour are already
  partially separated in code, giving future architecture a migration starting
  point.

### What undermines the intended brand

- The public presentation shifts between “People & Places” and
  “People & Places Tours.”
- Metadata and footer copy call the company “Ghana's premier tour company.”
- Isaac and Kojo are absent from the homepage.
- A fictional “Kofi Asante” is presented as founder and lead guide.
- The About page presents stock people as a fictitious team.
- The About page claims an incorrect 2012 founding date.
- The About page claims 1,200 travellers, 500 reviews, 40 countries and a
  98% success rate; these figures are not approved.
- Safety, certification, vehicle-standard, community-impact, luxury and 24/7
  support claims are unsupported or unresolved.
- Website review wording and portraits do not faithfully represent the Google
  source material.
- The site contains 128 Unsplash URL occurrences across HTML and JavaScript.
- Ten Unsplash images appear in the homepage content and seven on the About
  page.
- The homepage hero film is hosted on an external Webflow CDN and ownership is
  not confirmed.
- Hours, response times, payment terms and booking expectations conflict across
  pages and channels.
- Google still points to an old Google Sites URL and an outdated secondary
  Ghana phone number.
- The contact experience can imply a walk-in location although Google records
  the company as a customer-location-only service-area business.
- Privacy and terms links on the current Contact page point to `#`.

### First future principle

Before the brand becomes more beautiful, it must become fully believable.

This does not mean that Sprint 0 should alter the website. It means the first
future implementation sprint must remove or quarantine invented,
contradictory and unsupported material before adding new claims.

---

## First Impression Audit

### Five-second visitor test

| Visitor question | Current answer | Assessment |
| --- | --- | --- |
| What does this company do? | It appears to sell Ghana tours and packages | Category is broadly clear from navigation and cards, but the hero itself does not name Ghana |
| Why should I trust them? | A Ghana phone number is visible, but proof is not immediate | Real proof exists, but is absent above the fold and later weakened by unsupported content |
| Why are they different? | They say local people host the experience | The territory is promising but generic because the hosts are unnamed and unseen |
| What emotion do I feel? | Energy, adventure and contemporary polish | The mood is active rather than warm, intimate or reflective |
| Would I continue scrolling? | Probably, to browse tours | The page creates product curiosity, not yet emotional curiosity about People & Places |

### Five-second verdict

> “This looks like an energetic Ghana tour company, but I do not yet know who
> the people are, what makes their hosting meaningful, or whether the proof is
> real.”

### Intended five-second result

A first-time visitor should understand:

- People & Places helps guests experience Ghana.
- The experience is hosted from lived Ghanaian perspective.
- Isaac, Kojo and their team are real and visible.
- Culture, history, food, everyday life and nature all belong in the story.
- A conversation can begin before a booking decision.

The provisional working hero is:

> **Your time in Ghana, hosted by people born and raised here.**

The provisional supporting message is:

> **We share Ghana's history, food, culture and everyday life as we know them
> firsthand, shaping your time here around what brings you.**

Both lines may be revisited. They are approved for planning, not frozen as
permanent brand language.

---

## Deliverable 2 — Storytelling Audit

### Current homepage sequence

The current renderer uses this order:

1. Hero
2. Six featured tour cards and filters
3. “Why Travel With Us”
4. Animated statistics
5. Three-step booking process
6. Testimonials
7. Newsletter
8. Instagram strip

This order tells a commercial story:

> Look at us → shop tours → read our claims → see our numbers → book quickly →
> read testimonials → receive deals → follow us.

It does not tell the founders' story, introduce real hosts, explain how People
& Places sees Ghana or end with a meaningful invitation.

### Current emotional progression

| Current stage | Emotional effect |
| --- | --- |
| Film hero | Interest and energy |
| Tour catalogue | Shopping and price comparison |
| Benefit claims | Rational evaluation |
| Animated counters | Claimed authority, with possible skepticism |
| “Book in Minutes” process | Transactional acceleration |
| Testimonials | Attempted emotion, undermined by source and image problems |
| Deals newsletter | Promotion |
| Stock Instagram strip | Generic social presence |
| Footer | No narrative close |

### Storytelling breaks

- **Hero to tours:** The visitor is asked to shop before understanding the
  point of view.
- **Tours to benefits:** The page explains category advantages instead of
  introducing the people behind them.
- **Benefits to statistics:** Claims are followed by more claims, not proof.
- **Statistics to booking:** The experience accelerates before trust is earned.
- **Booking to testimonials:** Emotional proof arrives too late and is
  misrepresented.
- **Testimonials to deals:** Promotional language interrupts the only attempted
  human moment.
- **Instagram to footer:** There is no final welcome or conversational next
  step.

### Storytelling question answers

| Question | Current answer |
| --- | --- |
| Does each section naturally lead to the next? | Structurally yes, emotionally no; the sequence follows a sales funnel rather than a story |
| Does the page create curiosity? | It creates curiosity about tour options, not enough curiosity about Ghana or the founders' perspective |
| Does it inspire travel? | It creates energy, but generic destination language limits imagination |
| Does it build trust? | It attempts to, but unsourced and inaccurate content reverses the effect |
| Does it feel memorable? | The colour and scale may be memorable; the story and language are not yet ownable |

### Approved narrative principle

The homepage should alternate emotion with practical clarity:

> Invitation → origin → imagination → choice → care → human story → evidence →
> ease → continued curiosity → welcome.

This prevents the page from becoming either a sentimental manifesto or a tour
catalogue.

---

## Deliverable 3 — Emotional Journey Map

| Stage | Visitor's question | Intended emotional movement | Required proof or content | Appropriate next action |
| --- | --- | --- | --- | --- |
| 1. Hero | “What is this, and is it for me?” | Unfamiliarity → curiosity | Ghana, human hosting, real interaction-led media | See Ghana with us |
| 2. Founder story | “Why do these people care?” | Curiosity → connection | Isaac, Kojo and the “I never knew Ghana looked like this” origin | Meet your hosts |
| 3. Ways to experience Ghana | “What could Ghana feel like?” | Connection → imagination | Heritage, food and city life, craft, nature, celebration | Explore a way in |
| 4. Available tours | “What can I actually choose?” | Imagination → relevant choice | Three to five accurate featured offers across motivations | View the experience |
| 5. How guests are hosted | “What will it feel like with them?” | Choice → confidence | Context, care, flexibility and preparation shown through specifics | See how planning works |
| 6. Featured guest story | “Has someone like me felt this care?” | Confidence → emotional recognition | Cynthia's real family story, Kojo's role and approved media | Read the guest story |
| 7. Reviews and trust | “Can others confirm this?” | Emotion → evidence | Exact Google reviews, founders, 2021, 300+ guests and dated 5.0 proof | Read Google reviews |
| 8. Planning process | “What happens if I contact them?” | Evidence → relief | Three clear steps, business hours and response expectation | Tell us what brings you here |
| 9. Instagram and stories | “Can I keep discovering before I decide?” | Relief → ongoing curiosity | Real linked stories from Ghana and current guest moments | See more stories |
| 10. Final invitation | “Am I ready to begin a conversation?” | Curiosity and confidence → welcome | Warm contact choices, response reassurance and no pressure | Plan your time in Ghana |

### Emotional high point

The featured guest story should be the emotional high point. Reviews then
confirm that the story is part of a repeatable standard rather than an isolated
moment.

### Emotional safety

Heritage, ancestry, grief, spirituality and identity must never be used as
conversion theatre. People & Places can create respectful conditions for
reflection; it should not promise healing, transformation or belonging on a
guest's behalf.

---

## Deliverable 4 — Homepage Narrative Review

### Approved homepage order

1. Hero
2. Founder story
3. Ways to experience Ghana
4. Available tours
5. How guests are hosted
6. Featured guest story
7. Reviews and trust
8. Planning process
9. Instagram and stories
10. Final invitation

This is a narrative requirement, not a layout specification.

### Section-by-section review

| Section | Current state | Future narrative job | Required content | Guardrail |
| --- | --- | --- | --- | --- |
| Hero | Bold film, generic headline, one exploration CTA | Clarify Ghana and the human promise | Provisional hero/support, two CTA levels, real guest-host media, optional sourced proof | Do not freeze the working headline yet |
| Founder story | Missing; replaced by fictional Kofi quote later | Establish motive and lived point of view | Isaac, Kojo, real photo and origin observation | No generic “local experts” section without named people |
| Ways to experience Ghana | Missing; inventory filters stand in for discovery | Help visitors imagine different relationships with Ghana | Heritage/homecoming, food/city, craft/tradition, nature/adventure, celebrations/personal trips | Do not treat these as database filters |
| Available tours | Six cards directly after hero | Turn imagination into a manageable choice | Three to five commercially ready featured offers | Do not imply that this is the complete catalogue or label items “popular” without data |
| How guests are hosted | Generic “Why Travel” benefits | Translate premium into observable behaviour | Context, personal care, flexible pacing and Ghana beyond the obvious | Avoid absolutes and unsupported inclusions |
| Featured guest story | Missing | Provide a specific human emotional peak | Cynthia's family visit, Kojo's role, exact source language and approved image | Do not sensationalize ancestry or grief |
| Reviews and trust | Counters plus two problematic testimonials | Confirm the promise with independent evidence | Louis, Heather and Shy; 2021, 300+ guests, dated Google aggregate | Verbatim excerpts, no required reviewer portraits |
| Planning process | “Book in Minutes,” same-day and deposit claims | Reduce uncertainty without pressure | Tell us what brings you here; shape your time together; arrive and be welcomed | Confirm policies before publishing transaction claims |
| Instagram and stories | Stock strip under the real handle; newsletter before it | Continue the story beyond the page | Founder-selected real posts or owned content with context | Do not simulate a social feed |
| Final invitation | Missing | Complete the emotional arc with welcome | Conversation CTA, WhatsApp, hours, response time and advance-notice wording | Do not end on scarcity or “Book Now” pressure |

### Offer architecture

The customer-facing offer should distinguish:

- **Day tours:** Available for a guest's chosen day with advance notice. They
  are not fixed daily scheduled departures.
- **Tailored multi-day tours:** Structured offers such as Just Go Ghana that can
  still require planning and confirmation.
- **Custom tours:** Designed around the customer's dates, interests, group and
  requests.

The current repository contains 15 tour records, but the founders have
confirmed that this is not the full inventory. The future homepage should
feature a small selection of three to five tours. The exact selection remains
pending the complete catalogue and should balance different motivations rather
than merely repeat the current six.

### Visual pacing direction

The future story needs contrast:

- Expansive invitation.
- Intimate founder detail.
- Imaginative variety.
- Selective product clarity.
- Calm service evidence.
- One emotionally focused guest story.
- Stable, readable trust proof.
- Simple planning reassurance.
- Lighter current stories.
- Warm close.

Repeated card grids, uppercase labels, animated statistics, automatic review
rotation and promotional badges should not dictate the new experience. Their
future use is a UI decision only after the content hierarchy is approved.

---

## Deliverable 5 — Photography Strategy

### Current photography assessment

The current site mostly uses imagery to illustrate destinations and fill
commercial components. It does not consistently tell a People & Places story.

The highest-risk uses are:

- Stock portraits representing invented founders or staff.
- Stock portraits beside testimonial wording.
- Six Unsplash images presented as an Instagram strip.
- An externally hosted hero video with unresolved ownership.
- Stock tour imagery that may not accurately represent the named experience.

This directly conflicts with a brand built on real people and firsthand
perspective.

### Evidence available now

- Thirty-two high-resolution images exist in the Google Business Takeout.
- A reviewed sample shows real guests, multigenerational groups, family
  experiences, laughter, pauses, activities and destination context.
- Some images are strong human moments; others are posed group photographs or
  location-only records.
- Five founder-selected Instagram references are documented.
- A founder-selected image identifies Isaac in yellow and Evans in white.
- General customer-photo permission has been founder-confirmed.

This is enough to begin an asset inventory. It is not enough to assume that
every file is cleared for every placement.

### Strategic visual idea

> Do not only show where a guest went. Show what happened between people while
> they were there.

### Recommended visual mix

- **70% people and interaction:** conversation, participation, care, laughter,
  reflection, welcome and shared movement.
- **20% environmental context:** markets, workshops, streets, meals, transport
  and landscapes with people present.
- **10% iconic destinations:** used to orient the visitor, not carry the brand
  alone.

### Story sequence for a single experience

A useful photographic story should include:

1. **Arrival:** A person entering the moment.
2. **Context:** A host, artisan, cook or historian explaining or demonstrating.
3. **Participation:** Guests doing, tasting, making, walking or listening.
4. **Emotion:** Laughter, concentration, surprise, quiet or reflection.
5. **Detail:** Hands, food, texture, objects, movement or place-specific clues.
6. **After-moment:** What the group carries, shares or remembers.

Not every story needs all six frames, but the library should not consist only
of posed smiles and empty landmarks.

### Priority subjects

- Isaac and Kojo together and separately.
- Hosts in conversation, not only facing the camera.
- Guests across ages, group types and mobility needs.
- Food preparation and shared meals.
- Craft processes and the people who hold the knowledge.
- Historical interpretation handled with restraint.
- Contemporary Accra, creativity, neighbourhood life and everyday rhythms.
- Nature and adventure with human scale.
- Planning, welcome, pickup and small acts of care.
- Quiet moments as well as celebration.

### Asset register required before production use

Each media record should include:

- Unique asset ID.
- Original file and derivatives.
- Photographer or owner.
- Capture date.
- Location.
- Related tour or story.
- People shown and their roles.
- Consent or permission status.
- Community or cultural-credit requirements.
- Orientation and dimensions.
- Intended placement.
- Caption and story context.
- Alt text.
- Focal point.
- Rights restrictions or expiry.
- Placeholder, draft, approved or archived status.

### Placeholder policy

Neutral, clearly labelled placeholders are approved for architecture,
development and UI review.

They must preserve the intended media type and orientation so that a CMS upload
can replace them without rebuilding the page.

A placeholder must never use a stock person to impersonate a named founder,
host, reviewer, partner or guest.

Before public launch, accurate approved media is required for:

- Hero.
- Isaac and Kojo.
- Featured tours.
- Cynthia's guest story.
- Any named person or community contributor.

### Photography production priorities

1. Inventory the 32 Google images and founder-selected Instagram references.
2. Identify people, tours, dates, story context and permission status.
3. Map existing assets to the 10-section homepage brief.
4. Identify actual gaps.
5. Commission a focused shoot only for the gaps.

The first answer should not automatically be “take more photos.” The business
already appears to hold stronger real material than the website uses.

---

## Deliverable 6 — Brand Personality Assessment

### Current perceived personality

Based on the current content, visual system and interaction patterns, the site
feels:

- Bold.
- Youthful.
- Energetic.
- Adventure-oriented.
- Commercial.
- Social-media aware.

### Intended personality

The approved brand should feel:

- Warm.
- Grounded.
- Curious.
- Generous.
- Assured.
- Human.
- Ghanaian.
- Contemporary.
- Timeless.

### Trait assessment

| Desired trait | Current expression | Gap |
| --- | --- | --- |
| Authentic | “Real” and “local” are frequently claimed | Real founders and original media are often absent or replaced by stock |
| Trustworthy | Contact details and some useful tour information exist | False people, inflated statistics and conflicting facts create major risk |
| Premium | Large-format media, bold type and “luxury” language imply ambition | Premium service standards, policies and restraint are not consistently demonstrated |
| Warm | WhatsApp and energetic guest language suggest friendliness | The dominant experience is product-led and conversion-led |
| Human | Testimonials and local-guide claims attempt humanity | Invented identities and stock portraits undermine it |
| Story-driven | The name and origin story offer strong potential | The homepage follows a sales funnel rather than a narrative |
| African and Ghanaian | Ghana is the subject of the catalogue | Ghanaian identity is not yet carried by named voices, context and lived detail |
| Modern | Typography, motion and colour feel current | Influencer phrases and template patterns can date quickly |
| Timeless | Heritage and cultural depth could support longevity | Trends, badges, counters and promotional language dominate |
| Professional | The site is broad and functionally organized | Contradictory policies, broken legal links and unsupported claims reduce confidence |

### Recommended personality balance

People & Places should not become quiet to the point of losing its warmth and
energy. The goal is **warm assurance**:

- Confident, not boastful.
- Emotional, not sentimental.
- Modern, not trend-dependent.
- Ghanaian, not decorative.
- Premium, not status-driven.
- Helpful, not overly explanatory.
- Conversational, not casual with serious subjects.

### Ghanaian identity principle

Ghanaian identity should come from:

- Who is speaking.
- What they notice.
- How they explain a place.
- Which details they include.
- Whose knowledge is credited.
- How everyday life appears beside heritage.

It should not depend on generic African patterns, flags, colour symbolism or
visual spectacle.

---

## Deliverable 7 — Messaging Review

### Current headline review

| Current language | Problem | Direction |
| --- | --- | --- |
| “The People Make the Place” | Attractive but could describe any destination; Ghana is absent | Use the provisional Ghana-specific hero while continuing headline exploration |
| “Pick Your Adventure” | Marketplace language and narrow emotional framing | Introduce several human ways to experience Ghana |
| “Our Tours & Experiences” | Functional but generic | Present a small, intentional starting selection |
| “Ghana Is Better When Locals Lead” | Broad category claim; real founders remain unnamed | Let Isaac and Kojo demonstrate the difference |
| “Photo-Ready Moments” | Reduces experience to content capture | Show real moments without making the camera the benefit |
| “Three Steps to Ghana” | Generic and tied to unverified transaction promises | Explain the planning relationship in plain language |
| “Our Guests Say It Best” | Reasonable setup, but current proof is not faithfully sourced | Use exact Google reviews with attribution and dates |
| “Trip ideas, local tips and seasonal deals” | Promotional and unsupported by an editorial cadence | Defer newsletter until there is a real publishing and consent practice |
| “Real tours. Real people. Real Ghana.” | Generic and contradicted by stock imagery | Use actual linked stories with specific context |
| “Ghana's premier tour company” | Unsupported superlative | State what the company does and how it hosts |

### Paragraph-level findings

The current copy frequently relies on:

- Category clichés.
- Unsupported absolutes.
- Adjective stacks.
- Claims of transformation.
- Convenience promises that have not been operationally confirmed.
- “We are not a travel agency” positioning.
- Broad “local” claims without named people.

Natural People & Places writing should instead use:

- A person.
- A place or moment.
- A specific observation.
- Why it matters.
- What the guest can expect.
- A low-pressure invitation.

For example, “authentic cultural immersion” is not persuasive by itself. A
specific account of who welcomes the guest, what they learn, what they do and
why the moment matters is both more human and more believable.

### Messaging to retain

- The founding observation: “I never knew Ghana looked like this.”
- Ghana through food, history, culture, contemporary life and everyday
  rhythms.
- The idea of being hosted by people born and raised here, supported by named
  founders and real proof.
- Warmth, context, attentive care, flexibility and preparation.
- Specific human details from source reviews.
- Clear durations, inclusions, meeting expectations and accurate prices.
- Conversation before commitment.

### Messaging to reduce or remove

- Premier.
- Best.
- Ultimate.
- Hidden gems.
- Breathtaking.
- Unforgettable as a self-description.
- Authentic as an unsupported claim.
- Stress-free as an absolute.
- Life-changing or transformative as a promised result.
- Real people / real Ghana slogans.
- “We're not a travel agency.”
- Every, always, instant and guaranteed.
- “Journey/journeys” as the automatic customer-facing category noun.
- Dominant “Book Now” pressure.

### CTA hierarchy

| Visitor readiness | Preferred CTA type | Examples |
| --- | --- | --- |
| Curiosity | Explore | See Ghana with us; Discover the experiences |
| Human interest | Learn | Meet your hosts; Read their story |
| Early planning | Converse | Tell us what brings you to Ghana; Talk with our team |
| Offer evaluation | Inspect | View the experience; See dates and details |
| Intent | Confirm | Check availability |
| Transaction | Book | Use only when terms, availability and price are clear |

### Messaging status

The Brand Foundation and Homepage Messaging Brief provide the active content
direction. The hero and supporting message remain provisional. Final production
copy should not be written into UI components until:

- The exact featured-tour set is selected.
- Payment, cancellation and inclusion rules are verified.
- The relevant photography is mapped.
- One final founder language review is complete.

### Complete current homepage copy disposition

This inventory covers the customer-facing messages defined in
`homepage-content.js`, the six current homepage tour cards and the main shell
CTAs in `index.html`.

#### Hero and tour introduction

| Current message | Type | Disposition | Reason |
| --- | --- | --- | --- |
| “The People Make the Place.” | Headline | Replace | Memorable shape, but Ghana and the offer are absent |
| “Hosted by people who grew up here…” | Paragraph | Develop | Points toward the right territory, but does not name the hosts or clarify tours |
| “Explore Experiences” | CTA | Retain direction | Appropriate early exploration action; final label can follow the approved hierarchy |
| “Pick Your Adventure” | Eyebrow | Replace | Narrows the brand to marketplace-style adventure |
| “Our Tours & Experiences” | Headline | Replace or simplify | Generic and shown too early in the story |
| All / Multi-Day / Adventure / Culture / Nature / Relaxation | Filters | Move out of narrative role | Useful catalogue controls, but not meaningful homepage storytelling |
| “View All Tours” | CTA | Retain function | Appropriate after a curated selection |

#### Current featured-tour cards

| Current card | Copy finding | Badge finding | CTA finding |
| --- | --- | --- | --- |
| Just Go Ghana — 8 Days | “Ultimate” and blanket guided/inclusion language need removal or verification | “Featured” is valid only as an editorial state | “View Tour” is appropriate |
| Cape Coast Ancestral Tour | Landmark list does not prepare guests for emotional or historical context | “Best Seller” needs booking evidence | “Book Now” is premature |
| Accra City Tour | Useful places are listed, but there is no host, human encounter or contemporary point of view | “Popular” needs evidence | “Book Now” is premature |
| Shai Hills Wildlife Reserve | Specific wildlife and route claims require operational verification | “Adventure” adds little information | “Book Now” is premature |
| Volta River & Wli Falls | Destination illustration dominates; route and inclusions need confirmation | “Nature” is a category, not proof | “Book Now” is premature |
| Ada Foah Beach & Canoe Safari | “Pristine” and sea-turtle language need evidence and season/context | “Beach” is a category, not proof | “Book Now” is premature |

The cards also rely on external Unsplash imagery. None should migrate to a
public relaunch without accurate tour content and media.

#### “Why Travel With Us”

| Current message | Type | Disposition | Reason |
| --- | --- | --- | --- |
| “Why Travel With Us” | Eyebrow | Replace | Generic category language |
| “Ghana Is Better When Locals Lead” | Headline | Replace with evidence-led framing | The idea is relevant, but any operator can claim it |
| “We're not a travel agency…” | Paragraph | Remove | Difference should be demonstrated; Google categorizes the business as a tour agency |
| “Every guide… Every route… Every trip…” | Paragraph pattern | Remove | Unsupported absolutes |
| Kofi Asante quotation and attribution | Quote | Remove | The identity, portrait and quotation are not genuine |
| “Expert Local Guides” | Headline | Rebuild | Introduce real hosts and the context they provide |
| “Every guide is a born-and-raised Ghanaian…” | Paragraph | Withhold or qualify | The blanket staffing claim is undocumented |
| “Stress-Free Logistics” | Headline | Replace | Generic and absolute |
| “Transport, accommodation, entrance fees, meals…” | Paragraph | Verify by offer | These are not confirmed universal inclusions |
| “Small Group Vibes” | Headline | Replace | Trend-dependent and not appropriate for every offer |
| “We keep group sizes small…” | Paragraph | Verify by offer | Current records contain varied group sizes and custom work |
| “Photo-Ready Moments” | Headline | Remove | Makes content capture the product benefit |
| “Your feed will never look better” | Paragraph | Remove | Influencer language conflicts with the intended timeless brand |

#### Statistics

| Current message | Disposition | Reason |
| --- | --- | --- |
| “300+ Happy Travellers” | Change to “More than 300 guests served” | “Happy” is assumed; the counting unit is now confirmed |
| “15+ Tour Experiences” | Remove from trust section | Inventory count is incomplete and not a persuasive trust signal |
| “5.0 Google Rating” | Keep with source, count and date | Use “5.0 on Google from 15 reviews as of July 2026” and link it |
| “10+ Destinations” | Remove or define elsewhere | Not a meaningful trust fact without context |

#### Planning process

| Current message | Type | Disposition | Reason |
| --- | --- | --- | --- |
| “Simple Process” | Eyebrow | Simplify | Functional but generic |
| “Three Steps to Ghana” | Headline | Replace | The visitor is already planning Ghana; explain the relationship instead |
| “We've made the whole thing effortless” | Paragraph | Remove | Absolute convenience promise |
| “Browse & Pick Your Tour” | Step headline | Reframe | Appropriate catalogue action, but not the first planning relationship |
| “Filter by destination or vibe…” | Paragraph | Move to catalogue | Describes interface mechanics rather than service |
| “View all tours” | CTA | Keep as catalogue utility | Appropriate when visitors want inventory |
| “Book in Minutes” | Step headline | Remove | Not accurate for tailored or custom planning |
| Same-day confirmation and 30% deposit paragraph | Paragraph | Withhold | Both require confirmed operating rules |
| “WhatsApp us” | CTA | Keep and warm | Strong human route; use accurate hours and expectations |
| “Show Up & We Handle the Rest” | Step headline | Replace | Overpromises and makes the guest passive |
| Hotel pickup, transport, entry-fee and “every detail” paragraph | Paragraph | Verify by offer | Not approved as a universal inclusion |

#### Reviews

| Current message | Type | Disposition | Reason |
| --- | --- | --- | --- |
| “Real Reviews” | Eyebrow | Keep only when sources are visible | Current presentation does not provide source links |
| “What Our Travellers Say” | Headline | Change noun to “guests” | “Guests” is the approved human framing |
| “Don't take our word for it…” | Paragraph | Simplify | Can introduce proof without advertising phrasing |
| Precious Nwokeleme testimonial | Review | Replace with exact source wording or omit | Current text and Lagos attribution do not match the Google export |
| Tamaro Diallo testimonial | Review | Replace with exact source wording | Current wording and Dakar attribution do not match the Google export |

#### Newsletter and Instagram

| Current message | Type | Disposition | Reason |
| --- | --- | --- | --- |
| “Trip ideas for Ghana — once a month.” | Headline | Defer | No confirmed monthly editorial practice |
| “New tours, seasonal deals…” | Paragraph | Defer | Deals shift the brand toward promotion; privacy and cadence are unresolved |
| “Subscribe” | CTA | Defer | Use only after consent, policy and publishing ownership are ready |
| `@peopleand.places` | Identity | Keep | Correct social bridge |
| “Real tours. Real people. Real Ghana.” | Tagline | Remove | Generic and contradicted by the six stock images |
| “Follow on Instagram” | CTA | Keep with real content | Appropriate once the strip links to actual posts or approved media |

#### Navigation, shell and repeated conversion CTAs

| Current message | Location | Disposition |
| --- | --- | --- |
| “Book a Tour” | Desktop navigation | De-emphasize until availability and terms are clear |
| “Book a Tour” | Mobile navigation | Same rule as desktop |
| “Packages” | Navigation | Revisit during information architecture; it frames the offer as a commodity |
| “Ghana's premier tour company…” | Footer | Remove |
| “All Packages” | Footer | Revisit with the future offer naming system |
| “WhatsApp Us” | Footer | Keep |
| “Made with love in Accra” | Footer | Retain only if the founders want the casual tone; it is not a trust claim |

Navigational links such as Home, About, Contact and individual day-tour names
are functional labels rather than persuasive CTAs. Their naming should be
reviewed during information architecture, but they do not require advertising
copy.

### Cross-site messaging disposition

The full-site review identifies what each page must do in the future content
sprint. Final paragraph rewrites should wait for the verified tour and policy
inventory so new prose does not preserve old inaccuracies.

| Page or group | Current messaging issue | Future content job |
| --- | --- | --- |
| About | Incorrect origin, inflated scale, fictional team, unsupported safety/luxury/community claims and transformation language | Tell the true 2021 founder story, introduce Isaac and Kojo, and use sourced operating proof |
| Packages | Product grid and “bespoke/perfect adventure” language make the brand immediately comparable | Explain the three offer types, then provide accurate catalogue discovery |
| Contact | Conflicting response times, daily/24-hour implications, storefront language, unverified deposit information and broken policy links | Set one warm planning expectation, service-area wording and verified policies |
| Just Go Ghana | “Motherland is calling,” reconnect/rediscover, “breathtaking,” “unforgettable,” “transformative” and conflicting payment language | Define the real audience, pace, inclusions, emotional safeguards and payment terms |
| Individual tour pages | Repeated template, stock imagery, attraction lists, generic superlatives and dominant “Book a Tour” pressure | Give each offer a specific human point of view, accurate operations and a relevant conversation or availability action |
| Global navigation and footer | “Packages,” repeated “Book a Tour,” “premier,” public-name inconsistency and duplicated content | Align the information architecture, public name, CTA hierarchy and global source of truth |
| Thank-you and form experience | External form workflow and old GitHub Pages return URL need operational review | Provide a branded confirmation, privacy context and accurate response expectation |

### Tour-catalogue language findings

| Current offer | Messaging issue to resolve before migration |
| --- | --- |
| Just Go Ghana | “Ultimate” positioning and blanket inclusions; verify full itinerary and payment rules |
| Accra City Tour | Attraction list without a distinct host perspective; “epic” on the package card |
| Jamestown Heritage Walk | “Stories no guidebook captures” is an unprovable cliché; community context needs more care |
| Accra After Dark Food Tour | Strong contemporary territory, but “legendary” and nightlife framing need specific people and places |
| Cape Coast Ancestral Tour | Promises a lasting emotional result and compresses complex heritage into sales language |
| Elmina Castle & Fishing Village | “Perfect blend” and “unforgettable” flatten the relationship between traumatic history and living community |
| Kumasi Cultural Immersion | Broad “proud heart” and civilization language needs cultural precision and credited voices |
| Kente Weaving Village | Strong participation potential; verify “spiritual home,” artisan credits and take-home inclusion |
| Ada Foah Beach & Canoe Safari | “Pristine,” wildlife and sea-turtle language require current operational and environmental evidence |
| Quad Bike & Waterfalls | “Rip,” “thrill” and “wildest day out” conflict with the calm premium voice; safety and operator details need proof |
| Wli Waterfalls Hike | Destination superlatives and wildlife details require verification; the human experience is missing |
| Shai Hills & Boat Cruise | Species sightings and “one day, everything” should not be guaranteed |
| Aburi Day Tour | Generic escape/scenic framing; cocoa, garden and waterfall inclusions need exact route confirmation |
| Akosombo Dam & Lake Volta Cruise | Engineering and world-scale claims require fact-checking; current copy lacks a human story |
| Batik & Pottery Workshop | Strong brand fit; identify and credit the actual artisans and verify what guests make and keep |

The catalogue is not complete. These findings describe the current 15 records,
not the full future offer.

---

## Deliverable 8 — Trust Review

### Real trust signals available

| Trust signal | Verified state | Recommended use |
| --- | --- | --- |
| Founders | Founded in Ghana in 2021 by Isaac Yeboah and Evans Yirenkyi | Introduce both with real names, roles and imagery |
| Guest scale | More than 300 individual guests served | Use exact wording; do not inflate |
| Google rating | 5.0 from 15 reviews as of July 2026 | Link to Google and include verification date |
| Written review depth | 14 of 15 reviews contain comments | Use exact excerpts and varied proof themes |
| Named host evidence | Reviews name Kojo, Nana and other team members | Connect claims to real source language |
| Responsiveness | Usually replies within one hour during business hours | Publish with Monday–Friday, 9:00 a.m.–5:00 p.m. context |
| Direct contact | Ghana phone, international phone and WhatsApp | Keep consistent across channels |
| Operating history | Founded in 2021 | Use without implying that the Google listing date is the founding date |
| Original media | 32 Google Business photo files plus selected Instagram references | Use after identification and permission mapping |
| Registration | Founder confirms business registration exists | Public wording remains pending document review |

### Recommended review set

| Role | Reviewer | Evidence carried |
| --- | --- | --- |
| Featured guest story | Cynthia Muldrow | Family, Assin Manso, Cape Coast, Kojo, accessibility, emotional care and historical context |
| Supporting review | Louis Cameron | Kojo, cultural context, planning and support for his mother |
| Supporting review | Heather Harlin | Nana, hospitality, local insight, pacing and attention |
| Supporting team review | Shy osler | Kojo and Nana, communication, flexibility, punctuality, payment ease and personalization |

There is no need to force artificial founder-name parity beyond the available
evidence.

### Review presentation rules

- Preserve Google wording exactly.
- A shorter excerpt may be selected, but it must not be rewritten.
- Attribute reviewer name, rating, Google and date or year.
- Link to the Google profile.
- Call them Google reviews, not “verified customers,” unless booking records
  are matched.
- Reviewer portraits are not required.
- Optional trip photography must be from the related experience and approved.
- Cynthia's story should use an approved related image or remain text-led until
  one is identified.

### Current trust breaks

The following are priority risks for a future truth-correction sprint:

- Invented founder and team identities.
- Stock imagery labelled as real founders or staff.
- Incorrect 2012 founding date.
- 1,200 travellers, 500 reviews, 40 countries and 98% success claims.
- “Safety Guaranteed.”
- Unverified first-aid, tourism-certification, vehicle-standard and emergency
  protocol claims.
- “Luxury is our standard.”
- Unverified community contribution language.
- 24/7 support.
- Rewritten or unsupported testimonial copy.
- Stock reviewer portraits.
- Conflicting daily, weekday and response-hour claims.
- Same-day confirmation and universal deposit claims.
- Conflicting Just Go Ghana deposit information.
- Placeholder privacy and terms links.
- Old Google website and secondary phone details.
- Storefront implications for a service-area business.

### Additional trust-building opportunities

1. Publish a canonical claim register with source, owner and review date.
2. Show Isaac and Kojo early with real biographies and media.
3. Add exact Google review proof near the relevant service claims.
4. Publish accurate payment, cancellation, refund, privacy and terms
   information.
5. Explain what “premium care” means operationally.
6. State office hours separately from tour-day availability.
7. Describe day tours accurately: any chosen day with advance notice.
8. Clarify that People & Places is based in Ghana and serves guests at their
   locations and destinations, without implying a walk-in office.
9. Move to an owned-domain email when practical.
10. Maintain a considered Google review-response practice.
11. Add licence and insurance facts only after they are active and documented.
12. Review every trust claim quarterly across website, Google, Instagram,
    WhatsApp and inquiry templates.

### Trust principle

> A smaller true number is more premium than a larger unsupported number.

---

## Deliverable 9 — Competitive Positioning

### Competitive frame

The relevant market already uses:

- Authenticity.
- Local guides.
- Meaningful connection.
- Heritage.
- Homecoming.
- Transformation.
- Community.
- Luxury.
- Stress-free planning.
- Tailor-made tours.
- “Real Ghana.”

Repeating these phrases more loudly will not distinguish People & Places.

### Competitor-published positions

| Competitor | Published emphasis | Implication for People & Places |
| --- | --- | --- |
| [Ashanti African Tours](https://ashantiafricantours.com/) | Broad West African inventory, ethical travel, local guides, customization and extensive proof claims | Do not compete on scale; compete on Ghana-specific intimacy and story |
| [Travel Time Africa](https://traveltimeafrica.com/) | Premium comfort, Black heritage, cultural connection, prices and visible reviews | “Luxury + culture + stress-free” is already crowded territory |
| [Cultured Ghana](https://culturedghana.com/) | Culture, connection, community, return, impact and luxe experiences | Abstract “meaningful connection” is not enough to differentiate |
| [Protour Africa](https://protour.africa/) | Ancestral return, belonging, heritage and spiritual framing | Avoid making transformation or spiritual outcome a universal promise |
| [African Roots Travel](https://www.africanrootstravel.com/) | Full-time Ghana presence, diaspora family, homecoming and living culture | “We live here” and “we treat you like family” need more specific proof |
| [Nkabom Culture](https://www.nkabomculture.com/) | Cultural travel, return, relocation and audience-specific retreats | Audience specialization can be useful, but broad category language is common |
| [Sankofa Journeys](https://www.sankofabra.com/) | Roots, spiritual pilgrimage, heritage and ethical tourism | Clear emotional language without evidence is not sufficient for premium trust |

### Category parity

People & Places must communicate these clearly because visitors expect them:

- Ghana-based knowledge.
- Cultural, historical, food, nature and city experiences.
- Day, private, group, tailored and custom options.
- Dependable transport and planning.
- Safety awareness.
- Responsive communication.
- Reviews and contact details.
- Accurate price or quotation expectations.

These are reasons to qualify. They are not reasons to choose.

### Defensible difference

People & Places can credibly build distinction through:

1. **A fuller story of Ghana.** The founding observation is specific and true.
2. **Visible hosts.** Isaac and Kojo should carry the brand instead of hiding
   behind “local experts.”
3. **Contemporary and everyday Ghana.** Food, humour, neighbourhood life,
   creativity, friendship and the present can sit beside heritage.
4. **Emotionally intelligent context.** Important history can be prepared for
   without promising a guest's transformation.
5. **Premium attention.** Pacing, preparation, communication and noticing are
   more credible than repeated luxury claims.
6. **Evidence-led humanity.** Real people, exact reviews, original media and
   specific moments make the brand believable.

### Recommended positioning

> People & Places is a Ghanaian-founded travel company that hosts thoughtful,
> personal experiences across Ghana. Through local perspective, cultural
> context and attentive care, we help guests encounter the country as it is
> lived—not simply move through an itinerary.

### Positioning risk

“Hosted by people born and raised here” can still sound generic if the homepage
does not immediately show who those people are. “Hosted” can also be mistaken
for accommodation. Supporting copy, metadata and offer language must clarify
that People & Places provides tours and travel planning.

---

## Deliverable 10 — Opportunities to Become a Premium Destination Brand

### 1. Make the founders recognizable

Isaac and Kojo should be editorial voices, hosts and sources of perspective—not
an About-page footnote.

### 2. Let the name organize the story

Create stories about people, stories about places and the moments where the two
meet.

### 3. Inspire before displaying inventory

Use the homepage to create desire and understanding before asking visitors to
compare tours.

### 4. Curate rather than display everything

A premium brand makes intentional choices. Feature three to five relevant
experiences and provide the full catalogue elsewhere.

### 5. Show contemporary Ghana beside heritage

Heritage matters, but it should not become the only frame through which Ghana
is presented.

### 6. Turn care into observable standards

Show preparation, response expectations, accessibility conversations, pacing,
context and follow-through.

### 7. Use original media as proof

Photography should carry names, places, moments and permissions—not merely fill
cards.

### 8. Preserve real guest language

Verbatim reviews are more convincing than polished testimonial copy.

### 9. Practice visual and verbal restraint

Fewer claims, fewer urgent CTAs, calmer pacing and more stable proof will feel
more premium than additional animation or adjectives.

### 10. Publish useful cultural stories

Founder notes, food stories, cultural context and contemporary Ghana can make
the website valuable before a visitor is ready to inquire.

### 11. Align every channel around one hosting promise

Website, Instagram, Google, WhatsApp, email and inquiry documents should feel
like the same host speaking.

### 12. Build content governance into the platform

The future backend should manage:

- Tours and offer types.
- Photography and video.
- Founder and host profiles.
- Featured content.
- Guest stories.
- Exact review excerpts and sources.
- Trust facts and verification dates.
- Operating information.
- Draft, preview, publish and archive states.

Premium consistency cannot depend on manually editing repeated strings across
many static files.

---

## Approved decisions

- Public customer-facing name: **People & Places**.
- No permanent descriptor is currently approved.
- “Ghanaian-hosted journeys” is rejected.
- “Journey/journeys” should not be the default customer-facing category noun.
- Provisional hero: “Your time in Ghana, hosted by people born and raised
  here.”
- Provisional support: “We share Ghana's history, food, culture and everyday
  life as we know them firsthand, shaping your time here around what brings
  you.”
- Homepage uses the approved 10-section narrative.
- Offers include day tours, tailored multi-day tours and custom tours.
- Day tours can be booked for any chosen day with advance notice.
- Homepage shows a small featured selection, not the complete inventory.
- “Guests” is the preferred audience noun.
- Cynthia is the featured guest story.
- Louis, Heather and Shy form the supporting review set.
- Google review wording remains verbatim.
- Reviewer portraits are not required.
- Neutral labelled placeholders are acceptable during development.
- Accurate approved media is required for launch-critical slots.
- The future site requires a managed backend for tours, media, reviews,
  featured content and trust information.
- Codex leads architecture, content models, CMS decisions and acceptance
  criteria.
- Claude Code leads future UI implementation, usability, responsive behaviour
  and visual execution after architecture approval.

## Open decisions and evidence gaps

- Final hero and supporting wording.
- Complete tour inventory.
- Exact three-to-five featured-tour selection.
- Final naming system for day, tailored and custom offers.
- Image-by-image mapping of the Google and Instagram assets.
- Cynthia's approved related photograph.
- Current media ownership and consent records.
- Exact payment, deposit, refund and cancellation rules.
- Privacy and terms content.
- Business registration document review and approved wording.
- Production website domain and hosting.
- CMS platform selection.
- Direct rendered Instagram account review.
- Fresh desktop, mobile, keyboard and accessibility review of the current
  website.
- Ghana Tourism Authority licence completion.
- Insurance coverage.

The final two items are not blockers to strategy or architecture. They are
claims that must remain unpublished until active and documented.

## Sprint 0 conclusion

People & Places should not redesign the current sales funnel and call it a new
brand. It should first replace the underlying story and proof structure.

The sequence is:

1. Approve the truth, narrative and brand foundation.
2. Resolve operational claims and content ownership.
3. Define the content and CMS architecture.
4. Prepare real copy and media.
5. Implement the UI around the approved emotional progression.
6. Align all customer touchpoints.
7. Validate trust, usability and visual quality before launch.

The detailed sequence, owners and gates are defined in
[the prioritized roadmap](./people-and-places-prioritized-roadmap.md).
