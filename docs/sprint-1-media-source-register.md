# Sprint 1 — Media Source Register

**Status:** Draft scaffold — not yet founder-approved
**Prepared:** July 2026
**Owner of final approval:** Founders, with Codex structuring

## Purpose

Inventory every media source per the roadmap: 32 Google Business images,
5 founder-selected Instagram references, founder originals, tour media held
elsewhere, and existing video. For each item, capture ownership, consent,
subjects, tour, place, story, date, orientation, resolution, alt text, focal
point and intended role.

**This document does not commission new photography.** Per the Brand
Foundation (§18), a broad new shoot should not be commissioned until this
inventory reveals the actual gaps.

## Required field set (per media item)

- Ownership
- Consent
- Subjects
- Related tour
- Related place
- Related story
- Date
- Orientation
- Resolution
- Alt text
- Focal point
- Intended role/section

## Known source categories

### 1. Google Business Profile images (32 total, confirmed)

The Takeout export has been located (`~/Downloads/Takeout/Google Business
Profile/.../location-.../`) and read directly. It contains exactly 32
photos — matching the Brand Foundation's figure precisely — each with a
`media-*.jpeg` file and a companion `media-*.json` giving `createTime` and
pixel dimensions, but **no subject, caption or consent metadata**. Subject
identification has to come from actually viewing each image.

**Two upload batches, by timestamp:**

| Batch | Count | Date | Apparent content |
| --- | --- | --- | --- |
| Batch 1 | 14 photos | 2022-04-16, all within ~1 hour | Landmark and group shots — Kwame Nkrumah Memorial/Mausoleum (no people), a Jamestown-style fishing harbour with painted boats and flags, and a genuine guest group photo at a forest cave sign (7 guests posing together) |
| Batch 2 | 18 photos | 2023-07-11 to 2023-08-08 | Ada Foah-style canoe/mangrove river POV shot, Cape Coast Castle exterior and cannon-row shots (no people), and multiple genuine guest group photos — two women at the castle ramparts, a 6-person group in orange life jackets on a boat tour near the castle, a 6-person group posed on rocks (Shai Hills-style) |

**Sample of 8 images viewed directly** (of 32) confirms these are **real,
unstaged guest/tour photos — not stock** — a materially different finding
from the live website, which currently uses 100% Unsplash stock for every
tour image. This means real, owned photographic assets already exist and
are sitting unused; the media gap is about *surfacing and clearing* this
existing material, not necessarily commissioning all-new photography.

**What's still missing from this export:**

- No image shows anyone confirmable as Isaac Yeboah or Evans Yirenkyi
  specifically (group photos show guests; a host may be present but isn't
  identifiable without founder confirmation).
- No consent records — these were uploaded to Google Business, which
  covers business-listing display, but public use elsewhere (website,
  Instagram) showing identifiable guest faces should be confirmed as
  covered, not assumed.
- No tour/place tagging — matching each photo to a specific tour record
  needs a founder or Codex pass, ideally cross-referencing upload date
  against booking records if those exist.

**Decided (2026-07-25): defer further photo-by-photo audit work.** The
founders will personally handle real media — uploading approved photos
directly once the CMS/backend exists, rather than this being sourced from
the Google Business export photo-by-photo in the meantime. Until then, the
site continues to use clearly-understood placeholders (per the Brand
Foundation's placeholder policy), and there's no need to characterize the
remaining 24 images now. The sample of 8 already reviewed stays useful as
proof that real, non-stock material exists — it just isn't the path this
project will take to get real photos onto the site.

### 2. Founder-selected Instagram references (5 total)

| # | Reference | Ownership/consent | Subjects | Intended role |
| --- | --- | --- | --- | --- |
| 1 | [instagram.com/p/DZakOtDAjdZ](https://www.instagram.com/p/DZakOtDAjdZ/) | Founder-selected; confirm posting rights for website reuse | Not yet described | Candidate — role TBD |
| 2 | [instagram.com/p/DRj3f4lgubp](https://www.instagram.com/p/DRj3f4lgubp/) | Founder-selected; confirm reuse rights | Not yet described | Candidate — role TBD |
| 3 | [instagram.com/p/DEEwLyEi6G6](https://www.instagram.com/p/DEEwLyEi6G6/) | Founder-selected; confirm reuse rights | **Isaac in yellow, Evans in white** — identified in Brand Foundation §21 and recommended for the founder-story section media (messaging brief §9) | Founder-story section — **needs high-resolution original**, current reference may be too low-res for hero use |
| 4 | [instagram.com/p/C7gTdPQiROk](https://www.instagram.com/p/C7gTdPQiROk/) | Founder-selected; confirm reuse rights | Not yet described | Candidate — role TBD |
| 5 | [instagram.com/reel/C4H5pWeCoZn](https://www.instagram.com/reel/C4H5pWeCoZn/) | Founder-selected; confirm reuse rights | Not yet described | Candidate — role TBD, possibly hero film source |

### 3. Founder originals

| Status |
| --- |
| Not yet inventoried. Founders should supply any existing high-resolution photography/video not already covered above (e.g. the BET Music/Afrochella 2019 feature mentioned in Brand Foundation §17 for Isaac). |

### 4. Tour media held elsewhere

| Status |
| --- |
| Not yet inventoried. If any partner, guide or past guest holds usable tour media, it should be logged here with consent status before use. |

### 5. Existing video

| Status |
| --- |
| The current homepage hero video (`homepage-content.js` hero source, an externally hosted `.mp4` on a third-party CDN domain) has **unconfirmed ownership/licensing** — the messaging brief explicitly calls this out: "Avoid: The current externally hosted hero video unless ownership and usage rights are confirmed" (§8). **This must be resolved before the hero section can reuse or reference it.** |

## Current site media audit — all stock, none sourced

Every tour image currently in `tours.js` (all 15 offers) is an Unsplash
stock photograph (`images.unsplash.com` URLs), and the homepage Instagram
strip in `homepage-content.js` reuses the same tour stock images rather than
real Instagram/owned content. None of these carry:

- Ownership records
- Consent records
- Subject identification
- Alt text beyond a generic tour-name string
- Focal point metadata

This is expected at this stage (Brand Foundation §18 explicitly permits
clearly labelled neutral placeholders during development) but confirms the
roadmap's point: essentially the entire current media library needs
replacement before public launch, not just gap-filling.

## Priority slots that must NOT launch on stock media

Per the Brand Foundation and messaging brief, these are launch-critical and
must resolve to real, approved, consented media — not placeholders:

1. Hero (guest-host interaction, owned)
2. Founder story (high-resolution Isaac + Kojo photo)
3. Featured guest story (Cynthia's family experience, or an intentional
   text-led treatment if no approved image exists)
4. Featured tours (real image per featured tour, once the 3–5 set is
   confirmed)

## Founder decisions needed before this register can exit Sprint 1

1. ~~Walk through the 32 Google Business Profile images~~ — **deferred by
   founder decision (2026-07-25)**: real photos will be uploaded personally
   once the CMS exists, rather than sourced from this export image-by-image
   now. No further action needed here for Sprint 1.
2. Confirm reuse rights and describe subjects for the 5 selected Instagram
   references.
3. Supply or confirm there is no higher-resolution original of the "Isaac in
   yellow, Evans in white" photo.
4. Confirm ownership/licensing status of the current hero video, or approve
   sourcing a replacement.
5. Supply any founder-original photography/video not covered by the Google
   Business or Instagram sources above.
6. Confirm whether Cynthia's family has approved image use, or whether the
   guest-story section should launch as text-led.
