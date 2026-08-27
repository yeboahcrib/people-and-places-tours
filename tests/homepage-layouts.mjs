/**
 * Sections an editor can add without a developer.
 *
 * Two things are checked here. First, that the build turns Sanity's
 * "extra homepage section" documents into a render plan correctly — placement,
 * ordering, and the rules that keep an unfinished section off the page.
 * Second, that the three places a layout has to be declared stay in step: the
 * renderers in homepage-sections.js, the exported list in homepage-source.mjs,
 * and the dropdown in the Studio schema. Those live in different files and in
 * different languages, so nothing but a test keeps them honest.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {dirname, join} from 'node:path';
import vm from 'node:vm';
import {loadHomepageContent, FLEX_LAYOUTS} from '../scripts/homepage-source.mjs';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const keys = ['hero', 'founderStory', 'waysToExperience', 'reviewsAndTrust', 'planningProcess', 'finalInvitation'];

const localContent = Object.fromEntries(keys.map(key => [key, {
  eyebrow: 'E', headline: 'H', title: 'T', titleLines: ['T'], body: 'B', intro: 'I', sub: 'S',
}]));
localContent.finalInvitation.phone = '+233 000';
localContent.finalInvitation.internationalPhone = '+1 000';
localContent.finalInvitation.cta = {label: 'Go', href: 'contact.html'};
// The list-backed sections omit themselves when empty, so give each one entry.
localContent.waysToExperience.pathways = [{title: 'P', text: 'P', href: 'packages.html?category=nature', image: {src: 'p.jpg', alt: 'P'}}];
localContent.reviewsAndTrust.items = [{quote: 'R', author: 'A', location: 'L', rating: 5}];
localContent.planningProcess.steps = [{icon: 'search', number: '01', title: 'S', text: 'S'}];

const builtInSections = keys.map((sectionKey, index) => ({sectionKey, order: index + 1}));

const load = async flexible => {
  const {content} = await loadHomepageContent({
    localContent,
    env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
    fetchImpl: async () => new Response(JSON.stringify({
      result: {sections: builtInSections, flexible},
    }), {status: 200}),
  });
  return content;
};

const approvedPhoto = {src: 'https://cdn.sanity.io/x.jpg', alt: 'x', width: 900, height: 600, publicApprovalState: 'approved', placeholderState: 'approved'};
const base = {visible: true, tone: 'light', placement: 'after:waysToExperience', positionWithinPlacement: 1};

// ── Placement ──────────────────────────────────────────────────────────────

let content = await load([{...base, title: 'Mid', layout: 'quote', quote: 'A line worth reading.'}]);
let plan = content.sectionOrder.map(entry => entry.layout ? `flex:${entry.title}` : entry.key);
assert.deepEqual(plan, [
  'hero', 'founderStory', 'waysToExperience', 'flex:Mid',
  'reviewsAndTrust', 'planningProcess', 'finalInvitation',
], 'a section placed after waysToExperience must sit between it and reviewsAndTrust');

content = await load([{...base, title: 'Top', layout: 'quote', quote: 'Q', placement: 'top'}]);
assert.equal(content.sectionOrder[0].title, 'Top', 'top placement must precede the hero');

content = await load([{...base, title: 'Last', layout: 'quote', quote: 'Q', placement: 'after:finalInvitation'}]);
assert.equal(content.sectionOrder.at(-1).title, 'Last', 'bottom placement must follow everything');

// Two in the same slot are ordered by their number, then by name — never by
// whatever order Sanity happened to return them in.
content = await load([
  {...base, title: 'Second', layout: 'quote', quote: 'Q', positionWithinPlacement: 2},
  {...base, title: 'First', layout: 'quote', quote: 'Q', positionWithinPlacement: 1},
]);
assert.deepEqual(
  content.sectionOrder.filter(entry => entry.layout).map(entry => entry.title),
  ['First', 'Second'],
);

// ── What keeps a section off the page ──────────────────────────────────────

const offThePage = async (label, entry) => {
  const result = await load([entry]);
  assert.equal(result.sectionOrder.filter(e => e.layout).length, 0, label);
  assert.equal(result.sectionOrder.length, keys.length, `${label}: the built-in sections must be unaffected`);
};

await offThePage('a section switched off must not appear', {...base, visible: false, layout: 'quote', quote: 'Q', title: 'Draft'});
await offThePage('an unknown layout must not appear', {...base, layout: 'carousel', title: 'Odd'});
await offThePage('an unknown placement must not appear', {...base, layout: 'quote', quote: 'Q', placement: 'after:nowhere', title: 'Lost'});
await offThePage('a quote layout with no quote must not appear', {...base, layout: 'quote', title: 'Empty'});
await offThePage('a cards layout with no cards must not appear', {...base, layout: 'cards', cards: [], title: 'Empty'});
await offThePage('an invitation with no heading must not appear', {...base, layout: 'invitation', title: 'Empty'});
await offThePage('a photo layout with neither heading nor photo must not appear', {...base, layout: 'photoBeside', title: 'Empty'});

// A photo that is not approved yet is dropped, but a heading alone is still a
// section worth showing.
content = await load([{...base, title: 'Words only', layout: 'photoBeside', headline: 'A heading',
  image: {src: 'x.jpg', publicApprovalState: 'draft', placeholderState: 'approved'}}]);
const photoSection = content.sectionOrder.find(entry => entry.layout);
assert.ok(photoSection, 'a heading with an unapproved photo is still a section');
assert.equal(photoSection.image, undefined, 'the unapproved photo must be dropped');

// A broken button costs the button, not the section, and never the build.
content = await load([{...base, title: 'Bad button', layout: 'invitation', headline: 'H',
  ctas: [{label: 'Click', destination: 'javascript:alert(1)'}, {label: 'Fine', destination: 'contact.html'}]}]);
const buttons = content.sectionOrder.find(entry => entry.layout).ctas;
assert.deepEqual(buttons.map(cta => cta.href), ['contact.html'], 'only the valid button survives');

// Cards missing a heading are dropped individually.
content = await load([{...base, title: 'Cards', layout: 'cards',
  cards: [{text: 'no heading'}, {title: 'Kept', text: 'yes'}]}]);
const cards = content.sectionOrder.find(entry => entry.layout).cards;
assert.deepEqual(cards.map(card => card.title), ['Kept']);

// ── The rendered markup ────────────────────────────────────────────────────

const sectionsScript = await readFile(join(projectRoot, 'homepage-sections.js'), 'utf8');
const sandbox = {window: {}, document: {readyState: 'complete', getElementById: () => null, querySelector: () => null, addEventListener() {}}};
sandbox.window.PEOPLE_PLACES_HOME = null;
vm.createContext(sandbox);
vm.runInContext(sectionsScript, sandbox);
const render = sandbox.window.PEOPLE_PLACES_RENDER_HOMEPAGE;
const renderableLayouts = sandbox.window.PEOPLE_PLACES_HOMEPAGE_LAYOUTS;

// The three declarations of "which layouts exist" must agree.
const schema = await readFile(join(projectRoot, 'studio/schemaTypes/documents/flexibleSection.ts'), 'utf8');
const schemaLayouts = [...schema.matchAll(/value: '(photoBeside|cards|quote|invitation)'/g)].map(match => match[1]);
assert.deepEqual([...renderableLayouts].sort(), [...FLEX_LAYOUTS].sort(),
  'homepage-sections.js and homepage-source.mjs disagree about which layouts exist');
assert.deepEqual([...new Set(schemaLayouts)].sort(), [...FLEX_LAYOUTS].sort(),
  'the Studio offers a different set of layouts than the site can render');

// Every layout must produce markup carrying the site's own section classes,
// which is what makes an added section inherit the theme.
for (const layout of FLEX_LAYOUTS) {
  const sample = {
    layout, title: 'Sample', tone: 'light',
    eyebrow: 'Eyebrow', headline: 'A heading', body: 'A paragraph.',
    quote: 'A quotation.', attribution: 'Someone',
    image: approvedPhoto, imageSide: 'right',
    cards: [{title: 'Card', text: 'Text', image: approvedPhoto}],
    ctas: [{label: 'Go', href: 'contact.html'}],
  };
  const html = render({...localContent, sectionOrder: [{layout, ...sample}]});
  assert.match(html, /class="[^"]*\bcontainer\b/, `${layout}: must use the shared container`);
  assert.match(html, /\bsection-pad\b/, `${layout}: must use the shared section padding`);
  assert.match(html, new RegExp(`data-flex-layout="[a-z-]+"`), `${layout}: must be identifiable in the DOM`);
  assert.match(html, /<section /, `${layout}: must render a section element`);
  assert.ok(!/undefined|\[object Object\]/.test(html), `${layout}: must not leak undefined into the markup`);
}

// An entry naming a layout the site no longer has renders nothing rather than
// throwing — removing a layout must not take the homepage down.
const withGhost = render({...localContent, sectionOrder: [{key: 'hero'}, {layout: 'removedLayout', title: 'Ghost'}]});
assert.doesNotMatch(withGhost, /Ghost/);
assert.match(withGhost, /data-home-section="hero"/);

// With no plan at all, the homepage is the seven built-ins, exactly as before.
const defaultHtml = render(localContent);
for (const key of keys) {
  assert.match(defaultHtml, new RegExp(`data-home-section="${key}"`), `${key} must render without a plan`);
}
assert.doesNotMatch(defaultHtml, /data-home-section="flexible"/);

// Escaping holds on editor-supplied text.
const hostile = render({...localContent, sectionOrder: [{
  layout: 'quote', title: 'X', tone: 'light', quote: '<script>alert(1)</script>', attribution: '"><b>',
}]});
assert.doesNotMatch(hostile, /<script>alert/, 'editor text must be escaped');

console.log(`Editor-added homepage section tests passed (${FLEX_LAYOUTS.length} layouts).`);
