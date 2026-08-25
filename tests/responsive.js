const {chromium} = require('playwright');

const {serveDist} = require('./serve-dist.js');

// Serves dist/, not the source tree. Tour pages are generated from the CMS and
// have no file in the repository, and the navigation and footer are injected at
// build time — so a source server both 404s on tour pages and cannot see a
// navigation change at all. An explicit BASE_URL still wins.
let BASE_URL = process.env.BASE_URL;
const widths = [375, 430, 768, 1024, 1440];
const pages = [
  '/index.html',
  '/packages.html',
  '/about.html',
  '/contact.html',
  '/accra-city-tour.html',
  '/just-go-ghana.html',
  '/cancellation-refund-policy.html',
  '/travel-insurance.html',
  '/privacy-policy.html',
  '/booking-terms.html',
  '/travel-information.html',
  '/cape-coast-day-tour.html',
  '/volta-community-tour.html',
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const hosted = BASE_URL ? null : await serveDist();
  BASE_URL = BASE_URL || hosted.origin;
  const browser = await chromium.launch({headless: true});

  for (const width of widths) {
    const context = await browser.newContext({
      viewport: {width, height: 900},
      hasTouch: width <= 768,
      isMobile: width <= 430,
      reducedMotion: 'reduce',
    });

    for (const path of pages) {
      const page = await context.newPage();
      // Layout and reduced-motion assertions depend on the final stylesheet,
      // so wait for page resources rather than measuring unstyled HTML.
      await page.goto(`${BASE_URL}${path}`, {waitUntil: 'load'});
      await page.waitForTimeout(50);

      const audit = await page.evaluate(() => {
        const visible = element => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
        };
        const criticalControls = [...document.querySelectorAll('.nav-toggle, .btn, button, input:not([type="hidden"]):not([tabindex="-1"]), select, textarea')]
          .filter(visible)
          .map(element => {
            const rect = element.getBoundingClientRect();
            return {
              label: element.getAttribute('aria-label') || element.textContent.trim().slice(0, 50) || element.name || element.id,
              width: Math.round(rect.width),
              height: Math.round(rect.height),
              fontSize: parseFloat(getComputedStyle(element).fontSize),
              tag: element.tagName,
            };
          });
        const documentWidth = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
        const navLinks = document.querySelector('.nav-links');
        const navToggle = document.querySelector('.nav-toggle');

        // `body { overflow-x: hidden }` hides anything that runs past the right
        // edge, so document width alone cannot catch a clipped control. The
        // booking button is measured directly: adding a fifth navigation link
        // once pushed it off screen between 1024px and 1180px, and every
        // existing check still passed.
        const navCta = document.querySelector('.nav-cta .btn-primary');
        const navCtaRect = navCta ? navCta.getBoundingClientRect() : null;

        return {
          documentWidth,
          viewportWidth: document.documentElement.clientWidth,
          navCta: navCtaRect && visible(navCta)
            ? {right: Math.round(navCtaRect.right), left: Math.round(navCtaRect.left)}
            : null,
          navLinksVisible: navLinks ? visible(navLinks) : false,
          navToggleVisible: navToggle ? visible(navToggle) : false,
          criticalControls,
          h1Count: document.querySelectorAll('h1').length,
          invisibleRevealCount: [...document.querySelectorAll('.reveal')].filter(element => getComputedStyle(element).opacity === '0').length,
          invisibleReveals: [...document.querySelectorAll('.reveal')]
            .filter(element => getComputedStyle(element).opacity === '0')
            .slice(0, 5)
            .map(element => ({className: element.className, section: element.closest('[data-home-section]')?.getAttribute('data-home-section')})),
        };
      });

      assert(audit.documentWidth <= audit.viewportWidth + 1, `${path} overflows horizontally at ${width}px (${audit.documentWidth}px document)`);
      assert(audit.h1Count === 1, `${path} should have exactly one h1 at ${width}px, got ${audit.h1Count}`);
      if (audit.navCta) {
        assert(
          audit.navCta.right <= audit.viewportWidth,
          `${path} clips the "Book a Tour" button at ${width}px (button ends at ${audit.navCta.right}px, viewport is ${audit.viewportWidth}px)`,
        );
        assert(audit.navCta.left >= 0, `${path} pushes the "Book a Tour" button off the left edge at ${width}px`);
      }
      assert(audit.invisibleRevealCount === 0, `${path} hides reveal content with reduced motion at ${width}px: ${JSON.stringify(audit.invisibleReveals)}`);

      if (width <= 768) {
        assert(!audit.navLinksVisible, `${path} desktop navigation is visible at ${width}px`);
        assert(audit.navToggleVisible, `${path} mobile navigation toggle is hidden at ${width}px`);
        const undersized = audit.criticalControls.filter(control => control.width < 32 || control.height < 32);
        assert(undersized.length === 0, `${path} has undersized critical controls at ${width}px: ${JSON.stringify(undersized)}`);

        if (path === '/contact.html' && width <= 430) {
          const smallFormText = audit.criticalControls.filter(control => ['INPUT', 'SELECT', 'TEXTAREA'].includes(control.tag) && control.fontSize < 16);
          assert(smallFormText.length === 0, `${path} form controls may trigger mobile zoom at ${width}px: ${JSON.stringify(smallFormText)}`);
        }
      } else {
        assert(audit.navLinksVisible, `${path} desktop navigation is hidden at ${width}px`);
        assert(!audit.navToggleVisible, `${path} mobile navigation toggle is visible at ${width}px`);
      }

      await page.close();
    }

    await context.close();
  }

  await browser.close();
  hosted?.server.close();
  console.log(`Responsive checks passed across ${pages.length} page templates at ${widths.join(' / ')}px.`);
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
