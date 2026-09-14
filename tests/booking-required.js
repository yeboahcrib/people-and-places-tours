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

    /* 9. The new fields belong to the form, and interests read as preferences,
          at every width. Asserted as numbers rather than judged by eye. */
    const INTEREST_VALUES = ['culture-heritage', 'food', 'history-ancestry', 'nature-waterfalls', 'wildlife',
      'adventure', 'beaches-relaxation', 'nightlife', 'community', 'photography', 'shopping-crafts', 'not-sure'];
    // Height of the interests section in the rejected two-column grid of
    // field-styled boxes, measured at each width. The chips must beat it by at
    // least a tenth everywhere. Not more: with these twelve labels in this
    // order, a phone-width panel cannot fit much more than two to a line, and
    // the version that tried for a fifth — ring indicators and all — came out
    // taller than the grid on every phone. Reordering or shortening the
    // options would go further, and that is a product decision, not a style.
    const GRID_HEIGHT = {375: 448, 390: 431, 430: 380, 768: 311, 1024: 339, 1440: 304};
    // No grid was measured at 320px. The ring-indicator chips were 619px there.
    const RING_CHIPS_AT_320 = 619;

    for (const width of [320, 375, 390, 430, 768, 1024, 1440]) {
      const {context, page, failures} = await openForm(browser, base, {width, height: 900});
      const at = `at ${width}px`;
      // The floating navigation sits over whatever scrolls beneath it; a real
      // visitor scrolls past it, a pointer click in a test does not.
      await page.evaluate(() => {
        for (const element of document.querySelectorAll('body *')) {
          if (getComputedStyle(element).position === 'fixed') element.style.setProperty('display', 'none', 'important');
        }
      });
      await page.selectOption('#tour-interest', 'custom');
      await page.selectOption('#group-size', '3-5');

      const exact = await page.evaluate(() => {
        const q = selector => document.querySelector(selector);
        const box = element => element.getBoundingClientRect();
        const chips = [...document.querySelectorAll('.interest-option')];
        const chipFor = value => q(`input[name="interests"][value="${value}"]`).closest('.interest-option');
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          smallestChip: Math.min(...chips.map(node => box(node).height)),
          toggleHeight: box(q('.timing-toggle')).height,
          sectionHeight: Math.round(box(q('.interest-set')).height),
          foodWidth: box(chipFor('food')).width,
          communityWidth: box(chipFor('community')).width,
          notSureTop: Math.round(box(chipFor('not-sure')).top),
          lastInterestBottom: Math.round(Math.max(...chips.slice(0, 11).map(node => box(node).bottom))),
          legendToHelp: Math.round(box(q('#interests-help')).top - box(q('.interest-set legend')).bottom),
          labelToField: Math.round(box(q('#group-size')).top - box(q('label[for="group-size"]')).bottom),
          rowGap: Math.round(box(q('#trip-length-days').closest('.form-row')).top - box(q('#tour-interest').closest('.form-row')).bottom),
          gapBeforeInterests: Math.round(box(q('.interest-set')).top - box(q('#budget-range').closest('.form-row')).bottom),
          toggleUnderDateHelp: Math.round(box(q('.timing-toggle')).top - box(q('#travel-date-help')).bottom),
          // Relative to its own row. The booking panel is a scroll-reveal section
          // that slides up 40px as it comes into view, and the chip clicks below
          // scroll it there, so any page or viewport position taken before them
          // and compared after them measures the animation, not the layout.
          date: {
            top: Math.round(box(q('#travel-date')).top - box(q('#travel-date').closest('.form-row')).top),
            left: Math.round(box(q('#travel-date')).left - box(q('#travel-date').closest('.form-row')).left),
          },
        };
      });

      assert.equal(exact.overflow, 0, `no sideways scroll ${at}`);
      assert(exact.smallestChip >= 32, `every interest chip is at least 32px tall ${at} (smallest ${exact.smallestChip}px)`);
      assert(exact.toggleHeight >= 32, `the tickbox tap area is at least 32px ${at} (${exact.toggleHeight}px)`);
      assert(exact.foodWidth < exact.communityWidth * 0.6,
        `chips hug their words, so Food stays small ${at} (${Math.round(exact.foodWidth)} vs ${Math.round(exact.communityWidth)})`);
      const reference = GRID_HEIGHT[width] || RING_CHIPS_AT_320;
      assert(exact.sectionHeight <= reference * 0.9 + 2,
        `interests are more compact than the design they replace ${at} (${exact.sectionHeight}px vs ${reference}px)`);
      assert(exact.notSureTop >= exact.lastInterestBottom,
        `"Not sure — recommend something" stands on its own line, apart from the interests ${at}`);
      assert(Math.abs(exact.legendToHelp - exact.labelToField) <= 1,
        `the interests question sits as far from its helper as a label from its field ${at} (${exact.legendToHelp} vs ${exact.labelToField})`);
      assert(Math.abs(exact.gapBeforeInterests - exact.rowGap) <= 1,
        `a hidden children-age row leaves no extra gap ${at} (${exact.gapBeforeInterests} vs ${exact.rowGap})`);
      assert(exact.toggleUnderDateHelp >= -4 && exact.toggleUnderDateHelp <= 8,
        `the tickbox sits directly under the date's helper line ${at} (${exact.toggleUnderDateHelp}px)`);

      /* Selecting: anywhere on the chip works, and both states are legible
         against what is actually painted behind them. */
      const food = page.locator('.interest-option', {has: page.locator('input[value="food"]')});
      const notSure = page.locator('.interest-option', {has: page.locator('input[value="not-sure"]')});
      const paint = values => page.evaluate(async values => {
        const parse = value => (value.match(/[\d.]+/g) || []).map(Number);
        const over = (colour, ground) => {
          const [r, g, b, a = 1] = parse(colour);
          const [R, G, B] = parse(ground);
          return `rgb(${r * a + R * (1 - a)}, ${g * a + G * (1 - a)}, ${b * a + B * (1 - a)})`;
        };
        const luminance = colour => {
          const channel = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
          const [r, g, b] = parse(colour);
          return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
        };
        const ratio = (a, b) => {
          const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
          return +((light + 0.05) / (dark + 0.05)).toFixed(2);
        };
        const panel = getComputedStyle(document.querySelector('.booking-panel')).backgroundColor;
        const measure = value => {
          const input = document.querySelector(`input[name="interests"][value="${value}"]`);
          const chip = input.closest('.interest-option');
          const style = getComputedStyle(chip);
          const fill = over(style.backgroundColor, panel);
          return {
            checked: input.checked,
            text: ratio(over(style.color, fill), fill),
            border: ratio(over(style.borderTopColor, panel), panel),
            edge: style.boxShadow,
            width: Math.round(chip.getBoundingClientRect().width),
            fill,
          };
        };
        // A chip eases into its new colours over --motion-base; read the
        // colours it settles on, not a frame part-way there.
        // A transition cut short by the next one (hover moving on) rejects
        // rather than finishing, so wait until nothing is left running.
        const chips = values.map(value => document.querySelector(`input[name="interests"][value="${value}"]`).closest('.interest-option'));
        for (let running = chips.flatMap(chip => chip.getAnimations()); running.length; running = chips.flatMap(chip => chip.getAnimations())) {
          await Promise.all(running.map(animation => animation.finished.catch(() => {})));
        }
        return Object.fromEntries(values.map(value => [value, measure(value)]));
      }, values);
      // Measured one at a time: choosing "Not sure" clears Food (case 10).
      const foodBox = await food.boundingBox();
      await food.click({position: {x: foodBox.width - 6, y: foodBox.height / 2}});
      const chosen = await paint(['food', 'wildlife']);
      await notSure.click({position: {x: 8, y: (await notSure.boundingBox()).height / 2}});
      const handedOver = (await paint(['not-sure']))['not-sure'];
      assert.equal(chosen.food.checked, true, `a click near the edge of a chip selects it ${at}`);
      assert.equal(handedOver.checked, true, `"Not sure" is selectable too ${at}`);
      assert(chosen.wildlife.text >= 4.5, `unselected chip text is legible ${at} (${chosen.wildlife.text}:1)`);
      assert(chosen.food.text >= 4.5, `selected chip text is legible ${at} (${chosen.food.text}:1)`);
      assert(handedOver.text >= 4.5, `selected "Not sure" text is legible ${at} (${handedOver.text}:1)`);
      assert(chosen.food.border >= 3, `a selected chip's edge stands out from the panel ${at} (${chosen.food.border}:1)`);
      assert(/inset/.test(chosen.food.edge) && !/inset/.test(chosen.wildlife.edge),
        `selection doubles a chip's edge, so a choice is never shown by colour alone ${at}`);
      assert.equal(chosen.food.width, Math.round(foodBox.width),
        `choosing a chip does not change its size, so nothing reflows under a tap ${at}`);
      assert.notEqual(chosen.food.fill, chosen.wildlife.fill, `selected and unselected chips look different ${at}`);
      assert.notEqual(handedOver.fill, chosen.food.fill, `"Not sure" never looks like one of the interests ${at}`);

      /* The keyboard reaches every chip in order, shows where it is, and toggles. */
      if (width === 320 || width === 1440) {
        await page.focus('#traveling-with-children');
        const visited = [];
        for (let step = 0; step < INTEREST_VALUES.length; step += 1) {
          await page.keyboard.press('Tab');
          visited.push(await page.evaluate(() => document.activeElement?.value));
        }
        assert.deepEqual(visited, INTEREST_VALUES, `Tab visits every interest in order ${at}`);
        const ring = await page.evaluate(() => {
          const style = getComputedStyle(document.activeElement.closest('.interest-option'));
          return [style.outlineStyle, style.outlineWidth];
        });
        assert.deepEqual(ring, ['solid', '3px'], `the focused chip carries the site's focus ring ${at}`);
        await page.keyboard.press('Space');
        assert.equal(await page.evaluate(() => document.activeElement.checked), false,
          `Space toggles the focused chip — here, clearing "Not sure" ${at}`);
      }

      // Ticked: the month takes the arrival date's place, and the tickbox follows it.
      await page.evaluate(() => document.querySelector('[data-timing-toggle]').click());
      const approximate = await page.evaluate(() => {
        const q = selector => document.querySelector(selector);
        const box = element => element.getBoundingClientRect();
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          month: {
            top: Math.round(box(q('#travel-month')).top - box(q('#travel-month').closest('.form-row')).top),
            left: Math.round(box(q('#travel-month')).left - box(q('#travel-month').closest('.form-row')).left),
          },
          toggleUnderMonthHelp: Math.round(box(q('.timing-toggle')).top - box(q('#travel-month-help')).bottom),
        };
      });
      assert.equal(approximate.overflow, 0, `no sideways scroll with the month showing ${at}`);
      assert(Math.abs(approximate.month.top - exact.date.top) <= 2 && Math.abs(approximate.month.left - exact.date.left) <= 1,
        `the rough month appears in the arrival date's slot ${at}`);
      assert(approximate.toggleUnderMonthHelp >= -4 && approximate.toggleUnderMonthHelp <= 8,
        `the tickbox stays directly under the month's helper line ${at} (${approximate.toggleUnderMonthHelp}px)`);

      // Children: the age row adds exactly one row gap, above and below.
      await page.selectOption('#traveling-with-children', 'yes');
      const children = await page.evaluate(() => {
        const q = selector => document.querySelector(selector);
        const box = element => element.getBoundingClientRect();
        const ages = q('#children-age-ranges').closest('.form-row');
        return {
          visible: ages.offsetParent !== null,
          above: Math.round(box(ages).top - box(q('#budget-range').closest('.form-row')).bottom),
          below: Math.round(box(q('.interest-set')).top - box(ages).bottom),
        };
      });
      assert.equal(children.visible, true, `children's ages appear when children are selected ${at}`);
      assert(Math.abs(children.above - exact.rowGap) <= 1 && Math.abs(children.below - exact.rowGap) <= 1,
        `the children-age row is spaced like any other row ${at} (${children.above}/${children.below} vs ${exact.rowGap})`);

      assert.deepEqual(failures, [], `no page errors ${at}`);
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

    /* 10. "Not sure — recommend something" hands the choice to us, so it never
           stands beside a specific interest — by pointer or by keyboard — while
           specific interests still combine freely. What is ticked is what is sent. */
    {
      const {context, page, posted, failures} = await openForm(browser, base, {width: 390, height: 844});
      await page.evaluate(() => {
        for (const element of document.querySelectorAll('body *')) {
          if (getComputedStyle(element).position === 'fixed') element.style.setProperty('display', 'none', 'important');
        }
      });
      const ticked = () => page.$$eval('input[name="interests"]:checked', boxes => boxes.map(box => box.value));
      const chip = value => page.locator('.interest-option', {has: page.locator(`input[value="${value}"]`)});
      const press = async value => {
        await page.focus(`input[name="interests"][value="${value}"]`);
        await page.keyboard.press('Space');
      };
      await answerStepOne(page, 'custom');

      // Before any choice: hover and press answer the pointer, and a visitor
      // who has asked for less motion gets the same states without the easing.
      const settle = () => page.evaluate(async () => {
        const chips = [...document.querySelectorAll('.interest-option')];
        for (let running = chips.flatMap(node => node.getAnimations()); running.length; running = chips.flatMap(node => node.getAnimations())) {
          await Promise.all(running.map(animation => animation.finished.catch(() => {})));
        }
      });
      const look = value => page.evaluate(value => {
        const style = getComputedStyle(document.querySelector(`input[name="interests"][value="${value}"]`).closest('.interest-option'));
        return {border: style.borderTopColor, color: style.color, transform: style.transform, easing: style.transitionDuration};
      }, value);
      // Brought to the middle of the screen at once and left to stop moving:
      // a scroll still gliding under a stationary pointer carries the chip away
      // from it, and the press lands on whatever field arrives instead.
      await chip('history-ancestry').evaluate(node => node.scrollIntoView({block: 'center', behavior: 'instant'}));
      await page.waitForFunction(async () => {
        const node = document.querySelector('input[name="interests"][value="history-ancestry"]').closest('.interest-option');
        const top = node.getBoundingClientRect().top;
        await new Promise(resolve => setTimeout(resolve, 150));
        return node.getBoundingClientRect().top === top;
      });
      const resting = await look('history-ancestry');
      // A plain pointer move, as a visitor makes. Locator.hover() scrolls first,
      // and under the page's smooth scrolling that scroll is still gliding when
      // the button goes down, so the press lands on another field.
      const pressAt = await chip('history-ancestry').boundingBox();
      await page.mouse.move(pressAt.x + pressAt.width / 2, pressAt.y + pressAt.height / 2);
      await settle();
      const hovered = await look('history-ancestry');
      assert.notEqual(hovered.border, resting.border, 'hovering a chip brightens its edge');
      assert.notEqual(hovered.color, resting.color, 'hovering a chip brightens its words');
      await page.mouse.down();
      await settle();
      assert.notEqual((await look('history-ancestry')).transform, 'none', 'pressing a chip gives slightly under the finger');
      await page.mouse.up();
      await chip('history-ancestry').click();
      assert.deepEqual(await ticked(), [], 'that press was a real tick, and a second click clears it');
      await page.emulateMedia({reducedMotion: 'reduce'});
      assert.match((await look('food')).easing, /^0s(, 0s)*$/, 'no easing for a visitor who asked for less motion');
      await page.emulateMedia({reducedMotion: 'no-preference'});

      await chip('food').click();
      await chip('wildlife').click();
      assert.deepEqual(await ticked(), ['food', 'wildlife'], 'specific interests combine');
      await chip('not-sure').click();
      assert.deepEqual(await ticked(), ['not-sure'], 'choosing "Not sure" clears every specific interest');
      await chip('community').click();
      assert.deepEqual(await ticked(), ['community'], 'choosing an interest clears "Not sure"');
      await chip('photography').click();
      assert.deepEqual(await ticked(), ['community', 'photography'], 'interests still combine after "Not sure" was cleared');
      await chip('photography').click();
      assert.deepEqual(await ticked(), ['community'], 'unticking one interest leaves the others alone');

      await press('not-sure');
      assert.deepEqual(await ticked(), ['not-sure'], 'Space on "Not sure" clears the interests too');
      await press('not-sure');
      assert.deepEqual(await ticked(), [], 'unticking "Not sure" brings nothing back');
      await press('food');
      await press('not-sure');
      await press('adventure');
      assert.deepEqual(await ticked(), ['adventure'], 'Space on an interest clears "Not sure"');

      await chip('not-sure').click();
      await next(page);
      await answerStepTwo(page);
      await page.click('.contact-form button[type="submit"]');
      await page.waitForFunction(() => document.querySelector('.booking-success:not([hidden])') || document.querySelector('.form-error:not([data-step-error])')?.textContent.trim());
      assert.equal(posted.length, 1, 'the enquiry must be sent');
      assert.equal(posted[0].interests, 'not-sure', 'only "Not sure" is sent once it has cleared the rest');
      assert.deepEqual(failures, []);
      await context.close();
    }

    console.log('Booking required-field tests passed (10 cases, the chip case at seven widths).');
  } finally {
    await browser.close();
    hosted.server.close();
  }
})().catch(error => { console.error(error); process.exit(1); });
