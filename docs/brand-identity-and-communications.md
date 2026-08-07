# Brand Identity & Communications

The applied half of the brand: how the logo, colours, type and channels behave
in practice.

**This does not repeat what already exists.** Strategy, positioning, audience,
voice principles and photography direction live in:

| For | Read |
| --- | --- |
| Who we are, what we promise, how we write | `people-and-places-brand-foundation.md` |
| Emotional arc, visual philosophy, colour philosophy | `phase-2a-brand-experience-strategy.md` |
| Backgrounds, shapes, motion | `phase-2b-environmental-design-system.md` |
| What to photograph and what never to | `phase-2c-photography-direction.md` |
| Tokens as built in code | `design-system.md` |

This document covers what none of those do: the mechanics of the logo, exact
colour specification including print, the typefaces, and how each channel is
actually executed.

---

## Status

**Draft — three sections cannot be completed without founder input or new
files.** Those are marked **NEEDED** and listed together in §8. Everything else
is derived from the assets in `assets/` and `style.css` and is accurate as of
7 August 2026.

---

## 1. The logo

### What exists

Ten SVG files in `assets/`, in three lockups × colourways:

| Lockup | What it is | Files |
| --- | --- | --- |
| **Full** | Symbol + wordmark | `PAP LOGO_*` (black, white, yellow, two-colour) |
| **Symbol** | The pin/P mark alone | `PAP LOGO_SYMBOL_*` (black, white, yellow) |
| **Wordmark** | "PEOPLE & PLACES" alone | `PAP LOGO_TEXT_*` (black, white, yellow) |

`assets/logo-footer.svg` is the version the website loads. `assets/logo-nav.svg`
is unused and superseded — do not distribute it.

### Two problems with the current files

**1. Seven of the ten contain live text, not outlined artwork.**

The wordmark is set as an editable `<text>` element in
`HelveticaNeueLTStd-BlkExO` — Helvetica Neue LT Std Black Extended Oblique, a
licensed Linotype typeface. It is referenced by name, not embedded.

On any device without that font installed, the wordmark **silently renders in a
substitute face**. Tested in a clean browser, it fell back to a serif — the
opposite of the heavy extended sans it should be. The letterforms, weight,
width and slant all change, and nothing warns you.

Only the three `SYMBOL` files are outlined and therefore safe.

This affects `logo-footer.svg` too, which is the file on the live website.

**2. Every file is exported on a 1920 × 1080 canvas.**

That is a video/slide frame, not the logo's own proportions. The artwork floats
inside it with arbitrary padding, which means clear space and minimum size
cannot be specified from these files — there is no reliable edge to measure
from.

> **Both are fixed the same way:** re-export from the original design file with
> type converted to outlines, and the canvas cropped to the artwork. See §8.

### Rules that apply once the files are fixed

- **Clear space:** the height of the "P" in the wordmark, on all four sides.
  Nothing — text, image, edge, or another logo — enters that space.
- **Minimum size:** full lockup no smaller than 120px wide on screen or 30mm in
  print. Below that, use the symbol alone.
- **The symbol may stand alone.** It is distinctive enough for a profile
  picture, a favicon, a stamp on a photograph.
- **The wordmark may stand alone** where the symbol appears elsewhere on the
  same surface.

### Never

- Recolour outside the approved colourways
- Stretch, condense, rotate or add effects (shadow, glow, outline, gradient)
- Place the two-colour version on a busy photograph — use white or black
- Rebuild or retype the wordmark. **It is a drawing, not a font.**
- Put the yellow logo on a white or cream ground — see §2

---

## 2. Colour

### Screen values, as built

| Name | Hex | Role |
| --- | --- | --- |
| Yellow | `#FFB81C` | **Action only.** Buttons, links, the thing to press |
| Amber (on light) | `#9C6A00` | Yellow *as text* on a light ground |
| Forest deep | `#0B2E27` | Primary dark ground |
| Forest | `#123F35` | Secondary dark ground |
| Cream | `#FFF7E8` | Warm light ground, used instead of white |
| Charcoal | `#1A1A1A` | Body text on light grounds |
| Terracotta | `#C2553D` | Secondary accent, sparing |
| Soft gold | `#F2D27A` | Quiet type on dark grounds |

These exist in `style.css` as `--pap-*` tokens. Change them there, not in
individual files.

### The rule that matters most

**Yellow is never a background field.** It is reserved for action. A yellow
panel competes with every call to action on the page and the accent stops
working.

### The contrast constraint

Yellow text on white measures **1.9:1** — it fails accessibility and is genuinely
hard to read. This is the single easiest mistake to make in this palette.

| Combination | Ratio | Verdict |
| --- | --- | --- |
| `#FFB81C` text on white | 1.9:1 | **Fails** |
| `#9C6A00` text on white | 4.69:1 | Passes |
| `#FFB81C` text on `#0B2E27` | 10.4:1 | Passes |
| `#1A1A1A` on `#FFF7E8` | 15.8:1 | Passes |

Yellow as a **filled button with dark text** is fine anywhere — that is the
reverse arrangement. It is yellow *as type* that breaks.

### ⚠ The logo and the website use different colours

| | Logo files | Website |
| --- | --- | --- |
| Yellow | `#FFB423` | `#FFB81C` |
| Charcoal | `#262626` | `#1A1A1A` |

Indistinguishable on a screen. **Visibly different once printed** — on signage,
a vehicle, a partner's brochure, or merchandise, where the two will sit side by
side and read as two brands.

**NEEDED: a founder decision on which is correct.** See §8.

### Print values

**NEEDED.** No CMYK or Pantone equivalents exist anywhere in the project.
Everything is specified for screen only, which makes any print job a guess by
whoever runs it. See §8.

---

## 3. Typography

### Three faces are in play, and they are not the same

| Where | Typeface | Notes |
| --- | --- | --- |
| **Logo wordmark** | Helvetica Neue LT Std Black Extended Oblique | Licensed. Should be outlined in the artwork and never re-typed |
| **Website headings** | Archivo Black | Free, open licence |
| **Website body** | Inter | Free, open licence |

A distinct logo face is normal and fine. It should be documented rather than
discovered, and **nobody should ever set a heading in the logo face** — that is
what makes a logo stop feeling like a logo.

### Using the website faces elsewhere

Archivo Black and Inter are both freely licensed for print, web and embedding.
They can be used in proposals, decks, signage and email without a licence
purchase.

- **Archivo Black** — headlines only, used sparingly. It is heavy by design and
  loses its force when used for anything long.
- **Inter** — everything else. Body text, captions, forms, labels.
- Do not introduce a third face. If something needs distinguishing, change size,
  weight or colour.

---

## 4. Applied communications

Channel *roles* are defined in `people-and-places-brand-foundation.md` §20.
This section covers execution — the same host in every channel.

### The three-beat structure

The website moves a reader through **recognition → trust → invitation**. The
same three beats structure any outbound message, at any length:

1. **Recognition** — something a Ghanaian would recognise instantly and a
   first-time visitor would find intriguing. No selling yet.
2. **Trust** — a named person, in their own words. This is the part a
   competitor cannot copy. They can list the same castle; not the same host.
3. **Invitation** — **one** action. Not four.

### Email

- **From a person, not a department.** `info@peopleplacesgh.com` sends, but the
  sign-off is a name.
- **One link.** A single call to action is measurable; five tell you nothing
  except that the reader was confused.
- Cream ground (`#FFF7E8`), not white. Yellow appears exactly once — the button.
- Open with a photograph, not a logo. Photography leads.
- Replies must reach a human. Never send from a no-reply address.

### Newsletter

A repeatable format beats a periodic round-up. **One host, one place, one
invitation** per letter, following the three beats above. The strength is the
people, and a list of trips with prices is what every competitor sends.

### Instagram and TikTok

- Real people in real places. Never a stock image presented as ours.
- Faces over landscapes. A waterfall with nobody near it is a screensaver.
- Caption in the same voice as the website: specific, warm, unhurried. No
  "vibrant", "hidden gem", "bucket list", "unforgettable".
- The symbol alone is the profile mark — the full lockup is unreadable at
  avatar size.

### WhatsApp

The warmest channel and usually the first real conversation.

- Answer as a named person within the promised window.
- Match the enquiry's length. A one-line question gets a human answer, not a
  brochure.
- Never paste marketing copy into a chat.
- Move to email when a written record matters — proposals, dates, payment.

### Print, signage and merchandise

- **Do not proceed without §2's print values resolved.** A printer given only
  hex will convert it themselves and the yellow will shift.
- Outlined logo files only. Live-text files will substitute the font at the
  print shop.
- Minimum sizes in §1 apply.

### Anything anyone produces

Four checks, from the foundation's voice principles:

1. Would a Ghanaian reader recognise this as true?
2. Is every person, quotation and photograph real?
3. Does it say something specific, or could any tour operator have written it?
4. Is there exactly one thing to do next?

---

## 5. Placeholder assets currently in use

The site runs on licensed stock photography and one stock hero image until the
shoot. This is deliberate and documented in
`phase-2c-photography-direction.md`.

- Placeholders are never presented as People & Places guests, hosts or partners
- No AI-generated imagery, including as a temporary stand-in
- The hero is a still image; the intended replacement is the company's own
  footage. When it lands, text contrast must be measured against the video's
  **brightest** frame, not its first

---

## 6. Where things live

| Asset | Location |
| --- | --- |
| Logo files | `assets/PAP LOGO_*.svg` |
| Website logo | `assets/logo-footer.svg` |
| Colour tokens | `style.css`, `:root` block |
| Editable site content | Sanity Studio (`studio/`) |
| Photography rules | `docs/phase-2c-photography-direction.md` |

---

## 7. Decisions of record

| Date | Decision |
| --- | --- |
| 2026-08-07 | Yellow is action only, never a background field |
| 2026-08-07 | `#9C6A00` is the approved yellow for type on light grounds |
| 2026-08-07 | Cream (`#FFF7E8`) replaces white as the light ground |
| 2026-08-07 | No AI-generated imagery, including as placeholder |

Add a dated row when something changes. A change with a reason is a healthy
brand; an undocumented exception is how one rots.

---

## 8. What is needed to finish this document

### From the founders — decisions only you can make

1. **Which yellow is correct** — `#FFB423` (logo) or `#FFB81C` (website)? Once
   chosen, the other is corrected to match. This blocks all print work.
2. **Which charcoal** — `#262626` or `#1A1A1A`? Same reasoning.
3. **Is the logo registered or trademarked?** Determines whether ™ or ® appears
   and where.

### Files that would complete it

4. **The original logo design file** — `.ai`, `.eps`, `.sketch` or `.fig`. The
   SVGs are exports and cannot be corrected reliably. With the original I can
   specify real clear space and minimum sizes rather than sensible defaults.
5. **Outlined logo exports** — type converted to outlines, canvas cropped to
   the artwork. This fixes the substitution problem on all seven affected files
   **including the one on the live website**. If you can get these from whoever
   made the logo, that is the single highest-value item here.
6. **Any brand work already done elsewhere** — a deck, a PDF, a Canva file, a
   moodboard. If decisions were already made about colour, type or logo usage,
   they should be folded in rather than contradicted.
7. **Confirmation of the logo typeface licence** — whether Helvetica Neue LT
   Std is licensed to the company. Only matters if the wordmark ever needs
   re-setting; outlined files make it moot.

### Would strengthen it, not blocking

8. Pantone and CMYK values, ideally from a printed proof rather than a converter
9. A photograph of the logo used physically — a sign, a shirt, a card — to check
   the minimum sizes hold up
10. Any partner or tour-operator co-branding rules, if partnerships involve
    shared marketing

---

**Send what you have and I will fold it in.** The most useful single item is
**outlined logo files (5)** — it is the only fault here that is currently
visible to the public.
