# Phase 2B — Environmental Design System

The measuring stick for Phase 2 implementation.

**Read `phase-2a-brand-experience-strategy.md` first.** That document decides
what we believe: photography leads, environmental density is inverse to
emotional weight, nothing decorative goes near sites of memory. Those
decisions are not restated here.

This document exists because a principle cannot be checked. "Backgrounds
should support photography, never compete with it" is correct and unarguable,
and two designers will disagree about whether a given gradient obeys it. So
every rule below is written as something you can measure, count or fail a
review against.

Where 2A and 2B appear to conflict, 2A wins and this document is wrong.

---

## 1. The four registers

Every section on the site is assigned exactly one register. This is the single
most important decision in the system, and it is made from the *content's
emotional weight*, never from a wish for variety.

| Register | Layers | Max coverage | Max opacity | Motion |
| --- | --- | --- | --- | --- |
| **Open** | up to 3 | 100% of section | 0.18 | scroll-linked, ≤ 40px travel |
| **Ambient** | up to 2 | 60% | 0.10 | scroll-linked, ≤ 24px travel |
| **Quiet** | 1 | 30%, edges only | 0.06 | none |
| **Silent** | 0 | — | — | none |

**Coverage** means the proportion of the section's area touched by any
decorative element, including gradients. **Opacity** is the element's effective
alpha against its own background, including any blur.

### Register assignment

| Section | Register | Why |
| --- | --- | --- |
| Homepage hero | Open | The invitation; the one place expression is the point |
| Homepage final invitation | Open | Closing beat |
| Homepage mid sections | Ambient | Support, not spectacle |
| Experiences listing | Ambient | Photography is dense already |
| About story & mission | Ambient | |
| Experience detail body | Quiet | Reading |
| FAQs, itineraries | Quiet | Scanning |
| **Heritage content** | **Silent** | §4.2 below |
| **Booking flow** | **Silent** | Trust is the job |
| **Confirmation** | **Silent** | |
| 404, thanks | Quiet | |

A section may move one register *down* (quieter) at any time without review. It
may only move *up* with a reason recorded in this table.

---

## 2. Density budget

Per page, across all sections combined:

- **No more than 2 Open sections.** Three means none of them reads as special.
- **At least 40% of sections must be Quiet or Silent.** Rhythm requires rest.
- **Never two Open sections adjacent.** Always separate them with Ambient or
  quieter.

Per element:

- **Maximum 3 stacked layers** in any one section, including gradients.
- **Nothing decorative may exceed 40% of the viewport height** at any
  breakpoint. Backgrounds are ground, not subject.
- **One "gesture" per section.** If a section has a horizon, it does not also
  get a corner form and a topographic line.

---

## 3. Shape vocabulary

The system draws from a closed set. If a proposed element is not in this list,
either it is wrong or the list needs a recorded amendment.

**Permitted:**

1. **Horizon** — a single near-horizontal edge, ≤ 6° from level, spanning the
   full width. The primary form.
2. **Layered planes** — 2–3 overlapping horizons implying distance.
3. **Soft arc** — a shallow curve, radius ≥ 2× the section width. Never a
   semicircle, never a wave with more than one crest.
4. **Edge mask** — a shape that reveals or clips a photograph at its boundary.
5. **Field** — an untextured area of tone or gradient, no discernible edge.

**Forbidden as shapes:** anything representational. No huts, drums, wildlife,
maps, kente patterns, Adinkra glyphs, or symbolic marks of any kind. If it can
be named as a thing, it is illustration, not environment.

### Construction rules

- **Corner radius**: shapes are either fully straight-edged or use radii from
  the existing scale (`--radius-lg`, `--radius-xl`). No arbitrary curves.
- **Angles**: 0°, or between 2° and 6°. Nothing between 7° and 88° — diagonal
  energy belongs to a different brand.
- **Colour**: from the existing palette only. Environmental elements may not
  introduce a hue. Tints and gradients of `--pap-charcoal`, `--pap-forest`,
  `--pap-cream` and `--pap-soft-gold` only. **`--color-primary` is never a
  background field** — yellow is reserved for action.
- **Family test**: any two elements from the system, placed side by side,
  should be recognisable as the same hand. If one is drawn and one is
  photographic, one of them is wrong.

---

## 4. Where environment is forbidden

### 4.1 Over text

No decorative element may reduce any text's contrast below the AA threshold
already enforced site-wide: **4.5:1 for body, 3:1 for large text**. This is
measured, not judged. A background that passes on desktop and fails at 375px
fails.

Where text sits over photography, the legibility treatment is a scrim, not a
decorative shape.

### 4.2 Sites of memory

**Cape Coast, Elmina, Assin Manso, and any future content about the
transatlantic slave trade carry the Silent register permanently.**

No gradient, no horizon, no mask, no motion, no divider. The design response to
that material is space and stillness. This rule cannot be overridden by a
future brief without an explicit founder decision recorded in this document.

The test: would this feel appropriate to someone in tears?

### 4.3 The booking flow

Silent, for the length of the flow including the confirmation. A person is
deciding whether to trust the company with a journey. Decoration reads as
distraction precisely when attention matters most.

### 4.4 Anything that has to load before a photograph

An environmental element may never delay, obscure or shift a photograph.
Concretely: no decorative asset above a photo in load order, and nothing that
causes layout shift.

---

## 5. Layering model

Three planes, no more.

| Plane | Contains | Rule |
| --- | --- | --- |
| **Ground** | Tone, gradient, field | Never moves independently |
| **Middle** | Horizons, planes, arcs | May move on scroll, ≤ 40px |
| **Content** | Photography, text, UI | Always fully opaque and legible |

Environmental elements never occupy the Content plane. Nothing decorative
overlaps a photograph's subject, and nothing sits between the reader and the
words.

**Stacking:** all environmental elements sit behind content in a single
declared band. They never interleave with content, because that is how a
decoration ends up on top of a face.

---

## 6. Scale and placement

**Scale.** Elements size relative to their *section*, never the viewport, so a
tall section does not get a stretched shape. Horizons span 100% width. Arcs and
masks scale with container width and are capped at 40% of section height.

**Placement.** Environmental elements attach to edges — top, bottom, or a
single side. **Nothing floats in the middle of a section.** A centred
decorative shape has no relationship to anything and always looks applied
rather than designed.

**Responsive.** Every element declares behaviour at 375px, 768px and 1440px.
The default at 375px is *removal*, not scaling: a small screen has no room for
atmosphere, and the phone is where most people will read this site. An element
that only exists on desktop is a legitimate design, and usually the right one.

---

## 7. Section dividers

**The default is no divider.** A change of background tone is a transition. Most
sections need nothing else.

A divider is permitted only when **all** of these hold:

1. The two sections have genuinely different registers, and
2. The tonal change alone reads as an accident rather than a decision, and
3. The divider is a horizon or edge mask from §3 — never a repeating motif.

Maximum **two dividers per page**. If a page seems to need more, the section
structure is the problem, not the transitions.

Never place a divider immediately before or after Silent content. A flourish
introducing the Cape Coast dungeons is exactly the failure this system exists
to prevent.

---

## 8. Motion

Motion tokens already exist and environmental motion uses them rather than
inventing timings: `--motion-instant` 120ms, `--motion-fast` 200ms,
`--motion-base` 300ms, `--motion-slow` 560ms, `--motion-reveal` 620ms, with
`--ease-out` `cubic-bezier(0.16,1,0.3,1)` as the house curve.

**Rules:**

1. **Scroll-linked or nothing.** No autonomous loops, no ambient drift, no
   perpetual motion in the periphery. The visitor drives it; when they stop, it
   stops.
2. **Travel budget**: ≤ 40px in Open, ≤ 24px in Ambient, 0 elsewhere. Parallax
   beyond that stops reading as depth and starts reading as a slide.
3. **Never during reading.** No motion in a section whose primary job is text.
4. **Reduced motion is a design, not a fallback.** Every element ships with its
   still state specified at the same time. The still state must look
   *composed*, not like something failed to start.
5. **Performance**: transform and opacity only. Nothing that triggers layout.
   If an effect cannot hold 60fps on a mid-range Android over 3G, it does not
   ship — that is the device most of this audience will use.

---

## 9. Photography hierarchy

Photography is the subject; this system is its frame. Four roles, and a page
should use no more than three of them.

| Role | Size | Frequency | Purpose |
| --- | --- | --- | --- |
| **Anchor** | Full-bleed or near | Once per page, at most | The image the page is about |
| **Feature** | 50–70% width | 2–4 per page | Carries a section |
| **Support** | Card or column width | Many | Rhythm and evidence |
| **Detail** | Small, inline | Sparing | A hand, a texture, a face |

**Rules:**

- **One Anchor per page.** Two competing full-bleed images means neither is the
  subject.
- **Environmental elements frame, mask or ground a photograph. They never
  overlay its subject.**
- **Every image declares width and height.** Non-negotiable: it is what stops
  the page jumping while photos load.
- Portraits are never cropped tighter than the shoulders by an environmental
  mask.
- Heritage imagery takes no mask, no overlay, no treatment beyond a legibility
  scrim where text is required.

---

## 10. Composition

1. **The horizon is the organising line.** Where a section has an
   environmental element, it should relate to a single horizontal — the same
   logic that makes the Atlantic edge meaningful without illustrating anything.
2. **Asymmetry over symmetry.** The site's existing layouts are asymmetric;
   environment should follow, not centre things.
3. **One focal point per screen.** If a visitor's eye has two places to go,
   the design has not decided.
4. **Negative space is an element.** It is specified, not left over. A section
   with generous space and nothing in it is a finished design.
5. **Edges do the work.** Interest belongs at the boundary between sections,
   not in the middle of them.

---

## 11. Budgets

Measurable ceilings. An element exceeding these fails review regardless of how
good it looks.

| Budget | Limit |
| --- | --- |
| Per environmental element | ≤ 2KB inline |
| Per page, all environmental assets | ≤ 12KB |
| Added to Largest Contentful Paint | 0ms — nothing decorative loads before a photograph |
| Cumulative Layout Shift | 0 from any environmental element |
| Contrast reduction on any text | 0 — must still pass AA |
| Frame rate during scroll motion | ≥ 60fps on mid-range Android |

Inline SVG only, themed by token. No raster decoration, no external requests,
no icon fonts.

---

## 12. Things we will never do

Extending 2A §11, specific to environment:

- Decorate heritage or memorial content.
- Use Adinkra symbols, kente or printed cloth as pattern, texture or divider.
- Put a decorative element over a person's face.
- Let a background reduce text contrast below AA.
- Animate anything perpetually in the periphery.
- Introduce a colour that is not in the palette.
- Use yellow as a background field.
- Float a decorative shape in the centre of a section.
- Ship an effect without its reduced-motion design.
- Add a flourish to compensate for a weak photograph. Replace the photograph.
- Design a section's environment before its photograph exists.

---

## 13. Asset strategy

**Every image on the site today is a placeholder.** 84 stock photographs across
20 pages. The system must therefore be designed for photography that does not
exist yet, which imposes three constraints:

1. **No element may depend on a specific image.** A mask tuned to the
   composition of one placeholder breaks when the real photograph arrives. Masks
   attach to the frame, not to the content.
2. **Every element must hold up against an unknown image** — dark or light,
   busy or calm, portrait or landscape. If it only works against one, it is
   tuned to a placeholder.
3. **Environmental design for a section waits until that section's real
   photograph exists.** This is the sequencing rule from 2A, restated because it
   is the one most likely to be broken under pressure.

Sanity now holds the media model — hotspot cropping, required descriptions, and
an approval gate that prevents an unapproved image publishing. Environmental
elements must respect the hotspot: the focal point an editor chooses is the
part a mask may never cover.

---

## 14. Review checklist

The instrument. Any proposed environmental element is checked against this, and
any single failure means it does not ship.

**Register**
- [ ] The section has exactly one register, from the §1 table
- [ ] Layers, coverage and opacity are within that register's budget
- [ ] The page has ≤ 2 Open sections, and ≥ 40% Quiet or Silent

**Form**
- [ ] The shape is in the §3 vocabulary
- [ ] It cannot be named as a thing
- [ ] Angle is 0°, or 2–6°
- [ ] Colour is from the palette; no new hue; not yellow as a field

**Placement**
- [ ] Attached to an edge, not floating
- [ ] Behind content, never interleaved
- [ ] ≤ 40% of section height
- [ ] Behaviour declared at 375 / 768 / 1440

**Safety**
- [ ] Text contrast still passes AA at every breakpoint
- [ ] Not on heritage content, the booking flow, or a confirmation
- [ ] Does not overlay a face or a photograph's subject
- [ ] Respects the image hotspot

**Motion**
- [ ] Scroll-linked or static; never autonomous
- [ ] Travel within budget
- [ ] Still state designed, not derived
- [ ] Transform/opacity only

**Cost**
- [ ] ≤ 2KB; page total ≤ 12KB
- [ ] Zero layout shift; loads after photography

**The final question**, from 2A: *would removing this be noticed?* If not, it
should not ship.

---

## 15. Implementation roadmap

Nothing here is built until the type scale and real photography are in place.
The order from 2A stands, with the environmental work expanded:

**Before any environmental work**
1. Fluid display type — the last of the type system
2. Real photography through Sanity

**Then, in this order**
3. **Silent and Quiet registers first.** Most of the site is one of these, and
   they are mostly the *absence* of decoration. Doing them first proves the
   density discipline before anything is drawn.
4. **Ambient register** — tone and gradient fields only, no shapes.
5. **The horizon** — one element, applied to the homepage hero, reviewed
   against §14 before anything else is drawn.
6. **Layered planes** — only if the horizon has proved itself.
7. **Edge masks** for photography.
8. **Dividers** — last and fewest.

Each step ships and is reviewed before the next begins. If the horizon alone
makes the site feel more like itself, that may be the whole system, and the
rest should not be built for completeness.

---

## Success criteria

The document works if a disagreement about a proposed element can be settled by
pointing at a rule rather than by opinion.

The system works if a visitor could not describe the backgrounds afterwards but
found the site calm — and if every photograph looks more considered for being
framed by it.
