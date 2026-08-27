import assert from 'node:assert/strict';
import {loadHomepageContent} from '../scripts/homepage-source.mjs';

const clone = value => structuredClone(value);

const keys = ['hero', 'founderStory', 'waysToExperience', 'tripMoments', 'reviewsAndTrust', 'planningProcess', 'finalInvitation'];
const localContent = Object.fromEntries(keys.map(key => [key, {
  eyebrow: 'Local eyebrow', headline: 'Local headline', title: 'Local title', titleLines: ['Local title'], body: 'Local body', intro: 'Local intro', sub: 'Local sub', tagline: 'Local tagline', cta: {label: 'Local', href: 'index.html'},
}]));
localContent.waysToExperience.pathways = [{title: 'Local pathway', text: 'Local description', href: 'packages.html?category=nature', image: {src: 'local.jpg', alt: 'Local'}}];
localContent.reviewsAndTrust.items = [{quote: 'Local quote', author: 'Local author', rating: 5}];
localContent.planningProcess.steps = [{icon: 'search', number: '01', title: 'Local step', text: 'Local step text'}];
localContent.tripMoments.moments = [{shape: 'wide', caption: 'Local moment'}];
localContent.hero.video = {src: 'local.mp4'};

let loaded = await loadHomepageContent({localContent, env: {}});
assert.equal(loaded.source, 'local');
assert.equal(loaded.content, localContent);

// Addressed by key, not by index: these fixtures used sections[3], sections[4]
// and so on, so retiring one section silently re-pointed every assertion after
// it at the wrong document.
const at = (list, key) => list[keys.indexOf(key)];

const sections = keys.map((sectionKey, index) => ({
  sectionKey,
  order: index + 1,
  eyebrow: `Eyebrow ${index + 1}`,
  headline: sectionKey === 'reviewsAndTrust' ? 'What Guests\nSay' : `Headline ${index + 1}`,
  body: `Body ${index + 1}`,
  ctas: [{label: 'Explore', destination: 'packages.html', external: false}],
}));
at(sections, 'hero').media = [
  {video: 'https://cdn.example.com/ghana.mp4', alt: 'Ghana in motion', placeholderState: 'approved', publicApprovalState: 'approved'},
  {src: 'https://cdn.sanity.io/hero-poster.jpg', alt: 'A welcome in Ghana', width: 1600, height: 900, placeholderState: 'approved', publicApprovalState: 'approved'},
];
at(sections, 'waysToExperience').pathways = [{title: 'Sanity pathway', description: 'From Sanity', filterKey: 'craft', order: 1, image: {src: 'https://cdn.sanity.io/pathway.jpg', alt: 'A maker', width: 1200, height: 800, placeholderState: 'approved', publicApprovalState: 'approved'}}];
at(sections, 'founderStory').founders = [{name: 'Ama Example', preferredName: 'Ama', role: 'Founder', quote: 'A verified quote.', photo: {src: 'https://cdn.sanity.io/ama.jpg', alt: 'Ama', width: 800, height: 800, placeholderState: 'approved', publicApprovalState: 'approved'}}];
at(sections, 'reviewsAndTrust').featuredReviews = [{reviewerName: 'Ama', selectedExcerpt: 'A real excerpt.', rating: 5, country: 'USA'}];
at(sections, 'planningProcess').planningSteps = [{stepNumber: 1, title: 'Sanity step', description: 'From Sanity'}];
at(sections, 'reviewsAndTrust').media = [{src: 'https://cdn.sanity.io/reviews.jpg', alt: 'Guests laughing together', width: 1600, height: 1000, placeholderState: 'approved', publicApprovalState: 'approved'}];
loaded = await loadHomepageContent({
  localContent,
  env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
  fetchImpl: async () => new Response(JSON.stringify({result: {sections: sections, flexible: []}}), {status: 200, headers: {'Content-Type': 'application/json'}}),
});
assert.equal(loaded.source, 'sanity');
assert.equal(loaded.content.hero.headline, 'Headline 1');
assert.equal(loaded.content.hero.sub, 'Body 1');
assert.equal(loaded.content.hero.video.src, 'https://cdn.example.com/ghana.mp4');
// The bare asset URL used to ship, so the browser downloaded the original and
// the focal point was never applied — a homepage carrying five-megapixel
// masters came to 10.4MB of images. Every photograph now asks the CDN for the
// size its slot actually occupies.
const poster = loaded.content.hero.video.poster.src;
assert.ok(poster.startsWith('https://cdn.sanity.io/hero-poster.jpg?'), 'the poster keeps its asset');
assert.match(poster, /[?&]w=\d+/, 'and asks for a width rather than the original');
const banner = loaded.content.reviewsAndTrust.heroImage.src;
assert.ok(banner.startsWith('https://cdn.sanity.io/reviews.jpg?'), 'the banner keeps its asset');
assert.match(banner, /[?&]w=\d+/, 'and asks for a width rather than the original');
assert.deepEqual(loaded.content.reviewsAndTrust.titleLines, ['What Guests', 'Say']);
// Sanity owns the list once it has one: one pathway in the Studio means one
// pathway on the page, and the committed pathway it does not mention is gone.
assert.equal(loaded.content.waysToExperience.pathways.length, 1);
{
  // The src now carries the size its slot needs, so it is asserted separately
  // from the fields that must survive unchanged.
  const pathway = loaded.content.waysToExperience.pathways[0];
  const {src: pathwaySrc, ...pathwayRest} = pathway.image;
  assert.deepEqual({...pathway, image: pathwayRest}, {
    title: 'Sanity pathway', text: 'From Sanity', href: 'packages.html?category=craft',
    image: {alt: 'A maker', width: 1200, height: 800, placeholderState: 'approved', publicApprovalState: 'approved'},
  });
  assert.ok(pathwaySrc.startsWith('https://cdn.sanity.io/pathway.jpg?'));
  assert.match(pathwaySrc, /[?&]w=\d+/);

  const founder = loaded.content.founderStory.founders[0];
  const {src: founderSrc, ...founderRest} = founder.image;
  assert.deepEqual({...founder, image: founderRest}, {
    name: 'Ama Example', preferredName: 'Ama', role: 'Founder', quote: 'A verified quote.', initials: 'A',
    image: {alt: 'Ama', width: 800, height: 800, placeholderState: 'approved', publicApprovalState: 'approved'},
  });
  assert.ok(founderSrc.startsWith('https://cdn.sanity.io/ama.jpg?'));
}
assert.equal(loaded.content.finalInvitation.cta.href, 'packages.html');
assert.equal(loaded.content.planningProcess.steps.length, 1);
assert.equal(loaded.content.planningProcess.steps[0].title, 'Sanity step');
assert.equal(loaded.content.reviewsAndTrust.items.length, 1);
assert.equal(loaded.content.reviewsAndTrust.items[0].quote, 'A real excerpt.');

// Removing entries in the Studio removes them from the page — this is a CMS,
// and an editor who deletes something means it.
const deletions = clone(sections);
at(deletions, 'waysToExperience').pathways = [];
at(deletions, 'reviewsAndTrust').featuredReviews = [];
at(deletions, 'planningProcess').planningSteps = [];
const emptied = await loadHomepageContent({
  localContent,
  env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
  fetchImpl: async () => new Response(JSON.stringify({result: {sections: deletions, flexible: []}}), {status: 200}),
});
assert.deepEqual(emptied.content.waysToExperience.pathways, [], 'an emptied list must empty the page');
assert.deepEqual(emptied.content.reviewsAndTrust.items, []);
assert.deepEqual(emptied.content.planningProcess.steps, []);

// A list Sanity has never been given is absent from the response, not empty,
// and keeps its committed content. This is the difference between "not set up
// yet" and "deliberately cleared".
const untouched = clone(sections).map(section => {
  const copy = {...section};
  delete copy.pathways;
  delete copy.featuredReviews; delete copy.planningSteps;
  return copy;
});
const inherited = await loadHomepageContent({
  localContent,
  env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
  fetchImpl: async () => new Response(JSON.stringify({result: {sections: untouched, flexible: []}}), {status: 200}),
});
assert.deepEqual(inherited.content.waysToExperience.pathways, localContent.waysToExperience.pathways);
assert.deepEqual(inherited.content.reviewsAndTrust.items, localContent.reviewsAndTrust.items);
assert.deepEqual(inherited.content.planningProcess.steps, localContent.planningProcess.steps);

// The editor's order is the page's order.
const reordered = clone(sections);
reordered[2].pathways = [
  {title: 'Second', filterKey: 'b', order: 2, image: {src: 'b.jpg', alt: 'b', placeholderState: 'approved', publicApprovalState: 'approved'}},
  {title: 'First', filterKey: 'a', order: 1, image: {src: 'a.jpg', alt: 'a', placeholderState: 'approved', publicApprovalState: 'approved'}},
];
const sorted = await loadHomepageContent({
  localContent,
  env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
  fetchImpl: async () => new Response(JSON.stringify({result: {sections: reordered, flexible: []}}), {status: 200}),
});
assert.deepEqual(sorted.content.waysToExperience.pathways.map(p => p.title), ['First', 'Second']);

// Sections are independent. One missing from Sanity keeps its committed
// content instead of failing the build and freezing every other page.
for (const missing of keys) {
  const partial = clone(sections).filter(section => section.sectionKey !== missing);
  const result = await loadHomepageContent({
    localContent,
    env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
    fetchImpl: async () => new Response(JSON.stringify({result: {sections: partial, flexible: []}}), {status: 200}),
  });
  assert.equal(result.source, 'sanity', `${missing}: a missing section must not fail the build`);
  assert.equal(result.content[missing].eyebrow, 'Local eyebrow',
    `${missing}: must keep its committed copy`);
  // Every other section still picks up its Sanity edit.
  for (const other of keys.filter(key => key !== missing)) {
    assert.equal(result.content[other].eyebrow, `Eyebrow ${keys.indexOf(other) + 1}`,
      `${missing} missing: ${other} must still be edited`);
  }
}

// An empty dataset is the same case seven times over: the committed homepage.
const empty = await loadHomepageContent({
  localContent,
  env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
  fetchImpl: async () => new Response(JSON.stringify({result: {sections: [], flexible: []}}), {status: 200}),
});
const {sectionOrder: emptyOrder, ...emptyContent} = empty.content;
assert.deepEqual(emptyContent, localContent);
// With no added sections, the plan is simply the seven built-ins in order.
assert.deepEqual(emptyOrder, keys.map(key => ({key})));

// A duplicated section is the one ambiguous case: first wins, nothing breaks.
const duplicated = await loadHomepageContent({
  localContent,
  env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
  fetchImpl: async () => new Response(JSON.stringify({
    result: {sections: [...clone(sections), {sectionKey: 'hero', eyebrow: 'Second hero'}], flexible: []},
  }), {status: 200}),
});
assert.equal(duplicated.content.hero.eyebrow, 'Eyebrow 1');

// An existing pathway whose new photo is not approved yet keeps the photograph
// it already had. Editing the words must never cost the picture — this is what
// makes it safe to work on the site before the photography exists.
for (const [label, image] of [
  ['awaiting approval', {src: 'https://cdn.sanity.io/p.jpg', alt: 'p', placeholderState: 'approved', publicApprovalState: 'draft'}],
  ['a stand-in photo', {src: 'https://cdn.sanity.io/p.jpg', alt: 'p', placeholderState: 'placeholder', publicApprovalState: 'approved'}],
  ['no photo at all', undefined],
]) {
  const unusable = clone(sections);
  unusable[2].pathways = [{title: 'Reworded pathway', description: 'From Sanity', filterKey: 'nature', order: 1, image}];
  const result = await loadHomepageContent({
    localContent,
    env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
    fetchImpl: async () => new Response(JSON.stringify({result: {sections: unusable, flexible: []}}), {status: 200}),
  });
  assert.equal(result.content.waysToExperience.pathways.length, 1, `${label}: the pathway must stay on the page`);
  assert.equal(result.content.waysToExperience.pathways[0].title, 'Reworded pathway', `${label}: the new wording must apply`);
  assert.deepEqual(result.content.waysToExperience.pathways[0].image, localContent.waysToExperience.pathways[0].image,
    `${label}: the committed photograph must be kept`);
}

// Editing part of an entry leaves the rest of it alone. This is the whole
// point: change the words now, change the photograph when it exists.
const partialEdit = clone(sections);
at(partialEdit, 'waysToExperience').pathways = [{title: 'Renamed pathway', filterKey: 'nature', order: 1}];
at(partialEdit, 'planningProcess').planningSteps = [{stepNumber: 1, description: 'Rewritten step text'}];
const edited = await loadHomepageContent({
  localContent,
  env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
  fetchImpl: async () => new Response(JSON.stringify({result: {sections: partialEdit, flexible: []}}), {status: 200}),
});
const editedPathway = edited.content.waysToExperience.pathways[0];
assert.equal(edited.content.waysToExperience.pathways.length, 1, 'a renamed pathway must not become a second one');
assert.equal(editedPathway.title, 'Renamed pathway');
assert.deepEqual(editedPathway.image, localContent.waysToExperience.pathways[0].image,
  'a pathway edited without a new photo must keep the committed photo');
assert.equal(editedPathway.text, 'Local description', 'text left blank must survive');
assert.equal(edited.content.planningProcess.steps[0].text, 'Rewritten step text');
assert.equal(edited.content.planningProcess.steps[0].title, 'Local step',
  'a step edited without a title must keep the committed one');
assert.equal(edited.content.planningProcess.steps[0].icon, 'search', 'the icon is not editable and must survive');

// Swapping only the photograph keeps the committed words.
const newPhoto = {src: 'https://cdn.sanity.io/new.jpg', alt: 'New', width: 900, height: 900, placeholderState: 'approved', publicApprovalState: 'approved'};
const photoOnly = clone(sections);
photoOnly[2].pathways = [{filterKey: 'nature', image: newPhoto}];
const swapped = await loadHomepageContent({
  localContent,
  env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
  fetchImpl: async () => new Response(JSON.stringify({result: {sections: photoOnly, flexible: []}}), {status: 200}),
});
{
  const {src, ...rest} = swapped.content.waysToExperience.pathways[0].image;
  const {src: _ignored, ...expected} = newPhoto;
  assert.deepEqual(rest, expected);
  assert.ok(src.startsWith(newPhoto.src + '?'), 'the swapped photo keeps its asset, resized');
}
assert.equal(swapped.content.waysToExperience.pathways[0].title, 'Local pathway',
  'swapping a photo must not disturb the copy');

// An entry that still cannot be rendered is left off the page — but only that
// entry. A half-finished addition must never take down the ones beside it.
for (const {label, index, field, broken, good, section, key, titleOf} of [
  {label: 'review with no excerpt', index: keys.indexOf('reviewsAndTrust'), field: 'featuredReviews',
    broken: {reviewerName: 'Half Written', rating: 5},
    good: {reviewerName: 'Complete Person', selectedExcerpt: 'Ready.', rating: 5},
    section: 'reviewsAndTrust', key: 'items', titleOf: item => item.author},
  {label: 'planning step with no description', index: keys.indexOf('planningProcess'), field: 'planningSteps',
    broken: {stepNumber: 9, title: 'Half-written'},
    good: {stepNumber: 1, title: 'Complete step', description: 'Ready'},
    section: 'planningProcess', key: 'steps', titleOf: item => item.title},
  {label: 'pathway with an unapproved photo', index: 2, field: 'pathways',
    broken: {title: 'Half-written', filterKey: 'zz', image: {src: 'x.jpg', placeholderState: 'approved', publicApprovalState: 'draft'}},
    good: {title: 'Complete pathway', filterKey: 'craft', image: {src: 'y.jpg', alt: 'y', placeholderState: 'approved', publicApprovalState: 'approved'}},
    section: 'waysToExperience', key: 'pathways', titleOf: item => item.title},
]) {
  const mixed = clone(sections);
  mixed[index][field] = [broken, good];
  const result = await loadHomepageContent({
    localContent,
    env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
    fetchImpl: async () => new Response(JSON.stringify({result: {sections: mixed, flexible: []}}), {status: 200}),
  });
  const rendered = result.content[section][key].map(titleOf);
  assert.equal(rendered.length, 1, `${label}: the incomplete entry must be left off`);
  assert.ok(/^Complete/.test(rendered[0]), `${label}: the complete entry beside it must survive`);
}

// The committed content must never be mutated by a Sanity build.
assert.equal(localContent.waysToExperience.pathways[0].title, 'Local pathway');
assert.equal(localContent.reviewsAndTrust.items[0].quote, 'Local quote');
assert.equal(localContent.planningProcess.steps[0].title, 'Local step');

console.log('Homepage source contract tests passed.');
