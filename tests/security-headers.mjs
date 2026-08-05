import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const headers = await readFile(new URL('../_headers', import.meta.url), 'utf8');
const cspLine = headers.split(/\r?\n/).find(line => line.trim().startsWith('Content-Security-Policy:'));

assert(cspLine, 'Content-Security-Policy header is missing');

for (const directive of [
  "base-uri 'self'",
  "object-src 'none'",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "script-src-attr 'none'",
  "form-action 'self' https://formsubmit.co",
]) {
  assert(cspLine.includes(directive), `CSP is missing: ${directive}`);
}

const scriptDirective = cspLine.match(/script-src ([^;]+)/)?.[1] || '';
assert(!scriptDirective.includes("'unsafe-inline'"), 'script-src must not allow unsafe-inline');
assert(headers.includes('Strict-Transport-Security: max-age=31536000'), 'HSTS header is missing');
assert(headers.includes('X-Content-Type-Options: nosniff'), 'nosniff header is missing');
assert(headers.includes('Cross-Origin-Opener-Policy: same-origin'), 'COOP header is missing');
assert(!headers.includes('X-XSS-Protection:'), 'obsolete X-XSS-Protection header should not be used');

console.log('Security header tests passed.');
