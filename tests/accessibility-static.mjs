import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const files = (await readdir(root)).filter(file => file.endsWith('.html'));

for (const file of files) {
  const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  assert(/<html\s+[^>]*lang="en"/i.test(html), `${file} is missing the English document language`);
  assert(/<meta\s+[^>]*name="viewport"/i.test(html), `${file} is missing a viewport meta tag`);
  assert(!/href="#"/i.test(html), `${file} contains a non-functional # link`);

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    assert(/\balt="[^"]*"/i.test(match[0]), `${file} has an image without an alt attribute: ${match[0].slice(0, 100)}`);
  }

  const h1Count = (html.match(/<h1\b/gi) || []).length;
  if (file !== 'index.html') {
    assert.equal(h1Count, 1, `${file} should contain exactly one h1 in source, got ${h1Count}`);
  }
}

const css = await readFile(new URL('../style.css', import.meta.url), 'utf8');
assert(css.includes(':focus-visible'), 'The stylesheet is missing a keyboard focus-visible treatment');
assert(css.includes('.reveal { opacity: 1; transform: none; }'), 'Reveal content is not visible by default');
assert(css.includes('.reveal-ready .reveal'), 'Reveal enhancement is not scoped behind a readiness class');

console.log(`Static accessibility checks passed across ${files.length} HTML pages.`);
