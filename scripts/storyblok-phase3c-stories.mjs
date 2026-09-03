import {createHash} from 'node:crypto';
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchSanity} from './sanity-fetch.mjs';
import {loadLocalTours} from './local-render-source.mjs';

const SPACE_ID = 294832753590557;
const PARENT_ID = 213732107080273;
const STAGED_PARENT_ID = -31002;
const CAPE_COAST_ID = 213733342890335;
const CAPE_COAST_UUID = '6a2cbaab-10a8-43eb-944c-1afa14346bb7';
const SANITY_PROJECT_ID = '30a0uykw';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2026-08-02';
const STORY_DIRECTORY = 'tours/day-short-experiences';
const REQUIRED_COMPONENTS = ['tour', 'list_item', 'faq_item', 'gallery_item', 'price_option', 'seo'];
const SAFE_SLUGS = [
  'accra-city',
  'cape-coast',
  'kumasi',
  'ada-foah',
  'quad-bike',
  'shai-hills',
  'aburi',
  'cape-coast-day',
];

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');

function usage() {
  throw new Error(
    'Usage: node scripts/storyblok-phase3c-stories.mjs --out <private staging directory> --components-source <current component directory>',
  );
}

function options(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) continue;
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) usage();
    values[key.slice(2)] = value;
    index += 1;
  }
  return values;
}

function text(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function equal(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function uid(seed) {
  const hash = createHash('sha256').update(seed).digest('hex').slice(0, 32);
  return hash.slice(0, 8) + '-' + hash.slice(8, 12) + '-' + hash.slice(12, 16)
    + '-' + hash.slice(16, 20) + '-' + hash.slice(20);
}

function positiveNumber(value, label) {
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) throw new Error(label + ' must be a positive number.');
  return number;
}

function positiveInteger(value, label) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number <= 0) throw new Error(label + ' must be a positive integer.');
  return number;
}

function parsePrice(value, slug) {
  const match = String(value || '').match(/^\$(\d+(?:\.\d+)?)$/);
  if (!match) throw new Error(slug + ': local price is not an unambiguous USD value.');
  return Number(match[1]);
}

function parseGroupSize(value, slug) {
  const match = String(value || '').match(/^(\d+)-(\d+) People$/);
  if (!match) throw new Error(slug + ': local group size is not an unambiguous numeric range.');
  return {minimum: Number(match[1]), maximum: Number(match[2])};
}

function checkExact(slug, label, localValue, sanityValue) {
  if (!equal(localValue, sanityValue)) {
    throw new Error(slug + ': material ' + label + ' conflict between the current local source and Sanity.');
  }
}

function assertWithin(value, minimum, maximum, label) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum) {
    throw new Error(label + ' must contain ' + minimum + '–' + maximum + ' entries.');
  }
  if (value.some(item => !text(item))) throw new Error(label + ' contains an empty value.');
}

function listBlocks(slug, field, values, {minimum = 1, maximum = 12} = {}) {
  assertWithin(values, minimum, maximum, slug + ': ' + field);
  return values.map((value, index) => ({
    _uid: uid(slug + ':' + field + ':' + index),
    component: 'list_item',
    text: text(value),
  }));
}

function faqBlocks(slug, values) {
  if (!Array.isArray(values) || values.length < 1 || values.length > 10) {
    throw new Error(slug + ': FAQs must contain 1–10 entries.');
  }
  return values.map((value, index) => {
    const question = text(value?.question);
    const answer = text(value?.answer);
    if (!question || !answer) throw new Error(slug + ': FAQ ' + (index + 1) + ' is incomplete.');
    return {
      _uid: uid(slug + ':faq:' + index),
      component: 'faq_item',
      question,
      answer,
    };
  });
}

function priceOptionBlocks(slug, values) {
  if (values === undefined || values === null) return [];
  if (!Array.isArray(values)) throw new Error(slug + ': price options must be an array.');
  if (values.length > 4) throw new Error(slug + ': price options exceed the reviewed CMS limit.');
  return values.map((value, index) => {
    const label = text(value?.label);
    const price = positiveNumber(value?.price, slug + ': price option ' + (index + 1));
    if (!label) throw new Error(slug + ': price option ' + (index + 1) + ' has no label.');
    return {
      _uid: uid(slug + ':price-option:' + index),
      component: 'price_option',
      label,
      // Storyblok's number field validates a numeric string at write time.
      // The adapter converts it back to a number only after strict checks.
      price: String(price),
    };
  });
}

function dimensions(value, label) {
  const match = String(value || '').match(/^(\d+)x(\d+)$/);
  if (!match) throw new Error(label + ': asset dimensions are missing.');
  return {width: Number(match[1]), height: Number(match[2])};
}

function assetReference(assetKey, assets) {
  const asset = assets[assetKey];
  if (!asset) throw new Error('Asset manifest is missing ' + assetKey + '.');
  if (!Number.isSafeInteger(asset.id) || !text(asset.filename) || !text(asset.alt) || !text(asset.title)) {
    throw new Error(assetKey + ': asset metadata is incomplete.');
  }
  const size = dimensions(asset.dimensions, assetKey);
  return {
    id: asset.id,
    alt: asset.alt,
    name: asset.shortFilename || '',
    focus: asset.focus || '',
    title: asset.title,
    source: asset.source || '',
    filename: asset.filename,
    copyright: '',
    fieldtype: 'asset',
    meta_data: {
      size: String(size.width) + 'x' + String(size.height),
      alt: asset.alt,
      title: asset.title,
      source: asset.source || '',
      copyright: '',
    },
  };
}

function galleryBlocks(slug, assets) {
  const plans = {
    'cape-coast': [
      ['cape-coast-gallery-01', 'portrait', 'The First Bath of Return at Assin Manso'],
      ['cape-coast-card', 'wide', 'After a traditional naming ceremony at Cape Coast'],
      ['cape-coast-gallery-03', 'automatic', ''],
    ],
    'ada-foah': [
      ['ada-foah-gallery-01', 'automatic', ''],
      ['ada-foah-gallery-02', 'automatic', ''],
    ],
  };
  const entries = plans[slug] || [];
  if (entries.length > 6) throw new Error(slug + ': gallery exceeds the reviewed CMS limit.');
  return entries.map(([assetKey, layout, caption], index) => ({
    _uid: uid(slug + ':gallery:' + index),
    component: 'gallery_item',
    image: assetReference(assetKey, assets),
    layout,
    ...(caption ? {caption} : {}),
  }));
}

function seoBlock(slug, tour, page, assets) {
  return [{
    _uid: uid(slug + ':seo'),
    component: 'seo',
    title: tour.title + ' | People & Places Tours',
    // The current site falls back to its full page intro for this optional
    // description. Storyblok sensibly caps custom descriptions at 160
    // characters, so leave it empty rather than silently truncating the
    // production-facing prose into a different SEO claim.
    indexing: 'index',
    social_image: assetReference(slug === 'ada-foah' ? 'ada-foah-card' : slug + '-card', assets),
  }];
}

function cardAssetKey(slug) {
  return slug + '-card';
}

function storyIdFor(slug) {
  if (slug === 'cape-coast') return CAPE_COAST_ID;
  return -40000000 - SAFE_SLUGS.indexOf(slug);
}

function storyUuidFor(slug) {
  return slug === 'cape-coast' ? CAPE_COAST_UUID : uid('phase3c-story:' + slug);
}

function buildStory({local, page, sanity, assets}) {
  const slug = local.slug;
  const group = parseGroupSize(local.groupSize, slug);
  if (positiveInteger(sanity.groupSizeMin, slug + ': Sanity minimum guests') !== group.minimum
    || positiveInteger(sanity.groupSizeMax, slug + ': Sanity maximum guests') !== group.maximum) {
    throw new Error(slug + ': material group-size conflict between local source and Sanity.');
  }
  if (!text(sanity.startingPoint)) throw new Error(slug + ': Sanity starting point is missing.');
  if (text(sanity.currency || 'USD') !== 'USD') throw new Error(slug + ': only the approved USD currency may be staged.');
  if (!Array.isArray(sanity.locations) || sanity.locations.length < 1 || sanity.locations.length > 6) {
    throw new Error(slug + ': Sanity places visited are invalid.');
  }

  checkExact(slug, 'title', local.title, sanity.title);
  checkExact(slug, 'price', parsePrice(local.price, slug), Number(sanity.price));
  checkExact(slug, 'price per', local.priceUnit, sanity.priceUnit || 'Per Person');
  checkExact(slug, 'duration', local.duration, sanity.duration);
  checkExact(slug, 'destination', local.destination, sanity.destination);
  checkExact(slug, 'categories', local.categories, sanity.categories);
  checkExact(slug, 'highlights', local.vibes, sanity.vibes);
  checkExact(slug, 'search summary', local.commandSummary, sanity.commandSummary);
  checkExact(slug, 'places visited', local.location.split(', ').map(text), sanity.locations.map(text));
  checkExact(slug, 'detail title', local.title, page.title);
  for (const field of ['included', 'excluded', 'funFacts', 'heroWatermark', 'pageHeadline', 'pageIntro', 'faqs']) {
    checkExact(slug, field, page[field], sanity[field]);
  }
  // Neither source has authored an alternative booking option for most Tours.
  // Sanity serialises that empty CMS list as [], while the checked-in fallback
  // omits it. Those are the same visible state, unlike a populated option.
  checkExact(slug, 'priceOptions', page.priceOptions || [], sanity.priceOptions || []);

  const price = positiveNumber(sanity.price, slug + ': Sanity price');
  const cardImage = assetReference(cardAssetKey(slug), assets);
  const content = {
    _uid: uid('phase3c-content:' + slug),
    component: 'tour',
    slug,
    // This editor-facing switch says the experience is ready to be shown when
    // it is eventually published. The outer Storyblok record below remains a
    // draft throughout Phase 3C, so it cannot reach a public site here.
    published: true,
    experience_type: 'day',
    name: sanity.title,
    display_order: String(local.packageOrder),
    card_image: cardImage,
    card_badge: local.badge || '',
    card_description: local.packageDescription,
    categories: sanity.categories,
    vibes: sanity.vibes,
    destination: sanity.destination,
    search_summary: sanity.commandSummary || '',
    price: String(price),
    currency: 'USD',
    price_unit: sanity.priceUnit || 'Per Person',
    price_options: priceOptionBlocks(slug, sanity.priceOptions),
    duration: sanity.duration,
    locations: listBlocks(slug, 'locations', sanity.locations, {minimum: 1, maximum: 6}),
    starting_point: sanity.startingPoint,
    minimum_guests: String(group.minimum),
    maximum_guests: String(group.maximum),
    group_size_note: sanity.groupSizeNote || '',
    // One master photo is reused where it has the same approved composition.
    // The build adapter asks the Storyblok Image Service for a hero rendition
    // around its focal point, avoiding a duplicate desktop-only upload.
    hero_image: cardImage,
    hero_watermark: page.heroWatermark,
    page_headline: page.pageHeadline,
    overview: sanity.description,
    // page_intro is a visual grouping tab in the current schema, not a CMS
    // field. The renderer keeps the established local page intro when this
    // optional adapter field is absent, so staging it would be schema drift.
    good_to_know: listBlocks(slug, 'good-to-know', sanity.funFacts, {minimum: 1, maximum: 6}),
    included: listBlocks(slug, 'included', sanity.included, {minimum: 1, maximum: 12}),
    excluded: listBlocks(slug, 'excluded', sanity.excluded, {minimum: 1, maximum: 12}),
    gallery: galleryBlocks(slug, assets),
    faqs: faqBlocks(slug, sanity.faqs),
    seo: seoBlock(slug, sanity, page, assets),
  };

  return {
    id: storyIdFor(slug),
    name: sanity.title,
    slug,
    full_slug: STORY_DIRECTORY + '/' + slug,
    // New Storyblok CLI records refer to a local sentinel. manifest.jsonl maps
    // it to the already-existing Day & Short Experiences folder at creation
    // time; passing the remote ID directly would otherwise create at root.
    parent_id: slug === 'cape-coast' ? PARENT_ID : STAGED_PARENT_ID,
    is_folder: false,
    is_startpage: false,
    // The CLI must never publish during this phase. Cape Coast is deliberately
    // un-published separately because update/publish:false cannot do that.
    published: false,
    uuid: storyUuidFor(slug),
    content,
  };
}

async function fetchSanityTours() {
  const query = '*[_type == "tour" && active == true && slug.current in ['
    + SAFE_SLUGS.map(slug => JSON.stringify(slug)).join(', ')
    + ']]{'
    + '"slug": slug.current, title, price, currency, priceUnit, duration, locations, startingPoint, '
    + 'groupSizeMin, groupSizeMax, groupSizeNote, destination, categories, vibes, description, commandSummary, '
    + 'included, excluded, funFacts, heroWatermark, pageHeadline, pageIntro, '
    + 'priceOptions[]{label, price}, faqs[]{question, answer}'
    + '}';
  const url = 'https://' + SANITY_PROJECT_ID + '.apicdn.sanity.io/v' + SANITY_API_VERSION
    + '/data/query/' + SANITY_DATASET + '?query=' + encodeURIComponent(query);
  const body = await fetchSanity(url, {label: 'Phase 3C Sanity reconciliation'});
  if (!Array.isArray(body?.result)) throw new Error('Sanity reconciliation returned no tour collection.');
  const bySlug = new Map(body.result.map(tour => [tour?.slug, tour]));
  if (bySlug.size !== SAFE_SLUGS.length || SAFE_SLUGS.some(slug => !bySlug.has(slug))) {
    throw new Error('Sanity reconciliation did not return every approved safe Tour.');
  }
  return bySlug;
}

function assertSafeTemporaryDirectory(output) {
  const target = resolve(output);
  const prefix = '/private/tmp/storyblok-phase3c-stories-';
  if (!target.startsWith(prefix)) {
    throw new Error('Refusing to replace a staging directory outside ' + prefix + '.');
  }
  return target;
}

async function copyCurrentComponents({source, target}) {
  const componentsTarget = join(target, 'components', String(SPACE_ID));
  await mkdir(componentsTarget, {recursive: true});
  for (const name of REQUIRED_COMPONENTS) {
    const raw = await readFile(join(source, name + '.json'), 'utf8');
    const component = JSON.parse(raw);
    if (component.name !== name) throw new Error('Unexpected component source for ' + name + '.');
    await writeFile(join(componentsTarget, name + '.json'), JSON.stringify(component, null, 2) + '\n', 'utf8');
  }
}

async function previousStoryMappings(target) {
  const manifestPath = join(target, 'stories', String(SPACE_ID), 'manifest.jsonl');
  let raw;
  try {
    raw = await readFile(manifestPath, 'utf8');
  } catch (error) {
    if (error?.code === 'ENOENT') return [];
    throw error;
  }
  const permittedKeys = new Set([
    STAGED_PARENT_ID,
    ...SAFE_SLUGS.map(storyIdFor),
    ...SAFE_SLUGS.map(storyUuidFor),
  ]);
  const byOldId = new Map();
  for (const line of raw.split(/\r?\n/).filter(Boolean)) {
    let entry;
    try {
      entry = JSON.parse(line);
    } catch {
      throw new Error('The existing Phase 3C story manifest is not valid JSONL.');
    }
    if (!permittedKeys.has(entry?.old_id) || entry?.new_id === undefined) continue;
    byOldId.set(entry.old_id, entry);
  }
  return [...byOldId.values()];
}

async function stage({output, componentsSource}) {
  const target = assertSafeTemporaryDirectory(output);
  const [localTours, pageSource, assetSource, sanityTours] = await Promise.all([
    loadLocalTours(projectRoot),
    readFile(join(projectRoot, 'src/content/tour-pages.json'), 'utf8'),
    readFile(join(projectRoot, 'storyblok/phase3c/asset-manifest.json'), 'utf8'),
    fetchSanityTours(),
  ]);
  const pages = JSON.parse(pageSource).tours;
  const assets = JSON.parse(assetSource).assets;
  const localBySlug = new Map(localTours.map(tour => [tour.slug, tour]));
  const stories = SAFE_SLUGS.map(slug => {
    const local = localBySlug.get(slug);
    const page = pages[slug];
    const sanity = sanityTours.get(slug);
    if (!local || !page || !sanity) throw new Error(slug + ': a required reconciliation source is missing.');
    return buildStory({local, page, sanity, assets});
  });

  // A previous attempt may have created draft placeholders before a later
  // schema-level write failed. Preserve only the known safe mappings so a
  // corrected retry updates those exact records instead of duplicating paths.
  const previousMappings = await previousStoryMappings(target);

  await rm(target, {recursive: true, force: true});
  const storiesTarget = join(target, 'stories', String(SPACE_ID));
  await mkdir(storiesTarget, {recursive: true});
  await copyCurrentComponents({source: resolve(componentsSource), target});
  for (const story of stories) {
    await writeFile(
      join(storiesTarget, story.slug + '_' + story.uuid + '.json'),
      JSON.stringify(story, null, 2) + '\n',
      'utf8',
    );
  }
  // The Storyblok CLI uses this explicit mapping to keep newly created child
  // stories beneath the already-existing Day & Short Experiences folder.
  const requiredParentMapping = {old_id: STAGED_PARENT_ID, new_id: PARENT_ID};
  const manifestEntries = [requiredParentMapping, ...previousMappings.filter(entry => entry.old_id !== STAGED_PARENT_ID)];
  await writeFile(
    join(storiesTarget, 'manifest.jsonl'),
    manifestEntries.map(entry => JSON.stringify(entry)).join('\n') + '\n',
    'utf8',
  );
  await writeFile(
    join(target, 'migration-summary.json'),
    JSON.stringify({
      spaceId: SPACE_ID,
      parentId: PARENT_ID,
      stories: stories.map(story => ({
        slug: story.slug,
        storyPath: story.full_slug,
        publicRoute: localBySlug.get(story.slug).detailUrl,
        outerStoryblokState: 'draft',
        galleryImageCount: story.content.gallery.length,
      })),
      excluded: ['accra-food', 'volta', 'volta-community', 'batik-workshop', 'just-go-ghana'],
    }, null, 2) + '\n',
    'utf8',
  );
  console.log('Staged ' + stories.length + ' reconciled Phase 3C draft Tour records in ' + target + '.');
}

const flags = options(process.argv.slice(2));
if (!flags.out || !flags['components-source']) usage();
await stage({output: flags.out, componentsSource: flags['components-source']});
