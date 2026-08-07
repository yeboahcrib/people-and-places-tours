import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {extname, join} from 'node:path';
import {renderFooterTemplate, renderNavigationTemplate, replaceFooter, replacePrimaryNavigation} from './shared-shell.mjs';
import {loadSiteContent} from './content-source.mjs';
import {loadLocalHomepageContent, loadLocalTours, renderHomepageContent} from './local-render-source.mjs';
import {injectTourCards, injectContactTourOptions} from './render-tour-cards.mjs';
import {loadTourContent} from './tour-source.mjs';
import {loadHomepageContent} from './homepage-source.mjs';
import {loadBookingContent, loadLocalBookingContent} from './booking-source.mjs';
import {injectBookingContent, injectSiteContact, injectTurnstileSiteKey} from './render-booking.mjs';
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
  'robots.txt',
  'sitemap.xml',
]);
const publicDirectories = ['assets', '.well-known'];
const navigationTemplate = await readFile(join(projectRoot, 'src/partials/navigation.html'), 'utf8');
const footerTemplate = await readFile(join(projectRoot, 'src/partials/footer.html'), 'utf8');
const {content: siteContent, source: contentSource} = await loadSiteContent({projectRoot});
const navigation = renderNavigationTemplate(navigationTemplate, siteContent);
const footer = renderFooterTemplate(footerTemplate, siteContent);
const [localTours, localHomepageContent, localBookingContent, localAboutContent] = await Promise.all([
  loadLocalTours(projectRoot),
  loadLocalHomepageContent(projectRoot),
  loadLocalBookingContent(projectRoot),
  loadLocalAboutContent(projectRoot),
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
const homepageMarkup = await renderHomepageContent(projectRoot, homepageContent);

// 404.html only.
//
// Every other page is served at a path we control, so relative links resolve
// correctly. The 404 page is different: Cloudflare serves it for *any*
// unmatched URL, at whatever depth the visitor happened to type. Request
// /anything/deep and href="style.css" resolves to /anything/style.css, which
// does not exist — an unstyled page with a broken menu, shown to someone who
// is already lost.
//
// Nothing on the site links that deep today, so this is insurance rather than
// a fix for a known bad link: mistyped URLs, truncated shares, and any future
// move to nested paths. It costs one build step and removes a whole class of
// failure at the least forgiving moment.
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
// It was hardcoded to the GitHub Pages address. script.js rewrites it on load,
// so this was invisible in testing — but the only people who reach FormSubmit
// at all are the ones without JavaScript, which is precisely the group that
// rewrite never runs for. They would have submitted an enquiry and been sent
// to a different domain to read the thank-you page. Deriving it from siteUrl
// means it follows the site wherever it is deployed.
const injectFormNext = (html, site) => html.replace(
  /(<input[^>]*name="_next"[^>]*value=")[^"]*(")/g,
  (_match, before, after) => `${before}${site}/thanks.html${after}`,
);

await rm(outputRoot, {recursive: true, force: true});
await mkdir(outputRoot, {recursive: true});

const rootEntries = await readdir(projectRoot, {withFileTypes: true});
const copiedRootFiles = [];

for (const entry of rootEntries) {
  if (!entry.isFile()) continue;
  if (!publicRootFiles.has(entry.name) && !publicRootExtensions.has(extname(entry.name))) continue;

  if (extname(entry.name) === '.html') {
    const source = await readFile(join(projectRoot, entry.name), 'utf8');
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
    const withContact = injectSiteContact(withBooking, siteContent.siteSettings);
    const withTurnstile = injectTurnstileSiteKey(withContact, process.env.TURNSTILE_SITE_KEY);
    const withTourCards = injectTourCards(withTurnstile, tours);
    const rendered = injectContactTourOptions(withTourCards, tours);
    const withMeta = injectPageMeta(rendered, {
      file: entry.name,
      siteUrl,
      siteName: siteContent.siteSettings.businessName,
      ogImage,
    });
    if (!/name="robots"[^>]*noindex/i.test(withMeta)) indexableFiles.push(entry.name);
    const withNext = injectFormNext(withMeta, siteUrl);
    const final = entry.name === '404.html' ? rootRelativeUrls(withNext) : withNext;
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
  homepageContentSource,
  bookingContentSource,
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
