const {chromium} = require('playwright');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {serveDist, DIST_ROOT} = require('./serve-dist.js');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// These checks only make sense against dist/. The homepage and the packages
// grid are assembled at build time, so the editable source tree legitimately
// has an empty homepage shell and no tour cards — pointing this suite at the
// dev server reports failures that are not real. Serve dist/ ourselves rather
// than relying on whoever runs this to remember a port.
(async () => {
  // An explicit BASE_URL still wins, for CI setups that already serve a build.
  const hosted = process.env.BASE_URL ? null : await serveDist();
  const BASE_URL = process.env.BASE_URL || hosted.origin;

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
  assert(homeState.sections === 7, `JavaScript-free homepage has ${homeState.sections} sections`);
  assert(homeState.cards === 0, `JavaScript-free homepage still has ${homeState.cards} featured tours`);
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
  // The catalogue size is whatever the build rendered, not a number frozen
  // here: an editor switching a tour off in Sanity must not fail this suite.
  const expectedTours = JSON.parse(readFileSync(join(DIST_ROOT, 'health.json'), 'utf8')).tourCount;
  assert(Number.isInteger(expectedTours) && expectedTours > 0, 'dist/health.json has no usable tour count');
  assert(packageState.cards === expectedTours, `JavaScript-free packages page has ${packageState.cards} tours, expected ${expectedTours}`);
  assert(packageState.detailLinks === expectedTours, 'JavaScript-free tour detail links are incomplete');
  assert(packageState.inquiryLinks === expectedTours, 'JavaScript-free inquiry links are incomplete');
  assert(packageState.width <= packageState.viewport + 1, `JavaScript-free packages page overflows horizontally: ${JSON.stringify(packageState.overflowing)}`);

  // The contact form is the page where a JavaScript failure costs an enquiry
  // rather than polish. Everything above checks that content still renders;
  // these check that a visitor can still reach the team.
  const contact = await context.newPage();
  await contact.goto(`${BASE_URL}/contact.html`, {waitUntil: 'load'});
  const formState = await contact.evaluate(() => {
    const form = document.querySelector('.contact-form');
    if (!form) return null;
    return {
      action: form.getAttribute('action') || '',
      method: (form.getAttribute('method') || '').toUpperCase(),
      // Read the attribute, not the property: this test exists to prove the
      // markup does not carry it, since script.js sets the property instead.
      hasNoValidateAttribute: form.hasAttribute('novalidate'),
      requiredFields: [...form.querySelectorAll('[required]')].map(field => field.name),
      // Without JavaScript there is no step-by-step flow, so every field the
      // visitor must fill has to be on screen and reachable at once.
      visibleInputs: [...form.querySelectorAll('input, textarea, select')]
        .filter(field => field.type !== 'hidden' && field.offsetParent !== null).length,
      redirectTarget: form.querySelector('input[name="_next"]')?.value || '',
      captchaDisabled: form.querySelector('input[name="_captcha"]')?.value === 'false',
      formSubmitHoneypot: Boolean(form.querySelector('input[name="_honey"]')),
      countryField: Boolean(form.querySelector('input[name="country"][maxlength="100"]')),
      planningFields: ['departure-date', 'date-flexibility', 'traveling-with-children', 'children-age-ranges', 'accommodation', 'contact-method']
        .every(name => Boolean(form.querySelector(`[name="${name}"]`))),
      tourOptions: form.querySelectorAll('#tour-interest option').length,
      tourOptionLabels: [...form.querySelectorAll('#tour-interest option')].map(option => option.textContent.trim()),
    };
  });

  assert(formState, 'JavaScript-free contact page has no contact form at all');
  assert(formState.action.startsWith('http'), 'JavaScript-free form has no absolute action to post to');
  assert(formState.method === 'POST', `JavaScript-free form method is ${formState.method}`);

  // With the attribute in the markup nothing validates the form when the
  // script is absent, so an enquiry can arrive with no address to reply to.
  assert(!formState.hasNoValidateAttribute,
    'contact form carries novalidate in the markup, so a visitor without JavaScript gets no validation at all');

  for (const field of ['first-name', 'last-name', 'email']) {
    assert(formState.requiredFields.includes(field),
      `JavaScript-free form does not require ${field}, so an unanswerable enquiry can be sent`);
  }
  assert(formState.countryField, 'JavaScript-free form is missing the optional country field');
  assert(formState.planningFields, 'JavaScript-free form is missing one or more unified planning fields');

  // FormSubmit's built-in CAPTCHA is reCAPTCHA, which needs JavaScript to draw
  // its checkbox — and every visitor who reaches FormSubmit does so because
  // JavaScript is unavailable. Left on, the fallback dead-ends on a challenge
  // that can never render.
  assert(formState.captchaDisabled,
    'FormSubmit CAPTCHA is not disabled; the no-JavaScript path ends on a challenge that cannot render without JavaScript');
  assert(formState.formSubmitHoneypot,
    'FormSubmit honeypot (_honey) is missing, so nothing replaces the CAPTCHA that was turned off');

  // The experience list must be present in the HTML. Built only by script.js,
  // the dropdown offers a single choice without JavaScript and the enquiry
  // arrives with no indication of which experience it concerns.
  assert(formState.tourOptions > 5,
    `JavaScript-free experience dropdown offers only ${formState.tourOptions} option(s); the tour list is not in the HTML`);
  assert(formState.tourOptionLabels.includes("I'm open to ideas"),
    'experience dropdown lost its default "open to ideas" choice');
  assert(formState.tourOptionLabels.some(label => label.includes('Cape Coast')),
    'experience dropdown does not list the actual experiences');

  assert(formState.visibleInputs >= 5,
    `JavaScript-free form shows only ${formState.visibleInputs} fields; the step flow may be hiding them`);
  assert(formState.redirectTarget.startsWith('http'),
    'JavaScript-free form has no absolute redirect target, so the visitor lands nowhere after submitting');

  await context.close();
  await browser.close();
  if (hosted) hosted.server.close();
  console.log(`JavaScript-free resilient-rendering checks passed against ${hosted ? 'dist/' : BASE_URL}.`);
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
