const { chromium } = require('playwright');

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8081';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function withPage(browser, path, callback) {
  const page = await browser.newPage();
  const consoleErrors = [];
  const pageErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', error => pageErrors.push(error.message));

  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'domcontentloaded' });
  await callback(page);

  assert(pageErrors.length === 0, `${path} page errors:\n${pageErrors.join('\n')}`);
  assert(consoleErrors.length === 0, `${path} console errors:\n${consoleErrors.join('\n')}`);
  await page.close();
}

(async () => {
  const browser = await chromium.launch({ headless: true });

  await withPage(browser, '/index.html', async page => {
    await page.waitForSelector('.trip-card');
    const homepageContentLoaded = await page.evaluate(() => Boolean(window.PEOPLE_PLACES_HOME?.hero));
    assert(homepageContentLoaded, 'homepage content data did not load');

    const renderedSections = await page.locator('#homepage-root [data-home-section]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-home-section')));
    const expectedSections = ['hero', 'founderStory', 'waysToExperience', 'availableTours', 'howHosted', 'guestStory', 'reviewsAndTrust', 'planningProcess', 'stories', 'finalInvitation'];
    assert(renderedSections.join('|') === expectedSections.join('|'), `unexpected homepage section order: ${renderedSections.join(', ')}`);

    const cards = await page.locator('.trip-card').count();
    const searchItems = await page.locator('.cmd-item').count();
    assert(cards === 4, `expected 4 homepage trip cards, got ${cards}`);
    assert(searchItems === 15, `expected 15 command palette items, got ${searchItems}`);

    const firstCardImage = page.locator('.trip-card-img img').first();
    assert(await firstCardImage.getAttribute('width') === '800', 'homepage tour card image is missing width');
    assert(await firstCardImage.getAttribute('height') === '560', 'homepage tour card image is missing height');
    assert(await firstCardImage.getAttribute('decoding') === 'async', 'homepage tour card image is missing async decoding');

    const storiesLink = await page.locator('.stories-strip .ig-follow-btn').count();
    assert(storiesLink === 1, `expected the Instagram follow-out link in the stories strip, got ${storiesLink}`);

    const inlineSectionBackgrounds = await page.locator('.sec-img-head[style*="background-image"]').count();
    assert(inlineSectionBackgrounds === 0, `expected no inline section background images, got ${inlineSectionBackgrounds}`);

    const lazySectionImages = await page.locator('.sec-img-head-media[loading="lazy"][width="1920"][height="720"]').count();
    assert(lazySectionImages === 1, `expected 1 lazy section header image, got ${lazySectionImages}`);
  });

  await withPage(browser, '/packages.html', async page => {
    await expectPageHeroImage(page, 'packages page hero');

    await page.waitForSelector('.tour-card');
    const allCards = await page.locator('.tour-card').count();
    assert(allCards === 15, `expected 15 package tour cards, got ${allCards}`);

    const firstCardImage = page.locator('.tour-card-img img').first();
    assert(await firstCardImage.getAttribute('width') === '800', 'package tour card image is missing width');
    assert(await firstCardImage.getAttribute('height') === '550', 'package tour card image is missing height');
    assert(await firstCardImage.getAttribute('sizes') !== null, 'package tour card image is missing sizes');

    await page.locator('.filter-tab[data-filter="cape-coast"]').click();
    const visibleCapeCoast = await page.locator('.tour-card:visible').count();
    assert(visibleCapeCoast === 2, `expected 2 visible Cape Coast tours, got ${visibleCapeCoast}`);

    await page.locator('.filter-tab[data-filter="all"]').click();
    const visibleAll = await page.locator('.tour-card:visible').count();
    assert(visibleAll === 15, `expected 15 visible tours after reset, got ${visibleAll}`);
  });

  await withPage(browser, '/about.html', async page => {
    await expectPageHeroImage(page, 'about page hero');
  });

  await withPage(browser, '/contact.html?tour=cape-coast', async page => {
    await expectPageHeroImage(page, 'contact page hero');

    const selected = await page.locator('#tour-interest').inputValue();
    const hidden = await page.locator('#tour-name').inputValue();
    assert(selected === 'cape-coast', `expected cape-coast selected, got ${selected}`);
    assert(hidden === 'Cape Coast Ancestral Tour - $160', `unexpected hidden tour name: ${hidden}`);
  });

  await withPage(browser, '/contact.html?tour=batik-workshop', async page => {
    const selected = await page.locator('#tour-interest').inputValue();
    const hidden = await page.locator('#tour-name').inputValue();
    assert(selected === 'batik-workshop', `expected batik-workshop selected, got ${selected}`);
    assert(hidden === 'Batik & Pottery Workshop - $120', `unexpected hidden tour name: ${hidden}`);
  });

  await withPage(browser, '/thanks.html', async page => {
    await expectPageHeroImage(page, 'thanks page hero');
  });

  await withPage(browser, '/accra-city-tour.html', async page => {
    const heroImage = page.locator('.hero-img-placeholder img').first();
    assert(await heroImage.getAttribute('width') === '1920', 'tour hero image is missing width');
    assert(await heroImage.getAttribute('height') === '400', 'tour hero image is missing height');
    assert(await heroImage.getAttribute('fetchpriority') === 'high', 'tour hero image is missing high fetch priority');

    const firstFaq = page.locator('.faq-item').first();
    const firstQuestion = page.locator('.faq-q').first();

    await firstQuestion.click();
    await expectClass(firstFaq, 'open', 'tour FAQ did not open on click');

    await firstQuestion.press('Enter');
    await expectNoClass(firstFaq, 'open', 'tour FAQ did not close on keyboard toggle');
  });

  await withPage(browser, '/just-go-ghana.html', async page => {
    const firstDay = page.locator('.day-item').first();
    const firstHeader = page.locator('.day-header').first();

    await firstHeader.click();
    await expectClass(firstDay, 'open', 'itinerary day did not open on click');

    await firstHeader.press(' ');
    await expectNoClass(firstDay, 'open', 'itinerary day did not close on keyboard toggle');
  });

  await withPage(browser, '/index.html', async page => {
    await page.setViewportSize({ width: 390, height: 844 });
    const nav = page.locator('.nav-mobile');
    await page.locator('.nav-toggle').click();
    await expectClass(nav, 'open', 'mobile nav did not open');
    await page.locator('.nav-toggle').click();
    await expectNoClass(nav, 'open', 'mobile nav did not close');
  });

  await browser.close();
  console.log('Smoke tests passed.');
})().catch(async error => {
  console.error(error.message);
  process.exit(1);
});

async function expectClass(locator, className, message) {
  const classes = await locator.getAttribute('class');
  assert((classes || '').split(/\s+/).includes(className), message);
}

async function expectNoClass(locator, className, message) {
  const classes = await locator.getAttribute('class');
  assert(!(classes || '').split(/\s+/).includes(className), message);
}

async function expectPageHeroImage(page, label) {
  const legacyBackgrounds = await page.locator('.page-hero-bg[style*="background-image"]').count();
  assert(legacyBackgrounds === 0, `${label} still uses an inline background image`);

  const heroImage = page.locator('.page-hero > img.page-hero-bg').first();
  assert(await heroImage.count() === 1, `${label} image element is missing`);
  assert(await heroImage.getAttribute('width') === '1920', `${label} image is missing width`);
  assert(await heroImage.getAttribute('height') === '720', `${label} image is missing height`);
  assert(await heroImage.getAttribute('decoding') === 'async', `${label} image is missing async decoding`);
  assert(await heroImage.getAttribute('fetchpriority') === 'high', `${label} image is missing high fetch priority`);
}
