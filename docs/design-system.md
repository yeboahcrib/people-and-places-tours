# Design System

The token reference for the site. Written at the end of Phase 1 so Phase 2's
visual language has one vocabulary to build on rather than 162 shades of
white and four durations doing the same job.

All tokens live in the `:root` block at the top of `style.css`. Nothing here
changed how the site looks — the consolidation was verified with
`npm run test:visual` across 21 pages at three breakpoints.

## Layers

Tokens are in two layers, and **new work should use the semantic layer**.

**Brand layer** — the raw palette. `--pap-yellow`, `--pap-charcoal`,
`--pap-cream`, `--terracotta`. Change these to change the brand.

**Semantic layer** — names describing role, aliased onto the brand layer.
`--color-primary`, `--color-surface`, `--color-text-muted`. Change these to
retheme without touching every rule.

Reach for `var(--color-primary)`, not `var(--pap-yellow)`, in component CSS.

## Colour

| Token | Role |
| --- | --- |
| `--color-primary` | Brand yellow: fills, accents, active states |
| `--color-primary-deep` | Hover/pressed state of primary |
| `--color-on-primary` | Text sitting **on** a primary fill |
| `--color-accent` | Terracotta, secondary accent |
| `--color-success` / `--color-error` | Feedback states |
| `--color-whatsapp` | WhatsApp brand green — only for that link |
| `--color-surface` / `--color-surface-alt` | Raised panels on dark |
| `--color-border` | Default hairline |
| `--color-text-muted` / `--color-text-subtle` | Body and de-emphasised text on dark |
| `--light-surface*`, `--light-text*`, `--light-border` | The cream sections |

**One rule worth knowing:** `--color-primary` fails WCAG AA as *text on a
light surface* (1.73:1). Use `--yellow-on-light` (4.69:1) when yellow carries
words on cream or white. Yellow as a *fill* is fine anywhere.

## Spacing

An 8px scale with 4px half-steps. Use it for padding, margin and gap.

`--sp-0-5` 4px · `--sp-1` 8 · `--sp-1-5` 12 · `--sp-2` 16 · `--sp-2-5` 20 ·
`--sp-3` 24 · `--sp-3-5` 28 · `--sp-4` 32 · `--sp-4-5` 36 · `--sp-5` 40 ·
`--sp-6` 48 · `--sp-7` 56 · `--sp-8` 64 · `--sp-10` 80 · `--sp-12` 96

## Radius

`--radius-sm` 8px · `--radius-md` 16 · `--radius-lg` 24 · `--radius-xl` 40 ·
`--radius-pill` fully rounded controls · `--radius-circle` 50%

`--radius-pill` replaced a mix of `50px` and `100px` that meant the same
thing. Every control here is far shorter than either, so they rendered
identically.

## Motion

`--motion-instant` 120ms · `--motion-fast` 200 · `--motion-base` 300 ·
`--motion-slow` 560 · `--motion-reveal` 620

`--ease-out` `cubic-bezier(0.16,1,0.3,1)` is the house curve — decelerating,
used for reveals, hovers and step transitions. `--ease-standard` is the
symmetric fallback.

`--motion-base` absorbed 260/280/300/320ms, which were four values doing one
job. A 40ms difference on a hover is not perceptible; one value is far easier
to retune.

**Every animation must honour `prefers-reduced-motion`.** One exception
currently exists and is a known bug: the homepage testimonials carousel
advances on `requestAnimationFrame` without checking. Fix before Phase 2 adds
more motion.

## Not yet consolidated

Deliberately deferred, because collapsing them changes how the site looks and
that belongs with the visual language, not before it:

- **Typography.** 199 raw font sizes across 49 distinct values, and no scale.
  This is the biggest remaining debt.
- **Shadows.** 33 distinct values, no elevation scale.

Design both alongside Phase 2 rather than reverse-engineering them from what
happens to exist.

## Verifying a change

```bash
npm run build
npm run test:visual          # 21 pages x 375/768/1440, pixel compared
```

If a change is intentional, re-record with `npm run test:visual:baseline`.
Baselines are gitignored (32MB) and regenerate in about 49 seconds.

The suite is deterministic: reveals are pinned to their no-JS state, lazy
images forced to decode, the Experiences filter class applied, and the nav's
scroll state reset. Its tolerance is 0.002% — tight enough to catch a
border-radius change on a single card, which a looser budget missed.
