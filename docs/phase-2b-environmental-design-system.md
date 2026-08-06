# Environmental Design System

> **Frozen — version 1.0, approved 6 August 2026.** Reviewed and rewritten
> once before approval. Rules 1 and 2 of the one-page summary (grief and trust;
> readability) are permanent. Everything else may be amended by adding a dated
> line to §12 saying what changed and why.

The visual grammar for every background, shape, divider and environmental
animation on the site.

**Read `phase-2a-brand-experience-strategy.md` first.** That decides what we
believe. This decides how you check a thing obeys it.

This is the second version. The first was reviewed and largely rewritten: it
carried about twenty numeric limits of which roughly half were invented, and at
410 lines it was too long to be used. What follows keeps the measurements that
rest on something real — accessibility thresholds, the site's own breakpoints,
frame rate, layout shift — and replaces the invented ceilings with comparative
tests. A test with a reason beats a number without one.

---

## The whole system in one page

**Four registers.** Every section is exactly one:

| Register | The visitor is… | What it carries |
| --- | --- | --- |
| **Open** | arriving, or being invited | The fullest expression. Layers, light, gentle scroll motion |
| **Ambient** | being shown something | One quiet gesture. Tone, a single horizon |
| **Quiet** | reading, or deciding | Ground tone only. No shapes, no motion |
| **Silent** | grieving, or trusting us | Nothing at all |

**Three shapes.** Nothing else is in the vocabulary:

- **Horizon** — one near-level edge across the full width. Level, or gently
  curved. May be layered two or three deep to imply distance.
- **Mask** — a shape that reveals or clips a photograph at its boundary.
- **Field** — an area of tone or gradient with no discernible edge.

**Six rules.** In priority order — where they conflict, the earlier wins:

1. **Nothing decorative near grief or trust.** Heritage content and the booking
   flow are Silent, permanently.
2. **Text stays readable.** No element may drop any text below WCAG AA.
3. **Photography leads.** If you notice the decoration before the photograph,
   the decoration is wrong.
4. **One gesture per section.** A section with a horizon does not also get a
   mask and a texture.
5. **Motion is driven, never autonomous.** Scroll-linked or still. Nothing
   loops, nothing drifts on its own.
6. **If removing it would not be noticed, it should not ship.**

That is the system. Everything below is reference.

---

## 1. Choosing a register

Register follows what the visitor is *doing*, not what the page is called. This
is why it works for pages that do not exist yet.

- **Arriving or being invited** → Open. The homepage hero and its closing
  invitation. Nothing else, on any page.
- **Being shown something** → Ambient. Most mid-page sections.
- **Reading or deciding** → Quiet. Experience detail bodies, itineraries, FAQs.
- **Grieving, or trusting us with something** → Silent. §3.

**Open is the first and last impression only.** Two competing invitations on one
page means neither is an invitation. That is the reason, and it holds for any
future page without needing a number.

A section may always move quieter without discussion. Moving louder needs a
reason someone is willing to write down.

---

## 2. Density

Density is governed by one rule — **one gesture per section** — and one
question: *what is the visitor doing here?*

There is deliberately no layer count, coverage percentage or opacity ceiling.
The first version had all three and none could be justified; 0.18 opacity was
not better reasoned than 0.15, it was simply typed. They also measured the
wrong thing, because a pale shape over a busy photograph is more intrusive than
a stronger one over flat tone.

The replacement is comparative, and it is the test that actually matters:

> Look at the section. If your eye goes to the decoration before it goes to the
> photograph or the words, the decoration is too strong. Reduce it until that
> stops being true.

Where that judgement is contested, the tie-break is measurable: **contrast**
(§4) and **the removal test** (rule 6).

---

## 3. Where environment is forbidden

### Sites of memory — permanent

**Cape Coast, Elmina, Assin Manso, and any future content about the
transatlantic slave trade are Silent, permanently.**

No gradient, no horizon, no mask, no motion, no divider, no treatment of the
photography beyond a legibility scrim where text is unavoidable.

This is proposed as a permanent brand rule, not a default. A visitor may be
standing at the place their ancestor was taken from. Any decorative gesture
there converts grief into styling, and no brief should be able to override it
casually. Changing it requires a recorded founder decision in this document.

The test: *would this feel appropriate to someone in tears?*

### The booking flow — permanent

Silent for its whole length, including the confirmation. A person is deciding
whether to trust the company with a journey and handing over their details.
Decoration reads as distraction exactly when attention matters most.

### Over a face, or over the words

Nothing decorative overlays a photograph's subject or sits between the reader
and the text. Where text must sit on an image, the treatment is a legibility
scrim — not a shape.

---

## 4. What is actually measured

These are the numbers that survive, because each rests on something outside our
own preference.

| Measure | Limit | Why this number |
| --- | --- | --- |
| Text contrast | 4.5:1 body, 3:1 large | WCAG AA, already enforced site-wide |
| Layout shift from environment | Zero | Any shift moves content under a reader's eye |
| Load order | Nothing decorative before a photograph | The photograph is the content |
| Motion properties | `transform` and `opacity` only | Anything else forces layout and drops frames |
| Frame rate | 60fps on mid-range Android over 3G | The device most of this audience uses |
| Breakpoints declared | 375 / 768 / 1440 | The site's existing breakpoints |
| Element angle | Level, or within a few degrees | The Atlantic horizon is the organising line; diagonal energy belongs to another brand |

**Weight** is comparative rather than fixed: *an environmental element should
cost less than the photograph it frames.* A stated kilobyte ceiling would be
invented; this one has a reason and scales with the page.

---

## 5. Shapes

Three forms, listed above. Two constraints on all of them:

**It must not be nameable as a thing.** If it can be called a hut, a drum, a
map, an animal or a symbol, it is illustration and belongs to a different
project. Adinkra informs composition and rhythm, never ornament — see 2A §8.

**Colour comes from the palette, and never introduces a hue.** Tints and
gradients of `--pap-charcoal`, `--pap-forest`, `--pap-cream` and
`--pap-soft-gold`. **Yellow is never a background field** — it is reserved for
action, and a yellow field would compete with every call to action on the page.

**Family test:** place any two elements from the system side by side. If they
do not read as the same hand, one of them is wrong.

---

## 6. Placement

**Elements attach to edges.** Top, bottom, or one side. Nothing floats in the
middle of a section — a centred decorative shape has no relationship to
anything and always reads as applied rather than designed.

**Elements sit behind content, in one band.** They never interleave with
content, because interleaving is how a decoration ends up over a face.

**Elements size to their section, not the viewport**, so a tall section does
not get a stretched shape.

**On small screens the default is removal, not scaling.** A phone has no room
for atmosphere, and the phone is where most of this audience reads. An element
that exists only on desktop is a legitimate design and often the right one.

**Elements respect the image hotspot.** Sanity lets an editor choose the part
of a photograph that must stay visible. A mask may never cover it.

---

## 7. Dividers

**The default is no divider.** A change of background tone *is* a transition.

A divider is permitted only when the two sections carry different registers,
the tonal change alone reads as an accident, and the divider is a horizon or
mask from §5. Never a repeating motif.

Never immediately before or after Silent content. A flourish introducing the
Cape Coast dungeons is precisely the failure this system exists to prevent.

If a page seems to need several dividers, the section structure is the problem.

---

## 8. Motion

Environmental motion uses the existing tokens rather than inventing timings:
`--motion-fast` 200ms, `--motion-base` 300ms, `--motion-slow` 560ms,
`--motion-reveal` 620ms, with `--ease-out` `cubic-bezier(0.16,1,0.3,1)` as the
house curve — fast to arrive, slow to settle, which is the brand in a function.

1. **Scroll-linked or still.** No loops, no drift, no perpetual motion. The
   visitor drives it; when they stop, it stops.
2. **Movement is slight.** Parallax should read as depth. Past roughly the
   height of a line of text it starts reading as sliding, and that is the
   ceiling — not a pixel value, a perceptual one.
3. **Never during reading.** No motion in a section whose job is text.
4. **The still version is designed, not derived.** Every element specifies its
   reduced-motion state at the same time, and that state must look composed
   rather than like something failed to start.

---

## 9. Photography

Photography is the subject; this system is its frame.

Four roles: **Anchor** (full-bleed, once per page at most), **Feature** (carries
a section), **Support** (rhythm and evidence), **Detail** (a hand, a texture, a
face). A page uses no more than three of them.

- **One Anchor per page.** Two competing full-bleed images means neither is the
  subject.
- Environment **frames, masks or grounds** a photograph. It never overlays the
  subject.
- **Every image declares width and height.** This is what stops the page
  jumping as photographs load.
- Heritage imagery takes no mask and no treatment.

---

## 10. Designing before the photographs exist

Every image on the site today is a placeholder — 84 stock photographs across 20
pages. Real photography arrives later through Sanity, in a dedicated curation
phase. That imposes three constraints, and they are the ones most likely to be
broken under pressure:

1. **No element may depend on a specific image.** Masks attach to the frame,
   never to the composition of whatever is currently behind them.
2. **Every element must survive an unknown photograph** — dark or light, busy
   or calm, portrait or landscape. If it only works against one image, it is
   tuned to a placeholder.
3. **A section's environment is not finalised until its real photograph
   exists.**

**This does not mean waiting to start.** Most of the site is Quiet or Silent,
and those registers are largely the *absence* of decoration — they can be
specified, built and reviewed now, against any imagery. Only Open and Ambient
sections need to wait, and there are few of them.

---

## 11. Review checklist

Six questions. Any single failure means it does not ship.

1. Does this section's register match what the visitor is doing here?
2. Is the shape one of the three, and impossible to name as a thing?
3. Does all text still pass AA, at every breakpoint?
4. Does your eye reach the photograph before the decoration?
5. Is the motion scroll-driven, with its still state designed?
6. Would removing this be noticed?

---

## 12. Changing these rules

The system is meant to outlive the people who wrote it, so it needs a way to
change that is not "someone edited the file".

- **Rules 1 and 2 in the one-page summary** (grief and trust; readability) are
  permanent and need a recorded founder decision to alter.
- **Everything else** may be amended by adding a dated line to this section
  saying what changed and why. An amendment with a reason is a healthy system;
  an undocumented exception is how a design language rots.
- **If a rule blocks something genuinely good**, that is evidence about the
  rule. Record it rather than quietly working around it.

---

## 13. Implementation order

Nothing is built until fluid display type and real photography are in place.

1. **Quiet and Silent first.** Most of the site, and mostly the absence of
   decoration. Doing these first proves the density discipline before anything
   is drawn.
2. **Ambient** — tone and gradient only, no shapes.
3. **One horizon**, on the homepage hero. Review against §11 before anything
   else is drawn.
4. **Layered horizons**, only if the single one has earned it.
5. **Masks** for photography.
6. **Dividers**, last and fewest.

Each step ships and is reviewed before the next begins.

**If the horizon alone makes the site feel more like itself, that may be the
entire system**, and the rest should not be built for the sake of completeness.

---

## Success criteria

The document works if a disagreement about an element can be settled by
pointing at a rule rather than trading opinions — and if someone joining in two
years can read the first page and start work.

The system works if a visitor could not describe the backgrounds afterwards but
found the site calm, and if every photograph looks more considered for being
framed by it.
