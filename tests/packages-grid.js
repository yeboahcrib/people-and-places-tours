/*
 * The build renders the packages grid; the browser must not rebuild it.
 *
 * script.js used to replace every card after load from the public catalogue in
 * tours.js. Measured on the live site, ten CMS card photographs were served in
 * the HTML and discarded about a second later, and titles, prices and badges
 * were exposed to the same override — they agreed only because tours.js was
 * kept in step by hand. This test pins the fix: what the build renders is what
 * the visitor keeps, and filtering operates on those cards rather than
 * replacing them.
 */
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {serveDist} = require('./serve-dist.js');

const CARD = '#tours-grid .tour-card';

const snapshot = page => page.evaluate(sel => {
  const cards = [...document.querySelectorAll(sel)];
  return cards.map(card => ({
    slug: card.dataset.tourSlug,
    destination: card.dataset.destination,
    categories: card.dataset.categories,
    title: card.querySelector('.tour-card-title')?.textContent.trim(),
    price: card.querySelector('.tour-card-price')?.textContent.trim(),
    badge: card.querySelector('.tour-card-badge')?.textContent.trim() || null,
    image: card.querySelector('img')?.getAttribute('src'),
    href: card.querySelector('a')?.getAttribute('href'),
  }));
}, CARD);

const visibleSlugs = page => page.evaluate(sel =>
  [...document.querySelectorAll(sel)].filter(c => !c.hidden).map(c => c.dataset.tourSlug), CARD);

(async () => {
  const hosted = await serveDist();
  const base = process.env.BASE_URL || hosted.origin;
  const browser = await chromium.launch();

  const load = async ({withScript}) => {
    const page = await browser.newPage({viewport: {width: 1280, height: 900}, reducedMotion: 'reduce'});
    if (!withScript) await page.route(u => u.pathname.endsWith('/script.js'), r => r.abort());
    await page.goto(base + '/packages.html', {waitUntil: 'load'});
    await page.waitForTimeout(900);
    return page;
  };

  const built = await load({withScript: false});
  const server = await snapshot(built);
  await built.close();

  const page = await load({withScript: true});
  const client = await snapshot(page);

  // 1. Every card the build rendered is still there, in the same order.
  assert.equal(client.length, server.length, 'JavaScript must not add or drop cards');
  assert(server.length >= 13, `expected the full catalogue, saw ${server.length}`);
  assert.deepEqual(client.map(c => c.slug), server.map(c => c.slug),
    'card order must survive initialization');

  // 2-6. Nothing the CMS authored may be rewritten in the browser.
  for (const [i, before] of server.entries()) {
    const after = client[i];
    assert.equal(after.image, before.image, `card image for ${before.slug} was rewritten`);
    assert.equal(after.title, before.title, `title for ${before.slug} was rewritten`);
    assert.equal(after.price, before.price, `price for ${before.slug} was rewritten`);
    assert.equal(after.badge, before.badge, `badge for ${before.slug} was rewritten`);
    assert.equal(after.href, before.href, `link for ${before.slug} was rewritten`);
  }

  // 7. The CMS photographs specifically — the symptom that exposed this.
  const isCms = src => /cdn\.sanity\.io|a2?\.storyblok\.com/.test(src || '');
  const cmsBefore = server.filter(c => isCms(c.image)).length;
  const cmsAfter = client.filter(c => isCms(c.image)).length;
  // A build without CMS credentials legitimately renders every card from the
  // committed fallback, so the count is reported rather than required; the
  // parity above is the invariant that holds in both environments.
  assert.equal(cmsAfter, cmsBefore,
    `${cmsBefore - cmsAfter} CMS photographs were replaced after load`);

  // 8. A grid holding both CMS and committed records keeps both kinds.
  const fallbackBefore = server.filter(c => !isCms(c.image)).length;
  assert.equal(client.filter(c => !isCms(c.image)).length, fallbackBefore,
    'records still on their committed fallback must also survive');

  // 9. Category filtering operates on the existing cards.
  const all = await visibleSlugs(page);
  assert.equal(all.length, server.length, 'every card starts visible');
  await page.click('.filter-tab[data-filter="craft"]');
  await page.waitForTimeout(300);
  const craft = await visibleSlugs(page);
  assert(craft.length > 0 && craft.length < all.length, 'a category filter must narrow the grid');
  assert.equal((await snapshot(page)).length, server.length,
    'filtering must hide cards, not rebuild the grid');

  // 10. Destination filtering composes with it, down to the empty state.
  await page.selectOption('.destination-filter select', 'kumasi');
  await page.waitForTimeout(300);
  assert.equal((await visibleSlugs(page)).length, 0, 'craft in Kumasi should match nothing');
  assert.equal(await page.evaluate(() => !document.querySelector('[data-experience-empty]').hidden),
    true, 'an empty result must show the empty state');

  // 11. Reset restores every card, and a deep link still filters on load.
  await page.click('[data-experience-reset]');
  await page.waitForTimeout(400);
  assert.deepEqual(await visibleSlugs(page), all, 'reset must restore the full grid');
  await page.goto(base + '/packages.html?category=nature', {waitUntil: 'load'});
  await page.waitForTimeout(900);
  const deepLinked = await visibleSlugs(page);
  assert(deepLinked.length > 0 && deepLinked.length < server.length,
    'a category deep link must apply on load');

  await browser.close();
  hosted.server.close();
  console.log(`Packages grid tests passed (${server.length} cards, ${cmsBefore} CMS photographs preserved, `
    + `${fallbackBefore} on committed fallback).`);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
