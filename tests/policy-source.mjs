import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {loadLocalPolicyContent, loadPolicyContent} from '../scripts/policy-source.mjs';
import {injectPolicyContent} from '../scripts/render-policy.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const local = await loadLocalPolicyContent(projectRoot);

assert(local.sections.length >= 4, 'the committed policy lost a section');
assert(/^\d{4}-\d{2}-\d{2}$/.test(local.lastUpdated), 'the committed policy has no usable date');

// The refund ladder is the part a traveller argues with, so it is asserted
// term by term rather than by counting.
const cancelSection = local.sections[0];
const terms = cancelSection.items.map(item => item.term.toLowerCase());
for (const expected of ['60 or more days', '31 to 59 days', '30 days or less', 'no-shows']) {
  assert(terms.some(term => term.includes(expected)), `the cancellation ladder is missing "${expected}"`);
}
assert(
  cancelSection.intro.includes('$400'),
  'the policy no longer states the deposit amount, which is the term travellers ask about most',
);

// A policy that renders without its own rules is worse than no page at all.
const emptySection = {...local, sections: [{heading: 'Empty', items: []}]};
await assert.rejects(
  async () => loadPolicyContent({
    localContent: local,
    env: {SANITY_STUDIO_PROJECT_ID: 'test'},
    fetchImpl: async () => ({ok: true, json: async () => ({result: emptySection})}),
  }),
  /has no terms in it/,
  'a section with no terms should fail the build',
);

// Sanity holding nothing must leave the committed policy in place rather than
// publishing a blank legal page.
const {content, source} = await loadPolicyContent({
  localContent: local,
  env: {SANITY_STUDIO_PROJECT_ID: 'test'},
  fetchImpl: async () => ({ok: true, json: async () => ({result: null})}),
});
assert.equal(source, 'local');
assert.equal(content.title, local.title);

// The build injects into the committed page, which already holds rendered
// sections. Injecting twice must produce the same page: when it did not, the
// second pass truncated the page's own <section> and the live page turned into
// a white band with white text on it.
const page = await readFile(new URL('../cancellation-refund-policy.html', import.meta.url), 'utf8');
const settings = JSON.parse(await readFile(new URL('../src/content/site.json', import.meta.url), 'utf8')).siteSettings;
const once = injectPolicyContent(page, local, settings);
const twice = injectPolicyContent(once, local, settings);
assert.equal(twice, once, 'rendering the policy page twice changes it, so the build corrupts the committed page');

const body = once.slice(once.indexOf('<main'), once.indexOf('</main>'));
for (const tag of ['section', 'div', 'dl']) {
  assert.equal(
    (body.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length,
    (body.match(new RegExp(`</${tag}>`, 'g')) || []).length,
    `the rendered policy page has unbalanced <${tag}> tags`,
  );
}

console.log('Policy content contract tests passed.');
