# People & Places Prioritized Roadmap

**Version:** 1.0  
**Status:** Proposed sequence for founder approval  
**Prepared:** July 25, 2026  
**Starting point:** Sprint 0 strategy audit complete; no website implementation
has been authorized or performed  

## Purpose

This roadmap turns the Sprint 0 findings into a controlled sequence for future
work.

It is designed to prevent three common failures:

- Redesigning inaccurate content.
- Letting an old component structure dictate the new brand story.
- Building a CMS or UI before the content responsibilities are understood.

The future website must support both a premium customer experience and a
practical managed backend. Founders should be able to add and update tours,
upload media, select featured content and maintain approved reviews without
editing source code.

## Non-negotiables

1. Truth before polish.
2. Story before product comparison.
3. Named people before generic “local” claims.
4. Original, approved media before public launch.
5. Exact source language for reviews.
6. Premium through care, clarity and restraint.
7. Content models before visual components.
8. One source of truth across website, Google, Instagram, WhatsApp and email.
9. No active licence or insurance claim until documented.
10. No public launch with an invented person, unsupported statistic, broken
    policy link or unlabeled placeholder.

## Responsibility boundary

| Role | Primary responsibility |
| --- | --- |
| Founders | Business truth, offer accuracy, brand decisions, media context, consent and final approval |
| Codex | Information architecture, content models, CMS evaluation, data contracts, migration strategy, trust governance, technical acceptance criteria and architecture QA |
| Claude Code | UI implementation, usability, responsive behaviour, interaction, accessibility and visual execution after architecture approval |
| Engineering owner | Backend and CMS implementation against the approved architecture; this may be Codex-assisted or assigned separately |
| Shared | Integration, browser QA, content verification and launch acceptance |

Claude Code should not receive the current
`docs/claude-homepage-handoff.md` as the active implementation brief. It
documents an older homepage and conversion direction. A new handoff should be
created only after the content architecture is approved.

## Recommended sequence

### Sprint 0 — Brand strategy and storytelling

**Status:** Substantially complete; founder approval gate remains.

#### Completed outputs

- Brand Foundation.
- Homepage Messaging Brief.
- Brand Experience and Storytelling Audit.
- Emotional Journey Map.
- Homepage Narrative Review.
- Photography Strategy.
- Brand Personality Assessment.
- Messaging Review.
- Trust Review.
- Competitive Positioning.
- Premium destination-brand opportunities.
- Prioritized roadmap.

#### Founder decisions already recorded

- Public brand is People & Places.
- No permanent descriptor is approved.
- “Ghanaian-hosted journeys” is rejected.
- The working hero and support are provisional.
- The 10-section homepage order is approved.
- Day tours can run on a guest's chosen day with advance notice.
- Offers include day tours, tailored multi-day tours and custom tours.
- Homepage should show three to five featured offers.
- Cynthia is the featured guest story.
- Louis, Heather and Shy provide supporting review proof.
- Google review wording remains exact.
- Reviewer portraits are optional and not required.
- Labelled placeholders are acceptable during development.
- A managed backend is required.

#### Remaining Sprint 0 gate

- Review and approve the audit conclusions.
- Confirm that the roadmap sequence reflects business priorities.
- Keep the working hero provisional or approve a final language round.
- Confirm that truth correction is the first implementation priority.

#### Exit criteria

- Founders approve the Brand Foundation, audit, homepage story and roadmap as
  the strategy source of truth.
- No UI work begins from the stale homepage handoff.

---

### Sprint 1 — Truth, operations and content readiness

**Priority:** P0  
**Lead:** Founders with Codex structuring and auditing  
**Why now:** A premium interface cannot repair contradictory or unsupported
business information.

#### 1. Create a canonical claim register

Every public fact should record:

- Claim.
- Approved wording.
- Source.
- Owner.
- Verification date.
- Expiry or review date.
- Approved channels.
- Draft, approved, withheld or expired status.

Initial approved facts include:

- Founded in Ghana in 2021.
- More than 300 individual guests served.
- 5.0 on Google from 15 reviews as of July 2026.
- Monday–Friday, 9:00 a.m.–5:00 p.m. office hours.
- Usually replies within one hour during business hours.
- Day tours available for a chosen day with advance notice.
- Primary phone: +233 50 367 3473.
- International phone: +1 803 477 6489.

The Ghana Tourism Authority licence and insurance must remain withheld until
active and documented.

#### 2. Complete the master tour inventory

The current 15 records are incomplete. For every offer, record:

- Public title.
- Offer type: day, tailored multi-day or custom.
- Active or inactive state.
- Duration.
- Available days or advance-notice rule.
- Starting point or meeting arrangement.
- Locations.
- Intended audience and accessibility considerations.
- Group-size rules.
- Price and currency.
- What is included and excluded.
- Deposit and payment rules.
- Cancellation and refund rules.
- Operational owner.
- Accurate media.
- Cultural context and human story.
- Homepage eligibility.

#### 3. Resolve policy and payment truth

Confirm and document:

- Deposit rules by offer.
- Payment schedule.
- Accepted payment methods.
- Currency and exchange handling.
- Cancellation.
- Refunds.
- Rescheduling.
- Weather and operational changes.
- Guest responsibilities.
- Accessibility and health conversations.
- Privacy.
- Terms.

The existing universal 30% and Just Go Ghana $400/30% conflict must not be
migrated without resolution.

#### 4. Create the review source register

For every approved review excerpt, record:

- Reviewer display name.
- Exact source text.
- Selected exact excerpt.
- Rating.
- Platform.
- Review date.
- Source URL.
- Related experience.
- Host names mentioned.
- Publication state.
- Optional related media and permission.

Map Cynthia, Louis, Heather and Shy first.

#### 5. Create the media source register

Inventory:

- Thirty-two Google Business images.
- Five founder-selected Instagram references.
- Founder originals.
- Tour media held elsewhere.
- Existing video.

For each item, capture ownership, consent, subjects, tour, place, story, date,
orientation, resolution, alt text, focal point and intended role.

Do not commission a broad new shoot until this inventory reveals the actual
gaps.

#### 6. Create the truth-correction backlog

Mark every current item as:

- Keep.
- Rewrite.
- Remove.
- Replace with sourced proof.
- Await evidence.

P0 items include invented founders and team members, false scale and founding
claims, stock testimonial identities, unsupported certification or safety
claims, conflicting hours, payment contradictions and broken policy links.

#### 7. Correct exposed channel facts that do not depend on the redesign

Once the canonical facts are approved, do not wait for the new UI to correct
current public operating information:

- Align Google office hours.
- Reconcile the public secondary phone.
- Clarify service-area wording.
- Replace generic or inaccurate service language where possible.
- Align WhatsApp and inquiry response expectations.

The Google website URL should be updated when the production URL is ready.
Full narrative and media alignment remains in Sprint 5.

#### Exit criteria

- Every launch-intended claim has a source and owner.
- Complete current tour inventory is available.
- Payment and policy contradictions are resolved or explicitly withheld.
- Approved review records are source-mapped.
- Existing media is catalogued sufficiently to identify gaps.
- No false current-site content is marked for migration.

---

### Sprint 2 — Information architecture and CMS decision

**Priority:** P0  
**Lead:** Codex  
**Dependency:** Sprint 1 claim and inventory structure  

#### 1. Define page responsibilities

At minimum:

- Homepage.
- About and hosts.
- Experience discovery.
- Full tour catalogue.
- Day-tour detail.
- Tailored multi-day detail.
- Custom-tour planning.
- Guest stories.
- Stories or field notes.
- Contact and planning.
- Policies.

Each page should have one primary narrative and conversion job.

#### 2. Define the content model

Required managed types:

- Site settings.
- Brand identity.
- Navigation and footer.
- Homepage sections.
- Founder and host profiles.
- Origin story.
- Experience pathways.
- Tours.
- Featured-tour collections.
- Hosting principles.
- Guest stories.
- Reviews.
- Trust facts.
- Planning steps.
- Social and editorial stories.
- Calls to action.
- Contact and operating information.
- Policies.
- Media.

#### 3. Define trust-aware fields

Claims, reviews and media cannot remain ungoverned strings.

Models need:

- Source.
- Verification date.
- Permission state.
- Approval state.
- Publication state.
- Owner.
- Expiry or review date.
- Channel eligibility.
- Revision history where appropriate.

#### 4. Define tour architecture

Separate:

- Catalogue content.
- Homepage curation.
- Booking or inquiry data.
- Search and filters.
- Operational availability.
- Pricing.
- Media.
- Story content.

Replace the current `homeFeatured` boolean with an editorial feature
collection that can enforce:

- Three-to-five item limits.
- Manual order.
- Start and end dates if needed.
- Motivation balance.
- Draft preview.
- Reason for feature.

#### 5. Define media architecture

The media model should support:

- Direct upload.
- Original and optimized derivatives.
- Image and video.
- Alt text.
- Caption.
- Focal point.
- Orientation.
- Credit.
- Owner.
- Consent.
- Related people, place, tour and story.
- Placeholder state.
- Public approval state.

#### 6. Evaluate and select a CMS

The decision should be based on:

- Ease of use for founders.
- Tour and media publishing workflows.
- Draft, preview, publish and archive support.
- Authentication and roles.
- Media handling.
- Structured review and trust fields.
- API quality.
- Hosting compatibility.
- Backup and export.
- Cost.
- Security and maintenance.
- Future booking or payment integration without forcing it now.

Produce an architecture decision record comparing viable options. Do not pick a
platform because it is fashionable or because the current frontend makes it
convenient.

#### 7. Define workflows and roles

Minimum workflow:

> Draft → editorial review → fact and permission check → preview → publish →
> scheduled review → archive.

Possible roles:

- Administrator.
- Editor.
- Media contributor.
- Reviewer or approver.

#### 8. Define interfaces and acceptance contracts

Codex should deliver:

- Content schemas.
- API or data contracts.
- Page-to-content mapping.
- Media rules.
- Validation rules.
- Migration map from current files.
- Error and fallback states.
- Preview behaviour.
- Test contracts.
- New Claude Code implementation brief.

#### Exit criteria

- CMS platform is selected and recorded.
- Founders approve the publishing workflow.
- Every approved homepage section maps to a content type.
- Tour, review, trust and media models include provenance.
- UI can be built against stable contracts without embedding final content in
  components.
- A new Claude Code handoff replaces the stale one.

---

### Sprint 3A — Backend and CMS foundation

**Priority:** P1, required for launch  
**Lead:** Engineering owner against Codex architecture  
**Can run alongside:** Sprint 3B and, after contracts stabilize, Sprint 3C  

#### Scope

- Configure the selected CMS and environments.
- Implement authentication and roles.
- Implement structured content types.
- Implement media upload and derivative handling.
- Implement draft, preview, publish and archive.
- Add validation for required trust and permission fields.
- Establish backup and export.
- Create content migration utilities.
- Seed approved content.
- Protect secrets and environment configuration.
- Log publication and validation errors.

#### Founder workflow test

A founder must be able to:

1. Create or edit a tour.
2. Upload and select accurate media.
3. Enter price, duration and advance-notice information.
4. Save a draft.
5. Preview it.
6. Submit or approve it.
7. Publish it.
8. Feature or unfeature it on the homepage.
9. Correct it without editing code.

#### Exit criteria

- Founder publishing workflow succeeds end to end.
- Permissions prevent unintended publication.
- Content is portable and backed up.
- Trust, source and media checks are enforced.
- Preview accurately represents production content.

---

### Sprint 3B — Content and photography production

**Priority:** P1  
**Lead:** Founders and content owner, using Codex schemas and guardrails  
**Can run alongside:** Backend and early UI work  

#### Homepage content package

Prepare approved content for all 10 sections:

1. Final or approved-working hero.
2. Founder story and profiles.
3. Five experience pathways.
4. Three to five featured tours.
5. Four hosting principles with proof.
6. Cynthia guest story.
7. Louis, Heather and Shy review excerpts plus trust facts.
8. Planning process.
9. Real Instagram or owned stories.
10. Final invitation and contact reassurance.

#### Media package

Required final assets:

- Owned hero film or still.
- High-resolution Isaac and Kojo image.
- Interaction-led pathway images.
- Accurate images for featured tours.
- Cynthia's related approved image, or an intentional text-led treatment.
- Hosting and planning moments.
- Real social/editorial story media.
- Warm final image if used.

#### Content quality rules

- No generic adjective can substitute for a concrete detail.
- No transformation claim is written on behalf of guests.
- No review is rewritten.
- No source is published without attribution where required.
- No cultural contributor is treated as visual decoration.
- No incomplete operational fact is hidden in marketing language.

#### Exit criteria

- Production copy is approved.
- Featured tours are confirmed.
- Launch-critical assets are approved and mapped.
- Every media item has alt text, credit and consent state.
- Development placeholders are clearly identified.

---

### Sprint 3C — Homepage UI and usability implementation

**Priority:** P1  
**Lead:** Claude Code  
**Dependency:** Stable Sprint 2 contracts and active content package  

#### Scope

- Implement the approved 10-section narrative.
- Establish emotional and visual pacing.
- Make founders, guest story and reviews readable and credible.
- Build responsive desktop, tablet and mobile behaviour.
- Build keyboard and screen-reader access.
- Respect reduced-motion settings.
- Create useful loading, empty, error and placeholder states.
- Make CTA progression clear without pressure.
- Preserve performance with optimized real media.
- Avoid reproducing the old catalogue, counters and stock social strip under a
  new visual skin.

#### Architecture boundary

Claude Code may decide:

- Layout treatment.
- Responsive composition.
- Component presentation.
- Interaction patterns.
- Visual hierarchy.
- Accessibility implementation.

Claude Code should not independently redefine:

- Brand positioning.
- Approved section order.
- Offer facts.
- Review wording.
- Trust claims.
- Content schemas.
- CMS workflow.
- Founder-approved media meaning.

Any necessary strategy change returns to founder review and Codex architecture
assessment.

#### Exit criteria

- The five-second test passes with representative new visitors.
- The 10-section story remains intact across viewport sizes.
- UI reads from the agreed content contracts.
- All interactive elements are keyboard accessible.
- Reduced-motion behaviour is usable.
- No named person is represented by placeholder stock.
- Visual QA is completed in a working browser.

---

### Sprint 4 — Catalogue, tour pages and custom planning

**Priority:** P1  
**Lead:** Codex architecture plus Claude Code UI implementation  
**Dependency:** CMS foundation and homepage patterns  

#### Scope

- Migrate the complete verified tour inventory.
- Build day-tour, tailored multi-day and custom-tour presentation patterns.
- Separate editorial discovery from catalogue filters.
- Expose duration, date rules, starting point, price basis, inclusions,
  exclusions and accessibility information clearly.
- Implement accurate inquiry and availability flows.
- Preserve a warm conversation route alongside transactional actions.
- Add related tours through editorial rules rather than arbitrary repetition.
- Remove unsupported promotional badges.
- Ensure homepage curation is managed independently of catalogue publication.

#### Exit criteria

- Every published tour is operationally accurate.
- Founders can publish and feature offers from the CMS.
- Day tours clearly state chosen-day availability with advance notice.
- Tailored and custom offers are not confused with fixed packages.
- Prices and policies are consistent across cards, detail pages and inquiries.
- No incomplete tour is accidentally public.

---

### Sprint 4B — Full-site UI renovation (About, Contact, and remaining pages)

**Priority:** P1  
**Lead:** Claude Code  
**Dependency:** Sprint 3C homepage visual language finalized (this sprint extends those patterns site-wide rather than inventing new ones)  
**Can run alongside:** Sprint 4  

#### Why this exists

The roadmap staged UI work as homepage (3C) → catalogue/tour pages (4) →
cross-channel (5) → whole-site QA (6). That sequence never named a phase
for the site's remaining pages — About, Contact, and any other
non-catalogue page — as their own visual-design initiative. Sprint 1's
truth-correction pass already fixed *content* accuracy on About and
Contact (fabricated founders, false stats, conflicting claims — see
`docs/sprint-1-truth-correction-backlog.md`), but that was a content fix,
not a UI rebuild. This sprint is the one that was missing: an explicit
audit and renovation of the *design* of every remaining page so the whole
site reads as one system instead of homepage-quality work sitting next to
older patterns.

#### Scope

- Audit every non-homepage, non-catalogue page (About, Contact, and any
  utility pages) against the homepage's finalized visual language:
  typography rhythm, spacing scale, component patterns, motion/reveal
  conventions.
- Identify dated or inconsistent patterns (e.g. legacy inline-style blocks,
  one-off section treatments that don't match the rest of the site,
  unused/orphaned CSS left behind by content fixes).
- Rebuild each page's UI to match the site's current design system,
  respecting the explicit off-limits list in `CLAUDE.md`: the
  `packages.html` card grid, the tour-detail booking sidebar, the
  day-by-day accordion itinerary, and the included/not-included checklist
  are **not** to be redesigned as part of this sprint.
- Responsive-check every touched page per the standing rule in `CLAUDE.md`.

#### Exit criteria

- Every remaining page shares the same design language as the finalized
  homepage — no page reads as visibly older or inconsistent.
- No off-limits component (per `CLAUDE.md`) was altered.
- No regressions in existing functionality (forms, FAQs, nav, footer).
- Responsive check completed and reported at all five standard breakpoints.

---

### Sprint 5 — Cross-channel brand alignment

**Priority:** P1  
**Lead:** Founders with content and operations support  
**Dependency:** Production URL and approved canonical facts  

#### Google Business

- Replace the old Google Sites URL with the production site.
- Apply founder-approved office hours.
- Replace the outdated secondary Ghana number with the approved international
  number if that is the intended public setup.
- Rewrite the description around Ghanaian perspective, personal hosting and
  cultural context.
- Confirm service categories and service-area wording.
- Use current, approved images.
- Review unanswered reviews against the live profile before replying.

#### Instagram

- Connect actual founder-selected posts or owned stories to the website.
- Use the same founder identities, tone and offer language.
- Add context, not only destination spectacle.
- Establish repeatable story territories: people, everyday Ghana, meaning,
  encounters, contemporary life and preparation.

#### WhatsApp and contact

- Use one greeting and response expectation.
- Separate office hours from tour-day operation.
- Use the approved day-tour advance-notice explanation.
- Create consistent inquiry questions without making the conversation feel
  like a form.

#### Email and documents

- Align proposals, confirmations and preparation messages with the brand voice.
- Use verified prices, policies and contact details.
- Consider an owned-domain email.

#### Exit criteria

- Name, phones, hours, website, offer types and review proof match everywhere.
- Each channel feels like the same host.
- No channel publishes an unsupported licence, insurance, safety or scale
  claim.

---

### Sprint 6 — Trust, legal, accessibility and launch readiness

**Priority:** P0 before public relaunch  
**Lead:** Shared  

#### Truth QA

- Compare every public claim with the canonical register.
- Verify dates and aggregate review wording.
- Verify all prices and policies.
- Confirm media consent and credits.
- Remove every launch-critical placeholder.
- Confirm founders and staff shown are real.

#### Legal and operational QA

- Publish privacy, terms, cancellation, refund and payment information.
- Review visa, vaccination, health and safety wording for current accuracy.
- Confirm service-area language.
- Confirm that licence and insurance status are either documented or omitted.

#### Technical QA

- Desktop and mobile browsers.
- Keyboard navigation.
- Screen reader basics.
- Colour contrast.
- Reduced motion.
- Forms and validation.
- Error states.
- Performance and media optimization.
- Search metadata and structured data.
- CMS permissions.
- Backups and recovery.
- Analytics and consent where used.
- Security review.

#### Narrative QA

Ask unfamiliar visitors:

- What does this company do?
- Why do you trust it?
- What feels different?
- What emotion do you feel?
- What would you do next?

The answers should match the strategy without coaching.

#### Exit criteria

- Zero invented identities.
- Zero unsupported public claims.
- Zero broken policy links.
- Zero unlabeled or launch-critical placeholders.
- All published reviews preserve source wording.
- All public media is approved.
- Founder CMS workflow passes.
- Core accessibility and browser checks pass.
- Cross-channel facts match.
- Founders provide final launch approval.

---

### Sprint 7 — Learning and growth

**Priority:** P2, after the core experience is trustworthy  
**Lead:** Founders with strategy and technical support  

Possible initiatives:

- Founder field notes and cultural stories.
- Search-led Ghana planning content.
- Guest-story programme.
- Ethical review-request practice.
- Tripadvisor proof if operationally useful.
- Partner and community profiles with permission.
- Seasonal content without discount dependence.
- Newsletter only after consent, ownership and editorial cadence are ready.
- Inquiry-quality and conversion measurement.
- Quarterly content, claim and media audit.
- Booking or payment integration only when the operational workflow justifies
  it.

Growth should deepen the point of view, not expand the number of generic
claims.

## Parallel-work map

After Sprint 2 contracts are approved, three tracks can proceed in parallel:

| Track | Work | Owner |
| --- | --- | --- |
| A | CMS and backend foundation | Engineering owner under Codex architecture |
| B | Copy, media and source preparation | Founders and content owner |
| C | Homepage UI and usability | Claude Code |

They converge in Sprint 4 for catalogue and integration.

Parallel work should not bypass dependencies:

- UI needs stable fields and states.
- CMS needs approved workflows.
- Content needs verified business facts.
- Launch needs final approved media and policies.

## Priority register

### P0 — Must be resolved before public relaunch

- Canonical claim register.
- Removal or quarantine of invented people and false statistics.
- Removal of unsupported certification, safety, luxury and impact claims.
- Exact sourced reviews.
- Consistent office hours, response promise and phones.
- Complete payment and cancellation truth.
- Real privacy and terms pages.
- Media source and permission register.
- Accurate service-area wording.
- CMS content governance.
- No launch-critical placeholders.
- Cross-channel fact alignment.

### P1 — Core premium experience

- Final homepage narrative and copy.
- Visible Isaac and Kojo profiles.
- Real guest-host hero media.
- Five experience pathways.
- Three to five featured tours.
- Cynthia story.
- Review and trust section.
- Managed tour, media and review publishing.
- Responsive and accessible UI.
- Complete tour catalogue and custom-planning flow.

### P2 — Growth and editorial depth

- Field notes and cultural editorial content.
- Review-response and review-request practice.
- Domain email.
- Tripadvisor and relevant third-party proof.
- Newsletter.
- Partnerships and community profiles.
- Deeper measurement and automation.

## Required decisions before architecture is complete

| Decision | Owner | Needed by |
| --- | --- | --- |
| Complete tour inventory | Founders | Sprint 1 exit |
| Payment, deposit, cancellation and refund rules | Founders | Sprint 1 exit |
| Exact featured-tour set | Founders with strategy support | Sprint 3B |
| Final hero language | Founders | Before production copy lock |
| Media ownership and consent mapping | Founders | Sprint 3B exit |
| Cynthia story image | Founders | Sprint 3B exit |
| CMS platform | Founders on Codex recommendation | Sprint 2 exit |
| Publishing roles | Founders | Sprint 2 exit |
| Production domain and hosting | Founders with architecture support | Before integration |
| Business registration public wording | Founders after document review | Before launch |

Licence and insurance completion do not need to delay architecture. The claims
must simply remain absent until true and documented.

## Success measures

### Brand clarity

- Unfamiliar visitors identify Ghana, human hosting and the offer within five
  seconds.
- Visitors can name a specific reason People & Places feels different.

### Trust integrity

- Every claim has a source, owner and review date.
- Review excerpts exactly match their source.
- No public stock person represents a real named person.
- Website and Google facts match.

### Story quality

- The homepage follows the approved emotional sequence.
- Founders appear before product pressure.
- The page contains at least one specific guest story.
- Contemporary Ghana appears beside heritage and landmarks.

### Operational usefulness

- Founders can add, edit, preview and publish a tour without code.
- Media can be uploaded with permission, alt text and story context.
- Featured tours can be managed without changing catalogue records manually.

### Usability and quality

- Responsive, keyboard and reduced-motion checks pass.
- Pages load efficiently with optimized media.
- Contact expectations are clear.
- No launch-critical placeholder remains.

## Change-control rule

Once this roadmap and the Brand Foundation are approved:

- Brand strategy changes require founder approval.
- Content-model changes require Codex architecture review.
- UI changes that preserve the model remain within Claude Code's remit.
- Operational facts must be updated through the canonical register and CMS,
  not copied independently across channels.

This preserves the agreed division of work while allowing the design and
engineering teams to move quickly.

## Immediate next checkpoint

The next action is not coding.

The founders should review:

1. The Sprint 0 audit conclusion.
2. The P0 truth risks.
3. The approved 10-section homepage sequence.
4. The proposed Sprint 1 truth and content-readiness scope.
5. The Codex/Claude Code responsibility boundary.

Once those are approved, Sprint 1 can begin with the claim register, master
tour inventory, policy truth and media inventory.
