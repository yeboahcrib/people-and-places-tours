# People & Places UI redesign direction

**Status:** Approved direction, pending visual prototype
**Direction:** Playful and bold, with premium restraint

## Design idea

The interface should feel like a lively Ghana travel journal: cinematic guest
photography, confident blocks of colour, tactile cards, and culturally grounded
graphic accents. It should not become a generic luxury site or an imitation of
the supplied references.

The redesign changes the presentation layer while preserving the static build,
content adapters, Sanity contracts, inquiry function, semantic HTML, and
progressive-rendering guarantees.

## Reference principles to translate

From Travel Mo:

- a transparent hero navigation that becomes a floating light pill on scroll;
- oversized, confident typography;
- full colour fields and organic corner shapes;
- rounded image and content cards that feel like physical objects;
- staggered card entrances and horizontal visual rhythm.

From Sorted Chale:

- sparse motifs entering from page edges;
- cultural graphics used as framing rather than wallpaper;
- circular and organic image crops;
- alternation between quiet and visually expressive sections.

We will not copy either site's logo, artwork, exact compositions, or decorative
marks.

## Palette

The current brand yellow and charcoal remain dominant. The complementary
colours extend them rather than replace them.

| Token | Value | Role |
|---|---:|---|
| People & Places yellow | `#FFB81C` | Primary actions, active states, joyful emphasis |
| Charcoal | `#1A1A1A` | Text, premium dark sections, outlines |
| Deep forest | `#123F35` | Hosting, culture and trust sections |
| Terracotta | `#C2553D` | Human-story accents, badges, small colour fields |
| Warm cream | `#FFF7E8` | Main non-white canvas and quiet sections |
| Soft gold | `#F2D27A` | Low-contrast motifs and borders |
| White | `#FFFFFF` | Cards and breathing space |

Suggested visual proportion: 50% cream/white, 20% photography, 15% forest,
10% yellow, and no more than 5% terracotta. Strong colours should appear in
large but limited sections, not compete on every screen.

## Cultural graphic system

Adinkra is a visual language connected to Akan proverbs, ideas, and cultural
contexts—not a library of arbitrary ornaments. Every selected symbol must have
a documented name, meaning, and reason for its placement. The first candidates
for founder review are:

- **Sankofa**, for learning from the past and carrying knowledge forward;
- **Dwennimmen (double ram's horns)**, for the relationship between strength
  and humility;
- **Ananse Ntontan**, where wisdom and creativity are genuinely relevant.

The visual forms and meanings must be verified before artwork is approved. See
the Smithsonian National Museum of African Art's Adinkra material and the
University of Ghana research referenced below.

Usage rules:

- use two or three recurring symbols across the site, not a different symbol
  in every section;
- render as original, lightweight SVG artwork;
- keep opacity low or use a single brand colour;
- position partially outside section edges;
- mark decorative instances `aria-hidden="true"`;
- do not place symbols behind body text or essential controls;
- do not rotate, crop, or combine a symbol until its meaning remains legible;
- confirm the final selection with the founders or a culturally knowledgeable
  Ghanaian reviewer.

Kente-inspired treatment should be an original geometric rhythm derived from
the brand palette. Use it as a thin divider, card-edge strip, or occasional
footer detail—never a full-page texture and never a direct copy of a named
cloth pattern without understanding its context.

## Homepage visual rhythm

1. **Hero:** retain the cinematic video; simplify the overlay and preserve the
   bottom-left invitation.
2. **Founder story:** warm cream canvas, asymmetric composition, restrained
   Sankofa accent, and more tactile founder cards.
3. **Ways to experience:** yellow or cream colour field with staggered organic
   image cards; cards overlap the section boundary slightly.
4. **Available tours:** quiet cream canvas so animated tour cards and imagery
   remain the focus.
5. **How you are hosted:** deep forest section with soft-gold motif fragments
   and circular/arched photography.
6. **Guest story:** retain a cinematic full-bleed break in the page.
7. **Reviews and trust:** charcoal or cream cards with one terracotta accent,
   avoiding a visually heavy all-black block.
8. **Planning process:** connected by a hand-drawn route line with three bold
   numbered stops.
9. **Stories:** compact, energetic strip rather than a simulated social feed.
10. **Final invitation:** yellow statement section with a small kente-inspired
    edge rhythm and a clear inquiry action.

## Navigation behavior

- At the top: transparent navigation integrated with the hero.
- Scrolling down: retreat to preserve the view.
- Scrolling up: return as a compact warm-white floating pill with charcoal
  border and soft shadow.
- Active item: yellow capsule; do not change the underlying accessible link
  structure.
- Mobile: logo plus one obvious menu button; avoid shrinking the desktop pill.

## Motion language

Tour and pathway cards may enter with a small vertical offset, `0.97` scale,
and no more than about one degree of rotation. Stagger siblings by roughly
70–100ms. Hover can lift and straighten a card, but must not move its link away
from the pointer.

Motion rules:

- content is visible by default before JavaScript initializes;
- transforms animate rather than layout properties;
- avoid continuous motion behind text;
- reduce or remove all non-essential effects under `prefers-reduced-motion`;
- do not make scroll position necessary to understand content;
- preserve the current JavaScript-disabled rendering tests.

## First implementation slice

Build a homepage-only `ui-v2` prototype in this order:

1. extend design tokens and add section colour themes;
2. create the floating navigation states;
3. add an SVG motif component and one temporary, reviewed motif;
4. redesign founder, pathways, and tour-card sections;
5. add restrained card entrance motion;
6. verify desktop, mobile, keyboard, reduced-motion, and JavaScript-disabled
   behavior before carrying the system to other pages.

## Cultural references

- [Smithsonian National Museum of African Art — Inscribing Meaning](https://africa.si.edu/exhibitions/inscribing-meaning-writing-and-graphic-systems-africa-art)
- [Smithsonian National Museum of African Art — Asante Adinkra cloth](https://africa.si.edu/collection/selected-artwork/1720)
- [University of Ghana — Adinkra and digital storytelling](https://pure.ug.edu.gh/en/publications/from-oral-to-digital-and-back-adinkra-symbols-and-kweku-ananse-on/)
