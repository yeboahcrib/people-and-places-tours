/**
 * The SEO metadata the build emits.
 *
 * Two things are pinned here. A meta description has to be short enough that a
 * search result shows all of it — twelve tour pages shipped between 251 and 630
 * characters because the fallback was the page's whole intro paragraph. And the
 * homepage carries one structured-data record, built from the same siteSettings
 * the footer renders, so it cannot claim something a visitor cannot see.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {metaDescription} from '../scripts/render-tour-page.mjs';
import {THEME_COLOR} from '../scripts/render-meta.mjs';

// ── Trimming ──

// An authored description is never touched; only a fallback is trimmed. That
// distinction lives at the call site, so what is checked here is the trimmer.
assert.equal(metaDescription('Short enough already.'), 'Short enough already.');
assert.equal(metaDescription(''), '');
assert.equal(metaDescription(undefined), '');
assert.equal(metaDescription('  collapses   whitespace  '), 'collapses whitespace');

{
  const long = 'When the sun sets over Accra, a different city wakes up, lit by charcoal '
    + 'fires and sizzling woks. This tour walks you through it with someone who eats here '
    + 'every week, not a guide reading from a script, and you finish somewhere with music.';
  const out = metaDescription(long);
  assert(out.length <= 160, `trimmed description is still ${out.length} characters`);
  assert(long.startsWith(out.replace(/…$/, '').trim()),
    'the trimmed description is not a prefix of the original — wording was altered');
  assert(!/\s$/.test(out), 'trimmed description ends in whitespace');
}

// Ending on a sentence is preferred, but not at the cost of most of the text.
{
  const sentence = 'A short first sentence. ' + 'x'.repeat(300);
  // The full stop sits at 22 of 160 — too early, so a word boundary is used.
  assert(metaDescription(sentence).endsWith('…'),
    'a very early full stop should not truncate the description to a fragment');

  const late = 'A'.repeat(100) + ' and more words here. ' + 'B'.repeat(200);
  assert(metaDescription(late).endsWith('.'),
    'a full stop late enough to keep should end the description');
}

// Every real page description the build produces fits.
{
  const projectRoot = fileURLToPath(new URL('../', import.meta.url));
  const {readdir} = await import('node:fs/promises');
  const files = (await readdir(`${projectRoot}dist`)).filter(f => f.endsWith('.html'));
  assert(files.length >= 20, 'dist looks unbuilt; run npm run build first');
  const over = [];
  for (const file of files) {
    const html = await readFile(`${projectRoot}dist/${file}`, 'utf8');
    const match = html.match(/<meta[^>]+name="description"[^>]+content="([^"]*)"/i);
    assert(match, `${file} has no meta description`);
    const value = match[1].replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"');
    if (value.length > 160) over.push(`${file} (${value.length})`);
  }
  assert.deepEqual(over, [], `meta descriptions longer than a search result shows: ${over.join(', ')}`);
}

// ── Theme colour ──
//
// The value is written in render-meta.mjs, but it belongs to the stylesheet.
// If --pap-charcoal is ever changed, the browser bar would keep painting the
// old colour beside the new hero, and nothing would say so.
{
  const projectRoot = fileURLToPath(new URL('../', import.meta.url));
  const css = await readFile(`${projectRoot}style.css`, 'utf8');
  const declared = /--pap-charcoal:\s*(#[0-9a-fA-F]{3,8})\s*;/.exec(css)?.[1];
  assert(declared, 'style.css no longer declares --pap-charcoal');
  assert.equal(THEME_COLOR.toLowerCase(), declared.toLowerCase(),
    `theme-color ${THEME_COLOR} has drifted from --pap-charcoal ${declared}`);

  const files = (await (await import('node:fs/promises')).readdir(`${projectRoot}dist`))
    .filter(f => f.endsWith('.html'));
  for (const file of files) {
    const html = await readFile(`${projectRoot}dist/${file}`, 'utf8');
    assert(html.includes(`<meta name="theme-color" content="${THEME_COLOR}" />`),
      `${file} has no theme-color`);
    // en_GH is not a locale any Open Graph consumer carries; en_GB is.
    assert(html.includes('property="og:locale" content="en_GB"'),
      `${file} does not declare a supported og:locale`);
  }
}

// ── robots.txt ──
//
// One group, not two. Cloudflare prepends its own "User-agent: *" block on the
// live domain, and a second one here would shadow its Content-Signal line.
{
  const projectRoot = fileURLToPath(new URL('../', import.meta.url));
  const robots = await readFile(`${projectRoot}dist/robots.txt`, 'utf8');
  assert.equal((robots.match(/^User-agent:/gm) || []).length, 0,
    'the generated robots.txt declares a user-agent group of its own again');
  assert(/^Sitemap: https?:\/\/\S+\/sitemap\.xml$/m.test(robots),
    `robots.txt no longer points at the sitemap:\n${robots}`);
  // Nothing here may ever forbid crawling the live site by accident.
  assert(!/^Disallow:/m.test(robots), 'the generated robots.txt disallows crawling');
}

// ── Social images ──
//
// A tour shared into a chat should show that tour. Three pages were falling
// back to the site banner because their Storyblok SEO block named no social
// image — including Just Go Ghana, whose page is committed rather than
// generated and so never appeared in the generated-page map at all.

{
  const projectRoot2 = fileURLToPath(new URL('../', import.meta.url));
  const {readdir} = await import('node:fs/promises');
  const files = (await readdir(`${projectRoot2}dist`)).filter(f => f.endsWith('.html'));
  const tourPages = files.filter(f => /-tour\.html$|^just-go-ghana\.html$|^batik-workshop\.html$/.test(f));
  assert(tourPages.length >= 12, `expected the tour pages, found ${tourPages.length}`);

  for (const file of tourPages) {
    const html = await readFile(`${projectRoot2}dist/${file}`, 'utf8');
    const og = /property="og:image"[^>]+content="([^"]*)"/.exec(html)?.[1];
    const tw = /name="twitter:image"[^>]+content="([^"]*)"/.exec(html)?.[1];
    assert(og, `${file} has no og:image`);
    assert(!og.includes('share-door-of-return'),
      `${file} still shares the generic site image instead of its own photograph`);
    assert(og.includes('a.storyblok.com'), `${file} social image is not the approved Storyblok photograph`);
    assert(/\/m\/1200x630\//.test(og), `${file} social image is not cropped to link-preview proportions: ${og}`);
    assert.equal(tw, og, `${file} twitter:image and og:image disagree`);
  }
}

// The site's share image is the fallback for everything that is not a tour.
{
  const projectRoot3 = fileURLToPath(new URL('../', import.meta.url));
  const fallback = 'assets/photos/share-door-of-return-1200x630.jpg';
  // The size in the file name is what the pages declare, so it has to be the
  // file's real size. Read from the JPEG's own frame header, not trusted.
  const bytes = await readFile(`${projectRoot3}${fallback}`);
  let size = null;
  for (let at = 2; at < bytes.length - 9;) {
    const marker = bytes[at + 1];
    if (bytes[at] !== 0xFF) break;
    if (marker >= 0xC0 && marker <= 0xC3) { size = {height: bytes.readUInt16BE(at + 5), width: bytes.readUInt16BE(at + 7)}; break; }
    at += 2 + bytes.readUInt16BE(at + 2);
  }
  assert.deepEqual(size, {width: 1200, height: 630}, `${fallback} is not the 1200x630 its name promises`);
  for (const file of ['index.html', 'about.html', 'contact.html', 'privacy-policy.html', 'go.html']) {
    const html = await readFile(`${projectRoot3}dist/${file}`, 'utf8');
    const og = /property="og:image"[^>]+content="([^"]*)"/.exec(html)?.[1];
    assert(og && og.endsWith(`/${fallback}`),
      `${file} should use the site share image; a page with no tour photograph must have a fallback`);
    assert.equal(/property="og:image:width"[^>]+content="([^"]*)"/.exec(html)?.[1], '1200', `${file} does not declare the share image width`);
    assert.equal(/property="og:image:height"[^>]+content="([^"]*)"/.exec(html)?.[1], '630', `${file} does not declare the share image height`);
    assert.equal(/name="twitter:image"[^>]+content="([^"]*)"/.exec(html)?.[1], og, `${file} twitter:image and og:image disagree`);
  }
}

console.log('SEO metadata tests passed.');
