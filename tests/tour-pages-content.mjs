import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';

// This file is the version-controlled copy of content that otherwise exists
// only in Sanity. It is checked rather than trusted because every value here
// was migrated by hand out of HTML, and three of them were wrong when they
// left it.
const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const {tours} = JSON.parse(await readFile(new URL('../src/content/tour-pages.json', import.meta.url), 'utf8'));

const dayTours = ['accra-city', 'aburi', 'quad-bike', 'shai-hills', 'kumasi', 'volta', 'cape-coast', 'ada-foah'];

for (const slug of dayTours) {
  const tour = tours[slug];
  assert(tour, `${slug} has no page content`);
  assert(tour.included?.length, `${slug} lists nothing as included`);
  assert(
    tour.excluded?.includes('Lunch'),
    `${slug} no longer excludes lunch — four tours once advertised it as included and it is not`,
  );
}

// Kakum belongs to the Cape Coast Day Tour, which the site does not sell yet.
const capeCoast = JSON.stringify(tours['cape-coast']);
assert(!/kakum/i.test(capeCoast), 'Kakum is back on the Cape Coast Ancestral Tour');

// The package is the only trip with a day-by-day plan.
const itinerary = tours['just-go-ghana']?.itinerary || [];
assert.equal(itinerary.length, 8, 'the package itinerary is not eight days');
assert.deepEqual(
  itinerary.map(day => day.day),
  [1, 2, 3, 4, 5, 6, 7, 8],
  'the package itinerary days are out of order or missing',
);
for (const day of itinerary) {
  assert(day.title?.trim() && day.description?.trim(), `day ${day.day} of the package is incomplete`);
}

const faqCount = Object.values(tours).reduce((total, tour) => total + (tour.faqs?.length || 0), 0);
assert(faqCount >= 60, `only ${faqCount} tour FAQs survived migration`);

// Answered once, on the Travelling to Ghana page.
for (const [slug, tour] of Object.entries(tours)) {
  for (const faq of tour.faqs || []) {
    assert(
      !/do i need a visa|what vaccinations/i.test(faq.question),
      `${slug} repeats a question the Travelling to Ghana page owns: "${faq.question}"`,
    );
  }
}

console.log(`Tour page content checks passed (${faqCount} FAQs, ${itinerary.length}-day itinerary).`);
