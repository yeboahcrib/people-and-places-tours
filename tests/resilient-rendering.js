const {chromium} = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8081';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({headless: true});
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: {width: 375, height: 900},
    reducedMotion: 'reduce',
  });

  const home = await context.newPage();
  // Wait for stylesheets as well as HTML. Measuring layout at
  // `domcontentloaded` can briefly report overflow before CSS is applied.
  await home.goto(`${BASE_URL}/index.html`, {waitUntil: 'load'});
  const homeState = await home.evaluate(() => ({
    sections: document.querySelectorAll('[data-home-section]').length,
    cards: document.querySelectorAll('.trip-card').length,
    h1: document.querySelector('h1')?.textContent.trim(),
    invisibleContent: [...document.querySelectorAll('.reveal')].filter(element => getComputedStyle(element).opacity === '0').length,
  }));
  assert(homeState.sections === 10, `JavaScript-free homepage has ${homeState.sections} sections`);
  assert(homeState.cards === 4, `JavaScript-free homepage has ${homeState.cards} featured tours`);
  assert(homeState.h1, 'JavaScript-free homepage has no h1');
  assert(homeState.invisibleContent === 0, `JavaScript-free homepage hides ${homeState.invisibleContent} reveal elements`);

  const packages = await context.newPage();
  await packages.goto(`${BASE_URL}/packages.html`, {waitUntil: 'load'});
  const packageState = await packages.evaluate(() => ({
    cards: document.querySelectorAll('.tour-card').length,
    detailLinks: document.querySelectorAll('.tour-card-stretched-link').length,
    inquiryLinks: document.querySelectorAll('.tour-card-book-btn').length,
    width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    viewport: document.documentElement.clientWidth,
    overflowing: [...document.querySelectorAll('body *')]
      .map(element => {
        const rect = element.getBoundingClientRect();
        return {tag: element.tagName, className: String(element.className || '').slice(0, 100), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width)};
      })
      .filter(rect => rect.right > document.documentElement.clientWidth + 1 || rect.left < -1)
      .slice(0, 10),
  }));
  assert(packageState.cards === 15, `JavaScript-free packages page has ${packageState.cards} tours`);
  assert(packageState.detailLinks === 15, 'JavaScript-free tour detail links are incomplete');
  assert(packageState.inquiryLinks === 15, 'JavaScript-free inquiry links are incomplete');
  assert(packageState.width <= packageState.viewport + 1, `JavaScript-free packages page overflows horizontally: ${JSON.stringify(packageState.overflowing)}`);

  await context.close();
  await browser.close();
  console.log('JavaScript-free resilient-rendering checks passed.');
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
