import assert from 'node:assert/strict';
import {loadHomepageContent} from '../scripts/homepage-source.mjs';

const keys = ['hero', 'founderStory', 'waysToExperience', 'howHosted', 'reviewsAndTrust', 'planningProcess', 'finalInvitation'];
const localContent = Object.fromEntries(keys.map(key => [key, {
  eyebrow: 'Local eyebrow', headline: 'Local headline', title: 'Local title', titleLines: ['Local title'], body: 'Local body', intro: 'Local intro', sub: 'Local sub', tagline: 'Local tagline', cta: {label: 'Local', href: 'index.html'},
}]));
localContent.waysToExperience.pathways = [{title: 'Local pathway', text: 'Local description', href: 'packages.html?category=nature', image: {src: 'local.jpg', alt: 'Local'}}];

let loaded = await loadHomepageContent({localContent, env: {}});
assert.equal(loaded.source, 'local');
assert.equal(loaded.content, localContent);

const sections = keys.map((sectionKey, index) => ({
  sectionKey,
  order: index + 1,
  eyebrow: `Eyebrow ${index + 1}`,
  headline: sectionKey === 'reviewsAndTrust' ? 'What Guests\nSay' : `Headline ${index + 1}`,
  body: `Body ${index + 1}`,
  ctas: [{label: 'Explore', destination: 'packages.html', external: false}],
}));
sections[2].pathways = [{title: 'Sanity pathway', description: 'From Sanity', filterKey: 'craft', order: 1, image: {src: 'https://cdn.sanity.io/pathway.jpg', alt: 'A maker', width: 1200, height: 800}}];
sections[1].founders = [{name: 'Ama Example', preferredName: 'Ama', role: 'Founder', quote: 'A verified quote.', photo: {src: 'https://cdn.sanity.io/ama.jpg', alt: 'Ama', width: 800, height: 800, publicApprovalState: 'approved'}}];
loaded = await loadHomepageContent({
  localContent,
  env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
  fetchImpl: async () => new Response(JSON.stringify({result: sections}), {status: 200, headers: {'Content-Type': 'application/json'}}),
});
assert.equal(loaded.source, 'sanity');
assert.equal(loaded.content.hero.headline, 'Headline 1');
assert.equal(loaded.content.hero.sub, 'Body 1');
assert.deepEqual(loaded.content.reviewsAndTrust.titleLines, ['What Guests', 'Say']);
assert.deepEqual(loaded.content.waysToExperience.pathways[0], {
  title: 'Sanity pathway', text: 'From Sanity', href: 'packages.html?category=craft',
  image: {src: 'https://cdn.sanity.io/pathway.jpg', alt: 'A maker', width: 1200, height: 800},
});
assert.deepEqual(loaded.content.founderStory.founders[0], {
  name: 'Ama Example', preferredName: 'Ama', role: 'Founder', quote: 'A verified quote.', initials: 'A',
  image: {src: 'https://cdn.sanity.io/ama.jpg', alt: 'Ama', width: 800, height: 800, publicApprovalState: 'approved'},
});
assert.equal(loaded.content.finalInvitation.cta.href, 'packages.html');

await assert.rejects(
  loadHomepageContent({
    localContent,
    env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
    fetchImpl: async () => new Response(JSON.stringify({result: sections.slice(0, 6)}), {status: 200}),
  }),
  /exactly 7 sections/,
);

console.log('Homepage source contract tests passed.');
