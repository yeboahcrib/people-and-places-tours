# Storyblok Phase 4A — homepage migration

The existing homepage now reads its words and photographs from Storyblok, behind
a flag that is off by default. Presentation is untouched: no redesign, no
section reorder, no page builder, no framework change. Sanity and every fallback
remain in place, and the production homepage still comes from Sanity.

---

## Homepage sections found

Verified against the running code rather than the original audit. The live page
renders **seven sections in the renderer's built-in order**, with no flexible
sections in use. Content today comes from **Sanity merged over the committed
`homepage-content.js`**, so the approved content is the merged result — that is
what was migrated.

| Section | Editor-controlled content | Repeatables |
| --- | --- | --- |
| Hero | headline, sub-heading, photograph, button | — |
| Founder story | eyebrow, heading, story, trust note, button | 2 founders |
| Ways to experience Ghana | eyebrow, heading, intro, button | 6 pathways |
| Trip moments | eyebrow, heading, intro | 5 photographs |
| Reviews & trust | eyebrow, heading, intro, photograph, rating summary | 2 trust facts, 10 reviews |
| Planning process | eyebrow, heading | 3 steps |
| Final invitation | eyebrow, heading, body, reassurance, trust line, 2 buttons | — |

Sanity also holds an eighth section, `howHosted`, which the adapter's key filter
has always excluded so it never renders. **Owner decision: not migrated.**

## Storyblok model created

One content type and six small nestable blocks. Nothing generic was invented for
future possibilities, and existing blocks were left alone.

**`homepage`** (content type, 45 fields) organised into seven tabs named after
the sections an editor sees on the page — Hero, Founder story, Ways to
experience Ghana, Trip moments, Reviews & trust, Planning process, Final
invitation. Field labels are plain English ("Small label above the heading",
"Button link", "One line per line of the heading"), matching the convention the
`tour` content type already established.

It carries a **Show this homepage** switch, off by default, mirroring the
`tour` component's visibility field.

| Nestable block | Fields |
| --- | --- |
| `home_founder` | name, preferred name, role, initials |
| `home_pathway` | title, description, link, photo |
| `home_moment` | photograph, caption, shape (tall/wide) |
| `home_step` | number, title, description, icon |
| `home_review` | review, reviewer, source, date, stars |
| `home_trust_fact` | figure, label |

Definitions are version-controlled in `storyblok/phase4a/components.mjs`.

## Content migrated

Story `homepage` (id 216916573794979), populated from the approved merged
content: 2 founders, 6 pathways, 5 moments, 2 trust facts, 10 reviews, 3
planning steps, plus all section copy, the rating summary and every button.

**The rendered page is identical.** Building from Storyblok instead of Sanity
produces:

```
elements with classes: Sanity 262 | Storyblok 262   structure identical: True
words:                 Sanity 809 | Storyblok 809   text differences: 0
```

Only the image host changes. That is the strongest evidence that the model
carries content and the existing code still owns presentation.

## Images migrated

13 photographs moved to Storyblok Assets as **masters**, not derivatives:

- Every one carries its **alt text**.
- The **4 that had a Sanity hotspot kept it** as a Storyblok focal point
  (hero, two pathways, the reviews photograph), converted from Sanity's 0–1
  coordinates to Storyblok's pixel form.
- Sizes are requested **per slot** through the existing image service, so a
  photograph is fetched at the size it is displayed at rather than at master
  size — hero 1920×1080, pathways 900×1100, moments 1200×1500, reviews 1600×1000,
  all at quality 80.
- **No duplicate desktop/mobile assets.** One master per photograph; the design
  does not call for different compositions.

Verified in a browser at six widths: 15/15 images load, 13 from
`a.storyblok.com`, 4 carrying `filters:focal(...)`.

## Fallback behaviour

The homepage is one story rather than thirteen records, so there is no partial
state — either the whole page comes from Storyblok or none of it does. Every
failure path leaves the homepage exactly as it is.

| Condition | Result | Homepage shown |
| --- | --- | --- |
| Flag off (default) | `disabled` | current source |
| No token | `missing-configuration` | current source |
| Wrong region | `unsupported-region` | current source |
| Story missing | `missing-story` | current source |
| Credential rejected (401/403) | `unauthorized` | current source |
| Host unreachable | `unavailable` | current source |
| Fails the content gate | `invalid-content` | current source |
| **Show this homepage** switched off | `editorial-suppressed` | current source |
| Everything valid | `applied` | Storyblok |

All nine verified — the first eight by test, and `disabled`,
`missing-configuration`, `unsupported-region`, `unauthorized`,
`editorial-suppressed` and `applied` additionally by real builds against the
live space.

Two gate decisions worth naming. **A photograph without alt text is treated as
not publishable** and sends the page to fallback rather than shipping an
unlabelled image. And the **editor switch is read before the content gate**, so
turning the page off reports a decision rather than broken content.

The merge is additive: anything the model does not cover — section order, and
any renderer field with no Storyblok home — survives untouched.

## Files changed

| File | Why |
| --- | --- |
| `scripts/storyblok-homepage-source.mjs` | new — the adapter |
| `scripts/build-static.mjs` | loads the homepage after Sanity, behind its flag; reports `storyblokHomepageSource` in `health.json` |
| `storyblok/phase4a/components.mjs` | new — the component definitions |
| `tests/storyblok-homepage.mjs` | new — contract tests |
| `package.json` | registers the suite in `test:content` |

No change to Tours, Sanity, the renderer, the stylesheet or any page markup.
`packages.html`, `cape-coast-tour.html` and `just-go-ghana.html` are
byte-identical before and after.

## Tests

`tests/storyblok-homepage.mjs`, registered in `test:content`: the seven mapped
sections, image sizing and focal points, alt-text enforcement, seven content-gate
rejections, the visibility switch, all nine load paths, merge preservation, and
delivery separation (published content is never read with a preview token).

**Mutation-verified**, four ways — each reintroduces the defect and the suite
fails: ignoring the visibility switch, accepting a photograph without alt text,
accepting empty section arrays, and replacing rather than merging the base
content.

Full regression on the final state — all executed, all passing: `test:content`,
`test:headers`, `test:build`, `test:layouts`, `test:packages-grid`,
`test:price-ownership`, `test:resilience`, `test:smoke`, `test:responsive`,
`test:a11y-static`.

**No token or API exposure**: the management, preview and public tokens each
appear in 0 files in the build, and neither `api.storyblok.com` nor
`mapi.storyblok.com` appears in any shipped file. Delivery is build-time only;
the browser never contacts Storyblok.

**Responsive**, six widths (375/390/430/768/1024/1440): 7 sections, all images
loaded, zero horizontal overflow, zero CSP violations at every width. All 12
homepage links resolve, none empty.

## Preview results

Branch `storyblok-phase-4a`, commit **`be25fad8`**, deployed to
`https://storyblok-phase-4a.people-and-places-tours.pages.dev`.

The preview currently reports `storyblokHomepageSource: disabled` and
`homepageContentSource: local` — neither the homepage flag nor the Sanity
variables exist in Cloudflare's Preview scope, so it is serving the fully
committed homepage. That is the safe default behaving correctly on real
infrastructure, but it means **the Storyblok homepage is not yet visible on the
Preview**.

Locally, with the same production-style delivery the Preview scope uses
(`version=published` + the Public token), both the homepage and Tours apply:

```
Storyblok: homepage content applied.
Storyblok: 10 of 13 Storyblok records applied; 3 not yet migrated.
homepage source: applied | sections: 7 | storyblok imgs: 13
```

The story is published in Storyblok and readable over published delivery
(HTTP 200). Production remains gated: `peopleplacesgh.com` still reports
`homepageContentSource: sanity`, and `main` predates this work entirely.

## Owner decisions genuinely required

**One, and it is the only thing standing between here and a visible Preview.**

Add to Cloudflare Pages → Settings → Environment variables, **Preview scope
only**:

| Variable | Value |
| --- | --- |
| `STORYBLOK_HOMEPAGE_ENABLED` | `true` |

Then redeploy the `storyblok-phase-4a` branch. Do not add it to Production
scope — that would switch the live homepage.

Optionally, adding `SANITY_STUDIO_PROJECT_ID` to Preview scope would make the
fallback path show the Sanity homepage rather than the committed one, which is a
closer comparison but is not required to review the Storyblok version.

Already decided by the owner and applied: `howHosted` is not migrated.

## Production-readiness blockers

1. **The Preview has not yet shown the Storyblok homepage** — needs the variable
   above.
2. **No real-device QA** of the Storyblok homepage. Phase 3H found two defects
   on a real iPhone that emulation missed; the same check is warranted here.
3. **Founder photographs are still absent.** Founders render as initials, which
   is what the current homepage does — unchanged by this phase, but still open.

None is architectural. Nothing was switched on in production, no section was
migrated beyond the homepage, and Sanity and every fallback remain in place.

Phase 4A stops here for owner review of the Preview.
