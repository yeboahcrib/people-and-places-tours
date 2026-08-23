import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {extname, join} from 'node:path';
import {createHash} from 'node:crypto';
import {renderFooterTemplate, renderNavigationTemplate, replaceFooter, replacePrimaryNavigation} from './shared-shell.mjs';
import {loadSiteContent} from './content-source.mjs';
import {loadLocalHomepageContent, loadLocalTours, renderHomepageContent} from './local-render-source.mjs';
import {injectTourCards, injectContactTourOptions} from './render-tour-cards.mjs';
import {loadTourContent} from './tour-source.mjs';
import {loadHomepageContent} from './homepage-source.mjs';
import {loadBookingContent, loadLocalBookingContent} from './booking-source.mjs';
import {loadLocalPolicies, loadPolicyContent, POLICY_PAGES} from './policy-source.mjs';
import {loadTourPageTemplate, renderTourPage} from './render-tour-page.mjs';
import {injectBookingContent, injectInquiryMode, injectSiteContact, injectTurnstileSiteKey} from './render-booking.mjs';
import {injectPolicyContent} from './render-policy.mjs';
import {injectPageMeta, normaliseSiteUrl, renderRobots, renderSitemap} from './render-meta.mjs';
import {loadAboutContent, loadLocalAboutContent} from './about-source.mjs';
import {injectAboutContent} from './render-about.mjs';

const projectRoot = process.cwd();
const siteUrl = normaliseSiteUrl(process.env.SITE_URL);
const ogImage = 'assets/photos/reviews-trust-banner.jpg';
const indexableFiles = [];
const outputRoot = join(projectRoot, 'dist');

// Public root files are intentionally allow-listed. This prevents internal
// folders such as docs/, tests/, and studio/ from becoming web-accessible when
// somebody adds them to the repository later.
const publicRootExtensions = new Set(['.html', '.css', '.js']);
const publicRootFiles = new Set([
  '_headers',
  '_redirects',
  'robots.txt',
  'sitemap.xml',
]);
const publicDirectories = ['assets', '.well-known'];
const navigationTemplate = await readFile(join(projectRoot, 'src/partials/navigation.html'), 'utf8');
const footerTemplate = await readFile(join(projectRoot, 'src/partials/footer.html'), 'utf8');
const {content: siteContent, source: contentSource} = await loadSiteContent({projectRoot});
const navigation = renderNavigationTemplate(navigationTemplate, siteContent);
const footer = renderFooterTemplate(footerTemplate, siteContent);
const [localTours, localHomepageContent, localBookingContent, localAboutContent, localPolicyContent] = await Promise.all([
  loadLocalTours(projectRoot),
  loadLocalHomepageContent(projectRoot),
  loadLocalBookingContent(projectRoot),
  loadLocalAboutContent(projectRoot),
  loadLocalPolicies(projectRoot),
]);
const [
  {tours, source: tourContentSource},
  {content: homepageContent, source: homepageContentSource},
  {content: bookingContent, source: bookingContentSource},
  {content: aboutContent, source: aboutContentSource},
] = await Promise.all([
  loadTourContent({localTours}),
  loadHomepageContent({localContent: localHomepageContent}),
  loadBookingContent({localContent: localBookingContent}),
  loadAboutContent({localContent: localAboutContent}),
]);

// One request per policy page. They are independent documents; a missing
// insurance page must not take the cancellation page down with it.
const policies = Object.fromEntries(await Promise.all(POLICY_PAGES.map(async page => {
  const {content, source} = await loadPolicyContent({
    localContent: localPolicyContent[page.key],
    policyType: page.policyType,
  });
  return [page.file, {content, source}];
})));
const policyContentSource = POLICY_PAGES.some(page => policies[page.file].source === 'sanity')
  ? 'sanity'
  : 'local';
const homepageMarkup = await renderHomepageContent(projectRoot, homepageContent);

// Tour detail pages are generated from the CMS when GENERATE_TOUR_PAGES is set.
// Off by default so the switch is deliberate: the hand-written pages remain the
// published ones until the generated versions have been reviewed on a preview.
const generateTourPages = process.env.GENERATE_TOUR_PAGES === 'true';
const tourPageTemplate = generateTourPages ? await loadTourPageTemplate(projectRoot) : null;
const tourPageContent = generateTourPages
  ? JSON.parse(await readFile(join(projectRoot, 'src/content/tour-pages.json'), 'utf8')).tours
  : {};
const generatedTourPages = new Map();
if (generateTourPages) {
  for (const tour of tours) {
    // The package page has an itinerary and its own template; not yet generated.
    if (tour.slug === 'just-go-ghana') continue;
    const extra = tourPageContent[tour.slug];
    if (!extra) continue;
    generatedTourPages.set(tour.detailUrl, renderTourPage({
      template: tourPageTemplate,
      tour: {...tour, ...extra},
      catalogue: tours,
    }));
  }
}

// 404.html only.
//
// Every other page is served at a path we control, so relative links resolve
// correctly. The 404 page is different: Cloudflare serves it for *any*
// unmatched URL, at whatever depth the visitor happened to type. Request
// /anything/deep and href="style.css" resolves to /anything/style.css, which
// does not exist — an unstyled page with a broken menu, shown to someone who
// is already lost.
//
// Nothing links that deep today, so this is insurance against mistyped URLs,
// truncated shares and any future move to nested paths.
//
// Rewriting to root-absolute fixes it at any depth. A <base href="/"> tag
// would be one line, but it also rewrites fragment links, sending the skip
// link to the homepage instead of past the navigation — so this rewrites the
// attributes instead and leaves anchors, tel:, mailto: and absolute URLs
// alone. Attribute-scoped, so it cannot disturb element structure.
const rootRelativeUrls = html => html.replace(
  /\b(src|href)="(?!https?:|\/\/|\/|#|tel:|mailto:|data:)([^"]+)"/g,
  (_match, attr, value) => `${attr}="/${value}"`,
);

// FormSubmit's _next is where a visitor lands after submitting, and it has to
// be an absolute URL because the redirect happens on FormSubmit's servers.
//
// It must be derived from siteUrl rather than hardcoded. script.js rewrites
// this value on load, but the only visitors who reach FormSubmit are those
// without JavaScript — precisely the group that rewrite never runs for.
const injectFormNext = (html, site) => html.replace(
  /(<input[^>]*name="_next"[^>]*value=")[^"]*(")/g,
  (_match, before, after) => `${before}${site}/thanks${after}`,
);

// Cloudflare Pages serves clean URLs: /about is the real address and
// /about.html 308-redirects to it, so a link written with the extension costs
// a redirect round trip before the page starts loading.
//
// The pattern is deliberately narrow: an attribute value that is a bare page
// name and nothing else. It cannot match an absolute URL or a path into a
// directory, so it will not touch assets, and being attribute-scoped it cannot
// disturb element structure.
//
// index.html becomes "/", the address Cloudflare serves the homepage at.
const cleanInternalUrls = html => html.replace(
  /\b(href|src)="([a-z0-9][a-z0-9-]*)\.html((?:[?#][^"]*)?)"/g,
  (_match, attr, name, suffix) => `${attr}="${name === 'index' ? '/' : name}${suffix}"`,
);

/**
 * Stamp every stylesheet and script reference with a hash of its contents.
 *
 * Cloudflare serves CSS and JS with a four-hour cache and the `_headers` rule
 * intended to shorten it is not applied — responses carry max-age=14400
 * regardless. HTML revalidates on every request, so without a changing URL a
 * returning visitor runs new HTML against stale JavaScript after a deploy.
 *
 * Hashing contents rather than stamping the commit means an unchanged asset
 * keeps its URL, and therefore its cache, across deploys. Any existing `?v=`
 * is replaced so it cannot be maintained by hand and drift.
 */
const assetHashes = new Map();
for (const entry of await readdir(projectRoot, {withFileTypes: true})) {
  if (!entry.isFile() || !['.css', '.js'].includes(extname(entry.name))) continue;
  const contents = await readFile(join(projectRoot, entry.name));
  assetHashes.set(entry.name, createHash('sha256').update(contents).digest('hex').slice(0, 10));
}

const stampAssets = html => html.replace(
  /\b(href|src)="([a-z0-9][a-z0-9-]*\.(?:css|js))(?:\?[^"]*)?"/g,
  (match, attr, file) => assetHashes.has(file) ? `${attr}="${file}?v=${assetHashes.get(file)}"` : match,
);

await rm(outputRoot, {recursive: true, force: true});
await mkdir(outputRoot, {recursive: true});

const rootEntries = await readdir(projectRoot, {withFileTypes: true});
const copiedRootFiles = [];

for (const entry of rootEntries) {
  if (!entry.isFile()) continue;
  if (!publicRootFiles.has(entry.name) && !publicRootExtensions.has(extname(entry.name))) continue;

  if (extname(entry.name) === '.html') {
    const source = generatedTourPages.get(entry.name)
      ?? await readFile(join(projectRoot, entry.name), 'utf8');
    const withNavigation = replacePrimaryNavigation(source, navigation, entry.name);
    const withFooter = replaceFooter(withNavigation, footer);
    const withHomepage = entry.name === 'index.html'
      ? withFooter.replace(
        '<main id="homepage-root" data-homepage-renderer="homepage-sections"></main>',
        `<main id="homepage-root" data-homepage-renderer="homepage-sections">${homepageMarkup}</main>`,
      )
      : withFooter;
    const withAbout = injectAboutContent(withHomepage, aboutContent);
    const withBooking = injectBookingContent(withAbout, bookingContent);
    // Guarded by filename: the renderer throws when a binding is missing, which
    // is what we want on a policy page and wrong everywhere else.
    const withPolicy = policies[entry.name]
      ? injectPolicyContent(withBooking, policies[entry.name].content, siteContent.siteSettings, entry.name)
      : withBooking;
    const withContact = injectSiteContact(withPolicy, siteContent.siteSettings);
    const withTurnstile = injectTurnstileSiteKey(withContact, process.env.TURNSTILE_SITE_KEY);
    const withInquiryMode = injectInquiryMode(withTurnstile, Boolean(process.env.CF_PAGES));
    const withTourCards = injectTourCards(withInquiryMode, tours);
    const rendered = injectContactTourOptions(withTourCards, tours);
    const withMeta = injectPageMeta(rendered, {
      file: entry.name,
      siteUrl,
      siteName: siteContent.siteSettings.businessName,
      ogImage,
    });
    if (!/name="robots"[^>]*noindex/i.test(withMeta)) indexableFiles.push(entry.name);
    const withNext = injectFormNext(withMeta, siteUrl);
    // Strip extensions before the 404 page's root-absolute rewrite, so that
    // pass sees "about" and produces "/about" rather than "/about.html".
    const withCleanUrls = cleanInternalUrls(withNext);
    const stamped = stampAssets(withCleanUrls);
    const final = entry.name === '404.html' ? rootRelativeUrls(stamped) : stamped;
    await writeFile(join(outputRoot, entry.name), final, 'utf8');
  } else {
    await cp(join(projectRoot, entry.name), join(outputRoot, entry.name));
  }
  copiedRootFiles.push(entry.name);
}

await writeFile(join(outputRoot, 'sitemap.xml'), renderSitemap(siteUrl, indexableFiles, new Date().toISOString().slice(0, 10)), 'utf8');
await writeFile(join(outputRoot, 'robots.txt'), renderRobots(siteUrl), 'utf8');

for (const directory of publicDirectories) {
  await cp(join(projectRoot, directory), join(outputRoot, directory), {recursive: true});
}

if (!copiedRootFiles.includes('index.html')) {
  throw new Error('Static build is missing index.html');
}

const buildHealth = {
  status: 'ok',
  service: 'people-and-places-website',
  revision: process.env.CF_PAGES_COMMIT_SHA || process.env.GITHUB_SHA || 'local',
  builtAt: new Date().toISOString(),
  contentSource,
  tourContentSource,
  // The packages grid is generated from this list, so recording its length
  // lets tests/build-output.mjs check the grid against the catalogue that
  // built it rather than against a number frozen into the test.
  tourCount: tours.length,
  homepageContentSource,
  bookingContentSource,
  policyContentSource,
  aboutContentSource,
  siteUrl,
  botProtection: process.env.TURNSTILE_SITE_KEY ? 'turnstile' : 'none',
};

await writeFile(
  join(outputRoot, 'health.json'),
  `${JSON.stringify(buildHealth, null, 2)}\n`,
  'utf8',
);

console.log(`Built ${copiedRootFiles.length} public root files and ${publicDirectories.length} public directories into dist/.`);
