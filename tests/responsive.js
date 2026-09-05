const {chromium} = require('playwright');

const {serveDist} = require('./serve-dist.js');

// Serves dist/, not the source tree. Tour pages are generated from the CMS and
// have no file in the repository, and the navigation and footer are injected at
// build time — so a source server both 404s on tour pages and cannot see a
// navigation change at all. An explicit BASE_URL still wins.
let BASE_URL = process.env.BASE_URL;
// 320 is WCAG 1.4.10's reflow width, not a device width — it is the point the
// spec names, and it sat below this suite's floor. .contact-info-grid
// overflowed by 14px there for as long as the page has existed, invisible to
// every check because the smallest width tested was 375.
const widths = [320, 375, 430, 768, 1024, 1440];
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

        // An <img> carrying width/height attributes with a percentage CSS width
        // and no height:auto renders at the attribute's height, so aspect-ratio
        // and the natural proportions are both ignored and the photograph is
        // squashed. It shipped twice in one day — the add-ons photo and the
        // About founders photo, the latter 24.6% off at desktop and 52% at
        // mobile. object-fit cover/contain are excluded: those crop by design.
        const stretchedImages = [...document.images]
          .filter(visible)
          .filter(img => img.naturalWidth > 0 && img.naturalHeight > 0)
          .filter(img => !['cover', 'contain', 'scale-down', 'none'].includes(getComputedStyle(img).objectFit))
          .map(img => {
            const rect = img.getBoundingClientRect();
            const natural = img.naturalWidth / img.naturalHeight;
            const rendered = rect.width / rect.height;
            return {
              src: (img.getAttribute('src') || '').split('/').pop().slice(0, 48),
              skew: Math.abs(rendered - natural) / natural,
              rendered: `${Math.round(rect.width)}x${Math.round(rect.height)}`,
              natural: `${img.naturalWidth}x${img.naturalHeight}`,
            };
          })
          .filter(img => img.skew > 0.05);

        // A clamped quote with no way to open it is a truncated customer review
        // shown under the words "Verified Google review". The button used to be
        // decided by character count, which cannot know how many lines a quote
        // wraps to: at 375px that stranded four quotes and at 320px seven, one
        // of them only 75 characters long.
        const strandedQuotes = [...document.querySelectorAll('.testi-quote')]
          .filter(q => q.scrollHeight > q.clientHeight + 1)
          .filter(q => { const btn = q.nextElementSibling; return !btn || !btn.classList.contains('testi-read-more') || btn.hidden; })
          .map(q => q.textContent.trim().slice(0, 40));

          // Real-device QA found the back link underneath the floating nav pill
          // on Just Go Ghana: the nav is fixed, so a hero with too little top
          // padding puts the link behind it.
          //
          // Hit-test rather than measure a gap: the nav is a centred pill, so a
          // vertical overlap only matters where the pill is actually above the
          // link. This caught the same defect at 1440px, where the link was
          // rendering inside the pill and blocked at every point across it.
          const backLink = [...document.querySelectorAll('a')]
            .find(a => /back to all experiences/i.test(a.textContent));
          const backLinkBlocked = backLink ? (() => {
            const r = backLink.getBoundingClientRect();
            const y = r.top + r.height / 2;
            return [r.left + 8, r.left + r.width / 2, r.right - 8]
              .map(x => document.elementFromPoint(x, y))
              .some(el => !el || !(el === backLink || backLink.contains(el)));
          })() : null;

          // A CMS starting point can be a sentence. When the label and value
          // share a line and the value wraps, they run together and read as
          // "DeparturePickup and drop-off…". The value must begin either clear
          // to the right of its label or on a line below it.
          const collidedMetaRows = [...document.querySelectorAll('.trip-meta-item')]
            .filter(row => {
              const label = row.querySelector('strong');
              if (!label) return false;
              const valueNode = [...row.childNodes]
                .find(node => node.nodeType === 3 && node.textContent.trim());
              if (!valueNode) return false;
              const range = document.createRange();
              range.selectNodeContents(valueNode);
              const value = range.getBoundingClientRect();
              const box = label.getBoundingClientRect();
              return !(value.left >= box.right - 1 || value.top >= box.bottom - 1);
            })
            .map(row => row.textContent.replace(/\s+/g, ' ').trim().slice(0, 40));

        return {
          documentWidth,
          strandedQuotes,
          stretchedImages,
          backLinkBlocked,
          collidedMetaRows,
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
      assert(
        audit.strandedQuotes.length === 0,
        `${path} truncates ${audit.strandedQuotes.length} review(s) with no way to expand at ${width}px: ` +
        audit.strandedQuotes.map(q => `"${q}…"`).join(', '),
      );
      assert(
        audit.stretchedImages.length === 0,
        `${path} distorts ${audit.stretchedImages.length} image(s) at ${width}px: ` +
        audit.stretchedImages.map(i => `${i.src} rendered ${i.rendered} from ${i.natural} (${Math.round(i.skew * 100)}% off)`).join('; '),
      );

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

      if (audit.backLinkBlocked !== null) {
        assert(!audit.backLinkBlocked,
          `${path} back link is covered by the floating nav at ${width}px`);
      }
      assert(audit.collidedMetaRows.length === 0,
        `${path} Trip Details label runs into its value at ${width}px: `
        + JSON.stringify(audit.collidedMetaRows));

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
