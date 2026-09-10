/**
 * The structured data the build emits, and the rule it exists to keep.
 *
 * Everything a page tells a crawler has to be something the same page tells a
 * reader. So the units are checked first — what a price parses to, what an FAQ
 * extractor reads out of each of the two markup shapes the site uses — and then
 * every built page is read back and compared against its own markup.
 */
import assert from 'node:assert/strict';
import {readFile, readdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {organizationNode, organizationId} from '../scripts/render-meta.mjs';
import {
  countFaqItems, extractFaqs, faqPageNode, parsePrice, renderStructuredData, tourProductNode,
} from '../scripts/render-structured-data.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const parse = script => JSON.parse(/<script[^>]*>([\s\S]*?)<\/script>/.exec(script)[1]);

// ── Prices ──
//
// A price that cannot be read exactly is not guessed at.
assert.deepEqual(parsePrice('$90'), {currency: 'USD', amount: 90});
assert.deepEqual(parsePrice('$3,000'), {currency: 'USD', amount: 3000});
assert.deepEqual(parsePrice('$1,234.50'), {currency: 'USD', amount: 1234.5});
assert.equal(parsePrice('From $90'), null);
assert.equal(parsePrice('$90–120'), null);
assert.equal(parsePrice('£90'), null);
assert.equal(parsePrice('Free'), null);
assert.equal(parsePrice(''), null);
assert.equal(parsePrice(undefined), null);
// A tour whose price cannot be read ships without an offer, not with a wrong one.
assert.equal(tourProductNode({url: 'https://x.test/t', name: 'T', price: 'On request'}).offers, undefined);

// ── FAQ extraction ──

// The tour-page shape: a question row, then its answer.
{
  const html = '<div class="faq-item">\n'
    + '  <div class="faq-q">Is it safe? <span class="faq-q-icon"><svg viewBox="0 0 24 24"><polyline points="6 9"/></svg></span></div>\n'
    + '  <div class="faq-a">Yes &amp; the guide stays with you.</div>\n'
    + '</div>';
  assert.deepEqual(extractFaqs(html), [{question: 'Is it safe?', answer: 'Yes & the guide stays with you.'}]);
  assert.equal(countFaqItems(html), 1);
}

// The About and Contact shape: a button, then a nested answer.
{
  const html = '<li class="faq-item open">\n'
    + '  <button class="faq-question" aria-expanded="true">\n'
    + '    What payment methods?\n'
    + '    <div class="faq-q-icon"><svg></svg></div>\n'
    + '  </button>\n'
    + '  <div class="faq-answer">\n'
    + '    <div class="faq-answer-inner">Bank transfer &amp; Mobile Money.</div>\n'
    + '  </div>\n'
    + '</li>';
  assert.deepEqual(extractFaqs(html), [{question: 'What payment methods?', answer: 'Bank transfer & Mobile Money.'}]);
  assert.equal(countFaqItems(html), 1);
}

// A half-written entry is not a question a page answers.
assert.deepEqual(extractFaqs('<div class="faq-q">Only a question</div><div class="faq-a"></div>'), []);
assert.deepEqual(extractFaqs('<p>An ordinary page.</p>'), []);
assert.equal(faqPageNode({url: 'https://x.test/p', faqs: []}), null);

// Entities are decoded once, in the right order: "&amp;lt;" is the text
// "&lt;", not a tag.
assert.equal(
  extractFaqs('<div class="faq-q">Q?</div><div class="faq-a">&amp;lt;b&amp;gt;</div>')[0].answer,
  '&lt;b&gt;',
);

// ── One record per page ──

{
  const org = organizationNode({siteUrl: 'https://x.test', settings: {businessName: 'X'}, social: {}});
  // A single node is written flat; more than one becomes a @graph. Either way
  // there is exactly one script, so no two records can describe a page.
  assert.equal(parse(renderStructuredData([org]))['@type'], 'TravelAgency');
  const graph = parse(renderStructuredData([org, faqPageNode({
    url: 'https://x.test/p', faqs: [{question: 'Q?', answer: 'A.'}],
  })]))['@graph'];
  assert.equal(graph.length, 2);
  assert.equal(graph[1]['@type'], 'FAQPage');
  assert.equal(renderStructuredData([null, null]), '');
  assert.equal(renderStructuredData([]), '');
}

// The JSON must never be able to close its own script tag.
{
  const script = renderStructuredData([organizationNode({
    siteUrl: 'https://x.test',
    settings: {businessName: '</script><script>alert(1)</script>'},
    social: {},
  })]);
  assert(!script.slice(0, -9).includes('</script>'),
    'a raw closing tag reached the JSON — the record can break out of its script tag');
  assert.equal(parse(script).name, '</script><script>alert(1)</script>');
}

// ── The business ──

{
  const settings = {
    businessName: 'People & Places',
    email: 'peopandplaces@gmail.com',
    primaryPhone: '+233 50 367 3473',
  };
  const social = {
    instagramUrl: 'https://instagram.com/peopleand.places',
    tiktokUrl: 'https://tiktok.com/@peopandplaces',
  };
  const data = organizationNode({siteUrl: 'https://peopleplacesgh.com', settings, social});
  assert.equal(data['@type'], 'TravelAgency');
  assert.equal(data['@id'], organizationId('https://peopleplacesgh.com'));
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

  const bare = organizationNode({siteUrl: 'https://x.test', settings: {businessName: 'X'}, social: {}});
  assert.equal(bare.telephone, undefined);
  assert.equal(bare.email, undefined);
  assert.equal(bare.sameAs, undefined);
}

// ── The built site ──

const files = (await readdir(`${projectRoot}dist`)).filter(f => f.endsWith('.html'));
assert(files.length >= 20, 'dist looks unbuilt; run npm run build first');

const records = new Map();
for (const file of files) {
  const html = await readFile(`${projectRoot}dist/${file}`, 'utf8');
  const scripts = html.match(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g) || [];
  assert(scripts.length <= 1, `${file} carries ${scripts.length} structured-data records; one page, one record`);
  if (!scripts.length) { records.set(file, {html, nodes: []}); continue; }
  // Parses cleanly, or the build shipped markup no crawler can read.
  let data;
  assert.doesNotThrow(() => { data = parse(scripts[0]); }, `${file} has structured data that is not valid JSON`);
  assert.equal(data['@context'], 'https://schema.org', `${file} record has no schema.org context`);
  const nodes = data['@graph'] || [data];
  records.set(file, {html, nodes});
}

// No two nodes anywhere claim the same identity with different content.
{
  const byId = new Map();
  for (const [file, {nodes}] of records) {
    for (const node of nodes) {
      const id = node['@id'];
      if (!id) continue;
      const seen = byId.get(id);
      const shape = JSON.stringify(node);
      if (seen && seen.shape !== shape) {
        // The business is referenced from every tour page as a brand; that is a
        // reference, not a second copy, so it may be a subset but never differ.
        const [a, b] = [JSON.parse(seen.shape), node];
        for (const key of Object.keys(b)) {
          if (key in a) {
            assert.deepEqual(b[key], a[key],
              `${id} says ${key} is ${JSON.stringify(b[key])} in ${file} but ${JSON.stringify(a[key])} in ${seen.file}`);
          }
        }
      }
      if (!seen) byId.set(id, {file, shape});
    }
  }
}

// The business is described once, on the homepage.
{
  const carriers = [...records].filter(([, {nodes}]) => nodes.some(n => n['@type'] === 'TravelAgency'));
  assert.deepEqual(carriers.map(([file]) => file), ['index.html'],
    'the organization record should appear on the homepage and nowhere else');
}

// Every page that shows FAQs states them, exactly as shown, and no page states
// a question it does not show.
{
  for (const [file, {html, nodes}] of records) {
    const shown = extractFaqs(html);
    const faqNode = nodes.find(n => n['@type'] === 'FAQPage');
    assert.equal(countFaqItems(html), shown.length,
      `${file} renders ${countFaqItems(html)} FAQ items but ${shown.length} could be read back`);
    if (!shown.length) {
      assert.equal(faqNode, undefined, `${file} claims an FAQ record but renders no FAQs`);
      continue;
    }
    assert(faqNode, `${file} renders ${shown.length} FAQs and states none of them`);
    assert.equal(faqNode.mainEntity.length, shown.length, `${file} FAQ record and page disagree on count`);
    faqNode.mainEntity.forEach((entry, index) => {
      assert.equal(entry['@type'], 'Question');
      assert.equal(entry.name, shown[index].question, `${file} FAQ ${index + 1} question is not what the page shows`);
      assert.equal(entry.acceptedAnswer.text, shown[index].answer, `${file} FAQ ${index + 1} answer is not what the page shows`);
      // The text on the page, not markup smuggled into it.
      assert(!/<[a-z/]/i.test(entry.acceptedAnswer.text), `${file} FAQ ${index + 1} answer carries markup`);
    });
  }
}

// Every tour page describes its tour, at the price the page displays.
{
  const tourPages = [...records].filter(([, {nodes}]) => nodes.some(n => n['@type'] === 'Product'));
  assert(tourPages.length >= 13, `expected the thirteen tour pages to carry a Product, found ${tourPages.length}`);

  for (const [file, {html, nodes}] of tourPages) {
    const product = nodes.find(n => n['@type'] === 'Product');
    const canonical = /<link rel="canonical" href="([^"]*)"/.exec(html)?.[1];
    assert(canonical, `${file} has no canonical to anchor its record to`);
    assert.equal(product.url, canonical, `${file} Product url is not the page's canonical`);
    assert.equal(product['@id'], `${canonical}#tour`);

    // The name and description a visitor reads.
    const title = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1].replace(/<[^>]*>/g, '').trim();
    assert(title, `${file} has no h1`);
    const metaDesc = /<meta name="description" content="([^"]*)"/.exec(html)?.[1];
    assert.equal(product.description, metaDesc?.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"'),
      `${file} Product description is not the page's own description`);
    assert.equal(product.image, /property="og:image" content="([^"]*)"/.exec(html)?.[1],
      `${file} Product image is not the photograph the page shares`);
    assert.equal(product.brand['@id'], organizationId('https://peopleplacesgh.com'),
      `${file} Product is not branded to the business`);

    // The displayed price, read as the least anyone pays.
    const displayed = /<div class="big-price">([^<]*)<\/div>|<div class="price">([^<]*)<\/div>/.exec(html);
    const shownPrice = (displayed?.[1] ?? displayed?.[2])?.trim();
    assert(shownPrice, `${file} shows no price to check the offer against`);
    const expected = parsePrice(shownPrice);
    assert(expected, `${file} shows an unparseable price ${shownPrice}`);
    assert.equal(product.offers['@type'], 'AggregateOffer',
      `${file} states a fixed price; the page says "From" and adds a surcharge for small parties`);
    assert.equal(product.offers.lowPrice, expected.amount, `${file} offer disagrees with the price on the page`);
    assert.equal(product.offers.priceCurrency, 'USD');

    // Claims the site cannot stand behind.
    for (const risky of ['aggregateRating', 'review', 'sku', 'gtin']) {
      assert.equal(product[risky], undefined, `${file} Product asserts ${risky}, which nothing on the page supports`);
    }
    for (const risky of ['availability', 'priceValidUntil', 'price', 'highPrice']) {
      assert.equal(product.offers[risky], undefined,
        `${file} offer asserts ${risky}, which the page does not state`);
    }
  }
}

console.log(`Structured-data checks passed (${records.size} pages).`);
