import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadBookingContent, loadLocalBookingContent, TEXT_KEYS} from '../scripts/booking-source.mjs';
import {injectBookingContent} from '../scripts/render-booking.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const local = await loadLocalBookingContent(projectRoot);

// ── Local content is complete ──
for (const key of TEXT_KEYS) {
  assert.equal(typeof local[key], 'string', `booking.json is missing ${key}`);
}
assert(local.trustPoints.length >= 1);
assert(local.nextSteps.length >= 1);
assert(local.faqs.length >= 1);

// The brand voice rules out checkout language on the primary actions.
for (const label of [local.submitLabel, local.nextLabel]) {
  assert(
    !/^(submit|send|book now|buy|checkout|pay)\b/i.test(label.trim()),
    `Booking CTA "${label}" reads as a transaction, not an invitation`,
  );
}

// ── Loader contract ──
let loaded = await loadBookingContent({localContent: local, env: {}});
assert.equal(loaded.source, 'local');
assert.equal(loaded.content.title, local.title);

let requestedUrl;
loaded = await loadBookingContent({
  localContent: local,
  env: {SANITY_STUDIO_PROJECT_ID: 'project-123', SANITY_STUDIO_DATASET: 'production'},
  fetchImpl: async url => {
    requestedUrl = url;
    return new Response(JSON.stringify({result: {...local, title: 'Edited in Sanity'}}), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    });
  },
});
assert.equal(loaded.source, 'sanity');
assert.equal(loaded.content.title, 'Edited in Sanity');
assert(requestedUrl.includes('project-123.apicdn.sanity.io'));

// Incomplete Sanity content must fail the build rather than publish gaps.
await assert.rejects(
  loadBookingContent({
    localContent: local,
    env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
    fetchImpl: async () => new Response(JSON.stringify({result: {...local, successTitle: ''}}), {
      status: 200,
      headers: {'Content-Type': 'application/json'},
    }),
  }),
  /successTitle/,
);

await assert.rejects(
  loadBookingContent({
    localContent: local,
    env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
    fetchImpl: async () => new Response('unavailable', {status: 503}),
  }),
  /HTTP 503/,
);

// ── Every bound key in contact.html is actually rendered ──
const contactHtml = await readFile(new URL('../contact.html', import.meta.url), 'utf8');
const boundKeys = [...contactHtml.matchAll(/data-booking-copy="([^"]+)"/g)].map(match => match[1]);
assert(boundKeys.length > 0, 'contact.html has no booking copy bindings');
for (const key of boundKeys) {
  assert(TEXT_KEYS.includes(key), `contact.html binds unknown booking copy key "${key}"`);
}

const edited = {
  ...local,
  title: 'A different headline',
  successTitle: 'A different confirmation',
  trustPoints: [{icon: 'clock', label: 'Replies fast'}],
  nextSteps: [{title: 'One step', description: 'Only one.'}],
  faqs: [{question: 'Only question?', answer: 'Only answer.'}],
};
const rendered = injectBookingContent(contactHtml, edited);
assert(rendered.includes('A different headline'));
assert(rendered.includes('A different confirmation'));
assert(rendered.includes('Replies fast'));
assert(rendered.includes('Only question?'));
assert(!rendered.includes(local.faqs[1].question), 'stale FAQ survived injection');
assert.equal((rendered.match(/class="booking-next-step"/g) || []).length, 1);

// Injected copy must be escaped, never interpreted as markup.
const escaped = injectBookingContent(contactHtml, {...local, title: '<script>alert(1)</script>'});
assert(!escaped.includes('<script>alert(1)</script>'));
assert(escaped.includes('&lt;script&gt;'));

console.log('Booking flow content contract tests passed.');
