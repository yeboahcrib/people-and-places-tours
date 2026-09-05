import assert from 'node:assert/strict';
import {access, readFile, readdir} from 'node:fs/promises';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {loadLocalTours} from '../scripts/local-render-source.mjs';

const output = new URL('../dist/', import.meta.url);
const outputPath = decodeURIComponent(output.pathname);
const exists = path => access(join(outputPath, path)).then(() => true, () => false);

// In coming-soon mode the build deliberately emits one page, so the checks
// below — which describe the whole site — do not apply. This asserts what that
// mode actually promises: a holding page that is contactable, and that no
// crawler is invited to index.
if (process.env.COMING_SOON === 'true') {
  const page = await readFile(join(outputPath, 'index.html'), 'utf8');
  assert(/<meta name="robots" content="noindex/.test(page), 'the holding page must not be indexable');
  assert(/wa\.me\//.test(page), 'the holding page must offer WhatsApp');
  assert(/tel:\+?\d/.test(page), 'the holding page must offer a phone number');
  assert(/mailto:[^"]+@/.test(page), 'the holding page must offer an email address');
  assert(!(await exists('sitemap.xml')),
    'the holding page build must not ship a sitemap inviting a crawler in');
  const robots = await readFile(join(outputPath, 'robots.txt'), 'utf8');
  assert(/Disallow: \/$/m.test(robots), 'robots.txt must disallow crawling while the hold is up');
  console.log('Coming-soon holding page checks passed.');
  process.exit(0);
}

for (const required of [
  'index.html',
  'contact.html',
  'thanks.html',
  'style.css',
  'script.js',
  '_headers',
  'health.json',
  '.well-known/security.txt',
]) {
  assert(await exists(required), `Build output is missing ${required}`);
}

// The lightbox keeps visible next/previous controls on larger screens, but a
// phone uses a direct horizontal swipe instead. These strings live in the
// generated browser script, so checking dist catches an accidental removal
// during a later static build.
{
  const generatedScript = await readFile(join(outputPath, 'script.js'), 'utf8');
  assert.match(generatedScript, /@media \(max-width:640px\)\{\.lb-prev,\.lb-next\{display:none;\}\}/,
    'the mobile lightbox must hide its on-screen next/previous buttons');
  assert.match(generatedScript, /lb\.addEventListener\('pointerdown'/,
    'the lightbox must record the start of a swipe');
  assert.match(generatedScript, /lb\.addEventListener\('pointerup'/,
    'the lightbox must handle horizontal swipe navigation');
}

for (const privatePath of ['docs', 'tests', 'studio', 'functions', 'package.json', 'CLAUDE.md', 'README.md']) {
  assert(!(await exists(privatePath)), `Private source was published: ${privatePath}`);
}

const generatedHtmlFiles = (await readdir(outputPath)).filter(entry => entry.endsWith('.html'));
for (const file of generatedHtmlFiles) {
  const html = await readFile(join(outputPath, file), 'utf8');
  assert.equal((html.match(/<!-- shared: navigation -->/g) || []).length, 1, `${file} should contain one shared navigation`);
  assert(html.includes('href="tel:+233503673473"'), `${file} did not render site settings into navigation`);
  assert(!html.includes('{{'), `${file} contains an unresolved template token`);
  // Every page carries the footer, including thanks.html. A distraction-free
  // confirmation page is a legitimate design, but this one already carries the
  // full navigation and two onward links, so omitting only the footer gains no
  // focus and leaves the page ending in blank space below the hero.
  const footerCount = (html.match(/<!-- shared: footer -->/g) || []).length;
  assert.equal(footerCount, 1, `${file} should contain one canonical shared footer`);

  // `container` holds hero content inside the site's column. Without it the
  // heading and buttons sit flush against the window edge. It is a class on an
  // element rather than a rule in the stylesheet, so nothing else catches it
  // going missing.
  // Cloudflare serves /about and 308-redirects /about.html to it, so a link
  // written with the extension costs a redirect round trip.
  //
  // It also keeps one consistent style: script.js identifies the current page
  // from the URL, and mixing the two forms breaks the active navigation
  // highlight and the catalogue lookup on tour detail pages.
  const extensionLinks = (html.match(/\b(?:href|src)="[a-z0-9][a-z0-9-]*\.html(?:[?#][^"]*)?"/g) || []);
  assert.equal(extensionLinks.length, 0,
    `${file} still links to .html URLs, which redirect on Cloudflare: ${extensionLinks.slice(0, 3).join(', ')}`);

  const canonical = html.match(/rel="canonical" href="([^"]*)"/)?.[1];
  if (canonical) {
    assert(!canonical.endsWith('.html'),
      `${file} declares a canonical URL that redirects: ${canonical}`);
  }

  // Every stylesheet and script must carry a content hash.
  //
  // Cloudflare caches these for four hours and the _headers rule intended to
  // shorten that is not applied, so without a changing URL a returning visitor
  // runs stale JavaScript against new HTML after a deploy, with no error
  // raised.
  for (const asset of html.match(/\b(?:href|src)="[a-z0-9][a-z0-9-]*\.(?:css|js)(?:\?[^"]*)?"/g) || []) {
    assert.match(asset, /\?v=[a-f0-9]{10}"/,
      `${file} references an asset with no content hash, so a cached copy can outlive a deploy: ${asset}`);
  }

  // The booking form must post to our own Function on any build that has one.
  // Deciding this at runtime from the hostname cannot distinguish a custom
  // domain with a Function from one without, and getting it wrong routes
  // enquiries to the fallback endpoint with no error raised.
  const inquiryMode = html.match(/data-inquiry-mode="([^"]*)"/)?.[1];
  if (inquiryMode !== undefined) {
    const expected = process.env.CF_PAGES ? 'cloudflare' : 'fallback';
    assert.equal(inquiryMode, expected,
      `${file} has inquiry mode "${inquiryMode}" but this build should produce "${expected}"`);
  }

  for (const heroContent of html.match(/<div class="page-hero-content[^"]*"/g) || []) {
    assert(/\bcontainer\b/.test(heroContent),
      `${file} has a page hero without the container class, so its content will touch the window edge: ${heroContent}`);
  }
}

const health = JSON.parse(await readFile(join(outputPath, 'health.json'), 'utf8'));
assert.equal(health.status, 'ok');
assert.equal(health.service, 'people-and-places-website');
assert(['local', 'sanity'].includes(health.contentSource));
assert(['local', 'sanity'].includes(health.tourContentSource));
const STORYBLOK_STANDARD_TOUR_STATES = new Set([
  'disabled',
  'missing-configuration',
  'unsupported-region',
  'not-applicable',
  'missing-story',
  'unavailable',
  'unauthorized',
  'pending-not-migrated',
  'withdrawn',
  'editorial-suppressed',
  'invalid-response',
  'invalid-content',
  'duplicate-slug',
  'duplicate-display-order',
  'applied',
]);

// The local registry owns public routes. Phase 3C may replace a standard
// tour's content at build time, but it must never infer or change the route
// from a Storyblok folder or story slug. Just Go Ghana deliberately stays out
// of this registry because it remains a future multi-day-tour migration.
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const localTourRegistry = await loadLocalTours(projectRoot);
const justGoGhana = localTourRegistry.find(tour => tour.slug === 'just-go-ghana');
const standardTours = localTourRegistry.filter(tour => tour.slug !== 'just-go-ghana');
assert(justGoGhana, 'tours.js no longer contains the separately managed Just Go Ghana tour');
assert(standardTours.length > 0, 'tours.js has no standard tours to validate');

assert(health.storyblokStandardTourSources
  && typeof health.storyblokStandardTourSources === 'object'
  && !Array.isArray(health.storyblokStandardTourSources),
'health.json must report one Storyblok result for every standard tour');
const storyblokStandardTourSources = health.storyblokStandardTourSources;
assert.deepEqual(
  Object.keys(storyblokStandardTourSources).sort(),
  standardTours.map(tour => tour.slug).sort(),
  'Storyblok build health must cover exactly the standard-tour registry, never Just Go Ghana',
);
for (const tour of standardTours) {
  assert(STORYBLOK_STANDARD_TOUR_STATES.has(storyblokStandardTourSources[tour.slug]),
    `health.json has an unknown Storyblok state for ${tour.slug}: ${storyblokStandardTourSources[tour.slug]}`);
}
assert.equal(storyblokStandardTourSources['just-go-ghana'], undefined,
  'Just Go Ghana must remain outside the standard-tour Storyblok registry');

assert(health.storyblokStandardTourSummary
  && typeof health.storyblokStandardTourSummary === 'object'
  && !Array.isArray(health.storyblokStandardTourSummary),
'health.json is missing its Storyblok standard-tour summary');
const storyblokStandardTourSummary = health.storyblokStandardTourSummary;
const appliedStoryblokSlugs = standardTours
  .filter(tour => storyblokStandardTourSources[tour.slug] === 'applied')
  .map(tour => tour.slug);
assert(Number.isInteger(storyblokStandardTourSummary.applied) && storyblokStandardTourSummary.applied >= 0,
  'Storyblok standard-tour health summary has an invalid applied count');
assert(Number.isInteger(storyblokStandardTourSummary.fallback) && storyblokStandardTourSummary.fallback >= 0,
  'Storyblok standard-tour health summary has an invalid fallback count');
assert.equal(storyblokStandardTourSummary.applied, appliedStoryblokSlugs.length,
  'Storyblok standard-tour health summary undercounts or overcounts applied records');
assert.equal(storyblokStandardTourSummary.fallback, standardTours.length - appliedStoryblokSlugs.length,
  'Storyblok standard-tour health summary must isolate fallbacks per tour');

const generatedPackages = await readFile(join(outputPath, 'packages.html'), 'utf8');
const escapeRegExp = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const cleanRoute = detailUrl => String(detailUrl).replace(/\.html$/, '');
const cardForSlug = (html, slug) => {
  const match = html.match(new RegExp(
    `<article\\b[^>]*\\bdata-tour-slug="${escapeRegExp(slug)}"[^>]*>[\\s\\S]*?<\\/article>`,
  ));
  assert(match, `packages.html has no card for ${slug}`);
  return match[0];
};

// The established browser script recreates the catalogue from tours.js after
// load. A Phase 3C build emits exactly one generated, public-content-only
// overlay when one or more standard tours were safely accepted. It must run
// after tours.js but before script.js, preserve the original registry order,
// and leave individual fallback tours alone.
const storyblokOverlayFile = 'storyblok-standard-tours-overlay.js';
const storyblokOverlayPresent = await exists(storyblokOverlayFile);
assert(!(await exists('storyblok-cape-coast-overlay.js')),
  'Phase 3C must replace the one-off Cape Coast browser overlay with one standard-tour overlay');
if (appliedStoryblokSlugs.length) {
  assert(storyblokOverlayPresent, 'an applied Storyblok build is missing its generic browser catalogue overlay');
  const overlay = await readFile(join(outputPath, storyblokOverlayFile), 'utf8');
  for (const slug of appliedStoryblokSlugs) {
    assert(overlay.includes(JSON.stringify(slug)),
      `the browser overlay does not contain the applied Storyblok tour ${slug}`);
  }
  assert(!/STORYBLOK_[A-Z0-9_]*TOKEN|api\.storyblok\.com|(?:[?&]token=)|\b(?:fetch|XMLHttpRequest)\b/i.test(overlay),
    'the browser overlay must contain mapped public content only, never a Storyblok credential or API request');

  const browserWindow = {PEOPLE_PLACES_TOURS: structuredClone(localTourRegistry)};
  new Function('window', overlay)(browserWindow);
  assert.deepEqual(
    browserWindow.PEOPLE_PLACES_TOURS.map(tour => tour.slug),
    localTourRegistry.map(tour => tour.slug),
    'the generic browser overlay must preserve registry order',
  );
  assert.equal(browserWindow.PEOPLE_PLACES_TOURS.length, localTourRegistry.length,
    'the generic browser overlay must not add or remove catalogue records');
  for (const tour of standardTours.filter(item => storyblokStandardTourSources[item.slug] !== 'applied')) {
    assert.deepEqual(browserWindow.PEOPLE_PLACES_TOURS.find(item => item.slug === tour.slug), tour,
      `a fallback ${tour.slug} record changed in the browser catalogue`);
  }
  assert.deepEqual(browserWindow.PEOPLE_PLACES_TOURS.find(tour => tour.slug === 'just-go-ghana'), justGoGhana,
    'the generic standard-tour overlay must not modify Just Go Ghana');
  for (const tour of browserWindow.PEOPLE_PLACES_TOURS) {
    const local = localTourRegistry.find(item => item.slug === tour.slug);
    assert.equal(tour.detailUrl, local.detailUrl,
      `the browser overlay changed the public route for ${tour.slug}`);
  }

  const overlayIndex = generatedPackages.indexOf(`src="${storyblokOverlayFile}?v=`);
  const toursIndex = generatedPackages.indexOf('src="tours.js?v=');
  const scriptIndex = generatedPackages.indexOf('src="script.js?v=');
  assert(toursIndex >= 0 && overlayIndex > toursIndex && scriptIndex > overlayIndex,
    'packages.html must load the generic overlay between tours.js and script.js');

  const browserPackageOrder = browserWindow.PEOPLE_PLACES_TOURS
    .filter(tour => tour.packageOrder !== undefined)
    .sort((a, b) => (a.packageOrder ?? Number.MAX_SAFE_INTEGER) - (b.packageOrder ?? Number.MAX_SAFE_INTEGER))
    .map(tour => tour.slug);
  const builtPackageOrder = [...generatedPackages.matchAll(/<article\b[^>]*\bdata-tour-slug="([^"]+)"/g)]
    .map(([, slug]) => slug);
  assert.deepEqual(browserPackageOrder, builtPackageOrder,
    'the generic browser overlay and pre-rendered Experiences cards disagree about catalogue ordering');

  for (const tour of standardTours.filter(item => storyblokStandardTourSources[item.slug] === 'applied')) {
    const detail = await readFile(join(outputPath, tour.detailUrl), 'utf8');
    assert(/<img[^>]+src="https:\/\/a\.storyblok\.com\/[^\"]+"[^>]+alt="[^\"]+"/.test(detail),
      `${tour.slug} lost the Storyblok Asset Manager alt text on its generated detail page`);
  }
} else {
  assert(!storyblokOverlayPresent, 'a build with no applied Storyblok tours unexpectedly emitted a browser overlay');
}

// Storyblok Asset Manager URLs are intentionally public, but its CDN content
// API and credentials are build-time only. Scan every textual public artifact
// rather than only the generated overlay so an accidental inline script or
// copied file cannot quietly turn the browser into a Storyblok client.
const collectPublicTextFiles = async directory => {
  const entries = await readdir(directory, {withFileTypes: true});
  const files = await Promise.all(entries.map(async entry => {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) return collectPublicTextFiles(file);
    if (!entry.isFile()) return [];
    return /\.(?:html|js|mjs|json|css|xml|txt)$/i.test(entry.name)
      || entry.name === '_headers' || entry.name === '_redirects'
      ? [file]
      : [];
  }));
  return files.flat();
};
const publicOutputText = (await Promise.all(
  (await collectPublicTextFiles(outputPath)).map(file => readFile(file, 'utf8')),
)).join('\n');
for (const [pattern, description] of [
  [/\bapi\.storyblok\.com\b/i, 'Storyblok content API endpoint'],
  [/\b(?:cdn\/stories|v2\/cdn\/stories)\b/i, 'Storyblok content API path'],
  [/\bSTORYBLOK_[A-Z0-9_]*TOKEN\b/i, 'Storyblok token environment name'],
  [/(?:[?&]token=|\baccess_token\b)/i, 'Storyblok token query parameter'],
  [/\b(?:fetch|XMLHttpRequest)\b[\s\S]{0,400}\bstoryblok\b/i, 'browser-side Storyblok fetch'],
]) {
  assert(!pattern.test(publicOutputText), `Public build output exposes a ${description}`);
}
assert(['local', 'sanity'].includes(health.homepageContentSource));
assert(!Number.isNaN(Date.parse(health.builtAt)), 'health.json has an invalid build time');

const generatedHome = await readFile(join(outputPath, 'index.html'), 'utf8');
// Derived from the renderer's own list, not frozen at a number. This assertion
// said 7, and retiring one section turned a deliberate change into a build
// failure that named the wrong problem.
const {SECTION_KEYS} = await import('../scripts/homepage-source.mjs');
assert.equal((generatedHome.match(/data-home-section=/g) || []).length, SECTION_KEYS.length,
  `Homepage was not statically rendered with all ${SECTION_KEYS.length} built-in sections`);
assert.equal((generatedHome.match(/<article class="trip-card/g) || []).length, 0, 'Homepage still contains featured tour cards');
assert(Number.isInteger(health.tourCount) && health.tourCount > 0, 'health.json is missing a tour count');
assert.equal(
  (generatedPackages.match(/<article class="tour-card/g) || []).length,
  health.tourCount,
  `Packages page was not built with all ${health.tourCount} tour cards`,
);

// Checked against the built page, not the source: the injectors run at build
// time, so a truncating injector leaves the committed page intact and breaks
// only what visitors see.
for (const file of ['cancellation-refund-policy.html', 'travel-insurance.html', 'privacy-policy.html', 'booking-terms.html', 'travel-information.html']) {
  const generatedPolicy = await readFile(join(outputPath, file), 'utf8');
  const policyBody = generatedPolicy.slice(generatedPolicy.indexOf('<main'), generatedPolicy.indexOf('</main>'));
  for (const tag of ['section', 'div', 'dl']) {
    assert.equal(
      (policyBody.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length,
      (policyBody.match(new RegExp(`</${tag}>`, 'g')) || []).length,
      `the built ${file} has unbalanced <${tag}> tags`,
    );
  }
  assert(policyBody.includes('policy-term'), `the built ${file} lost its terms`);
}

// A tour's price appears on its catalogue card and again on its own page, in
// different files with different sources. They drifted twice in one day: once
// when a CMS price change shipped ahead of the code, and once when a price was
// changed everywhere except the page that quotes it loudest.
const cardPrices = [...generatedPackages.matchAll(
  /data-tour-slug="([a-z0-9-]+)"[\s\S]*?tour-card-price"[^>]*><span>From<\/span>(\$[0-9,]+)/g,
)];
assert(cardPrices.length > 0, 'no catalogue card prices found to check');
for (const [, slug, cardPrice] of cardPrices) {
  const detailFile = `${slug === 'just-go-ghana' ? slug : `${slug}-tour`}.html`;
  let detail;
  try {
    detail = await readFile(join(outputPath, detailFile), 'utf8');
  } catch {
    continue; // A tour without its own page yet is Phase 3's problem, not a price bug.
  }
  const stated = detail.match(/class="big-price">(\$[0-9,]+)/);
  if (!stated) continue;
  assert.equal(
    stated[1],
    cardPrice,
    `${detailFile} says ${stated[1]} but its catalogue card says ${cardPrice}`,
  );
}

const sitemap = await readFile(join(outputPath, 'sitemap.xml'), 'utf8');
const locations = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+\/people-and-places-tours\/(.*?)<\/loc>/g)]
  .map(match => match[1] || 'index.html');

// Each standard story has to keep the filename and clean public URL assigned
// in tours.js. A Storyblok full_slug is CMS organisation only; it must not
// become a public route, and no single missing story can remove another tour's
// card, detail page, or sitemap entry.
const siteUrl = String(health.siteUrl).replace(/\/$/, '');
for (const tour of standardTours) {
  const route = cleanRoute(tour.detailUrl);
  assert(await exists(tour.detailUrl),
    `the standard tour ${tour.slug} lost its existing detail output file ${tour.detailUrl}`);
  const card = cardForSlug(generatedPackages, tour.slug);
  assert(card.includes(`href="${route}"`),
    `the ${tour.slug} card no longer links to its existing public route /${route}`);
  assert(sitemap.includes(`<loc>${siteUrl}/${route}</loc>`),
    `the standard tour ${tour.slug} is missing from the sitemap at its existing route /${route}`);
  const detail = await readFile(join(outputPath, tour.detailUrl), 'utf8');
  assert(detail.includes(`rel="canonical" href="${siteUrl}/${route}"`),
    `the ${tour.slug} detail page no longer declares its existing canonical route /${route}`);
}

// Just Go Ghana is explicitly out of Phase 3C. Its existing static page and
// card still ship, but neither its content nor asset host may be replaced by a
// standard-tour Storyblok record.
{
  const route = cleanRoute(justGoGhana.detailUrl);
  assert(await exists(justGoGhana.detailUrl), 'Just Go Ghana lost its existing detail page');
  const card = cardForSlug(generatedPackages, justGoGhana.slug);
  assert(card.includes(`href="${route}"`), 'Just Go Ghana card changed its existing public route');
  assert(card.includes(justGoGhana.title) && card.includes(justGoGhana.price),
    'Just Go Ghana card content was unexpectedly changed during the standard-tour migration');
  assert(sitemap.includes(`<loc>${siteUrl}/${route}</loc>`),
    'Just Go Ghana lost its existing sitemap route');
  const detail = await readFile(join(outputPath, justGoGhana.detailUrl), 'utf8');
  assert(detail.includes('<h1>Just Go Ghana</h1>'),
    'Just Go Ghana page content was unexpectedly replaced during the standard-tour migration');
  assert(!detail.includes('a.storyblok.com'),
    'Just Go Ghana must not receive a Storyblok standard-tour asset during Phase 3C');
}

// A tour created in the CMS has no file in the repository, so nothing would
// have failed if the build had quietly skipped building its page.
// Kumasi is $250 by road or $400 by air; Cape Coast is $160 or $180 with the
// naming ceremony. Both sat in the CMS for a week with no page able to show
// them, which is revenue a visitor could not see.
for (const [file, expected] of [['kumasi-tour.html', '$400'], ['cape-coast-tour.html', '$180']]) {
  const page = await readFile(join(outputPath, file), 'utf8');
  assert(
    page.includes('price-option') && page.includes(expected),
    `${file} does not show its alternative price of ${expected}`,
  );
}

for (const slug of ['cape-coast-day', 'volta-community']) {
  const file = `${slug}-tour.html`;
  const page = await readFile(join(outputPath, file), 'utf8');
  assert(/<h1>[^<]+<\/h1>/.test(page), `${file} was generated without a heading`);
  assert(/big-price">\$[0-9,]+/.test(page), `${file} was generated without a price`);
  assert(page.includes('<nav'), `${file} was generated without navigation`);
  assert(sitemap.includes(slug), `${file} was generated but left out of the sitemap`);
}

for (const location of locations) {
  const publicFile = location || 'index.html';
  assert(await exists(publicFile), `Sitemap points to missing build output: ${publicFile}`);
}


// Every page's skip link must resolve to a real element on that page. The
// homepage shipped a skip link pointing at #main-content while its <main>
// carried id="homepage-root", so keyboard users had no way past the nav on
// the most-visited page — and nothing caught it, because the link and the
// target live in different files.
{
  const pages = (await readdir(outputPath)).filter(f => f.endsWith('.html'));
  const broken = [];
  for (const page of pages) {
    const html = await readFile(join(outputPath, page), 'utf8');
    for (const [, target] of html.matchAll(/<a[^>]*class="skip-link"[^>]*href="#([^"]+)"/g)) {
      if (!new RegExp(`id="${target}"`).test(html)) broken.push(`${page} -> #${target}`);
    }
  }
  assert.deepEqual(broken, [], `skip links with no target: ${broken.join(', ')}`);
}


// A stylesheet with unbalanced braces does not fail to load — the browser
// silently discards everything after the stray one. A deletion script once
// left a single orphaned `}` in style.css, which dropped the whole cream
// treatment on the homepage's "How You're Hosted" section; the page still
// built, still passed every structural test, and only the pixel diff caught
// it. Counting braces costs nothing and catches the whole class.
{
  const css = await readFile(join(outputPath, 'style.css'), 'utf8');
  // Strip comments and string literals so braces inside them do not count.
  const stripped = css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
  let depth = 0;
  let firstOrphanLine = 0;
  let line = 1;
  for (const character of stripped) {
    if (character === '\n') line += 1;
    else if (character === '{') depth += 1;
    else if (character === '}') {
      depth -= 1;
      if (depth < 0 && !firstOrphanLine) firstOrphanLine = line;
    }
  }
  assert.equal(firstOrphanLine, 0,
    `style.css has an unmatched closing brace near line ${firstOrphanLine} of the comment-stripped file`);
  assert.equal(depth, 0, `style.css has ${depth} unclosed block(s)`);
}

// The contact page told a visitor both "within one hour during business hours"
// and "within one business day", ~600px apart, at the moment they were deciding
// whether to hand over their travel plans. The committed files are guarded in
// tests/booking-source.mjs, but Sanity merges over them and is what actually
// ships, so the only place the real answer is visible is the built page.
//
// A warning rather than a failure: this is an editor's sentence to fix in the
// Studio, and the site already prefers to render, complain, and carry on rather
// than block a deploy over copy.
{
  const contact = await readFile(join(outputPath, 'contact.html'), 'utf8');
  const text = contact.replace(/<[^>]+>/g, ' ');
  const WINDOW = /within (?:the )?(one|two|a|\d+)\s+(hour|hours|business day|business days|day|days)/gi;
  const norm = m => `${m[1].toLowerCase().replace(/^a$/, 'one')} ${m[2].toLowerCase().replace(/s$/, '')}`;
  const windows = [...new Set([...text.matchAll(WINDOW)].map(norm))];
  if (windows.length > 1) {
    console.warn(
      `contact.html promises ${windows.length} different reply windows on one page — ` +
      `${windows.join(' and ')}. Whichever is true, the Studio should say only that one.`,
    );
  }
}

// just-go-ghana.html is hand-authored rather than generated, so its related
// cards carry prices typed in by hand. They drifted: the page offered Shai
// Hills at $130 and Accra City at $100 while the catalogue had moved to $140
// and $110, so a visitor clicking through met a different price than the one
// that brought them. Every price a committed page states about another tour
// must match what that tour actually costs.
{
  const catalogue = await readFile(new URL('../tours.js', import.meta.url), 'utf8');
  const priceOf = slug => {
    const block = catalogue.split(`slug: '${slug}'`)[1] || '';
    return (block.match(/price: '(\$[\d,]+)'/) || [])[1];
  };
  const page = await readFile(join(outputPath, 'just-go-ghana.html'), 'utf8');
  const named = [
    ['Cape Coast Ancestral Tour', 'cape-coast'],
    ['Shai Hills & Boat Cruise', 'shai-hills'],
    ['Accra City Tour', 'accra-city'],
  ];
  for (const [title, slug] of named) {
    const shown = (page.match(new RegExp(`${title.replace(/&/g, '&(?:amp;)?')}</h3>\\s*<div class="price">From (\\$[\\d,]+)`)) || [])[1];
    // Not `continue`: a card that cannot be found means this check stopped
    // looking at anything, which is how the first version of it passed while a
    // stale price sat on the page. If the markup changes, fail and be fixed.
    assert.ok(shown, `just-go-ghana.html has no related card priced for "${title}" — this check needs updating`);
    assert.equal(shown, priceOf(slug),
      `just-go-ghana.html shows ${title} at ${shown}, but the catalogue says ${priceOf(slug)}`);
  }
}

console.log('Build output and availability checks passed.');
