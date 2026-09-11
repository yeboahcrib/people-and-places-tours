// The Turnstile token path, driven from the browser with a scripted widget.
//
// These are timing bugs, and timing bugs cannot be reasoned about from the
// source alone — the one this suite exists for survived review precisely
// because reading `setTimeout(..., 15000)` looks harmless. So the challenge is
// stubbed and the clock is driven: no network, no Cloudflare, no real widget,
// and every path taken deliberately rather than waited for.
//
// Needs `npm run build` first. A local build has no CF_PAGES and no site key,
// so it ships `data-inquiry-mode="fallback"` and an empty key — correct for a
// build that cannot run a Function, and useless for testing one. The page is
// patched on the way through here rather than the build being bent to suit a
// test, so this runs against an ordinary `dist/` on any machine.

const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {serveDist} = require('./serve-dist.js');

const API = 'https://challenges.cloudflare.com/turnstile/v0/api.js**';

// Stands in for the widget. `execute()` does nothing until the test says so,
// which is what makes a slow or silent challenge reproducible.
const WIDGET_STUB = `
  window.__turnstile = {rendered: 0, resets: 0, executes: 0, options: null};
  window.turnstile = {
    render(el, options) {
      window.__turnstile.rendered += 1;
      window.__turnstile.options = options;
      window.__turnstile.hostVisible = el.parentElement.offsetParent !== null;
      const field = document.createElement('input');
      field.type = 'hidden';
      field.name = 'cf-turnstile-response';
      el.appendChild(field);
      return 'widget-1';
    },
    reset() {
      window.__turnstile.resets += 1;
      const field = document.querySelector('input[name="cf-turnstile-response"]');
      if (field) field.value = '';
    },
    execute() { window.__turnstile.executes += 1; },
  };
  // Drives the callbacks the real widget would fire.
  window.__solve = token => {
    const field = document.querySelector('input[name="cf-turnstile-response"]');
    if (field) field.value = token;
    window.__turnstile.options.callback(token);
  };
  window.__fail = code => window.__turnstile.options['error-callback'](code);
  window.__expire = () => window.__turnstile.options['timeout-callback']();
`;

// Hands the browser the contact page as Cloudflare would build it: posting to
// the Function, with a site key present so the widget is wired up at all.
const serveFormInFunctionMode = (page, baseUrl) => page.route(`${baseUrl}/contact`, async route => {
  const response = await route.fetch();
  const html = (await response.text())
    .replace(/data-inquiry-mode="[^"]*"/, 'data-inquiry-mode="cloudflare"')
    .replace(/data-turnstile-sitekey="[^"]*"/, 'data-turnstile-sitekey="0xTEST_SITE_KEY"');
  await route.fulfill({response, body: html, headers: {...response.headers(), 'content-type': 'text/html; charset=utf-8'}});
});

async function openForm(browser, {captureSubmits = true} = {}, baseUrl) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const submissions = [];
  const warnings = [];

  page.on('console', message => {
    if (message.type() === 'warning') warnings.push(message.text());
  });

  await page.addInitScript(WIDGET_STUB);
  // The real api.js never loads; this is only the onload hook script.js waits
  // for, so the stub above is what gets used.
  await page.route(API, route => route.fulfill({
    status: 200,
    contentType: 'text/javascript',
    body: 'window.onBookingTurnstileLoad && window.onBookingTurnstileLoad();',
  }));

  if (captureSubmits) {
    await page.route('**/api/inquiry', async route => {
      submissions.push(JSON.parse(route.request().postData() || '{}'));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ok: true, reference: `PP-TEST${submissions.length}`}),
      });
    });
  }

  await serveFormInFunctionMode(page, baseUrl);
  await page.goto(`${baseUrl}/contact`);
  // The booking flow takes over the form on load; fill nothing until it has.
  await page.waitForSelector('.contact-form[data-booking-current="1"]');
  await page.waitForFunction(() => window.__turnstile !== undefined);
  return {context, page, submissions, warnings};
}

// Step one asks about the trip, step two about the person — and the widget
// lives in step two, which is the whole reason it starts life hidden.
const fillAndAdvance = async page => {
  await page.selectOption('#tour-interest', 'cape-coast');
  await page.click('[data-booking-actions="1"] .booking-next');
  await page.waitForSelector('[data-booking-step="2"]', {state: 'visible'});
  await page.fill('#first-name', 'Ada');
  await page.fill('#last-name', 'Guest');
  await page.fill('#email', 'ada@example.com');
  await page.fill('#country', 'Ghana');
};

(async () => {
  const hosted = await serveDist();
  const browser = await chromium.launch();
  const base = hosted.origin;

  try {
    /* 1. The widget is not initialised inside a hidden container. */
    {
      const {context, page} = await openForm(browser, {}, base);
      const atLoad = await page.evaluate(() => window.__turnstile.rendered);
      assert.equal(atLoad, 0, 'the widget must not render while its step is hidden');

      await fillAndAdvance(page);
      const state = await page.evaluate(() => window.__turnstile);
      assert.equal(state.rendered, 1, 'reaching step two must mount the widget');
      assert.equal(state.hostVisible, true, 'the widget must be mounted into a container with layout');
      assert.equal(state.options.action, 'inquiry', 'the action name must not drift');
      assert.equal(state.options.appearance, 'interaction-only');
      assert.equal(state.options.execution, 'execute');
      await context.close();
    }

    /* 2. A first submission carries the token the challenge produced. */
    {
      const {context, page, submissions} = await openForm(browser, {}, base);
      await fillAndAdvance(page);
      await page.evaluate(() => {
        window.turnstile.execute = () => { window.__turnstile.executes += 1; window.__solve('token-one'); };
      });
      await page.click('.contact-form button[type="submit"]');
      await page.waitForFunction(() => document.querySelector('.booking-success, .form-error'), null, {timeout: 10000})
        .catch(() => {});
      assert.equal(submissions.length, 1, 'the first submission must reach the endpoint');
      assert.equal(submissions[0]['cf-turnstile-response'], 'token-one');
      await context.close();
    }

    /* 3. The one this suite exists for.
       A first attempt fails and the visitor tries again — the shape every
       report of this took. The first attempt's timer is still armed, and the
       second challenge is still in flight when it fires. Before the fix that
       timer resolved the second attempt with an empty string, the server read
       it as "not a person", and each retry armed another one. */
    {
      const context = await browser.newContext();
      const page = await context.newPage();
      const submissions = [];
      await page.addInitScript(WIDGET_STUB);
      await page.route(API, route => route.fulfill({
        status: 200, contentType: 'text/javascript',
        body: 'window.onBookingTurnstileLoad && window.onBookingTurnstileLoad();',
      }));
      // The first attempt is refused, exactly as a real failed challenge is,
      // so the form stays on step two with the button live for a retry.
      await page.route('**/api/inquiry', async route => {
        submissions.push(JSON.parse(route.request().postData() || '{}'));
        const first = submissions.length === 1;
        await route.fulfill({
          status: first ? 403 : 200,
          contentType: 'application/json',
          body: JSON.stringify(first
            ? {error: 'We could not confirm this was submitted by a person.'}
            : {ok: true, reference: 'PP-TEST2'}),
        });
      });
      await serveFormInFunctionMode(page, base);
      await page.goto(`${base}/contact`);
      await page.waitForSelector('.contact-form[data-booking-current="1"]');
      await page.clock.install();
      await fillAndAdvance(page);

      // Attempt one answers at once. Attempt two takes ten seconds — long
      // enough to still be waiting when attempt one's timer comes due.
      await page.evaluate(() => {
        window.turnstile.execute = () => {
          window.__turnstile.executes += 1;
          const n = window.__turnstile.executes;
          if (n === 1) window.__solve('token-1');
          else setTimeout(() => window.__solve(`token-${n}`), 10000);
        };
      });

      await page.click('.contact-form button[type="submit"]');
      await page.waitForFunction(() => window.__turnstile.executes === 1);
      await page.waitForSelector('.form-error:not(:empty)');

      await page.clock.fastForward(8000);
      await page.click('.contact-form button[type="submit"]');
      await page.waitForFunction(() => window.__turnstile.executes === 2);

      // t = 15s. Attempt one's timer is due here, while attempt two waits.
      await page.clock.fastForward(7000);
      await page.waitForTimeout(200);
      assert.equal(submissions.length, 1,
        'a stale timer must not send the second attempt before its challenge answers');

      // t = 18s. Attempt two's challenge finally answers.
      await page.clock.fastForward(3000);
      await page.waitForFunction(() => window.__turnstile.executes === 2 && document.querySelector('.booking-success, .form-error'));
      await page.waitForTimeout(200);

      assert.equal(submissions.length, 2, 'the retry must reach the endpoint');
      assert.equal(submissions[1]['cf-turnstile-response'], 'token-2',
        'the retry must carry its own token, not an empty string from a stale timer');
      await context.close();
    }

    /* 4. A challenge that never answers still settles, and says why. */
    {
      const {context, page, submissions} = await openForm(browser, {}, base);
      await page.clock.install();
      await fillAndAdvance(page);
      await page.evaluate(() => { window.turnstile.execute = () => {}; });

      await page.click('.contact-form button[type="submit"]');
      await page.clock.fastForward(16000);
      await page.waitForFunction(() => window.__submitted === undefined, null, {timeout: 5000}).catch(() => {});
      await page.waitForTimeout(300);
      assert.equal(submissions.length, 1, 'a timed-out challenge must still send, and be refused by the server');
      assert.equal(submissions[0]['cf-turnstile-response'], '', 'no token means no token');
      await context.close();
    }

    /* 5. An error code is kept rather than discarded. */
    {
      const {context, page, warnings} = await openForm(browser, {}, base);
      await fillAndAdvance(page);
      await page.evaluate(() => { window.turnstile.execute = () => window.__fail('600010'); });
      await page.click('.contact-form button[type="submit"]');
      await page.waitForTimeout(400);
      const recorded = await page.getAttribute('.contact-form', 'data-turnstile-error');
      assert.equal(recorded, '600010', 'the error code must be recorded on the form');
      assert(warnings.some(text => text.includes('600010')), 'the error code must be logged');
      await context.close();
    }

    /* 6. A token the widget holds is used rather than thrown away.
       The promise resolves empty here, but Cloudflare did answer. The token is
       still verified in full by the server; nothing is taken on trust. */
    {
      const {context, page, submissions} = await openForm(browser, {}, base);
      await fillAndAdvance(page);
      await page.evaluate(() => {
        window.turnstile.execute = () => {
          const field = document.querySelector('input[name="cf-turnstile-response"]');
          field.value = 'late-token';       // the widget answered
          window.__turnstile.options['error-callback']('internal-error');  // our promise did not
        };
      });
      await page.click('.contact-form button[type="submit"]');
      await page.waitForTimeout(400);
      assert.equal(submissions.length, 1);
      assert.equal(submissions[0]['cf-turnstile-response'], 'late-token',
        "a token Cloudflare issued must not be discarded because our own promise gave up");
      await context.close();
    }

    console.log('Turnstile client tests passed (6 cases).');
  } finally {
    await browser.close();
    hosted.server.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
