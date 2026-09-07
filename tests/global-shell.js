/*
 * The shell — navigation, footer, contact details, social links — as a
 * visitor gets it.
 *
 * The contract tests next door prove the adapter cannot change a destination.
 * This one proves the built pages agree: the same menu on every page, the same
 * footer, the routes still resolving, the mobile drawer still working, and the
 * contact details on the contact page and the policy pages still matching the
 * ones in the footer. Those last two matter because siteSettings reaches
 * further than the shell — a globals edit lands on the policy contact block
 * and every data-site-copy binding too, and nothing else checks that they stay
 * in step.
 */
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const {serveDist} = require('./serve-dist.js');

const PAGES = ['/', '/about', '/packages', '/contact', '/travel-information', '/privacy-policy', '/cape-coast-tour'];
const LEGAL = ['booking-terms', 'cancellation-refund-policy', 'travel-insurance', 'privacy-policy'];

const shell = page => page.evaluate(() => {
  const abs = a => a.getAttribute('href');
  const nav = document.querySelector('nav.nav');
  const footer = document.querySelector('footer.footer');
  return {
    desktop: [...nav.querySelectorAll('.nav-links a')].map(a => ({label: a.textContent.trim(), href: abs(a)})),
    mobile: [...nav.querySelectorAll('.nav-mobile a:not(.btn)')].map(a => ({label: a.textContent.trim(), href: abs(a)})),
    navPhone: abs(nav.querySelector('.nav-phone')),
    navCta: abs(nav.querySelector('.nav-cta .btn')),
    tagline: footer.querySelector('.footer-brand p')?.textContent.trim(),
    social: [...footer.querySelectorAll('.footer-social a')].map(a => ({label: a.getAttribute('aria-label'), href: abs(a)})),
    columns: [...footer.querySelectorAll('.footer-col')].map(col => ({
      heading: col.querySelector('h2').textContent.trim(),
      links: [...col.querySelectorAll('a')].map(a => ({label: a.textContent.trim(), href: abs(a)})),
    })),
  };
});

(async () => {
  const hosted = await serveDist();
  const base = process.env.BASE_URL || hosted.origin;
  const browser = await chromium.launch();
  const open = async (path, viewport) => {
    const page = await browser.newPage({viewport, reducedMotion: 'reduce'});
    const response = await page.goto(base + path, {waitUntil: 'load'});
    page.httpStatus = response?.status();
    return page;
  };

  // 1. One shell, every page. A global that differs per page is not global.
  let reference;
  for (const path of PAGES) {
    const page = await open(path, {width: 1440, height: 900});
    const seen = await shell(page);
    if (!reference) reference = seen;
    else assert.deepEqual(seen, reference, `the shell differs on ${path}`);
    await page.close();
  }

  // 2. Every route in the shell actually resolves. This is the check that
  //    would have caught a renamed destination before a visitor did.
  const seenStatus = new Map();
  const internal = [...reference.desktop, ...reference.columns.flatMap(c => c.links)]
    .map(l => l.href)
    .filter(href => !/^(?:https?:|mailto:|tel:|#)/.test(href));
  assert(internal.length >= 15, `expected the full set of internal links, saw ${internal.length}`);
  for (const href of new Set(internal)) {
    // Built links are relative ("about"), which is what the browser resolves
    // against the current page; the probe needs them root-absolute.
    const probe = await open(href.startsWith('/') ? href : '/' + href, {width: 1440, height: 900});
    seenStatus.set(href, probe.httpStatus);
    // The status, not the page title: a missing page still renders a shell,
    // and a title check quietly passed a link pointing at a 404.
    assert.equal(probe.httpStatus, 200, `${href} does not resolve (HTTP ${probe.httpStatus})`);
    await probe.close();
  }

  // 3. The links that must never disappear, whatever a CMS says.
  const legalColumn = reference.columns.find(c => c.heading.toLowerCase().includes('legal'));
  assert(legalColumn, 'the footer has no legal column');
  for (const page of LEGAL) {
    assert(legalColumn.links.some(l => l.href.replace(/^\//, '') === page),
      `the ${page} link is missing from the footer`);
  }
  const reach = reference.columns.flatMap(c => c.links);
  assert(reach.some(l => l.href.startsWith('mailto:')), 'the footer has no email link');
  assert(reach.some(l => l.href.startsWith('tel:')), 'the footer has no phone link');
  assert.equal(reference.social.length, 3, 'the footer lost a social profile');
  for (const {label, href} of reference.social) {
    assert(/^https:\/\//.test(href), `the ${label} link is not https`);
  }

  // 4. Desktop and mobile menus are the same menu.
  assert.deepEqual(reference.mobile, reference.desktop,
    'the mobile drawer and the desktop menu disagree');

  // 5. The mobile drawer still opens, and the CTA is inside it rather than in
  //    the collapsed pill. Behaviour, not layout — this phase must not change it.
  {
    const page = await open('/', {width: 375, height: 812});
    const toggle = page.locator('.nav-toggle');
    await assert.doesNotReject(toggle.waitFor({state: 'visible', timeout: 4000}),
      'the mobile menu button is not visible at 375px');
    assert.equal(await page.locator('.nav-mobile').isVisible(), false, 'the drawer starts open');
    await toggle.click();
    await page.waitForTimeout(450);
    assert.equal(await page.locator('.nav-mobile').isVisible(), true, 'the drawer did not open');
    assert.equal(await page.locator('.nav-mobile .nav-mobile-cta').isVisible(), true,
      'Book a Tour is not in the mobile drawer');
    assert.equal(await toggle.getAttribute('aria-expanded'), 'true', 'aria-expanded did not follow the drawer');
    await page.close();
  }

  // 6. Contact details are one value, not four. The footer, the contact page
  //    and the policy pages all read the same siteSettings, so they have to
  //    agree — this is what a globals edit is checked against.
  const phoneDigits = reference.navPhone.replace(/[^\d]/g, '');
  const footerEmail = reach.find(l => l.href.startsWith('mailto:')).href.replace('mailto:', '');
  {
    const page = await open('/contact', {width: 1440, height: 900});
    const shown = await page.evaluate(() => ({
      phone: document.querySelector('[data-site-copy="primaryPhone"]')?.textContent.trim(),
      email: document.querySelector('[data-site-copy="email"]')?.textContent.trim(),
      handle: document.querySelector('[data-site-copy="instagramHandle"]')?.textContent.trim(),
    }));
    assert.equal(shown.phone.replace(/[^\d]/g, ''), phoneDigits,
      'the contact page shows a different phone number from the navigation');
    assert.equal(shown.email, footerEmail,
      'the contact page shows a different email from the footer');
    assert(shown.handle?.startsWith('@'), 'the Instagram handle is missing from the contact page');
    await page.close();
  }
  for (const policy of LEGAL) {
    const page = await open('/' + policy, {width: 1440, height: 900});
    const contact = await page.evaluate(() => [...document.querySelectorAll('[data-policy-contact] a, .policy-contact a')]
      .map(a => a.getAttribute('href')));
    assert(contact.some(h => h === `mailto:${footerEmail}`),
      `${policy} does not offer the site email`);
    assert(contact.some(h => h.includes(phoneDigits)),
      `${policy} does not offer the site phone number`);
    await page.close();
  }

  await browser.close();
  hosted.server.close();
  console.log(`Global shell checks passed (${PAGES.length} pages, ${seenStatus.size} routes, desktop + mobile).`);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
