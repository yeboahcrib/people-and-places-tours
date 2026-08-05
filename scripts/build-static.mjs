import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {extname, join} from 'node:path';
import {renderFooterTemplate, renderNavigationTemplate, replaceFooter, replacePrimaryNavigation} from './shared-shell.mjs';
import {loadSiteContent} from './content-source.mjs';
import {loadLocalHomepageContent, loadLocalTours, renderHomepageContent} from './local-render-source.mjs';
import {injectTourCards} from './render-tour-cards.mjs';
import {loadTourContent} from './tour-source.mjs';
import {loadHomepageContent} from './homepage-source.mjs';
import {loadBookingContent, loadLocalBookingContent} from './booking-source.mjs';
import {injectBookingContent, injectSiteContact, injectTurnstileSiteKey} from './render-booking.mjs';

const projectRoot = process.cwd();
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
const [localTours, localHomepageContent, localBookingContent] = await Promise.all([
  loadLocalTours(projectRoot),
  loadLocalHomepageContent(projectRoot),
  loadLocalBookingContent(projectRoot),
]);
const [
  {tours, source: tourContentSource},
  {content: homepageContent, source: homepageContentSource},
  {content: bookingContent, source: bookingContentSource},
] = await Promise.all([
  loadTourContent({localTours}),
  loadHomepageContent({localContent: localHomepageContent}),
  loadBookingContent({localContent: localBookingContent}),
]);
const homepageMarkup = await renderHomepageContent(projectRoot, homepageContent);

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
    const withBooking = injectBookingContent(withHomepage, bookingContent);
    const withContact = injectSiteContact(withBooking, siteContent.siteSettings);
    const withTurnstile = injectTurnstileSiteKey(withContact, process.env.TURNSTILE_SITE_KEY);
    const rendered = injectTourCards(withTurnstile, tours);
    await writeFile(join(outputRoot, entry.name), rendered, 'utf8');
  } else {
    await cp(join(projectRoot, entry.name), join(outputRoot, entry.name));
  }
  copiedRootFiles.push(entry.name);
}

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
  botProtection: process.env.TURNSTILE_SITE_KEY ? 'turnstile' : 'none',
};

await writeFile(
  join(outputRoot, 'health.json'),
  `${JSON.stringify(buildHealth, null, 2)}\n`,
  'utf8',
);

console.log(`Built ${copiedRootFiles.length} public root files and ${publicDirectories.length} public directories into dist/.`);
