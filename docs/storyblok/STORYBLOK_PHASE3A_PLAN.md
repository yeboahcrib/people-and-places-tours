# Storyblok Phase 3A Plan — CMS Structure Only

**Status:** planning only. Do not provision this plan, enter content, connect Storyblok, add dependencies, or change any website source until Phase 3A approval is explicitly given. This plan is based on `STORYBLOK_MIGRATION_AUDIT.md` and `STORYBLOK_ARCHITECTURE.md`, rechecked against the repository and current official Storyblok documentation on 27 August 2026.

## 0. Current Free-plan verification

The current Storyblok **Starter (Free)** plan includes one Space, one included user (maximum two), Management API, Visual Editor, Datasources, Asset Manager, Image Optimization Services, standard roles, 200 components, 100 content folders, 2,000 assets, 20,000 stories, 10 datasources, two Preview URLs, two locales, 100 GB monthly traffic, and 100,000 API requests/month. It has one-day version/activity retention and three webhooks. It does **not** include custom metadata fields, custom roles, custom workflow stages/workflows, environments, or scheduled single stories. Management API rate limit is three calls/second. [Current pricing](https://www.storyblok.com/pricing), [Free plan](https://www.storyblok.com/free), [technical limits](https://www.storyblok.com/pricing/technical-limits).

### Free-plan impact on the approved architecture

| Approved idea | Free-plan decision |
|---|---|
| Asset focal points and transformations | Available: use native Asset focus and Image Service. |
| Asset alt/credit/source | Available: use native Asset alt, copyright and source. |
| Custom per-asset consent/owner/approval fields | **Adjust:** custom metadata is unavailable. Use Asset folders/tags (`needs-consent`, `approved-photo`, `stock`, `placeholder`) and a small internal note on the consuming story only when necessary. |
| Editorial workflow/custom roles | **Adjust:** use default draft/published behaviour and standard roles; do not design custom workflow states in Phase 3A. |
| Schema-as-code | Available via Management API/official Storyblok CLI; Free includes Management API. |
| Visual Editor | Available, but not required or configured in Phase 3A; use no Preview URL yet. |
| Separate dev/staging/prod Storyblok environments | **Adjust:** unavailable. Keep this one Space unconnected during Phase 3A; use a documented manual test record and schema pull/changeset history. |

These constraints do not require a change to the production-site architecture. They only simplify internal governance in the initial CMS configuration.

## 1. Phase 3A scope and sequence

Create **only the minimum schema needed to test one standard Tour cleanly**, plus its reusable supporting blocks/options. Do not create every future page type in the Space yet.

### Create first

1. Component folders/tags in the Block Library.
2. Nine supporting nestable blocks: `seo`, `faq_item`, `price_option`, `gallery_item`, `list_item`, `cta`, `related_tour_item` (only if dated feature list needs it; otherwise defer), `internal_note` (defer—Storyblok Story description is enough), and no generic blocks.
3. One `tour` Content Type.
4. Four required datasources/options: category, vibe, destination, currency. Add activity level and meals only when creating `multi_day_tour` in a later phase.
5. Content folders: Tours plus child folders Day & Short Experiences and Multi-day Experiences; Global; Pages; Policies; Editorial; Assets folders. Create no stories except the single test Tour after the schema passes a manual editor review.

### Explicitly defer

`multi_day_tour`, Home, Experiences, About, Contact, Policy, Review, Guest Story, Team, Site Settings, Navigation/Footer and Featured Tours content types; all page/flexible blocks; Webhooks; Preview URLs; content migration; Production tokens; custom asset metadata; any integration code. They are approved architecture, but not essential to validate the standard-tour editing experience.

This keeps Phase 3A well below the Free plan’s limits and makes early editor feedback meaningful.

## 2. Exact initial components

### Content Type: `tour` — **Experience**

Use one Story per ordinary bookable experience. Organize fields in the editor as visible groups; technical names remain internal.

| Editor group | Technical field / editor label | Storyblok type | Rule/default/help | Current source/destination |
|---|---|---|---|---|
| Basics | `name` / Experience name | Text | Required; max 80. “The name guests see.” | Sanity+`tours.js`; cards/details/search/select |
|  | `slug` / Website address | Text or Slug | Required; lowercase/hyphen pattern; unique. “Do not change after launch without redirect review.” | Sanity+local; future route lookup |
|  | `published` / Show this experience | Boolean | Default true. “Turn off to hide it without deleting.” | Sanity `active` |
|  | `experience_type` / Type of experience | Single option | Required; `day`, `tailored_multi_day`, `custom`; default `day`. | Sanity `offerType` |
|  | `display_order` / Position in Experiences | Number | Required integer ≥1. “Lower numbers appear first.” | local `packageOrder` |
| Card | `card_image` / Card photo | Asset | Required; Asset alt required; focus required during QA. | local/Sanity image; 3:2 card |
|  | `card_badge` / Small card label | Text | Optional; max 20. | local badge |
|  | `card_description` / Card description | Textarea | Required; 180–340 recommended characters. | local packageDescription/description |
|  | `categories` / Experience categories | Multi-option datasource | Required; at least 1. | filters/related behaviour |
|  | `vibes` / Experience highlights | Multi-option datasource | Optional; max 2 shown. | card tags/related card |
|  | `destination` / Region or area | Single-option datasource | Required. | filter value |
|  | `search_summary` / Search summary | Textarea | Optional; max 150. | command palette |
| Pricing & group size | `price` / Price | Number | Required; minimum 0. | cards/details |
|  | `currency` / Currency | Single-option datasource | Required; default USD. | price formatting |
|  | `price_unit` / Price per | Text | Required; default “Per Person”; max 30. | cards/details |
|  | `price_options` / Other ways to book | Blocks | Optional; only `price_option`; max 4. | detail alternatives |
|  | `duration` / Duration | Text | Required; max 50. | cards/details |
|  | `locations` / Places visited | Blocks | Optional; only `list_item`; max 8. | current joined location |
|  | `starting_point` / Starting point | Text | Required; max 140. | details/hero |
|  | `minimum_guests` / Minimum guests | Number | Optional; integer ≥1. | group display |
|  | `maximum_guests` / Maximum guests | Number | Optional; integer ≥1; QA must ensure ≥ minimum. | group display |
|  | `group_size_note` / Group size note | Text | Optional; max 140. | detail price note |
| Hero & overview | `hero_image` / Wide hero photo | Asset | Optional; card photo is fallback. “Use only if this needs a different wide composition.” | hero |
|  | `hero_watermark` / Large background word | Text | Optional; max 32. | current hero |
|  | `page_headline` / Tour overview heading | Text | Required; max 110. | overview |
|  | `overview` / Tour overview | Textarea | Required; max 1,200; paragraphs are supported by blank lines. | detail overview |
| What’s included | `included` / What’s included | Blocks | Required; only `list_item`; min 1/max 15. | coverage |
| Not included | `excluded` / What’s not included | Blocks | Required; only `list_item`; min 1/max 15. | coverage |
| Gallery | `gallery` / Photos from this experience | Blocks | Optional; only `gallery_item`; max 12. “The existing website shows the gallery only with three or more photos.” | grid/lightbox |
| Questions | `faqs` / Questions guests ask | Blocks | Required; only `faq_item`; min 1/max 10. | detail FAQ |
| Related | `related_tours` / Also check out | Multi-reference to `tour` | Optional; max 3. “Leave blank to let the site use its current category-based suggestions.” | future explicit override; current code derives |
| Search & review | `editorial_note` / Private editor note | Textarea | Optional; never public. Use instead of unavailability custom metadata. | new/simple governance |
|  | `last_reviewed` / Last reviewed | Date | Optional. | new/simple governance |
| SEO | `seo` / Search & sharing | Blocks | One `seo` block; max 1. Optional fields preserve code fallbacks. | `render-meta.mjs` equivalent |

**Do not add in Phase 3A:** accessible-travel notes, availability note, cultural context, highlights, small-group supplement, guest-story reference, or itinerary. They have no current standard Tour surface (or are a multi-day concern), and violate the “need to edit” test.

### Nestable blocks

| Technical name / label | Fields | Validation/purpose |
|---|---|---|
| `price_option` / Other price option | `label` (text), `price` (number) | Both required; label ≤60, price ≥0. Used only inside Tour pricing. |
| `faq_item` / Question & answer | `question` (text), `answer` (textarea) | Both required; ≤120/≤700. Ordered directly by editor. |
| `gallery_item` / Gallery photo | `image` (Asset), `caption` (text), `layout` (single option automatic/portrait/wide) | Image required; caption ≤180; default automatic. Focal/alt live on the Asset. |
| `list_item` / List item | `text` (text) | Required; ≤120. Reused for locations, included and excluded lists. |
| `seo` / Search & sharing | `title`, `description`, `canonical_override`, `social_image`, `indexing` | Optional; title ≤60, description ≤160, URL pattern; indexing default index. Code supplies fallbacks. |

`cta` is not needed for the first Tour test because current tour CTA presentation/URLs are code-owned; defer it. `related_tour_item` is not needed because a reference field directly handles the test. This avoids speculative components.

## 3. Content Types vs nestable blocks

| Create in Phase 3A | Classification | Reason |
|---|---|---|
| Tour | Content Type | A complete editorial record with a unique identity, slug and relationships. |
| Price option, FAQ item, gallery item, list item, SEO | Nestable blocks | Ordered/repeated or local structured content; never independently published. |
| All page/global/editorial types | Defer | Need no first-tour test; protects Free-plan space from premature model growth. |

## 4. Folders and initial stories

Create these content folders now: `Tours/Day & Short Experiences`, `Tours/Multi-day Experiences`, `Pages`, `Policies`, `Editorial`, `Global`. The latter five are empty placeholders for the approved model; do not create fake content to fill them. Create one Story: **Tours/Day & Short Experiences/Cape Coast Ancestral Tour**. Asset folders: `Tours/Cape Coast Ancestral Tour`, `Home`, `Pages`, `People`, `Brand`. Asset tags: `approved-photo`, `needs-consent`, `stock`, `placeholder`. Asset tags are governance aids only; tag presence does not change frontend behaviour.

## 5. Datasources/options required now

Free allows 10 datasources; use four only.

| Datasource | Values for Phase 3A |
|---|---|
| `tour_category` | culture, heritage, food, nature, adventure, craft, relaxation, multi-day |
| `tour_vibe` | Culture, History, Heritage, Foodie, Nightlife, Craft, Beach, Nature, Adventure, Thrills, Wildlife, Relaxation, Workshop, Multi-Day |
| `tour_destination` | accra, cape-coast, kumasi, ada-foah, volta |
| `currency` | USD (initial; add only currencies actually used) |

Hard-code `experience_type` and gallery `layout` options in their component fields because they are narrow implementation choices, not editor-managed taxonomy. Do not create datasources for routes, SEO, nav, labels, meals, reviews or CTAs now.

## 6. Assets and metadata configuration

Configure only native Asset facilities: folders, tags, alt, copyright, source and focus point. For each test image, supply sensible filename, asset-level alt, source/copyright, a focus point and any governance tag. Do not create custom metadata: Starter does not support it. No asset must be duplicated just to serve card and hero; use one original, then later code will request exact Image Service variants. A placement-specific description is supported only by optional `gallery_item.caption`; use a different hero image only when its composition genuinely differs.

## 7. Safest setup method

**Recommended controlled combination:**

1. **Manual in Storyblok UI:** create the empty folders, confirm Free-plan available field labels/groups and configure the one-space Asset folders/tags. This is low-volume editor-facing setup and avoids premature automation of account-specific IDs.
2. **Official schema-as-code/CLI, in a separate CMS configuration workspace (not the website):** after manual UX approval, define the components/datasources in source-controlled schema files and use official `storyblok schema push` to preview a diff and apply it. The CLI supports schema pull/push, Management API-backed changes, changesets and rollback. [Storyblok CLI](https://www.storyblok.com/docs/libraries/storyblok-cli), [schema package](https://www.storyblok.com/docs/libraries/js/schema).
3. **Management API:** use only through the official CLI for this initial schema. Do not write an ad-hoc migration program, do not send production content, and do not use it to connect the frontend.

The Phase 3A approval should authorize a separate non-website `cms-schema/` repository or protected directory containing the schema—not `People & Places` production source. The CLI/package installation belongs to that later authorized setup, not this plan. Commit schema definitions and generated changeset metadata if it contains no secrets; never commit credentials or downloaded content tokens.

## 8. Credentials and safe local storage

| Credential | When needed | Use | Storage rule |
|---|---|---|---|
| Personal Access Token (PAT) | Phase 3A schema CLI/API | authenticated Management API: components, datasources, folders/stories/assets | OS keychain or untracked local env file outside website repo; never frontend/source control. Scope to this Space if possible; rotate/revoke if exposed. |
| Space ID and region | Phase 3A CLI/API | selects the Storyblok Space/API endpoint | non-secret may be in untracked local config or documented in private team records; do not require commit. |
| Public Delivery token | **Not Phase 3A** | eventual published-content build fetch | may appear in build environment only when integration is authorized; never management token. |
| Preview token | **Not Phase 3A** | eventual draft/Visual Editor preview | secret; environment/keychain only; never production client bundle. |
| OAuth token | Not needed | only for a future plugin/app acting for a user | do not create. |

Storyblok explicitly recommends keeping PATs in environment variables and never exposing them in committed frontend code. [Access tokens](https://www.storyblok.com/docs/concepts/access-tokens.html). CLI login stores credentials under `~/.storyblok/credentials.json`; use this only on the owner’s secured machine, never copy it into project folders. The Management API accepts a PAT or OAuth token, not both. [Management API](https://www.storyblok.com/docs/api/management), [CLI login](https://www.storyblok.com/docs/libraries/storyblok-cli).

## 9. First test content — Cape Coast Ancestral Tour

Select **Cape Coast Ancestral Tour** (`cape-coast`) as the one test Tour. It is a representative standard day tour and exercises more approved fields than the others: card image/alt/badge, hero fallback or distinct hero, featured status context, price/duration/location/group size, category/vibes/destination, overview, seven included and four excluded items, six FAQs, and a real price option in `src/content/tour-pages.json`. Its sources are `tours.js` and `src/content/tour-pages.json`; it is not the multi-day exception.

Create only this non-connected draft story. Upload/select a test card master and, if available, a distinct approved hero master; add three gallery assets to test reorder/grid threshold (they must not alter the website); create its `price_option`, FAQs, categories/vibes and optional related Tour references only if reference targets already exist as unconnected drafts. If no related Tour exists, leave `related_tours` empty: this validates the intended current category-derived fallback behaviour without creating extra content records.

## 10. Phase 3A acceptance criteria

- The Free plan supports every provisioned capability; no unavailable custom metadata/workflow/environment feature is depended upon.
- A nontechnical owner can find `Cape Coast Ancestral Tour`, understand groups labelled Basics, Card, Pricing & group size, Tour overview, What’s included, Gallery, Questions, and Search & sharing, and enter it without knowing code terms.
- Required validation behaves sensibly: name/slug/card asset/card description/price/duration/overview/included/excluded/FAQ; optional fields remain optional.
- One image upload can be reused for card and hero; native asset alt and focus can be set; gallery captions/ordering/layout override work; no duplicate desktop/mobile asset requirement exists.
- Gallery and FAQs can be reordered in Storyblok; price options and group size are comprehensible.
- Datasource choices prevent taxonomy drift without exposing routes, API fields or rendering settings.
- The Space contains no implementation-only field that an editor cannot use; no generic page-builder component is available.
- No website file, production build, Cloudflare setting, route, Sanity configuration/query, token, content migration, or frontend behaviour changes.
- Schema can be exported/pulled and a dry-run/diff can be reviewed before any future structural update.

## Stop condition

After this plan is approved, Phase 3A execution may create only the defined CMS structure and one unconnected Cape Coast draft test record. Stop for an editor walkthrough and acceptance review. Do not begin Phase 3B, content migration, Storyblok delivery integration or website changes without a new explicit authorization.

