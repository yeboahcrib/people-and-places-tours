const {chromium} = require('playwright');
const {join} = require('node:path');
const {tmpdir} = require('node:os');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8081';
const screenshotPath = name => join(tmpdir(), `people-places-${name}.png`);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function pathwayState(page) {
  return page.locator('[data-home-section="waysToExperience"]').evaluate(section => {
    const sectionRect = section.getBoundingClientRect();
    const firstCard = section.querySelector('.pathway-card');
    return {
      progress: Number(getComputedStyle(section).getPropertyValue('--pathway-progress')),
      scale: Number(getComputedStyle(section).getPropertyValue('--pathway-scale')),
      sectionWidth: sectionRect.width,
      cardTransform: getComputedStyle(firstCard).transform,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    };
  });
}

(async () => {
  const browser = await chromium.launch({headless: true});

  for (const width of [375, 768, 1440]) {
    const context = await browser.newContext({viewport: {width, height: 900}, hasTouch: width <= 768, isMobile: width <= 430});
    const page = await context.newPage();
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${BASE_URL}/index.html`, {waitUntil: 'load'});

    const section = page.locator('[data-home-section="waysToExperience"]');
    await page.evaluate(() => {
      const target = document.querySelector('[data-home-section="waysToExperience"]');
      window.scrollTo({top: target.offsetTop - (innerHeight * .92), behavior: 'instant'});
    });
    await page.waitForTimeout(100);
    const initial = await pathwayState(page);
    if (width === 1440) await page.screenshot({path: screenshotPath('pathway-section-small-desktop')});

    await page.mouse.wheel(0, 760);
    await page.waitForTimeout(140);
    const expanded = await pathwayState(page);
    if (width === 1440) await page.screenshot({path: screenshotPath('pathway-section-expanded-desktop')});
    if (width === 375) await page.screenshot({path: screenshotPath('pathway-section-expanded-mobile')});

    assert(initial.scale < .9, `section did not begin small at ${width}px: ${JSON.stringify(initial)}`);
    assert(expanded.scale > .99, `section did not expand fully at ${width}px: ${JSON.stringify(expanded)}`);
    assert(expanded.progress > initial.progress, `scroll progress did not increase at ${width}px`);
    assert(initial.cardTransform !== expanded.cardTransform, `photo cards did not move at ${width}px`);

    await page.mouse.wheel(0, 600);
    await page.waitForTimeout(100);
    const past = await pathwayState(page);
    assert(past.scale > .99, `section did not remain expanded after passing it at ${width}px`);

    await page.evaluate(() => {
      const target = document.querySelector('[data-home-section="waysToExperience"]');
      window.scrollTo({top: target.offsetTop - (innerHeight * .92), behavior: 'instant'});
    });
    await page.waitForTimeout(120);
    const reversed = await pathwayState(page);
    assert(reversed.scale < .9, `section did not reverse to its small state at ${width}px: ${JSON.stringify(reversed)}`);
    assert(reversed.documentWidth <= reversed.viewportWidth + 1, `section causes horizontal overflow at ${width}px: ${JSON.stringify(reversed)}`);
    assert(errors.length === 0, `console errors at ${width}px: ${errors.join('\n')}`);
    await context.close();
  }

  const reduced = await browser.newContext({viewport: {width: 768, height: 900}, reducedMotion: 'reduce'});
  const reducedPage = await reduced.newPage();
  await reducedPage.goto(`${BASE_URL}/index.html`, {waitUntil: 'load'});
  const reducedState = await pathwayState(reducedPage);
  assert(reducedState.scale === 1, `reduced motion did not preserve the normal layout: ${JSON.stringify(reducedState)}`);
  await reduced.close();

  await browser.close();
  console.log('Pathway section checks passed: small-to-expanded scroll, photo movement, reverse scroll, persistent expanded state, responsive overflow, reduced motion, and console.');
  console.log(`Screenshots: ${screenshotPath('pathway-section-small-desktop')}, ${screenshotPath('pathway-section-expanded-desktop')}, ${screenshotPath('pathway-section-expanded-mobile')}`);
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
