// The dashboard page, drawn from stubbed figures.
//
// The endpoint is stubbed rather than reached: the Function's own suite proves
// what it returns, and this proves what the page does with it — including the
// two states nobody remembers to look at, the refusal and the empty database.
//
// Needs `npm run build` first.

const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {serveDist} = require('./serve-dist.js');

const FIGURES = {
  generatedAt: '2026-09-11T21:00:00.000Z',
  summary: {total: 13, thisMonth: 6, topCountry: 'United States', topTour: 'Just Go Ghana'},
  countries: [
    {key: 'US', label: 'United States', count: 6},
    {key: 'GH', label: 'Ghana', count: 5},
    {key: 'raw:Wakanda', label: 'Wakanda', count: 1},
    {key: '', label: 'Not provided', count: 1},
  ],
  tours: [
    {key: 'just-go-ghana', label: 'Just Go Ghana', count: 7},
    {key: 'cape-coast', label: 'Cape Coast Ancestral Tour', count: 5},
  ],
  groupSizes: [{key: '3-5', label: '3-5', count: 6}, {key: '1-2', label: '1-2', count: 4}],
  months: [
    {month: '2026-07', count: 2},
    {month: '2026-08', count: 5},
    {month: '2026-09', count: 6},
  ],
  recent: [{
    createdAt: '2026-09-11T20:42:40.770Z', reference: 'PP-3ED8JU', name: 'Albert Mensah',
    country: 'Ghana', tour: 'Accra After Dark Food Tour', groupSize: '3-5',
    travelDate: '2027-02-01', contactMethod: 'whatsapp', status: 'new',
  }],
};

const EMPTY = {
  generatedAt: '2026-09-11T21:00:00.000Z',
  summary: {total: 0, thisMonth: 0, topCountry: null, topTour: null},
  countries: [], tours: [], groupSizes: [], months: [], recent: [],
};

async function open(browser, base, reply) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const failures = [];
  page.on('pageerror', error => failures.push(String(error)));
  await page.route('**/api/dashboard', route => route.fulfill(reply));
  await page.goto(`${base}/dashboard`);
  await page.waitForSelector('[data-dash-root] .dash-card, [data-dash-root] .dash-message h2', {timeout: 10000});
  return {context, page, failures};
}

const ok = body => ({status: 200, contentType: 'application/json', body: JSON.stringify(body)});

(async () => {
  const hosted = await serveDist();
  const browser = await chromium.launch();
  const base = hosted.origin;

  try {
    /* Figures drawn. */
    {
      const {context, page, failures} = await open(browser, base, ok(FIGURES));
      const cards = await page.$$eval('.dash-card', nodes => nodes.map(node => [
        node.querySelector('dt').textContent.trim(), node.querySelector('dd').textContent.trim(),
      ]));
      assert.deepEqual(cards, [
        ['Total enquiries', '13'], ['This month', '6'],
        ['Top country', 'United States'], ['Most requested', 'Just Go Ghana'],
      ]);

      const countryRows = await page.$$eval('.dash-panel:has(h2:text-is("Enquiries by country")) .bar-row',
        nodes => nodes.map(node => [
          node.querySelector('.bar-label').textContent,
          node.querySelector('.bar-count').textContent,
          node.querySelector('.bar-fill').style.width,
          node.classList.contains('is-unresolved'),
        ]));
      assert.equal(countryRows.length, 4);
      assert.deepEqual(countryRows[0], ['United States', '6', '100%', false],
        'the largest bar fills the track');
      assert.deepEqual(countryRows[1].slice(0, 3), ['Ghana', '5', '83%'],
        'bars are scaled against the largest, not the total');
      assert.equal(countryRows[2][3], true, 'an unmatched country is marked as one');

      // The months chart is a sequence and must stay in order.
      const months = await page.$$eval('.month-label', nodes => nodes.map(node => node.textContent));
      assert.deepEqual(months, ['Jul 26', 'Aug 26', 'Sep 26']);

      const headings = await page.$$eval('.dash-table th', nodes => nodes.map(node => node.textContent));
      assert.deepEqual(headings, ['Date', 'Reference', 'Name', 'Country', 'Tour interest',
        'Group size', 'Travel date', 'Contact', 'Status']);
      assert(!headings.some(text => /email|phone/i.test(text)),
        'the operational table must not offer a column for personal contact detail');

      const cells = await page.$$eval('.dash-table tbody td', nodes => nodes.map(node => node.textContent.trim()));
      assert.deepEqual(cells, ['2026-09-11', 'PP-3ED8JU', 'Albert Mensah', 'Ghana',
        'Accra After Dark Food Tour', '3-5', '2027-02-01', 'whatsapp', 'new']);

      const note = await page.textContent('.dash-note');
      assert.match(note, /1 country value could not be matched/);

      assert.deepEqual(failures, [], 'the page must draw without throwing');
      await context.close();
    }

    /* A database with nothing in it yet. Every panel says so rather than
       rendering an empty chart that looks broken. */
    {
      const {context, page, failures} = await open(browser, base, ok(EMPTY));
      const totals = await page.$eval('.dash-card dd', node => node.textContent.trim());
      assert.equal(totals, '0');
      const empties = await page.$$eval('.is-empty', nodes => nodes.map(node => node.textContent));
      assert.equal(empties.length, 5, 'each panel says it is empty');
      assert.deepEqual(failures, []);
      await context.close();
    }

    /* Refused. The page must say so plainly and draw no figures at all. */
    {
      const {context, page} = await open(browser, base, {
        status: 401, contentType: 'application/json',
        body: JSON.stringify({error: 'This dashboard is private.'}),
      });
      assert.match(await page.textContent('.dash-message h2'), /private/i);
      assert.equal(await page.$$eval('.dash-card', nodes => nodes.length), 0,
        'a refused reader must be shown nothing');
      await context.close();
    }

    /* The database answered with an error. */
    {
      const {context, page} = await open(browser, base, {
        status: 500, contentType: 'application/json', body: JSON.stringify({error: 'Figures could not be read.'}),
      });
      assert.match(await page.textContent('.dash-message h2'), /could not be read/i);
      await context.close();
    }

    /* Readable at the three widths that matter, with no sideways scroll. */
    for (const width of [375, 768, 1440]) {
      const context = await browser.newContext({viewport: {width, height: 900}});
      const page = await context.newPage();
      await page.route('**/api/dashboard', route => route.fulfill(ok(FIGURES)));
      await page.goto(`${base}/dashboard`);
      await page.waitForSelector('.dash-card');
      const overflow = await page.evaluate(() =>
        document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.equal(overflow, 0, `the page must not scroll sideways at ${width}px`);
      const columns = await page.$eval('.dash-cards', node => getComputedStyle(node).gridTemplateColumns.split(' ').length);
      assert.equal(columns, width >= 900 ? 4 : width >= 520 ? 2 : 1,
        `summary cards should stack appropriately at ${width}px`);
      await context.close();
    }

    console.log('Dashboard page tests passed (7 cases).');
  } finally {
    await browser.close();
    hosted.server.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
