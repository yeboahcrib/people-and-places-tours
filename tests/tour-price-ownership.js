/*
 * The tour page owns its price. The browser catalogue must not overwrite it.
 *
 * hydrateTourDetailFromCatalog() used to rewrite the booking-card price, the
 * "per person" line and the "From:" trip-meta item from window.PEOPLE_PLACES_TOURS
 * after load. Those values are CMS-owned and rendered by the build, so the
 * committed catalogue had the final say over a published price. They agreed
 * only because tours.js was maintained by hand — the first divergence would
 * have shown a stale price on top of the real one.
 *
 * This test forces exactly that divergence: it poisons the catalogue with an
 * obviously wrong price after tours.js and the Storyblok overlay have run, but
 * before script.js initializes. The page must ignore it.
 *
 * It also pins the one responsibility that legitimately remains — pointing the
 * booking CTA at the booking flow anchor — so removing the price ownership
 * cannot quietly take booking with it.
 */
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {serveDist} = require('./serve-dist.js');

const STALE_PRICE = '$999 STALE-CATALOGUE-PRICE';
const STALE_DURATION = '99 stale days';

const TOUR_PAGES = [
  'cape-coast-tour.html',
  'accra-city-tour.html',
  'kumasi-tour.html',
  'ada-tour.html',
  'accra-food-tour.html',
  'just-go-ghana.html',
];

const readPage = page => page.evaluate(() => ({
  price: document.querySelector('.booking-card .big-price, .booking-card .price')?.textContent.trim() ?? null,
  sub: document.querySelector('.booking-card .price-sub')?.textContent.trim() ?? null,
  meta: [...document.querySelectorAll('.trip-meta-item')]
    .find(i => i.textContent.includes('From:'))?.textContent.trim() ?? null,
  cta: document.querySelector('.booking-card .booking-btns a.btn-outline-white')?.getAttribute('href') ?? null,
}));

(async () => {
  const hosted = await serveDist();
  const base = process.env.BASE_URL || hosted.origin;
  const browser = await chromium.launch();
  let checked = 0;

  for (const path of TOUR_PAGES) {
    // What the build rendered, with no JavaScript at all.
    const bare = await browser.newPage();
    await bare.route(u => u.pathname.endsWith('/script.js'), r => r.abort());
    const res = await bare.goto(`${base}/${path}`, {waitUntil: 'load'});
    assert(res && res.ok(), `${path} should be built and served`);
    const server = await readPage(bare);
    await bare.close();

    assert(server.price, `${path} must render a price server-side`);

    // The same page, but the catalogue is poisoned after tours.js and the
    // Storyblok overlay have run and immediately before script.js initializes.
    const page = await browser.newPage();
    await page.route(u => u.pathname.endsWith('/script.js'), async route => {
      const original = await route.fetch();
      const body = await original.text();
      route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body:
          `;(function(){var t=window.PEOPLE_PLACES_TOURS;if(Array.isArray(t)){t.forEach(function(x){` +
          `x.price=${JSON.stringify(STALE_PRICE)};x.duration=${JSON.stringify(STALE_DURATION)};});}})();\n` +
          body,
      });
    });
    await page.goto(`${base}/${path}`, {waitUntil: 'load'});
    await page.waitForTimeout(700);

    // The poison must actually have been applied, or this test proves nothing.
    const poisoned = await page.evaluate(p =>
      Array.isArray(window.PEOPLE_PLACES_TOURS) &&
      window.PEOPLE_PLACES_TOURS.every(t => t.price === p), STALE_PRICE);
    assert(poisoned, `${path}: the catalogue was not poisoned, so the test is not meaningful`);

    const client = await readPage(page);

    assert.equal(client.price, server.price,
      `${path}: the server-rendered price was replaced from the browser catalogue`);
    assert(!client.price.includes('STALE'), `${path}: a stale catalogue price reached the page`);
    assert.equal(client.sub, server.sub, `${path}: the price sub-line was rewritten`);
    assert(!(client.sub || '').includes('stale days'), `${path}: a stale duration reached the page`);
    assert.equal(client.meta, server.meta, `${path}: the "From:" trip-meta price was rewritten`);
    assert(!(client.meta || '').includes('STALE'), `${path}: a stale price reached the trip meta`);

    // Booking must still work: the CTA keeps its slug and gains the flow anchor.
    assert(client.cta, `${path}: the booking CTA must have a link`);
    assert(client.cta.startsWith(server.cta),
      `${path}: the booking CTA target changed (${server.cta} -> ${client.cta})`);
    assert(client.cta.endsWith('#booking-flow'),
      `${path}: the booking CTA must point at the booking flow anchor`);

    await page.close();
    checked += 1;
  }

  await browser.close();
  hosted.server.close();
  console.log(`Tour price ownership tests passed (${checked} tour pages; price stays server/CMS authoritative, booking CTA intact).`);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
