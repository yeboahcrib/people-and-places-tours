# Sanity Go-Live — Stock Take

**17 August 2026.** Written after the founder decided to turn Sanity on rather
than shelve it, and flagged that real photography is not ready yet.

Read-only assessment. Nothing was changed in the dataset or the site.

## The headline

**Switching the site to Sanity today would change nothing a visitor could
see.** `npm run check:sanity` builds the site twice — once from Sanity, once
from the committed files — and compares them:

```
Sanity matches the committed content — 21 pages identical.
The build could be switched to Sanity without changing the site.
```

A full `npm run build` against the live dataset also passes every check:
security headers, static accessibility across 21 pages, all five content
contracts, and the build-output tests.

So the go-live is not a risky migration. The content is already there and
already agrees with the site. The switch is a single environment variable in
Cloudflare — `SANITY_STUDIO_PROJECT_ID=30a0uykw` — and the day it is set, the
site looks exactly as it does now. What changes is that from that moment the
founder's edits in the Studio become the source of truth.

**This means the sequencing is safe.** Turning Sanity on does not depend on
photography being ready. The risk is not in the switch; it is in what gets
edited afterwards. That is what the rest of this document is about.

## What is actually in the dataset

46 published documents (`30a0uykw` / `production`):

| Type | Count | Feeds |
| --- | --- | --- |
| `tour` | 15 | Tour pages, packages grid, homepage cards, contact dropdown |
| `review` | 15 | Real verbatim Google reviews |
| `homepageSection` | 7 | The homepage — see the exact-count trap below |
| `founderProfile` | 2 | Isaac, Evans |
| `aboutPage` | 1 | About page |
| `bookingFlow` | 1 | Contact page booking copy |
| `featuredTourCollection` | 1 | Which tours lead the homepage |
| `guestStory` | 1 | Cynthia Muldrow, Cape Coast |
| `navigation` | 1 | Nav + footer |
| `originStory` | 1 | Founding story |
| `siteSettings` | 1 | Phone, email, hours, service area |

## What is empty, and whether it matters

Seven document types are registered in the Studio but hold nothing. They split
into two groups, and the difference matters.

**Optional overrides — the build reads them, and falls back when empty:**

- `hostingPrinciple` → homepage "how we host" cards
- `planningStep` → homepage planning process
- `cta` → homepage and About call-to-action buttons

These are why the site is currently identical: the build merges Sanity over the
committed files, so an empty type simply leaves the built-in text in place.

**Never read by the build at all:**

- `experiencePathway`, `trustFact`, `socialStory`, `policy`

These are empty shelves. The schema exists, the Studio will happily accept
content for them, and nothing will ever appear on the website. Either wire them
up or remove them — leaving them is how an editor loses an afternoon writing
copy that cannot be published.

## Three traps to fix before handing the Studio over

> **All three are fixed as of 17 August 2026.** The build no longer replaces
> committed content with Sanity content; it merges the two. See "The merge
> model" below. The descriptions are kept because they explain what the merge
> now prevents.


These are not bugs today. They become bugs the first time a non-technical
editor uses the Studio the way its interface invites them to.

### 1. The homepage must contain exactly seven sections

`scripts/homepage-source.mjs`:

```js
if (!Array.isArray(sections) || sections.length !== SECTION_KEYS.length) {
  throw new Error(`Sanity homepage must contain exactly ${SECTION_KEYS.length} sections`);
}
```

The keys are `hero`, `founderStory`, `waysToExperience`, `howHosted`,
`reviewsAndTrust`, `planningProcess`, `finalInvitation`. Adding an eighth
section, deleting one, or duplicating a key **fails the build** — which on
Cloudflare means the deploy fails and the site freezes at its previous version.

The Studio offers no warning about this. An editor adding a homepage section is
doing an obvious, reasonable thing.

### 2. Filling one item silently replaces the whole set

Every list follows this shape:

```js
if (sectionKey === 'howHosted' && Array.isArray(section.hostingPrinciples) && section.hostingPrinciples.length) {
  target.principles = section.hostingPrinciples...
}
```

Empty means "use the built-in four." One item means "use this one and discard
the built-in four." There is no partial merge. An editor adding a single
hosting principle to try it out would delete the other three from the live
site. The same applies to pathways, planning steps and featured reviews.

### 3. Pathways without approved photos blank the section — FIXED

> **Fixed 17 August 2026**, along with the same defect in three sibling lists.
> See "What was fixed" below. The description is kept because it explains what
> the guard now prevents.


The most likely one to actually happen, because it sits directly on top of the
photography gap. Pathways are filtered like this:

```js
.filter(pathway => pathway?.title && pathway?.filterKey && pathway?.image?.src
  && pathway.image.publicApprovalState === 'approved'
  && pathway.image.placeholderState === 'approved')
```

An image that is missing, unapproved, or marked as a stand-in removes that
pathway entirely. If every pathway fails the filter, the result is an empty
array — and the renderer has no guard:

```js
${(data.pathways || []).map((p, i) => `...`).join('')}
```

The heading and background motif stay; the four photo cards vanish. The build
passes, the tests pass, and the homepage section the animation was just built
for ships blank.

This is the one to fix first.

## The merge model

All three traps came from one design decision: Sanity content **replaced**
committed content. The homepage now **merges** the two, which is what makes it
safe to edit the site a piece at a time while photography is incomplete.

**The editor is in charge.** Sanity decides which items exist and in what
order; the committed homepage in `homepage-content.js` supplies detail the
editor has not filled in yet. Three rules, applied in
`scripts/homepage-source.mjs`:

1. **Sections are independent and optional.** A section that does not exist in
   Sanity keeps its committed content. Nothing about the homepage requires the
   editor to have filled in all seven, and no missing section can fail a build.
   A duplicated section is the one ambiguous case: the first by `order` wins and
   the rest are reported.
2. **A list Sanity holds is a list Sanity owns.** Delete an item in the Studio
   and it leaves the page; add one and it appears; reorder them and the page
   reorders. The distinction that makes this safe is between a list that is
   **absent** from the query result — never set up, so the committed content
   stands — and one that is present but **empty**, which is a deliberate
   clearing. Verified against the live dataset: every list currently returns
   `null`, not `[]`, which is why today's homepage is untouched.
3. **Within an item, blank means "not written yet".** Each Sanity entry is
   matched to its committed counterpart by a stable key — the pathway's
   category, the principle's icon, the reviewer's name, the step's number — and
   only the fields the editor actually filled in are written over it
   (`overlay`). A photo counts as filled in only once it is approved and marked
   as a genuine photograph (`usablePhoto`); anything else keeps the existing
   picture. So an item can be renamed without losing its photograph, or have
   its photograph swapped without losing its words.

An entry that still cannot be rendered — a new pathway with no approved photo,
a principle with no icon — is left off the page and reported in the build log.
Only that entry: the complete ones beside it are unaffected.

The renderers now omit a section whose list the editor has emptied, rather than
printing a heading over nothing. Deleting everything looks deliberate instead of
broken. `reviewsAndTrust` keeps its trust-facts row and drops only the carousel,
since the two are independent.

The practical effect, run against the real committed content (6 pathways):

| What the editor does | What happens |
| --- | --- |
| Never sets it up (today) | 6 pathways — untouched |
| Deletes two | 4 pathways |
| Deletes all | section omitted from the page |
| Reorders two | page order follows the Studio |
| Renames one, uploads no photo | renamed, committed photograph kept |
| Uploads a photo, changes no words | photo swapped, copy kept |
| Adds a complete new pathway | appears in the editor's order |

### Verification

`tests/homepage-source.mjs` covers each rule: deletion, reordering, the
absent-versus-empty distinction, partial edits (renaming without a photo,
swapping a photo without touching the words, blank fields inheriting), an
unapproved photo keeping the committed one, one incomplete entry not taking
down the complete entries beside it, every section missing in turn, an empty
dataset, and a duplicated section.

Green afterwards: `build`, `check:sanity` (**still 21 pages identical against
the live dataset**), `test:smoke`, `test:visual` (no change across 63
screenshots), `test:responsive` (375/430/768/1024/1440), `test:resilience`,
`test:pathway-spotlight`.

## The photography position

- 5 real photographs exist in `assets/photos/` (four pathway images, one
  reviews banner).
- ~19 unique stock images from Unsplash are referenced ~131 times across 23
  files.
- No image fields were ever seeded into Sanity — a deliberate choice recorded
  in the July session notes, so that stock stand-ins were never entered as
  though they were the company's own work.

The `mediaAsset` schema already enforces this properly. It asks, in plain
language, *"Is this a real photograph?"* and *"Show this photo on the
website?"*, and the build checks both before publishing an image. The guard is
sound. It just has almost nothing to guard yet.

## Dependency advisories

22 advisories in `studio/` (1 critical, 10 high, 11 moderate), unchanged since
the 7 August audit. The critical one is `decompress`, reached only via
`@sanity/cli` → `@sanity/runtime-cli`.

That is the developer command-line tool used to deploy the Studio. It is not
part of the Studio's browser application and not part of the public website. No
visitor is exposed to it. An `@sanity/cli` upgrade should clear the critical
and most of the highs; the Studio itself is on `sanity ^3.68.0` and worth
upgrading in the same pass.

## Recommended order

1. ~~**Fix trap 3**~~ — done, and extended to all four affected lists.
2. ~~**Fix traps 1 and 2**~~ — done, by replacing the whole replace-the-list
   model with the merge model above.
3. **Resolve the four dead types** — wire up or delete.
4. **Upgrade `studio/` dependencies** and re-audit.
5. **Set `SANITY_STUDIO_PROJECT_ID` in Cloudflare** and deploy. Confirm with
   `check:sanity` and `test:visual` that the site is unchanged.
6. **Then** photography, as and when it exists, one image at a time.

Steps 1–4 are code and need no founder input. Step 5 is a dashboard action.

## Open questions only the founder can answer

- **Do the four unused types earn their place?** `policy` would back real
  cancellation/privacy pages (drafted in `docs/legal-pages-draft.md`, never
  built). `trustFact` and `socialStory` may be leftovers from a superseded
  homepage plan. `experiencePathway` overlaps with what the homepage already
  does.
- ~~**Should an editor be able to add an eighth homepage section?**~~ Answered
  yes, and built — see `docs/adding-homepage-sections.md`. Four on-theme
  layouts can be added, positioned and removed from the Studio without a
  developer. Whole new *pages* remain a developer task.
- **Which stock images matter most?** Ranking the ~19 by how prominent they
  are would turn "we need photos" into a specific shot list.
