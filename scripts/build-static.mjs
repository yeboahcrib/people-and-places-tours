import {cp, mkdir, readFile, readdir, rm, writeFile} from 'node:fs/promises';
import {extname, join} from 'node:path';
import {createHash} from 'node:crypto';
import {renderFooterTemplate, renderNavigationTemplate, replaceFooter, replacePrimaryNavigation} from './shared-shell.mjs';
import {loadSiteContent} from './content-source.mjs';
import {loadLocalHomepageContent, loadLocalTours, renderHomepageContent} from './local-render-source.mjs';
import {injectTourCards, injectContactTourOptions} from './render-tour-cards.mjs';
import {loadTourContent} from './tour-source.mjs';
import {assessStoryblokFallback, resolveStoryblokMode} from './storyblok-fallback-policy.mjs';
import {renderStoryblokStandardToursBrowserOverlay} from './storyblok-tour-browser-overlay.mjs';
import {loadHomepageContent} from './homepage-source.mjs';
import {loadBookingContent, loadLocalBookingContent} from './booking-source.mjs';
import {loadLocalPolicies, loadPolicyContent, POLICY_PAGES} from './policy-source.mjs';
import {loadTourPageTemplate, renderTourPage} from './render-tour-page.mjs';
import {injectBookingContent, injectInquiryMode, injectSiteContact, injectTurnstileSiteKey} from './render-booking.mjs';
import {injectPolicyContent} from './render-policy.mjs';
import {injectPagePhotos} from './render-page-photos.mjs';
import {loadExperiencesPagePhotos} from './experiences-page-source.mjs';
import {loadExperienceContent, loadLocalExperienceContent} from './local-experience-source.mjs';
import {injectLocalExperiences} from './render-local-experiences.mjs';
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

// ── COMING-SOON MODE ──────────────────────────────────────────────
// Set COMING_SOON=true in Cloudflare's Production scope and the deployed site
// becomes a single holding page. Preview builds do not carry the variable, so
// every branch preview keeps serving the real site: the work continues on main
// exactly as before, and nothing about the site is deleted or branched away.
//
// Turning it off is one variable, not a revert.
if (process.env.COMING_SOON === 'true') {
  const {loadSiteContent: loadForHold} = await import('./content-source.mjs');
  const {content: held} = await loadForHold({projectRoot});
  const settings = held.siteSettings;
  const digits = String(settings.primaryPhone).replace(/[^\d+]/g, '');
  const template = await readFile(join(projectRoot, 'src/templates/coming-soon.html'), 'utf8');
  const page = template
    .replaceAll('{{LOGO}}', 'assets/PAP LOGO_YELLOW_NO BACKGROUND.svg')
    .replaceAll('{{FAVICON}}', 'assets/favicon.svg')
    .replaceAll('{{WHATSAPP}}', settings.whatsappUrl || `https://wa.me/${digits.replace(/^\+/, '')}`)
    .replaceAll('{{PHONE_HREF}}', digits)
    .replaceAll('{{PHONE}}', settings.primaryPhone)
    .replaceAll('{{EMAIL}}', settings.email)
    // The CMS serviceArea reads "Accra and the Adenta Municipality, with
    // experiences across Ghana" — correct for a business listing, too
    // administrative for a holding page. The hours are what someone reaching
    // out actually needs to know.
    .replaceAll('{{SERVICE_AREA}}', settings.hours || '');

  await rm(outputRoot, {recursive: true, force: true});
  await mkdir(outputRoot, {recursive: true});
  await writeFile(join(outputRoot, 'index.html'), page, 'utf8');
  // The logo and favicon are the only assets the page loads.
  await mkdir(join(outputRoot, 'assets'), {recursive: true});
  for (const asset of ['PAP LOGO_YELLOW_NO BACKGROUND.svg', 'favicon.svg']) {
    await cp(join(projectRoot, 'assets', asset), join(outputRoot, 'assets', asset)).catch(() => {});
  }
  // Headers still apply; the sitemap deliberately does not ship, so nothing
  // invites a crawler to index a placeholder.
  await cp(join(projectRoot, '_headers'), join(outputRoot, '_headers')).catch(() => {});
  await writeFile(join(outputRoot, 'robots.txt'), 'User-agent: *\nDisallow: /\n', 'utf8');
  await writeFile(join(outputRoot, 'health.json'),
    `${JSON.stringify({status: 'ok', service: 'people-and-places-website', mode: 'coming-soon', builtAt: new Date().toISOString()}, null, 2)}\n`, 'utf8');
  console.log('Built the coming-soon holding page. Unset COMING_SOON to build the site.');
  process.exit(0);
}

const navigationTemplate = await readFile(join(projectRoot, 'src/partials/navigation.html'), 'utf8');
const footerTemplate = await readFile(join(projectRoot, 'src/partials/footer.html'), 'utf8');
const {content: siteContent, source: contentSource} = await loadSiteContent({projectRoot});
const navigation = renderNavigationTemplate(navigationTemplate, siteContent);
const footer = renderFooterTemplate(footerTemplate, siteContent);
const [localTours, localHomepageContent, localBookingContent, localAboutContent, localPolicyContent, localExperienceContent] = await Promise.all([
  loadLocalTours(projectRoot),
  loadLocalHomepageContent(projectRoot),
  loadLocalBookingContent(projectRoot),
  loadLocalAboutContent(projectRoot),
  loadLocalPolicies(projectRoot),
  loadLocalExperienceContent(projectRoot),
]);
const [
  {
    tours,
    source: tourContentSource,
    storyblokStandardTourSources,
    storyblokStandardTourSummary,
    storyblokAppliedSlugs,
    storyblokMultiDaySources,
    storyblokMultiDaySummary,
  },
  {content: homepageContent, source: homepageContentSource},
  {content: bookingContent, source: bookingContentSource},
  {content: aboutContent, source: aboutContentSource},
] = await Promise.all([
  loadTourContent({localTours}),
  loadHomepageContent({localContent: localHomepageContent}),
  loadBookingContent({localContent: localBookingContent}),
  loadAboutContent({localContent: localAboutContent}),
]);

// Falling back is per-record and quiet by design, which is right for one bad
// tour and wrong for thirteen: an outage or a rejected token fails every record
// the same way and would ship a fully committed site without saying so. Assess
// both gates together and refuse the build when the failure is systemic.
const storyblokMode = resolveStoryblokMode(process.env);
const storyblokFallback = assessStoryblokFallback({
  sourcesBySlug: {...storyblokStandardTourSources, ...storyblokMultiDaySources},
  mode: storyblokMode,
});
if (storyblokFallback.status === 'fail') throw new Error(storyblokFallback.message);
if (storyblokFallback.status === 'warn') console.warn('Storyblok: ' + storyblokFallback.message);

// The packages grid is rendered once, by this build, and script.js no longer
// rebuilds it. The overlay remains because the command palette and the contact
// form's tour list still read the public catalogue in the browser, and they
// should see the same validated records as the static HTML. Nothing is emitted
// when all records fall back safely.
const storyblokBrowserOverlay = renderStoryblokStandardToursBrowserOverlay({
  tours,
  appliedSlugs: storyblokAppliedSlugs,
});
const storyblokBrowserOverlayFile = storyblokBrowserOverlay
  ? 'storyblok-standard-tours-overlay.js'
  : undefined;

// One request per policy page. They are independent documents; a missing
// insurance page must not take the cancellation page down with it.
const experiencesPagePhotos = await loadExperiencesPagePhotos();

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
const {content: experienceContent, source: experienceContentSource} =
  await loadExperienceContent({localContent: localExperienceContent});
const homepageMarkup = await renderHomepageContent(projectRoot, homepageContent);

// Tour detail pages are generated from the CMS. Reviewed on a preview and
// switched on 24 August 2026, which is what made adding the Cape Coast Day
// Tour and the Volta Community Tour a matter of filling in a form. Set
// GENERATE_TOUR_PAGES=false to fall back to any hand-written page still present.
const generateTourPages = process.env.GENERATE_TOUR_PAGES !== 'false';
const tourPageTemplate = generateTourPages ? await loadTourPageTemplate(projectRoot) : null;
const tourPageContent = generateTourPages
  ? JSON.parse(await readFile(join(projectRoot, 'src/content/tour-pages.json'), 'utf8')).tours
  : {};
const generatedTourPages = new Map();
if (generateTourPages) {
  for (const tour of tours) {
    // The package page has an itinerary and its own template; not yet generated.
    if (tour.slug === 'just-go-ghana') continue;
    // Sanity wins; the committed snapshot fills anything it does not hold and
    // carries the whole page when Sanity is switched off entirely.
    const extra = tourPageContent[tour.slug];
    const merged = {...extra, ...tour};
    if (!merged.faqs?.length) continue;
    generatedTourPages.set(tour.detailUrl, {
      html: renderTourPage({
        template: tourPageTemplate,
        tour: merged,
        catalogue: tours,
      }),
      seo: merged.seo,
    });
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
if (storyblokBrowserOverlayFile) {
  assetHashes.set(
    storyblokBrowserOverlayFile,
    createHash('sha256').update(storyblokBrowserOverlay).digest('hex').slice(0, 10),
  );
}

const stampAssets = html => html.replace(
  /\b(href|src)="([a-z0-9][a-z0-9-]*\.(?:css|js))(?:\?[^"]*)?"/g,
  (match, attr, file) => assetHashes.has(file) ? `${attr}="${file}?v=${assetHashes.get(file)}"` : match,
);

const injectStoryblokStandardToursBrowserOverlay = html => {
  if (!storyblokBrowserOverlayFile) return html;
  const toursScript = '<script src="tours.js"></script>';
  if (!html.includes(toursScript)) return html;
  return html.replace(
    toursScript,
    `${toursScript}\n<script src="${storyblokBrowserOverlayFile}"></script>`,
  );
};

await rm(outputRoot, {recursive: true, force: true});
await mkdir(outputRoot, {recursive: true});
if (storyblokBrowserOverlayFile) {
  await writeFile(join(outputRoot, storyblokBrowserOverlayFile), storyblokBrowserOverlay, 'utf8');
}

const rootEntries = await readdir(projectRoot, {withFileTypes: true});
const copiedRootFiles = [];

for (const entry of rootEntries) {
  if (!entry.isFile()) continue;
  if (!publicRootFiles.has(entry.name) && !publicRootExtensions.has(extname(entry.name))) continue;

  if (extname(entry.name) === '.html') {
    const generatedTour = generatedTourPages.get(entry.name);
    const source = generatedTour?.html
      ?? await readFile(join(projectRoot, entry.name), 'utf8');
    const withNavigation = replacePrimaryNavigation(source, navigation, entry.name);
    const withFooter = replaceFooter(withNavigation, footer);
    const withHomepage = entry.name === 'index.html'
      ? withFooter.replace(
        '<main id="main-content" data-homepage-renderer="homepage-sections"></main>',
        `<main id="main-content" data-homepage-renderer="homepage-sections">${homepageMarkup}</main>`,
      )
      : withFooter;
    const withAbout = injectAboutContent(withHomepage, aboutContent);
    const withBooking = injectBookingContent(withAbout, bookingContent);
    // Guarded by filename: the renderer throws when a binding is missing, which
    // is what we want on a policy page and wrong everywhere else.
    const withPolicy = policies[entry.name]
      ? injectPolicyContent(withBooking, policies[entry.name].content, siteContent.siteSettings, entry.name)
      : withBooking;
    // Page photographs an editor can choose. Keyed by data-cms-photo, so a page
    // that carries none is untouched and a photo that is not approved yet
    // leaves the committed image in place.
    const withPagePhotos = injectPagePhotos(withPolicy, {
      contactHero: bookingContent.coverPhoto,
      ...experiencesPagePhotos.photos,
    });
    const withExperiences = injectLocalExperiences(withPagePhotos, experienceContent);
    const withContact = injectSiteContact(withExperiences, siteContent.siteSettings);
    const withTurnstile = injectTurnstileSiteKey(withContact, process.env.TURNSTILE_SITE_KEY);
    const withInquiryMode = injectInquiryMode(withTurnstile, Boolean(process.env.CF_PAGES));
    const withTourCards = injectTourCards(withInquiryMode, tours);
    const rendered = injectContactTourOptions(withTourCards, tours);
    const withBrowserCatalogue = injectStoryblokStandardToursBrowserOverlay(rendered);
    const withMeta = injectPageMeta(withBrowserCatalogue, {
      file: entry.name,
      siteUrl,
      siteName: siteContent.siteSettings.businessName,
      ogImage: generatedTour?.seo?.socialImage || ogImage,
      canonicalOverride: generatedTour?.seo?.canonicalOverride,
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

// A tour created in the CMS has no file in the repository to iterate over, so
// its page would silently never be built. These go through exactly the same
// pipeline as a committed page: navigation, footer, meta, clean URLs, hashes.
for (const [fileName, generatedTour] of generatedTourPages) {
  if (copiedRootFiles.includes(fileName)) continue;
  const withNavigation = replacePrimaryNavigation(generatedTour.html, navigation, fileName);
  const withFooter = replaceFooter(withNavigation, footer);
  const withContact = injectSiteContact(withFooter, siteContent.siteSettings);
  const withInquiryMode = injectInquiryMode(withContact, Boolean(process.env.CF_PAGES));
  const withBrowserCatalogue = injectStoryblokStandardToursBrowserOverlay(withInquiryMode);
  const withMeta = injectPageMeta(withBrowserCatalogue, {
    file: fileName,
    siteUrl,
    siteName: siteContent.siteSettings.businessName,
    ogImage: generatedTour.seo?.socialImage || ogImage,
    canonicalOverride: generatedTour.seo?.canonicalOverride,
  });
  if (!/name="robots"[^>]*noindex/i.test(withMeta)) indexableFiles.push(fileName);
  const stamped = stampAssets(cleanInternalUrls(injectFormNext(withMeta, siteUrl)));
  await writeFile(join(outputRoot, fileName), stamped, 'utf8');
  copiedRootFiles.push(fileName);
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
  // The existing source field retains its Sanity/local contract. These fields
  // report the independently validated result for every standard Storyblok
  // record, so one bad story cannot hide the rest of the catalogue.
  storyblokStandardTourSources,
  storyblokStandardTourSummary,
  storyblokMultiDaySources,
  storyblokMultiDaySummary,
  // The packages grid is generated from this list, so recording its length
  // lets tests/build-output.mjs check the grid against the catalogue that
  // built it rather than against a number frozen into the test.
  tourCount: tours.length,
  homepageContentSource,
  bookingContentSource,
  policyContentSource,
  experienceContentSource,
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
