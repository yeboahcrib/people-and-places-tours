// The booking flow's required answers and conditional questions, in a browser.
//
// The form sets noValidate, so `required` in the markup enforces nothing once
// the script runs: a question is only required if script.js says so. That
// makes this the one place the rule is actually proven. The server refuses the
// same enquiries — see tests/inquiry-function.mjs — but a refusal from the
// server arrives on step two, about a field on step one the visitor can no
// longer see, which is exactly the experience these checks exist to prevent.
//
// Needs `npm run build` first. The page is served in Function mode with no
// Turnstile site key, so a submission goes straight to a stubbed endpoint.

const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {serveDist} = require('./serve-dist.js');

const FUTURE_DATE = '2027-06-01';

// The dropdown's window, worked out the way the page and the server both do:
// this month through 18 months ahead, in UTC.
const monthAt = offset => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1)).toISOString().slice(0, 7);
};

async function openForm(browser, base, viewport) {
  const context = await browser.newContext(viewport ? {viewport} : {});
  const page = await context.newPage();
  const posted = [];
  const failures = [];
  page.on('pageerror', error => failures.push(String(error)));

  await page.route(`${base}/contact`, async route => {
    const response = await route.fetch();
    const html = (await response.text())
      .replace(/data-inquiry-mode="[^"]*"/, 'data-inquiry-mode="cloudflare"')
      .replace(/data-turnstile-sitekey="[^"]*"/, 'data-turnstile-sitekey=""');
    await route.fulfill({response, body: html, headers: {...response.headers(), 'content-type': 'text/html; charset=utf-8'}});
  });
  await page.route('**/api/inquiry', async route => {
    posted.push(JSON.parse(route.request().postData() || '{}'));
    await route.fulfill({status: 200, contentType: 'application/json', body: JSON.stringify({ok: true, reference: `PP-TEST${posted.length}`})});
  });

  await page.goto(`${base}/contact`);
  await page.waitForSelector('.contact-form[data-booking-current="1"]');
  return {context, page, posted, failures};
}

const current = page => page.getAttribute('.contact-form', 'data-booking-current');
const next = page => page.click('[data-booking-actions="1"] .booking-next');

async function answerStepOne(page, tour = 'cape-coast') {
  await page.selectOption('#tour-interest', tour);
  await page.selectOption('#group-size', '3-5');
  await page.fill('#travel-date', FUTURE_DATE);
}

async function answerStepTwo(page) {
  await page.fill('#first-name', 'Ada');
  await page.fill('#last-name', 'Guest');
  await page.fill('#email', 'ada@example.com');
  await page.selectOption('#country', 'GH');
}

(async () => {
  const hosted = await serveDist();
  const browser = await chromium.launch();
  const base = hosted.origin;

  try {
    /* 1. Continue will not skip the three required questions. */
    {
      const {context, page, failures} = await openForm(browser, base);
      await next(page);
      assert.equal(await current(page), '1', 'Continue must not leave step one with required answers missing');

      // Step one's own region. `.form-error` alone now matches two elements.
      const error = page.locator('[data-step-error="1"]');
      assert.equal(await error.isVisible(), true, 'the reason must be visible from step one, not rendered into a hidden step');
      assert.match(await error.textContent(), /experience.*traveling.*when you'd like to travel/);
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'tour-interest',
        'focus goes to the first thing skipped');
      for (const id of ['tour-interest', 'group-size', 'travel-date']) {
        assert.equal(await page.getAttribute(`#${id}`, 'aria-invalid'), 'true', `${id} must be marked invalid`);
      }

      // Pressing Enter in a step-one field is Continue, and obeys the same rule.
      await page.selectOption('#tour-interest', 'cape-coast');
      await page.press('#travel-date', 'Enter');
      assert.equal(await current(page), '1', 'Enter must not skip required answers either');

      // Answering clears the message — step one's own, even though step two's
      // name fields are still empty.
      await answerStepOne(page);
      assert.equal((await error.textContent()).trim(), '', 'a fixed step must clear its own message');
      await next(page);
      assert.equal(await current(page), '2', 'with the answers given, Continue advances');
      assert.deepEqual(failures, []);
      await context.close();
    }

    /* 2. Trip length is asked only about a custom trip. */
    {
      const {context, page} = await openForm(browser, base);
      const length = page.locator('#trip-length-days');
      await page.selectOption('#tour-interest', 'cape-coast');
      assert.equal(await length.isVisible(), false, 'a day tour already has a length');
      assert.equal(await length.isDisabled(), true, 'hidden, it must also not be submitted');

      await page.selectOption('#tour-interest', 'custom');
      assert.equal(await length.isVisible(), true, 'a custom trip is asked how long');
      assert.equal(await length.isDisabled(), false);

      await length.fill('9');
      await page.selectOption('#tour-interest', 'accra-city');
      assert.equal(await length.isVisible(), false, 'switching away hides it again');
      assert.equal(await length.isDisabled(), true, 'and an answer typed before switching is not sent');
      await context.close();
    }

    /* 3. A full custom enquiry: every new field arrives, in the shape the
          server stores. */
    {
      const {context, page, posted} = await openForm(browser, base);
      await answerStepOne(page, 'custom');
      await page.fill('#trip-length-days', '10');
      await page.selectOption('#budget-range', '1500-3000');
      // Ticked out of order on purpose; the form's order is what is sent.
      await page.check('input[name="interests"][value="food"]');
      await page.check('input[name="interests"][value="culture-heritage"]');
      await next(page);
      await answerStepTwo(page);
      await page.click('.contact-form button[type="submit"]');
      await page.waitForFunction(() => document.querySelector('.booking-success:not([hidden])') || document.querySelector('.form-error:not([data-step-error])')?.textContent.trim());

      assert.equal(posted.length, 1, 'the enquiry must be sent');
      const [sent] = posted;
      assert.equal(sent['tour-interest'], 'custom');
      assert.equal(sent['group-size'], '3-5');
      assert.equal(sent['travel-date'], FUTURE_DATE);
      assert.equal(sent['trip-length-days'], '10');
      assert.equal(sent['budget-range'], '1500-3000');
      // Document order, not tick order: FormData walks the form top to bottom,
      // and the server stores the form's order either way.
      assert.equal(sent.interests, 'culture-heritage,food',
        'every ticked box must arrive — Object.fromEntries alone would keep only the last');
      await context.close();
    }

    /* 4. A plain day-tour enquiry is no longer than it was, and still sends. */
    {
      const {context, page, posted} = await openForm(browser, base);
      await answerStepOne(page, 'accra-city');
      await next(page);
      await answerStepTwo(page);
      await page.click('.contact-form button[type="submit"]');
      await page.waitForFunction(() => document.querySelector('.booking-success:not([hidden])') || document.querySelector('.form-error:not([data-step-error])')?.textContent.trim());

      assert.equal(posted.length, 1);
      const [sent] = posted;
      assert.equal(sent['trip-length-days'], undefined, 'a day tour sends no trip length at all');
      assert.equal(sent['budget-range'], '', 'optional budget left unanswered');
      assert.equal(sent.interests, '', 'optional interests left unanswered');
      await context.close();
    }

    /* 5. Emptied after the fact, a step-one answer sends the visitor back to
          step one — not to a message about a field they cannot see. */
    {
      const {context, page, posted} = await openForm(browser, base);
      await answerStepOne(page);
      await next(page);
      await answerStepTwo(page);
      await page.evaluate(() => { document.querySelector('#travel-date').value = ''; });
      await page.click('.contact-form button[type="submit"]');

      assert.equal(posted.length, 0, 'nothing is sent with a required answer missing');
      assert.equal(await current(page), '1', 'the visitor is returned to the step the field is on');
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'travel-date');
      assert.equal(await page.locator('[data-step-error="1"]').isVisible(), true,
        'the message is shown on the step the visitor is sent back to');
      assert.equal((await page.locator('.form-error:not([data-step-error])').textContent()).trim(), '',
        'and not left behind on the step they left');
      await context.close();
    }

    /* 7. No exact dates: a rough month instead, never an invented date. */
    {
      const {context, page, posted, failures} = await openForm(browser, base);
      const exact = page.locator('#travel-date');
      const month = page.locator('#travel-month');
      const departure = page.locator('#departure-date');
      await page.selectOption('#tour-interest', 'custom');
      await page.selectOption('#group-size', '3-5');
      assert.equal(await month.isVisible(), false, 'the month is not asked until the visitor says they have no dates');
      assert.equal(await departure.isVisible(), true, 'a custom trip still asks for a departure date by default');

      await page.check('[data-timing-toggle]');
      assert.equal(await exact.isVisible(), false);
      assert.equal(await exact.isDisabled(), true, 'a hidden date must not be sent');
      assert.equal(await departure.isVisible(), false, 'no arrival date, so no departure date');
      assert.equal(await departure.isDisabled(), true);
      assert.equal(await page.locator('#date-flexibility').isVisible(), true,
        '"Are your dates flexible?" is left exactly as it was');
      assert.equal(await month.isVisible(), true);

      // Exactly the window the server accepts: this month through 18 ahead.
      const values = await month.locator('option').evaluateAll(options => options.map(option => option.value));
      assert.deepEqual(values, ['', ...Array.from({length: 19}, (_, offset) => monthAt(offset)), 'not-sure'],
        'the dropdown must offer this month through 18 months ahead, then "Not sure yet"');

      // Still required on this path.
      await next(page);
      assert.equal(await current(page), '1', 'the month is required once the box is ticked');
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'travel-month');
      assert.equal(await page.getAttribute('#travel-month', 'aria-invalid'), 'true');

      await month.selectOption(monthAt(5));
      assert.equal((await page.locator('[data-step-error="1"]').textContent()).trim(), '',
        'choosing a month clears the message');
      await next(page);
      assert.equal(await current(page), '2');
      await answerStepTwo(page);
      await page.click('.contact-form button[type="submit"]');
      await page.waitForFunction(() => document.querySelector('.booking-success:not([hidden])') || document.querySelector('.form-error:not([data-step-error])')?.textContent.trim());

      assert.equal(posted.length, 1);
      assert.equal(posted[0]['travel-month'], monthAt(5));
      assert.equal(posted[0]['travel-date'], undefined, 'no date is sent at all, let alone a made-up one');
      assert.equal(posted[0]['departure-date'], undefined);
      assert.deepEqual(failures, []);
      await context.close();
    }

    /* 8. "Not sure yet" is an answer, and changing one's mind brings the date back. */
    {
      const {context, page, posted} = await openForm(browser, base);
      await page.selectOption('#tour-interest', 'accra-city');
      await page.selectOption('#group-size', '2');
      await page.check('[data-timing-toggle]');
      await page.selectOption('#travel-month', 'not-sure');

      await page.uncheck('[data-timing-toggle]');
      assert.equal(await page.locator('#travel-date').isVisible(), true, 'unticking restores the date');
      assert.equal(await page.locator('#travel-month').isDisabled(), true, 'and the month chosen before is not sent');

      await page.check('[data-timing-toggle]');
      await next(page);
      assert.equal(await current(page), '2', '"Not sure yet" satisfies the timing question');
      await answerStepTwo(page);
      await page.click('.contact-form button[type="submit"]');
      await page.waitForFunction(() => document.querySelector('.booking-success:not([hidden])') || document.querySelector('.form-error:not([data-step-error])')?.textContent.trim());

      assert.equal(posted.length, 1);
      assert.equal(posted[0]['travel-month'], 'not-sure');
      assert.equal(posted[0]['travel-date'], undefined);
      await context.close();
    }

    /* 6. The interest chips wrap on a phone rather than pushing the page sideways,
          and every chip is a comfortable tap target. */
    {
      const {context, page} = await openForm(browser, base, {width: 375, height: 812});
      await page.locator('.interest-set').scrollIntoViewIfNeeded();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      assert.equal(overflow, 0, 'the form must not scroll sideways at 375px');
      const smallest = await page.$$eval('.interest-option', nodes => Math.min(...nodes.map(node => node.getBoundingClientRect().height)));
      assert(smallest >= 32, `every interest chip must be at least 32px tall (smallest was ${smallest}px)`);
      await context.close();
    }

    console.log('Booking required-field tests passed (8 cases).');
  } finally {
    await browser.close();
    hosted.server.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
