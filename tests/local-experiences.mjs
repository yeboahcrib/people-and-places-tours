import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadExperienceContent, loadLocalExperienceContent} from '../scripts/local-experience-source.mjs';
import {injectLocalExperiences} from '../scripts/render-local-experiences.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const local = await loadLocalExperienceContent(projectRoot);

assert(local.experiences.length >= 8, 'the add-on list lost entries');
assert.equal(local.minimumGroup, 4, 'the add-on minimum group size is no longer four');

// These are quoted per group when someone asks. A price here would be a
// promise the founders' document deliberately does not make.
await assert.rejects(
  async () => loadExperienceContent({
    localContent: local,
    env: {SANITY_STUDIO_PROJECT_ID: 'test'},
    fetchImpl: async () => ({ok: true, json: async () => ({result: [{name: 'Cooking Classes', price: 40}]})}),
  }),
  /must not carry a price/,
  'an add-on with a price should fail the build',
);

// The page and the content have to agree about where the list goes.
const page = await readFile(new URL('../packages.html', import.meta.url), 'utf8');
assert(page.includes('data-local-experiences'), 'the experiences page has no add-on list to fill');
const rendered = injectLocalExperiences(page, local);
for (const experience of local.experiences) {
  assert(rendered.includes(`<li>${experience.name.replace(/&/g, '&amp;')}</li>`), `${experience.name} did not render`);
}
assert(rendered.includes('groups of four or more'), 'the minimum group size did not render');

// The package's free day offers these already; it should point at them.
const packagePage = await readFile(new URL('../just-go-ghana.html', import.meta.url), 'utf8');
assert(
  packagePage.includes('packages.html#add-ons'),
  'the package free day no longer links to the add-ons it offers',
);

console.log(`Add-on experience checks passed (${local.experiences.length} experiences).`);
