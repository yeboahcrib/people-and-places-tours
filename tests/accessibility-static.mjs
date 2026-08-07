import assert from 'node:assert/strict';
import {readdir, readFile} from 'node:fs/promises';

// Elements that never carry a closing tag, plus svg, whose internals are
// checked by nobody here and would only add noise.
const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

/**
 * Mis-nested markup once shipped to production unnoticed: a </section> closing
 * a <div> ended a landmark early and orphaned everything after it, and every
 * suite still passed because none of them looked at document structure. This
 * walks the tag stack and fails on the first mismatch.
 */
function findNestingError(html) {
  // Comments are stripped before the tag stack is walked, because their
  // contents are not markup. Without this, a comment that mentions an element
  // by name — which is the natural way to write "the build replaces this
  // <footer> with the shared one" — is read as a real opening tag and fails
  // the build with a nesting error that does not exist. The comment is then
  // the bug, which is a confusing place to end up.
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const withoutSvg = withoutComments.replace(/<svg\b[\s\S]*?<\/svg>/gi, '');
  const stack = [];
  for (const match of withoutSvg.matchAll(/<(\/?)([a-zA-Z][a-zA-Z0-9-]*)\b([^>]*)>/g)) {
    const [tag, closing, name, attributes] = match;
    const element = name.toLowerCase();
    if (VOID_ELEMENTS.has(element) || attributes.trimEnd().endsWith('/')) continue;
    if (!closing) {
      stack.push(element);
      continue;
    }
    if (stack.length === 0) return `stray ${tag} with nothing open`;
    const open = stack.pop();
    if (open !== element) return `${tag} closes <${open}>`;
  }
  return stack.length ? `unclosed <${stack[stack.length - 1]}>` : null;
}

const root = new URL('../', import.meta.url);
const files = (await readdir(root)).filter(file => file.endsWith('.html'));

for (const file of files) {
  const html = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');
  assert(/<html\s+[^>]*lang="en"/i.test(html), `${file} is missing the English document language`);
  assert(/<meta\s+[^>]*name="viewport"/i.test(html), `${file} is missing a viewport meta tag`);
  assert(!/href="#"/i.test(html), `${file} contains a non-functional # link`);

  const nestingError = findNestingError(html);
  assert.equal(nestingError, null, `${file} has malformed markup: ${nestingError}`);

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
