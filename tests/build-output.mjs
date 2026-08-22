import assert from 'node:assert/strict';
import {access, readFile, readdir} from 'node:fs/promises';
import {join} from 'node:path';

const output = new URL('../dist/', import.meta.url);
const outputPath = decodeURIComponent(output.pathname);
const exists = path => access(join(outputPath, path)).then(() => true, () => false);

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
assert.equal((generatedHome.match(/data-home-section=/g) || []).length, 7, 'Homepage was not statically rendered with 7 sections');
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
for (const file of ['cancellation-refund-policy.html', 'travel-insurance.html']) {
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

const sitemap = await readFile(join(outputPath, 'sitemap.xml'), 'utf8');
const locations = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+\/people-and-places-tours\/(.*?)<\/loc>/g)]
  .map(match => match[1] || 'index.html');

for (const location of locations) {
  const publicFile = location || 'index.html';
  assert(await exists(publicFile), `Sitemap points to missing build output: ${publicFile}`);
}

console.log('Build output and availability checks passed.');
