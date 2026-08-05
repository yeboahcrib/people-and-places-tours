import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';
import {loadSiteContent} from '../scripts/content-source.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
let loaded = await loadSiteContent({projectRoot, env: {}, fetchImpl: fetch});
assert.equal(loaded.source, 'local');
assert.equal(loaded.content.siteSettings.businessName, 'People & Places');
assert.equal(loaded.content.navigation.navLinks.length, 4);

let requestedUrl;
loaded = await loadSiteContent({
  projectRoot,
  env: {SANITY_STUDIO_PROJECT_ID: 'project-123', SANITY_STUDIO_DATASET: 'production'},
  fetchImpl: async url => {
    requestedUrl = url;
    return new Response(JSON.stringify({
      result: {
        siteSettings: {businessName: 'People & Places', primaryPhone: '+233 50 367 3473', email: 'team@example.com'},
        navigation: {
          navLinks: [{label: 'Home', href: 'index.html'}],
          footerTagline: 'Hosted with care.',
          footerColumns: [{heading: 'Links', links: [{label: 'Home', href: 'index.html'}]}],
        },
      },
    }), {status: 200, headers: {'Content-Type': 'application/json'}});
  },
});
assert.equal(loaded.source, 'sanity');
assert(requestedUrl.includes('project-123.apicdn.sanity.io'));

await assert.rejects(
  loadSiteContent({
    projectRoot,
    env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
    fetchImpl: async () => new Response('unavailable', {status: 503}),
  }),
  /HTTP 503/,
);

console.log('Content source contract tests passed.');
