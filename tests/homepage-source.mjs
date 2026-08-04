import assert from 'node:assert/strict';
import {loadHomepageContent} from '../scripts/homepage-source.mjs';

const keys = ['hero', 'founderStory', 'waysToExperience', 'availableTours', 'howHosted', 'reviewsAndTrust', 'planningProcess', 'finalInvitation'];
const localContent = Object.fromEntries(keys.map(key => [key, {
  eyebrow: 'Local eyebrow', headline: 'Local headline', title: 'Local title', titleLines: ['Local title'], body: 'Local body', intro: 'Local intro', sub: 'Local sub', tagline: 'Local tagline', cta: {label: 'Local', href: 'index.html'},
}]));

let loaded = await loadHomepageContent({localContent, env: {}});
assert.equal(loaded.source, 'local');
assert.equal(loaded.content, localContent);

const sections = keys.map((sectionKey, index) => ({
  sectionKey,
  order: index + 1,
  eyebrow: `Eyebrow ${index + 1}`,
  headline: index === 5 ? 'What Guests\nSay' : `Headline ${index + 1}`,
  body: `Body ${index + 1}`,
  ctas: [{label: 'Explore', destination: 'packages.html', external: false}],
}));
loaded = await loadHomepageContent({
  localContent,
  env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
  fetchImpl: async () => new Response(JSON.stringify({result: sections}), {status: 200, headers: {'Content-Type': 'application/json'}}),
});
assert.equal(loaded.source, 'sanity');
assert.equal(loaded.content.hero.headline, 'Headline 1');
assert.equal(loaded.content.hero.sub, 'Body 1');
assert.deepEqual(loaded.content.reviewsAndTrust.titleLines, ['What Guests', 'Say']);
assert.equal(loaded.content.finalInvitation.cta.href, 'packages.html');

await assert.rejects(
  loadHomepageContent({
    localContent,
    env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
    fetchImpl: async () => new Response(JSON.stringify({result: sections.slice(0, 7)}), {status: 200}),
  }),
  /exactly 8 sections/,
);

console.log('Homepage source contract tests passed.');
