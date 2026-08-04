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
  const footerCount = (html.match(/<!-- shared: footer -->/g) || []).length;
  if (file === 'thanks.html') assert.equal(footerCount, 0, 'thanks.html intentionally has no footer');
  else assert.equal(footerCount, 1, `${file} should contain one canonical shared footer`);
}

const health = JSON.parse(await readFile(join(outputPath, 'health.json'), 'utf8'));
assert.equal(health.status, 'ok');
assert.equal(health.service, 'people-and-places-website');
assert(['local', 'sanity'].includes(health.contentSource));
assert(['local', 'sanity'].includes(health.tourContentSource));
assert(['local', 'sanity'].includes(health.homepageContentSource));
assert(!Number.isNaN(Date.parse(health.builtAt)), 'health.json has an invalid build time');

const generatedHome = await readFile(join(outputPath, 'index.html'), 'utf8');
assert.equal((generatedHome.match(/data-home-section=/g) || []).length, 8, 'Homepage was not statically rendered with 8 sections');
assert.equal((generatedHome.match(/<article class="trip-card/g) || []).length, 4, 'Homepage was not built with 4 featured tour cards');
const generatedPackages = await readFile(join(outputPath, 'packages.html'), 'utf8');
assert.equal((generatedPackages.match(/<article class="tour-card/g) || []).length, 15, 'Packages page was not built with 15 tour cards');

const sitemap = await readFile(join(outputPath, 'sitemap.xml'), 'utf8');
const locations = [...sitemap.matchAll(/<loc>https?:\/\/[^/]+\/people-and-places-tours\/(.*?)<\/loc>/g)]
  .map(match => match[1] || 'index.html');

for (const location of locations) {
  const publicFile = location || 'index.html';
  assert(await exists(publicFile), `Sitemap points to missing build output: ${publicFile}`);
}

console.log('Build output and availability checks passed.');
