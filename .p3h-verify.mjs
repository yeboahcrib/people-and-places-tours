import {STORYBLOK_STANDARD_TOUR_REGISTRY, STORYBLOK_MULTI_DAY_REGISTRY} from './scripts/storyblok-tour-source.mjs';
import {STORYBLOK_TOUR_AUTHORITY} from './scripts/storyblok-migration-authority.mjs';
const token = process.env.STORYBLOK_PUBLIC_API_TOKEN;
const all = [...STORYBLOK_STANDARD_TOUR_REGISTRY, ...STORYBLOK_MULTI_DAY_REGISTRY];
const published = [], missing = [];
console.log('  slug                 authority       published  HTTP');
for (const e of all) {
  const r = await fetch(`https://api.storyblok.com/v2/cdn/stories/${e.fullSlug}?version=published&token=${token}`, {redirect:'follow'});
  const ok = r.status === 200;
  (ok ? published : missing).push(e.slug);
  console.log('  ' + e.slug.padEnd(21) + STORYBLOK_TOUR_AUTHORITY[e.slug].padEnd(16) + (ok?'YES':'no').padEnd(11) + r.status);
}
const expectedPublished = all.filter(e => STORYBLOK_TOUR_AUTHORITY[e.slug]==='authoritative').map(e=>e.slug).sort();
const expectedMissing  = all.filter(e => STORYBLOK_TOUR_AUTHORITY[e.slug]==='pending').map(e=>e.slug).sort();
const match = JSON.stringify(published.sort())===JSON.stringify(expectedPublished)
           && JSON.stringify(missing.sort())===JSON.stringify(expectedMissing);
console.log(`\n  published: ${published.length} | unavailable: ${missing.length}`);
console.log('  matches the authority registry exactly:', match);
if (!match) {
  console.log('  expected published:', expectedPublished.join(', '));
  console.log('  actually published:', published.join(', '));
}
