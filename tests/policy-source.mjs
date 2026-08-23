import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {readFile} from 'node:fs/promises';
import {loadLocalPolicies, loadLocalPolicyContent, loadPolicyContent, POLICY_PAGES} from '../scripts/policy-source.mjs';
import {injectPolicyContent} from '../scripts/render-policy.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const local = await loadLocalPolicyContent(projectRoot);

assert(local.sections.length >= 5, 'the committed policy lost a section');

// Day tours were the gap: until August 2026 a day-tour customer had no stated
// terms at all. The 48-hour line is a founder decision from 25 July 2026,
// recorded in docs/sprint-1-policy-payment-register.md.
const daySection = local.sections.find(section => section.heading.includes('day tour'));
assert(daySection, 'the policy no longer covers day-tour cancellations');
assert(
  daySection.items.some(item => item.term.includes('48 hours')),
  'the day-tour section lost its 48-hour cut-off',
);
assert(/^\d{4}-\d{2}-\d{2}$/.test(local.lastUpdated), 'the committed policy has no usable date');

// The refund ladder is the part a traveller argues with, so it is asserted
// term by term rather than by counting.
const cancelSection = local.sections.find(section => section.heading.includes('package trip'));
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
const settings = JSON.parse(await readFile(new URL('../src/content/site.json', import.meta.url), 'utf8')).siteSettings;
const all = await loadLocalPolicies(projectRoot);

for (const {key, file} of POLICY_PAGES) {
  const policy = all[key];
  const page = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  const once = injectPolicyContent(page, policy, settings, file);
  const twice = injectPolicyContent(once, policy, settings, file);
  assert.equal(twice, once, `${file} changes when rendered twice, so the build corrupts the committed page`);

  const body = once.slice(once.indexOf('<main'), once.indexOf('</main>'));
  for (const tag of ['section', 'div', 'dl']) {
    assert.equal(
      (body.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length,
      (body.match(new RegExp(`</${tag}>`, 'g')) || []).length,
      `${file} has unbalanced <${tag}> tags`,
    );
  }
}

// The privacy policy claims no analytics and no tracking. That claim has to
// stay true, so the test reads the site's own code rather than trusting it.
const privacyText = JSON.stringify(all.privacyPolicy).toLowerCase();
assert(privacyText.includes('no analytics'), 'the privacy policy no longer states that there is no analytics');
const siteJs = await readFile(new URL('../script.js', import.meta.url), 'utf8');
for (const tracker of ['gtag(', 'googletagmanager', 'google-analytics', 'document.cookie']) {
  assert(!siteJs.includes(tracker), `the privacy policy promises no tracking but script.js uses ${tracker}`);
}

// The deposit was the site's oldest source of contradiction - a flat $400 in
// one place and 30% of the trip price in another. One figure now secures
// every trip, and a percentage reappearing anywhere means that drift has
// started again.
const bookingTermsText = JSON.stringify(all.bookingTerms);
assert(bookingTermsText.includes('$400 per person'), 'the booking terms lost the securing payment');
assert(
  !/\d+%/.test(bookingTermsText),
  'a percentage deposit is back in the booking terms - the whole point is that one figure covers every trip',
);
// Free planning is the difference between this and every competitor checked,
// so it is asserted rather than left to survive an edit by luck.
assert(
  /planning is free/i.test(bookingTermsText),
  'the booking terms no longer say that planning a custom trip costs nothing',
);

// Insurance is a requirement, not a suggestion, and the page has to say so.
const insurance = all.travelInsurance;
const insuranceText = JSON.stringify(insurance).toLowerCase();
assert(insuranceText.includes('required'), 'the insurance page no longer states that cover is required');
assert(insuranceText.includes('30 days'), 'the insurance page no longer states the proof deadline');

console.log('Policy content contract tests passed.');
