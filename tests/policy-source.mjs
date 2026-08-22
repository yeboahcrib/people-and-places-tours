import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {loadLocalPolicyContent, loadPolicyContent} from '../scripts/policy-source.mjs';

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

console.log('Policy content contract tests passed.');
