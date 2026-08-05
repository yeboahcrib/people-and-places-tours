import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadAboutContent, loadLocalAboutContent, TEXT_KEYS, LIST_SHAPES} from '../scripts/about-source.mjs';
import {injectAboutContent} from '../scripts/render-about.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const local = await loadLocalAboutContent(projectRoot);

for (const key of TEXT_KEYS) assert.equal(typeof local[key], 'string', `about.json missing ${key}`);
for (const list of Object.keys(LIST_SHAPES)) assert(local[list].length > 0, `about.json ${list} is empty`);

// Content is stored as plain text; entities belong to the HTML layer. Storing
// "&amp;" here would be escaped again on the way out and render literally.
for (const value of JSON.stringify(local).match(/&[a-z]+;/gi) || []) {
  assert.fail(`about.json contains an HTML entity (${value}); store plain text instead`);
}

// Impact figures must stay inside what the Claim Register approves.
const guests = local.impactStats.find(stat => /guest/i.test(stat.label));
assert(guests && guests.value === '300', 'approved guest figure is "300"');

// ── Loader contract ──
let loaded = await loadAboutContent({localContent: local, env: {}});
assert.equal(loaded.source, 'local');

let requestedUrl;
loaded = await loadAboutContent({
  localContent: local,
  env: {SANITY_STUDIO_PROJECT_ID: 'project-123', SANITY_STUDIO_DATASET: 'production'},
  fetchImpl: async url => {
    requestedUrl = url;
    return new Response(JSON.stringify({result: {...local, heroTitle: 'Edited in Sanity'}}), {
      status: 200, headers: {'Content-Type': 'application/json'},
    });
  },
});
assert.equal(loaded.source, 'sanity');
assert.equal(loaded.content.heroTitle, 'Edited in Sanity');
assert(requestedUrl.includes('project-123.apicdn.sanity.io'));

await assert.rejects(
  loadAboutContent({
    localContent: local,
    env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
    fetchImpl: async () => new Response(JSON.stringify({result: {...local, missionBody: ''}}), {
      status: 200, headers: {'Content-Type': 'application/json'},
    }),
  }),
  /missionBody/,
);

await assert.rejects(
  loadAboutContent({
    localContent: local,
    env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
    fetchImpl: async () => new Response(JSON.stringify({result: {...local, team: [{name: 'X', role: 'Y'}]}}), {
      status: 200, headers: {'Content-Type': 'application/json'},
    }),
  }),
  /team\[0\] is missing "bio"/,
);

// ── Every bound key in about.html is known ──
const aboutHtml = await readFile(new URL('../about.html', import.meta.url), 'utf8');
const bound = [...aboutHtml.matchAll(/data-about-copy="([^"]+)"/g)].map(match => match[1]);
assert(bound.length > 0, 'about.html has no bindings');
for (const key of bound) assert(TEXT_KEYS.includes(key), `about.html binds unknown key "${key}"`);
for (const key of TEXT_KEYS) assert(bound.includes(key), `about.html never renders "${key}"`);

// ── Injection replaces whole containers, not just the first child ──
// The difference grid and stats row hold children of the same tag as their
// container, which a non-greedy match truncates.
const edited = {
  ...local,
  heroTitle: 'A different hero',
  differenceItems: [{title: 'Only card', text: 'Only text.'}],
  team: [{name: 'Ada “Aba” Mensah', role: 'Host', bio: 'One line.'}],
  impactStats: [{value: '42', label: 'Only stat'}],
  faqs: [{question: 'Only question?', answer: 'Only answer.'}],
  storyParagraphs: ['Only paragraph.'],
};
const rendered = injectAboutContent(aboutHtml, edited);
assert(rendered.includes('A different hero'));
assert.equal((rendered.match(/class="why-item/g) || []).length, 1, 'stale difference cards survived');
assert.equal((rendered.match(/class="team-card/g) || []).length, 1, 'stale team cards survived');
assert.equal((rendered.match(/class="stat-block"/g) || []).length, 1, 'stale stat blocks survived');
assert.equal((rendered.match(/class="faq-item/g) || []).length, 1, 'stale FAQs survived');
// Nickname in quotes is skipped when deriving initials.
assert(rendered.includes('>AM<'), 'initials should be AM');
// The figure is in the markup, so the page is truthful without JavaScript.
assert(rendered.includes('data-target="42">42<'));

// ── Team photos ──
// Optional by design: photography is still in progress, so a member without an
// approved photo must keep the initials placeholder rather than a broken frame.
const approved = {
  src: 'https://cdn.sanity.io/images/x/y/nana.jpg', alt: 'Nana outside the office in Accra',
  width: 900, height: 1200, publicApprovalState: 'approved', placeholderState: 'approved',
};
const withPhoto = injectAboutContent(aboutHtml, {
  ...local,
  team: [{name: 'Isaac “Nana” Yeboah', role: 'Co-founder', bio: 'A line.', photo: approved}],
});
assert(withPhoto.includes('class="team-photo has-photo"'), 'approved photo should render a photo frame');
assert(withPhoto.includes('alt="Nana outside the office in Accra"'));
assert(withPhoto.includes('width="900"') && withPhoto.includes('height="1200"'), 'dimensions prevent layout shift');
assert(withPhoto.includes('loading="lazy"'));
assert(!withPhoto.includes('team-photo-placeholder'), 'initials should not also render');

assert(!withPhoto.includes('team-placeholder-note'), 'photography note should retire once all photos are approved');

// Mixed state: one member still without a photo means the note is still true.
const mixed = injectAboutContent(aboutHtml, {
  ...local,
  team: [
    {name: 'Isaac “Nana” Yeboah', role: 'Co-founder', bio: 'A line.', photo: approved},
    {name: 'Evans “Kojo” Yirenkyi', role: 'Co-founder', bio: 'A line.'},
  ],
});
assert(mixed.includes('team-placeholder-note'), 'note should stay while any photo is missing');
assert(mixed.includes('team-photo-placeholder'), 'the member without a photo keeps initials');
assert(mixed.includes('class="team-photo has-photo"'), 'the member with a photo shows it');

// An image that has not cleared both approval gates must never publish.
for (const unapproved of [
  {...approved, publicApprovalState: 'pending'},
  {...approved, placeholderState: 'pending'},
  {...approved, alt: ''},
]) {
  const out = injectAboutContent(aboutHtml, {
    ...local,
    team: [{name: 'Ada Mensah', role: 'Host', bio: 'A line.', photo: unapproved}],
  });
  assert(out.includes('team-photo-placeholder'), 'unapproved photo must fall back to initials');
  assert(!out.includes(approved.src), 'unapproved photo must not reach the page');
}

// A photo with no alt text fails the build rather than shipping unlabelled.
await assert.rejects(
  loadAboutContent({
    localContent: local,
    env: {SANITY_STUDIO_PROJECT_ID: 'project-123'},
    fetchImpl: async () => new Response(JSON.stringify({result: {
      ...local,
      team: [{name: 'Ada', role: 'Host', bio: 'A line.', photo: {src: 'x.jpg'}}],
    }}), {status: 200, headers: {'Content-Type': 'application/json'}}),
  }),
  /photo with no alt text/,
);

// Injected copy is escaped, never interpreted as markup.
const escaped = injectAboutContent(aboutHtml, {...local, heroTitle: '<script>alert(1)</script>'});
assert(!escaped.includes('<script>alert(1)</script>'));
assert(escaped.includes('&lt;script&gt;'));

console.log('About page content contract tests passed.');
