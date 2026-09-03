import assert from 'node:assert/strict';
import {STORYBLOK_EU_ASSET_HOSTS} from '../scripts/storyblok-tour-source.mjs';
import {readFile} from 'node:fs/promises';

const headers = await readFile(new URL('../_headers', import.meta.url), 'utf8');
const cspLine = headers.split(/\r?\n/).find(line => line.trim().startsWith('Content-Security-Policy:'));

assert(cspLine, 'Content-Security-Policy header is missing');

for (const directive of [
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "script-src-attr 'none'",
  "form-action 'self' https://formsubmit.co",
]) {
  assert(cspLine.includes(directive), `CSP is missing: ${directive}`);
}

const scriptDirective = cspLine.match(/script-src ([^;]+)/)?.[1] || '';
assert(!scriptDirective.includes("'unsafe-inline'"), 'script-src must not allow unsafe-inline');

// frame-src is an allow-list of one: Turnstile renders in an iframe, so
// 'none' prevents the booking form's spam check from appearing at all. The
// directive that guards against clickjacking is frame-ancestors, asserted
// above and still 'none'.
const frameDirective = cspLine.match(/frame-src ([^;]+)/)?.[1]?.trim() || '';
assert.equal(frameDirective, 'https://challenges.cloudflare.com',
  'frame-src must allow Turnstile and nothing else');

// Turnstile and Sanity are required by the live site but appear nowhere in the
// markup, so a future tidy-up could plausibly delete them as unused. These
// assertions make that failure loud at build time rather than in production.
for (const [host, directive] of [
  ['https://challenges.cloudflare.com', 'script-src'],
  ['https://cdn.sanity.io', 'img-src'],
  // Cloudflare injects the analytics beacon whether or not the policy allows
  // it. If blocked, the page pays for the request and records nothing, so
  // either both hosts are allowed or Web Analytics is switched off in the
  // dashboard.
  ['https://static.cloudflareinsights.com', 'script-src'],
  ['https://cloudflareinsights.com', 'connect-src'],
]) {
  const value = cspLine.match(new RegExp(`${directive} ([^;]+)`))?.[1] || '';
  assert(value.includes(host), `${directive} must allow ${host}`);
}

// Storyblok images were the one host the policy did not cover. The tour adapter
// refuses any asset not on this list, so asserting against the list itself means
// a newly accepted host cannot be added without the policy following it.
// Without this, a cutover would ship pages whose images are all blocked, with
// the failure reported only to the browser console.
const imgSrc = cspLine.match(/img-src ([^;]+)/)?.[1] || '';
for (const host of STORYBLOK_EU_ASSET_HOSTS) {
  assert(imgSrc.includes(`https://${host}`),
    `img-src must allow the Storyblok asset host ${host}, which the tour adapter accepts`);
}
assert(headers.includes('Strict-Transport-Security: max-age=31536000'), 'HSTS header is missing');
assert(headers.includes('X-Content-Type-Options: nosniff'), 'nosniff header is missing');
assert(headers.includes('Cross-Origin-Opener-Policy: same-origin'), 'COOP header is missing');
assert(!headers.includes('X-XSS-Protection:'), 'obsolete X-XSS-Protection header should not be used');

console.log('Security header tests passed.');
