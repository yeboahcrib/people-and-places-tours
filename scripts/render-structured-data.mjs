// Structured data for the pages that have something a crawler can use.
//
// The site already tells a reader what a tour costs and answers the questions
// people ask before booking. Both facts were readable only as prose. This
// states them in the form a search engine parses directly.
//
// One rule governs everything here: nothing is asserted that a visitor cannot
// see on the same page. The FAQ entries are read back out of the rendered
// markup rather than from the CMS record that produced it, so the schema
// cannot drift from the page even if the two sources ever disagree. Claims a
// crawler could check and find wrong — availability, a price valid-until date,
// ratings — are absent, because the site does not make them either.

const decodeEntities = value => String(value ?? '')
  .replace(/&(?:nbsp|#160);/g, ' ')
  .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)))
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
  // Ampersand last: decoding it first would let "&amp;lt;" become "<".
  .replace(/&amp;/g, '&');

const textFrom = markup => decodeEntities(String(markup ?? '').replace(/<[^>]*>/g, ' '))
  .replace(/\s+/g, ' ')
  .trim();

/**
 * The question-and-answer pairs a page actually renders.
 *
 * Two markup shapes exist and both are read. Tour pages emit a `.faq-q` row
 * followed by its `.faq-a`; the About and Contact pages use a `<button>` and a
 * `.faq-answer-inner`. A page with neither yields nothing.
 */
export function extractFaqs(html) {
  const source = String(html ?? '');
  const faqs = [];
  const patterns = [
    /<div class="faq-q">([\s\S]*?)<\/div>\s*<div class="faq-a">([\s\S]*?)<\/div>/g,
    /<button class="faq-question"[^>]*>([\s\S]*?)<\/button>\s*<div class="faq-answer">\s*<div class="faq-answer-inner">([\s\S]*?)<\/div>/g,
  ];
  for (const pattern of patterns) {
    for (const [, question, answer] of source.matchAll(pattern)) {
      const q = textFrom(question);
      const a = textFrom(answer);
      if (q && a) faqs.push({question: q, answer: a});
    }
  }
  return faqs;
}

// A page that renders FAQ items but yields none of them has changed shape
// under the extractor. Emitting a shorter list than the page shows is the one
// failure mode this module cannot detect at runtime, so the build stops.
export function countFaqItems(html) {
  return (String(html ?? '').match(/class="faq-item/g) || []).length;
}

/**
 * The number behind a displayed price, or null.
 *
 * Deliberately strict: only the "$1,234" and "$1,234.56" forms the catalogue
 * produces are recognised. Anything else — a range, a word, another currency —
 * returns null and the page simply carries no offer rather than a guess.
 */
export function parsePrice(displayed) {
  const match = /^\$((?:\d{1,3}(?:,\d{3})+|\d+))(?:\.(\d{2}))?$/.exec(String(displayed ?? '').trim());
  if (!match) return null;
  return {currency: 'USD', amount: Number(`${match[1].replace(/,/g, '')}.${match[2] || '00'}`)};
}

/**
 * A tour, as the thing being sold.
 *
 * The offer is an AggregateOffer with a low price, not an Offer with a price,
 * and that is not a technicality. Every tour page displays its number under
 * the words "From" and beside a note reading "Prices are for groups of three
 * or more. Solo travellers and pairs pay $20–30 more per person" — so the
 * figure shown is the least anyone pays, which is what lowPrice means. Stating
 * it as `price` would tell a crawler the tour costs that, which the page does
 * not say. No highPrice is given: the surcharge is a range, and the optional
 * extras some tours list are priced per booking rather than per person, so the
 * top of the range is not a number this site knows.
 */
export function tourProductNode({url, name, description, image, price, brand}) {
  if (!url || !name) return null;
  const offer = parsePrice(price);
  return {
    '@type': 'Product',
    '@id': `${url}#tour`,
    name,
    ...(description ? {description} : {}),
    ...(image ? {image} : {}),
    url,
    ...(brand ? {brand} : {}),
    ...(offer ? {
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: offer.currency,
        lowPrice: offer.amount,
        url,
      },
    } : {}),
  };
}

export function faqPageNode({url, faqs}) {
  if (!url || !faqs?.length) return null;
  return {
    '@type': 'FAQPage',
    '@id': `${url}#faq`,
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {'@type': 'Answer', text: faq.answer},
    })),
  };
}

/**
 * One record per page: a single node when that is all there is, and a @graph
 * when a page carries more than one. Never two script tags, so nothing has to
 * reconcile two competing descriptions of the same page.
 */
export function renderStructuredData(nodes) {
  const list = (nodes || []).filter(Boolean);
  if (!list.length) return '';
  const data = list.length === 1
    ? {'@context': 'https://schema.org', ...list[0]}
    : {'@context': 'https://schema.org', '@graph': list};
  // JSON inside a <script> must not be able to close the tag early.
  //
  // The replacement must be the two-character escape a JSON parser decodes
  // back to "<", written here as a literal backslash. Writing '<' with a
  // single backslash makes JavaScript decode it at parse time, so the call
  // becomes replace('<', '<') — a no-op that reads as protection.
  const json = JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}
