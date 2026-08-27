import assert from 'node:assert/strict';
import {access, readFile, readdir} from 'node:fs/promises';
import {join} from 'node:path';

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
const generatedPackages = await readFile(join(outputPath, 'packages.html'), 'utf8');
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

console.log('Build output and availability checks passed.');
