// Generates every tour page from the CMS record and reports how it differs
// from the page written by hand. Nothing is written to disk: this exists so
// the difference can be read before a single hand-written file is deleted.
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {loadTourPageTemplate, renderTourPage} from './render-tour-page.mjs';
import {loadLocalTours} from './local-render-source.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const template = await loadTourPageTemplate(projectRoot);
const catalogue = await loadLocalTours(projectRoot);
const {tours: pageContent} = JSON.parse(await readFile(new URL('../src/content/tour-pages.json', import.meta.url), 'utf8'));

const text = html => html
  .replace(/<script[\s\S]*?<\/script>/g, ' ')
  .replace(/<style[\s\S]*?<\/style>/g, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const sentences = html => new Set(
  text(html).split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(s => s.length > 25),
);

let checked = 0;
for (const tour of catalogue) {
  if (tour.slug === 'just-go-ghana') continue; // Its own template — the package page has an itinerary.
  const extra = pageContent[tour.slug];
  if (!extra) { console.log(`${tour.slug}: no CMS page content`); continue; }

  const generated = renderTourPage({template, tour: {...tour, ...extra}, catalogue});
  let existing;
  try {
    existing = await readFile(new URL(`../${tour.detailUrl}`, import.meta.url), 'utf8');
  } catch { console.log(`${tour.slug}: no hand-written page to compare`); continue; }

  const before = sentences(existing);
  const after = sentences(generated);
  const lost = [...before].filter(s => !after.has(s));
  const gained = [...after].filter(s => !before.has(s));
  checked += 1;
  console.log(`\n=== ${tour.slug} (${tour.detailUrl})`);
  console.log(`    lost ${lost.length} / gained ${gained.length}`);
  for (const s of lost.slice(0, 4)) console.log(`    - ${s.slice(0, 120)}`);
  for (const s of gained.slice(0, 4)) console.log(`    + ${s.slice(0, 120)}`);
}
console.log(`\nCompared ${checked} tours.`);
