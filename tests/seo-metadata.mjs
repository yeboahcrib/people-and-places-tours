/**
 * The SEO metadata the build emits.
 *
 * Two things are pinned here. A meta description has to be short enough that a
 * search result shows all of it — twelve tour pages shipped between 251 and 630
 * characters because the fallback was the page's whole intro paragraph. And the
 * homepage carries one structured-data record, built from the same siteSettings
 * the footer renders, so it cannot claim something a visitor cannot see.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {metaDescription} from '../scripts/render-tour-page.mjs';
import {renderOrganizationSchema} from '../scripts/render-meta.mjs';

// ── Trimming ──

// An authored description is never touched; only a fallback is trimmed. That
// distinction lives at the call site, so what is checked here is the trimmer.
assert.equal(metaDescription('Short enough already.'), 'Short enough already.');
assert.equal(metaDescription(''), '');
assert.equal(metaDescription(undefined), '');
assert.equal(metaDescription('  collapses   whitespace  '), 'collapses whitespace');

{
  const long = 'When the sun sets over Accra, a different city wakes up, lit by charcoal '
    + 'fires and sizzling woks. This tour walks you through it with someone who eats here '
    + 'every week, not a guide reading from a script, and you finish somewhere with music.';
  const out = metaDescription(long);
  assert(out.length <= 160, `trimmed description is still ${out.length} characters`);
  assert(long.startsWith(out.replace(/…$/, '').trim()),
    'the trimmed description is not a prefix of the original — wording was altered');
  assert(!/\s$/.test(out), 'trimmed description ends in whitespace');
}

// Ending on a sentence is preferred, but not at the cost of most of the text.
{
  const sentence = 'A short first sentence. ' + 'x'.repeat(300);
  // The full stop sits at 22 of 160 — too early, so a word boundary is used.
  assert(metaDescription(sentence).endsWith('…'),
    'a very early full stop should not truncate the description to a fragment');

  const late = 'A'.repeat(100) + ' and more words here. ' + 'B'.repeat(200);
  assert(metaDescription(late).endsWith('.'),
    'a full stop late enough to keep should end the description');
}

// Every real page description the build produces fits.
{
  const projectRoot = fileURLToPath(new URL('../', import.meta.url));
  const {readdir} = await import('node:fs/promises');
  const files = (await readdir(`${projectRoot}dist`)).filter(f => f.endsWith('.html'));
  assert(files.length >= 20, 'dist looks unbuilt; run npm run build first');
  const over = [];
  for (const file of files) {
    const html = await readFile(`${projectRoot}dist/${file}`, 'utf8');
    const match = html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i);
    assert(match, `${file} has no meta description`);
    const value = match[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    if (value.length > 160) over.push(`${file} (${value.length})`);
  }
  assert.deepEqual(over, [], `meta descriptions longer than a search result shows: ${over.join(', ')}`);
}

// ── Structured data ──

const settings = {
  businessName: 'People & Places',
  email: 'peopandplaces@gmail.com',
  primaryPhone: '+233 50 367 3473',
};
const social = {
  instagramUrl: 'https://instagram.com/peopleand.places',
  tiktokUrl: 'https://tiktok.com/@peopandplaces',
};
const parse = script => JSON.parse(/<script[^>]*>([\s\S]*?)<\/script>/.exec(script)[1]);

{
  const data = parse(renderOrganizationSchema({siteUrl: 'https://peopleplacesgh.com', settings, social}));
  assert.equal(data['@type'], 'TravelAgency');
  assert.equal(data.name, settings.businessName);
  assert.equal(data.telephone, settings.primaryPhone);
  assert.equal(data.email, settings.email);
  assert.deepEqual(data.sameAs, [social.instagramUrl, social.tiktokUrl]);
  assert.equal(data.url, 'https://peopleplacesgh.com/');

  // Nothing a crawler could check and find wrong. These are claims the site
  // does not make in prose either, and adding them is a business decision.
  for (const risky of ['aggregateRating', 'review', 'openingHours', 'openingHoursSpecification', 'priceRange', 'offers']) {
    assert.equal(data[risky], undefined, `the schema asserts ${risky}, which nothing on the page supports`);
  }
}

// Missing values are omitted rather than emitted empty.
{
  const data = parse(renderOrganizationSchema({siteUrl: 'https://x.test', settings: {businessName: 'X'}, social: {}}));
  assert.equal(data.telephone, undefined);
  assert.equal(data.email, undefined);
  assert.equal(data.sameAs, undefined);
  assert.equal(data.name, 'X');
}

// The JSON must never be able to close its own script tag.
{
  const script = renderOrganizationSchema({
    siteUrl: 'https://x.test',
    settings: {businessName: '</script><script>alert(1)</script>'},
    social: {},
  });
  assert(!script.slice(0, -9).includes('</script>'),
    'a raw closing tag reached the JSON — the schema can break out of its script tag');
  // \u003c is a valid JSON escape, so the escaped form parses as-is and the
  // name survives intact. No unescaping needed, and unescaping first would make
  // the extraction regex stop at the injected tag.
  assert.equal(parse(script).name, '</script><script>alert(1)</script>');
}

// One record, on the homepage only.
{
  const projectRoot = fileURLToPath(new URL('../', import.meta.url));
  const home = await readFile(`${projectRoot}dist/index.html`, 'utf8');
  assert.equal((home.match(/application\/ld\+json/g) || []).length, 1,
    'the homepage should carry exactly one structured-data record');
  const about = await readFile(`${projectRoot}dist/about.html`, 'utf8');
  assert.equal((about.match(/application\/ld\+json/g) || []).length, 0,
    'the organization record should not be repeated on every page');
}

console.log('SEO metadata tests passed.');
