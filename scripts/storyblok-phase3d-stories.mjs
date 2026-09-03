import {createHash} from 'node:crypto';
import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {fetchSanity} from './sanity-fetch.mjs';
import {loadLocalTours} from './local-render-source.mjs';

const SPACE_ID = 294832753590557;
const PARENT_ID = 213732107080273;
const STAGED_PARENT_ID = -31003;
const STORY_DIRECTORY = 'tours/day-short-experiences';
const SANITY_PROJECT_ID = '30a0uykw';
const SANITY_DATASET = 'production';
const SANITY_API_VERSION = '2026-08-02';
const REQUIRED_COMPONENTS = ['tour', 'list_item', 'faq_item', 'gallery_item', 'price_option', 'seo'];
const RECONCILED_SLUGS = ['accra-food', 'volta', 'volta-community', 'batik-workshop'];
const ASSET_BLOCKED_SLUGS = new Set(['accra-food', 'volta-community']);

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');

function usage() {
  throw new Error(
    'Usage: node scripts/storyblok-phase3d-stories.mjs --out <private staging directory> --components-source <current component directory>',
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

const text = value => typeof value === 'string' ? value.trim() : '';
const equal = (left, right) => JSON.stringify(left) === JSON.stringify(right);

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

function assertExact(slug, label, left, right) {
  if (!equal(left, right)) throw new Error(slug + ': material ' + label + ' conflict between current sources.');
}

function assertText(value, label) {
  const result = text(value);
  if (!result) throw new Error(label + ' is missing.');
  return result;
}

function assertList(values, {minimum = 1, maximum = 12, label}) {
  if (!Array.isArray(values) || values.length < minimum || values.length > maximum) {
    throw new Error(label + ' must contain ' + minimum + '–' + maximum + ' entries.');
  }
  if (values.some(value => !text(value))) throw new Error(label + ' contains an empty value.');
  return values.map(text);
}

function listBlocks(slug, field, values, range) {
  return assertList(values, {...range, label: slug + ': ' + field}).map((value, index) => ({
    _uid: uid(slug + ':' + field + ':' + index),
    component: 'list_item',
    text: value,
  }));
}

function faqBlocks(slug, values) {
  if (!Array.isArray(values) || values.length < 1 || values.length > 10) {
    throw new Error(slug + ': FAQs must contain 1–10 entries.');
  }
  return values.map((value, index) => {
    const question = assertText(value?.question, slug + ': FAQ ' + (index + 1) + ' question');
    const answer = assertText(value?.answer, slug + ': FAQ ' + (index + 1) + ' answer');
    return {_uid: uid(slug + ':faq:' + index), component: 'faq_item', question, answer};
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

function changedVoltaFaqs(values, source) {
  if (!Array.isArray(values)) throw new Error('volta: ' + source + ' FAQ source is missing.');
  const matches = values.filter(item => text(item?.question) === 'What is the rope suspension bridge?');
  if (matches.length !== 1) {
    throw new Error('volta: expected exactly one owner-approved FAQ removal in ' + source + '.');
  }
  const remaining = values.filter(item => text(item?.question) !== 'What is the rope suspension bridge?');
  if (remaining.length !== values.length - 1) throw new Error('volta: FAQ removal was not isolated.');
  return remaining;
}

function priceOptionBlocks(slug) {
  if (slug !== 'accra-food') return [];
  return [{
    _uid: uid('accra-food:price-option:two-guests'),
    component: 'price_option',
    label: 'For 2 guests (per person)',
    price: '110',
  }];
}

function seoBlock(slug, title, cardImage) {
  return [{
    _uid: uid(slug + ':seo'),
    component: 'seo',
    title: title + ' | People & Places Tours',
    indexing: 'index',
    ...(cardImage ? {social_image: cardImage} : {}),
  }];
}

function storyIdFor(slug) {
  const index = RECONCILED_SLUGS.indexOf(slug);
  if (index < 0) throw new Error('Unapproved Phase 3D story slug: ' + slug);
  return -41000001 - index;
}

function verifySources({local, page, sanity}) {
  const slug = local.slug;
  const group = parseGroupSize(local.groupSize, slug);
  assertExact(slug, 'title', local.title, sanity.title);
  assertExact(slug, 'detail title', local.title, page.title);
  assertExact(slug, 'price', parsePrice(local.price, slug), Number(sanity.price));
  assertExact(slug, 'price per', local.priceUnit, sanity.priceUnit || 'Per Person');
  assertExact(slug, 'duration', local.duration, sanity.duration);
  assertExact(slug, 'destination', local.destination, sanity.destination);
  assertExact(slug, 'categories', local.categories, sanity.categories);
  assertExact(slug, 'vibes', local.vibes, sanity.vibes);
  assertExact(slug, 'search summary', local.commandSummary, sanity.commandSummary);
  assertExact(slug, 'places visited', local.location.split(', ').map(text), (sanity.locations || []).map(text));
  // The established renderer already gives the active Sanity `description`
  // precedence for both the page overview and the catalogue card. The local
  // snapshot may hold a different placement sentence, but it is not shown
  // when the current CMS source is available. Preserve the existing explicit
  // source-of-truth rule rather than choosing between those fallback copies.
  assertText(sanity.description, slug + ': current Sanity description');
  assertExact(slug, 'included', page.included, sanity.included);
  assertExact(slug, 'excluded', page.excluded, sanity.excluded);
  assertExact(slug, 'good to know', page.funFacts, sanity.funFacts);
  assertExact(slug, 'hero watermark', page.heroWatermark, sanity.heroWatermark);
  assertExact(slug, 'page headline', page.pageHeadline, sanity.pageHeadline);
  assertExact(slug, 'page intro', page.pageIntro, sanity.pageIntro);
  if (positiveInteger(sanity.groupSizeMin, slug + ': Sanity minimum guests') !== group.minimum
    || positiveInteger(sanity.groupSizeMax, slug + ': Sanity maximum guests') !== group.maximum) {
    throw new Error(slug + ': material group-size conflict between current sources.');
  }
  if (text(sanity.currency || 'USD') !== 'USD') throw new Error(slug + ': only USD is approved for this phase.');
  return group;
}

function verifiedFaqs({slug, page, sanity}) {
  if (slug === 'volta') {
    const pageFaqs = changedVoltaFaqs(page.faqs, 'tour-pages.json');
    const sanityFaqs = changedVoltaFaqs(sanity.faqs, 'Sanity');
    assertExact(slug, 'remaining FAQ order', pageFaqs, sanityFaqs);
    return sanityFaqs;
  }
  assertExact(slug, 'FAQs', page.faqs, sanity.faqs);
  return sanity.faqs;
}

function buildStory({local, page, sanity, assets, existingStory}) {
  const slug = local.slug;
  const group = verifySources({local, page, sanity});
  const faqs = verifiedFaqs({slug, page, sanity});
  const assetBlocked = ASSET_BLOCKED_SLUGS.has(slug);
  const assetKey = slug === 'volta' ? 'volta-card' : slug === 'batik-workshop' ? 'batik-workshop-card' : undefined;
  const cardImage = assetKey ? assetReference(assetKey, assets) : undefined;

  if (assetBlocked && cardImage) throw new Error(slug + ': asset-blocked Tour must not receive an image.');
  if (!assetBlocked && !cardImage) throw new Error(slug + ': approved card image is missing.');
  if (slug === 'accra-food') {
    const existingOptions = sanity.priceOptions || page.priceOptions || [];
    if (Array.isArray(existingOptions) && existingOptions.length) {
      throw new Error('accra-food: current source has a price option that needs manual reconciliation.');
    }
  }

  const content = {
    _uid: uid('phase3d-content:' + slug),
    component: 'tour',
    slug,
    // Asset-blocked records intentionally stay off in the editor-facing
    // visibility switch. The outer Storyblok record is also a draft.
    published: !assetBlocked,
    experience_type: 'day',
    name: sanity.title,
    display_order: String(local.packageOrder),
    ...(cardImage ? {card_image: cardImage} : {}),
    card_badge: local.badge || '',
    card_description: sanity.description,
    categories: sanity.categories,
    vibes: sanity.vibes,
    destination: sanity.destination,
    search_summary: sanity.commandSummary || '',
    price: String(positiveNumber(sanity.price, slug + ': price')),
    currency: 'USD',
    price_unit: sanity.priceUnit || 'Per Person',
    price_options: priceOptionBlocks(slug),
    duration: sanity.duration,
    locations: listBlocks(slug, 'locations', sanity.locations, {minimum: 1, maximum: 6}),
    starting_point: assertText(sanity.startingPoint, slug + ': starting point'),
    minimum_guests: String(group.minimum),
    maximum_guests: String(group.maximum),
    group_size_note: sanity.groupSizeNote || '',
    ...(cardImage ? {hero_image: cardImage} : {}),
    hero_watermark: page.heroWatermark,
    page_headline: page.pageHeadline,
    overview: sanity.description,
    good_to_know: listBlocks(slug, 'good-to-know', sanity.funFacts, {minimum: 1, maximum: 6}),
    included: listBlocks(slug, 'included', sanity.included, {minimum: 1, maximum: 15}),
    excluded: listBlocks(slug, 'excluded', sanity.excluded, {minimum: 1, maximum: 15}),
    gallery: [],
    faqs: faqBlocks(slug, faqs),
    seo: seoBlock(slug, sanity.title, cardImage),
  };

  return {
    id: existingStory?.id || storyIdFor(slug),
    name: sanity.title,
    slug,
    full_slug: STORY_DIRECTORY + '/' + slug,
    parent_id: STAGED_PARENT_ID,
    is_folder: false,
    is_startpage: false,
    // No Story is published as part of Phase 3D.
    published: false,
    uuid: existingStory?.uuid || uid('phase3d-story:' + slug),
    content,
  };
}

async function fetchSanityTours() {
  const query = '*[_type == "tour" && active == true && slug.current in ['
    + RECONCILED_SLUGS.map(slug => JSON.stringify(slug)).join(', ')
    + ']]{'
    + '"slug": slug.current, title, price, currency, priceUnit, duration, locations, startingPoint, '
    + 'groupSizeMin, groupSizeMax, groupSizeNote, destination, categories, vibes, description, commandSummary, '
    + 'included, excluded, funFacts, heroWatermark, pageHeadline, pageIntro, '
    + 'priceOptions[]{label, price}, faqs[]{question, answer}'
    + '}';
  const url = 'https://' + SANITY_PROJECT_ID + '.apicdn.sanity.io/v' + SANITY_API_VERSION
    + '/data/query/' + SANITY_DATASET + '?query=' + encodeURIComponent(query);
  const body = await fetchSanity(url, {label: 'Phase 3D Sanity reconciliation'});
  if (!Array.isArray(body?.result)) throw new Error('Sanity reconciliation returned no Tour collection.');
  const bySlug = new Map(body.result.map(tour => [tour?.slug, tour]));
  if (bySlug.size !== RECONCILED_SLUGS.length || RECONCILED_SLUGS.some(slug => !bySlug.has(slug))) {
    throw new Error('Sanity reconciliation did not return all four owner-approved Tours.');
  }
  return bySlug;
}

function safeOutputDirectory(output) {
  const target = resolve(output);
  const prefix = '/private/tmp/storyblok-phase3d-stories-';
  if (!target.startsWith(prefix)) {
    throw new Error('Refusing to replace a staging directory outside ' + prefix + '.');
  }
  return target;
}

async function copyCurrentComponents({source, target}) {
  const componentsTarget = join(target, 'components', String(SPACE_ID));
  await mkdir(componentsTarget, {recursive: true});
  for (const name of REQUIRED_COMPONENTS) {
    const component = JSON.parse(await readFile(join(source, name + '.json'), 'utf8'));
    if (component.name !== name) throw new Error('Unexpected component source for ' + name + '.');
    await writeFile(join(componentsTarget, name + '.json'), JSON.stringify(component, null, 2) + '\n', 'utf8');
  }
}

async function loadExistingStoryMappings() {
  const source = join(projectRoot, 'storyblok/phase3d/story-manifest.json');
  let manifest;
  try {
    manifest = JSON.parse(await readFile(source, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return new Map();
    throw error;
  }
  if (manifest?.spaceId !== SPACE_ID || manifest?.parentId !== PARENT_ID
    || manifest?.storyDirectory !== STORY_DIRECTORY || !manifest.stories) {
    throw new Error('Phase 3D story manifest does not describe this Storyblok space and directory.');
  }
  const mappings = new Map();
  for (const slug of RECONCILED_SLUGS) {
    const entry = manifest.stories[slug];
    if (!entry) continue;
    if (!Number.isSafeInteger(entry.id) || !/^[0-9a-f-]{36}$/i.test(text(entry.uuid))) {
      throw new Error('Phase 3D story manifest has an invalid mapping for ' + slug + '.');
    }
    mappings.set(slug, entry);
  }
  return mappings;
}

async function stage({output, componentsSource}) {
  const target = safeOutputDirectory(output);
  const [localTours, pageSource, assetSource, sanityTours, existingStories] = await Promise.all([
    loadLocalTours(projectRoot),
    readFile(join(projectRoot, 'src/content/tour-pages.json'), 'utf8'),
    readFile(join(projectRoot, 'storyblok/phase3c/asset-manifest.json'), 'utf8'),
    fetchSanityTours(),
    loadExistingStoryMappings(),
  ]);
  const pages = JSON.parse(pageSource).tours;
  const assets = JSON.parse(assetSource).assets;
  const localBySlug = new Map(localTours.map(tour => [tour.slug, tour]));
  const stories = RECONCILED_SLUGS.map(slug => {
    const local = localBySlug.get(slug);
    const page = pages[slug];
    const sanity = sanityTours.get(slug);
    if (!local || !page || !sanity) throw new Error(slug + ': a required reconciliation source is missing.');
    return buildStory({local, page, sanity, assets, existingStory: existingStories.get(slug)});
  });

  await rm(target, {recursive: true, force: true});
  const storiesTarget = join(target, 'stories', String(SPACE_ID));
  await mkdir(storiesTarget, {recursive: true});
  await copyCurrentComponents({source: resolve(componentsSource), target});
  for (const story of stories) {
    await writeFile(join(storiesTarget, story.slug + '_' + story.uuid + '.json'), JSON.stringify(story, null, 2) + '\n', 'utf8');
  }
  await writeFile(join(storiesTarget, 'manifest.jsonl'), JSON.stringify({old_id: STAGED_PARENT_ID, new_id: PARENT_ID}) + '\n', 'utf8');
  await writeFile(join(target, 'migration-summary.json'), JSON.stringify({
    phase: '3D',
    spaceId: SPACE_ID,
    parentId: PARENT_ID,
    stories: stories.map(story => ({
      slug: story.slug,
      storyPath: story.full_slug,
      publicRoute: localBySlug.get(story.slug).detailUrl,
      outerStoryblokState: 'draft',
      contentReady: true,
      assetReady: !ASSET_BLOCKED_SLUGS.has(story.slug),
      productionReady: false,
      expectedBuildSource: ASSET_BLOCKED_SLUGS.has(story.slug) ? 'invalid-content fallback' : 'applied',
    })),
    exclusions: ['just-go-ghana'],
  }, null, 2) + '\n', 'utf8');
  console.log('Staged ' + stories.length + ' reconciled Phase 3D draft Tour records in ' + target + '.');
}

const flags = options(process.argv.slice(2));
if (!flags.out || !flags['components-source']) usage();
await stage({output: flags.out, componentsSource: flags['components-source']});
