// The dashboard page, driven in a browser against figures computed by the real
// analytics module.
//
// The endpoints are stubbed, but not with hand-written JSON: each request is
// answered by buildFigures() over a fixed set of enquiries, with the filters
// parsed from the request exactly as the Function parses them. So a filter
// chosen on the page narrows real figures, and what the page shows can be
// compared with what the module computed. tests/dashboard-sql.mjs proves the
// module against SQL; this proves the page against the module.
//
// Needs `npm run build` first.

const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {serveDist} = require('./serve-dist.js');

const CONTRAST = `(() => {
  const parse = value => (value.match(/[\\d.]+/g) || []).map(Number);
  const over = (colour, ground) => {
    const [r, g, b, a = 1] = parse(colour);
    const [br, bg, bb] = parse(ground);
    return [r * a + br * (1 - a), g * a + bg * (1 - a), b * a + bb * (1 - a)];
  };
  const luminance = ([r, g, b]) => {
    const channel = value => { const v = value / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };
  const groundOf = node => {
    let el = node;
    while (el) {
      const bg = getComputedStyle(el).backgroundColor;
      if (bg && bg !== 'transparent' && parse(bg)[3] !== 0) return bg;
      el = el.parentElement;
    }
    return 'rgb(255,255,255)';
  };
  return selector => [...document.querySelectorAll(selector)].filter(node => node.getClientRects().length).map(node => {
    const ground = over(groundOf(node), 'rgb(255,255,255)');
    const ink = over(getComputedStyle(node).color, 'rgb(' + ground.join(',') + ')');
    const [light, dark] = [luminance(ink), luminance(ground)].sort((a, b) => b - a);
    return {text: node.textContent.trim().slice(0, 30), ratio: (light + 0.05) / (dark + 0.05)};
  });
})()`;

(async () => {
  const {buildFigures, parseFilters, describeEnquiry} = await import('../src/dashboard/analytics.mjs');
  const now = new Date();
  const at = days => new Date(now.getTime() - days * 86_400_000).toISOString();
  const month = offset => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1)).toISOString().slice(0, 7);
  const row = (days, fields) => ({
    reference: `PP-P${String(days).padStart(5, '0')}`, created_at: at(days), status: 'new', source: 'Website inquiry',
    first_name: 'Guest', last_name: String(days), email: `guest${days}@example.com`, phone: '', country: 'GH',
    tour_interest: 'cape-coast', tour_name: 'Cape Coast Ancestral Tour', group_size: '3-5', travel_date: '', departure_date: '',
    date_flexibility: '', traveling_with_children: '', children_age_ranges: '', accommodation: '', contact_method: '',
    message: '', budget_range: '', interests: '', trip_length_days: '', travel_month: '', ...fields,
  });
  const ROWS = [
    row(0, {reference: 'PP-K4ZG7P', first_name: 'Test', last_name: 'Cutover', tour_interest: 'custom', tour_name: 'Custom tour request',
      group_size: '2', travel_month: month(6), trip_length_days: '10', budget_range: '1500-3000', interests: 'culture-heritage,food',
      message: 'We would love a slow week.\nTwo of us, first visit.', email: 'test.cutover@example.com', phone: '+233 20 000 0000', contact_method: 'email'}),
    row(2, {country: 'Ghana', tour_interest: 'just-go-ghana', tour_name: 'Just Go Ghana', group_size: 'not-sure', budget_range: 'not-sure', interests: 'not-sure', travel_month: 'not-sure'}),
    row(5, {country: 'US', first_name: '<img src=x onerror="window.__owned=1">', tour_interest: 'accra-food', tour_name: 'Accra After Dark Food Tour', travel_date: `${month(2)}-10`, accommodation: 'private', contact_method: 'whatsapp', traveling_with_children: 'yes', children_age_ranges: '5 and 8'}),
    row(12, {country: 'United', tour_interest: '', tour_name: '', group_size: ''}),
    row(40, {country: 'NG', tour_interest: 'custom', tour_name: 'Custom tour request', group_size: '15+', budget_range: 'over-5000', trip_length_days: '21', interests: 'history-ancestry', travel_month: month(3), accommodation: 'family'}),
    ...Array.from({length: 26}, (_, index) => row(50 + index * 9, {country: index % 3 ? 'US' : 'GH', group_size: ['solo', '2', '3-5', '6-10'][index % 4], travel_date: `${month(index % 12)}-15`})),
  ];

  const figuresFor = (url, rows = ROWS) => {
    const figures = buildFigures(rows, parseFilters(new URL(url).searchParams), new Date());
    for (const item of figures.recent.items) {
      const source = rows.find(entry => entry.reference === item.reference && entry.created_at === item.createdAt);
      item.name = [source.first_name, source.last_name].filter(Boolean).join(' ');
    }
    return figures;
  };
  const ok = body => ({status: 200, contentType: 'application/json', body: JSON.stringify(body)});

  const hosted = await serveDist();
  const browser = await chromium.launch();
  const base = hosted.origin;

  async function open(viewport, {figures, detail} = {}) {
    const context = await browser.newContext({viewport: viewport || {width: 1440, height: 1000}});
    const page = await context.newPage();
    const failures = [];
    const requests = [];
    page.on('pageerror', error => failures.push(String(error)));
    await page.route('**/api/dashboard?**', route => { requests.push(route.request().url()); return route.fulfill(figures ? figures(route.request().url()) : ok(figuresFor(route.request().url()))); });
    await page.route('**/api/dashboard', route => { requests.push(route.request().url()); return route.fulfill(figures ? figures(route.request().url()) : ok(figuresFor(route.request().url()))); });
    await page.route('**/api/dashboard/enquiry?**', route => {
      if (detail) return route.fulfill(detail(route.request().url()));
      const reference = new URL(route.request().url()).searchParams.get('reference');
      const source = ROWS.find(entry => entry.reference === reference);
      return route.fulfill(source ? ok({enquiry: describeEnquiry(source), sharedReference: false}) : {status: 404, contentType: 'application/json', body: '{"error":"No enquiry has that reference."}'});
    });
    await page.goto(`${base}/dashboard`);
    await page.waitForSelector('.kpis, .dash-message h2:not(:text("Reading"))', {timeout: 10000});
    await page.waitForFunction(() => document.querySelector('[data-dash-root]').getAttribute('aria-busy') === 'false');
    return {context, page, failures, requests};
  }
  const settled = page => page.waitForFunction(() => document.querySelector('[data-dash-root]').getAttribute('aria-busy') === 'false');
  const kpis = page => page.$$eval('.kpi', nodes => nodes.map(node => [node.querySelector('dt').textContent, node.querySelector('.kpi-value').textContent, node.querySelector('.kpi-sub').textContent]));

  try {
    /* 1. The headline figures are the module's figures. */
    {
      const {context, page, failures} = await open();
      const expected = figuresFor(`${base}/api/dashboard`);
      const cards = await kpis(page);
      assert.deepEqual(cards.map(card => card.slice(0, 2)), [
        ['Total enquiries', String(expected.summary.total)],
        ['This month', String(expected.summary.thisMonth.count)],
        ['Top country', expected.summary.topCountry.labels.join(' & ')],
        ['Most requested experience', expected.summary.topExperience.labels.join(' & ')],
      ]);
      assert.deepEqual(await page.$$eval('.dash-section-head h2', nodes => nodes.map(node => node.textContent)),
        ['Overview', 'Demand', 'Trip and preferences', 'Enquiries', 'Notes']);
      assert.match(await page.textContent('[data-dash-scope]'), new RegExp(`Showing all ${ROWS.length} enquiries`));

      // Zero, "not sure" and no answer are three different things on the page.
      const group = page.locator('.card', {has: page.locator('h3', {hasText: 'Group size'})});
      const counts = await group.locator('.col-count').allTextContents();
      assert.deepEqual(counts, expected.groupSize.items.map(item => String(item.count)), 'every range is drawn, zeros included');
      assert(counts.includes('0') === expected.groupSize.items.some(item => !item.count));
      const keys = await group.locator('.keyline li').allTextContents();
      assert(keys.some(text => /Not sure yet 1 · 3%/.test(text)), `"Not sure yet" is its own figure (${keys})`);
      assert(keys.some(text => /Not recorded 1 · 3%/.test(text)), `a missing group size is its own figure (${keys})`);
      assert.match(await group.locator('.callout').textContent(), /Median stated group: /);

      const country = page.locator('.card', {has: page.locator('h3', {hasText: 'Where enquiries come from'})});
      assert.equal(await country.locator('.hbar.is-unmatched .tag').textContent(), 'unmatched');
      assert.match(await country.locator('.card-foot').textContent(), /“United”/);

      // Donut and split bars write their numbers out.
      const legend = await page.locator('.card', {has: page.locator('h3', {hasText: 'Accommodation'})}).locator('.legend li').allTextContents();
      assert.equal(legend.length, 4);
      assert.equal(await page.locator('.timeline svg').count(), 1);
      assert.equal(await page.locator('.timeline .dash-sr tr').count(), expected.timeline.points.length + 1, 'the time series has a text alternative');

      // Nothing from the data is parsed as markup.
      assert.equal(await page.locator('.recent img').count(), 0);
      assert.equal(await page.evaluate(() => window.__owned), undefined);
      assert(await page.locator('.recent').textContent().then(text => text.includes('<img src=x')), 'a name that looks like markup is shown as text');

      for (const selector of ['.kpi dt', '.kpi-sub', '.card-meta', '.card-foot', '.hbar-value', '.col-count', '.col-labels span',
        '.keyline li', '.legend-value', '.recent th', '.dash-scope', '.dash-section-head h2', '.dash-field label', '.dash-stamp', '.tag', '.status-pill']) {
        const measured = await page.evaluate(`(${CONTRAST})(${JSON.stringify(selector)})`);
        assert(measured.length, `${selector} rendered nothing to measure`);
        for (const {text, ratio} of measured) assert(ratio >= 4.5, `"${text}" (${selector}) is ${ratio.toFixed(2)}:1`);
      }
      assert.deepEqual(failures, []);
      await context.close();
    }

    /* 2. A filter narrows every figure together, and says what it is showing. */
    {
      const {context, page, requests} = await open();
      await page.selectOption('#dash-country', 'GH');
      await settled(page);
      assert.match(requests.at(-1), /[?&]country=GH\b/);
      const expected = figuresFor(`${base}/api/dashboard?country=GH`);
      const cards = await kpis(page);
      assert.equal(cards[0][1], String(expected.summary.total));
      assert.equal(cards[0][2], `of ${ROWS.length} in all`);
      assert.equal(cards[2][1], 'Ghana');
      assert.match(await page.textContent('[data-dash-scope]'), new RegExp(`Showing ${expected.summary.total} of ${ROWS.length} enquiries · Ghana`));
      assert.match(page.url(), /country=GH/, 'the filter survives a reload');
      const listed = await page.locator('.recent tbody tr').count();
      assert.equal(listed, Math.min(25, expected.summary.total), 'the list shows the same enquiries as the figures');
      assert.equal(await page.isVisible('[data-dash-clear]'), true);

      // Choosing custom dates waits for a date before asking again.
      const before = requests.length;
      await page.selectOption('#dash-range', 'custom');
      assert.equal(await page.isVisible('#dash-from'), true);
      assert.equal(requests.length, before, 'no request until a date is chosen');
      await page.fill('#dash-from', new Date(now.getTime() - 20 * 86_400_000).toISOString().slice(0, 10));
      await page.dispatchEvent('#dash-from', 'change');
      await settled(page);
      assert.match(requests.at(-1), /range=custom/);
      assert.match(requests.at(-1), /from=\d{4}-\d{2}-\d{2}/);

      await page.click('[data-dash-clear]');
      await settled(page);
      assert.match(await page.textContent('[data-dash-scope]'), /Showing all/);
      assert.equal(await page.isVisible('[data-dash-clear]'), false);

      // Nothing matches: the page says so, and offers the way back.
      await page.selectOption('#dash-experience', 'accra-food');
      await settled(page);
      await page.selectOption('#dash-country', 'NG');
      await settled(page);
      assert.equal(await page.textContent('.dash-message h2'), 'No enquiries match these filters.');
      assert.equal((await kpis(page))[0][1], '0');
      await context.close();
    }

    /* 3. An enquiry opens beside the figures, grouped, and closes back to where it was. */
    {
      const {context, page, failures} = await open();
      const button = page.locator('[data-reference="PP-K4ZG7P"]');
      await button.click();
      await page.waitForSelector('.detail-group');
      assert.equal(await page.evaluate(() => document.querySelector('[data-dash-drawer]').open), true);
      assert.equal(await page.textContent('[data-drawer-title]'), 'Test Cutover');
      assert.deepEqual(await page.$$eval('.detail-group h3', nodes => nodes.map(node => node.textContent)),
        ['Traveller', 'Trip', 'Preferences', 'Message', 'Record']);
      const pairs = await page.$$eval('.detail-list', lists => lists.map(list => [...list.querySelectorAll('dt')].map(dt => [dt.textContent, dt.nextElementSibling.textContent])));
      const flat = Object.fromEntries(pairs.flat());
      assert.equal(flat.Email, 'test.cutover@example.com');
      assert.equal(flat['Travel month'].startsWith(new Date(`${month(6)}-01T00:00:00Z`).toLocaleString('en-US', {month: 'long', year: 'numeric', timeZone: 'UTC'})), true);
      assert.equal(flat['Trip length'], '10 days');
      assert.equal(flat['Budget per person'], '$1,500 – $3,000');
      assert.equal(flat.Interests, 'Culture & heritageFood');
      assert.equal(await page.getAttribute('.detail-list a[href^="mailto:"]', 'href'), 'mailto:test.cutover@example.com');
      assert.equal(await page.textContent('.detail-message'), 'We would love a slow week.\nTwo of us, first visit.');
      assert.equal(await page.evaluate(() => location.pathname), '/dashboard', 'opening an enquiry does not navigate');

      await page.keyboard.press('Escape');
      await page.waitForFunction(() => !document.querySelector('[data-dash-drawer]').open);
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-reference')), 'PP-K4ZG7P', 'focus returns to the enquiry that was opened');

      // A day tour shows no trip-length question it never asked; a missing answer reads as missing.
      await page.locator('.recent tbody tr', {hasText: 'PP-P00005'}).locator('td').first().click();
      await page.waitForFunction(() => document.querySelector('[data-drawer-title]').textContent.includes('onerror'));
      const second = Object.fromEntries((await page.$$eval('.detail-list', lists => lists.map(list => [...list.querySelectorAll('dt')].map(dt => [dt.textContent, dt.nextElementSibling.className + '|' + dt.nextElementSibling.textContent])))).flat());
      assert.equal(second['Trip length'], undefined);
      assert.equal(second["Children's ages"], '|5 and 8');
      assert.equal(second['Budget per person'], 'is-missing|No answer');
      assert.equal(await page.locator('[data-dash-drawer] img').count(), 0);
      await page.click('[data-drawer-close]');
      await page.waitForFunction(() => !document.querySelector('[data-dash-drawer]').open);
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-reference')), 'PP-P00005',
        'opened from its row, closing still returns focus to that enquiry, not to whatever was focused before');

      assert.deepEqual(failures, []);
      await context.close();
    }

    /* 4. Showing more of the list. */
    {
      const {context, page, requests} = await open();
      assert.equal(await page.locator('.recent tbody tr').count(), 25);
      await page.click('.more-row .button-quiet');
      await settled(page);
      assert.match(requests.at(-1), /recent=50/);
      assert.equal(await page.locator('.recent tbody tr').count(), ROWS.length);
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('data-reference')), await page.locator('[data-reference]').nth(25).getAttribute('data-reference'),
        'focus lands on the first newly shown enquiry');
      await context.close();
    }

    /* 5. The states nobody remembers to look at. */
    {
      let {context, page} = await open(null, {figures: url => ok(figuresFor(url, []))});
      assert.equal(await page.textContent('.dash-message h2'), 'No enquiries yet.');
      await context.close();

      ({context, page} = await open(null, {figures: () => ({status: 401, contentType: 'application/json', body: '{"error":"This dashboard is private."}'})}));
      assert.match(await page.textContent('.dash-message h2'), /private/i);
      assert.equal(await page.locator('.kpi').count(), 0, 'a refused reader is shown no figures');
      assert.equal(await page.isVisible('[data-dash-filters]'), false);
      await context.close();

      ({context, page} = await open(null, {figures: () => ({status: 500, contentType: 'application/json', body: '{}'})}));
      assert.match(await page.textContent('.dash-message h2'), /could not be read/);
      await context.close();

      ({context, page} = await open(null, {detail: () => ({status: 404, contentType: 'application/json', body: '{}'})}));
      await page.locator('[data-reference]').first().click();
      await page.waitForSelector('.drawer-state:not(:text("Loading"))');
      assert.match(await page.textContent('.drawer-state'), /No enquiry has this reference/);
      await context.close();
    }

    /* 6. Every width: no sideways scroll, stacked sensibly, reachable. */
    for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
      const {context, page, failures} = await open({width, height: 900});
      const at = `at ${width}px`;
      const layout = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        kpiColumns: getComputedStyle(document.querySelector('.kpis')).gridTemplateColumns.split(' ').length,
        smallestReference: Math.min(...[...document.querySelectorAll('.ref-button')].map(node => node.getBoundingClientRect().height)),
        filterHeight: Math.min(...[...document.querySelectorAll('.dash-field select')].map(node => node.getBoundingClientRect().height)),
        timelineWidth: document.querySelector('.timeline svg').getBoundingClientRect().width,
        timelineHost: document.querySelector('.timeline').getBoundingClientRect().width,
      }));
      assert.equal(layout.overflow, 0, `no sideways scroll ${at}`);
      assert.equal(layout.kpiColumns, width > 1100 ? 4 : width > 420 ? 2 : 1, `headline figures stack ${at}`);
      assert(layout.smallestReference >= 32, `each reference is a 32px target ${at}`);
      assert(layout.filterHeight >= 40, `filters are comfortable to tap ${at}`);
      assert(Math.abs(layout.timelineWidth - layout.timelineHost) <= 2, `the time series is drawn at its real width ${at} (${layout.timelineWidth} vs ${layout.timelineHost})`);

      await page.locator('[data-reference]').first().click();
      await page.waitForSelector('.detail-group');
      // Measured where it comes to rest, not part-way through sliding in.
      await page.evaluate(() => Promise.all(document.querySelector('[data-dash-drawer]').getAnimations().map(animation => animation.finished.catch(() => {}))));
      const drawer = await page.evaluate(() => {
        const box = document.querySelector('[data-dash-drawer]').getBoundingClientRect();
        return {width: Math.round(box.width), right: Math.round(box.right), viewport: document.documentElement.clientWidth};
      });
      assert(drawer.right <= drawer.viewport + 1 && drawer.right >= drawer.viewport - 16, `the drawer sits against the right edge ${at}`);
      assert(width > 560 ? drawer.width <= 541 : drawer.width >= width - 16, `the drawer is a side panel on wide screens and full width on phones ${at} (${drawer.width})`);
      assert.deepEqual(failures, [], `no page errors ${at}`);
      await context.close();
    }

    console.log('Dashboard page tests passed (6 cases, the last at seven widths).');
  } finally {
    await browser.close();
    hosted.server.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
