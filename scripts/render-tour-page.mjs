import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

// Generates a tour's detail page from its CMS record, using the markup of the
// pages that were written by hand. The template is a real page with its
// variable parts replaced, so the styling is inherited rather than rebuilt.

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

// The catalogue image is sized for a card (800px wide). The hero spans the
// full page, so it asks the same photo for a wider rendition rather than
// stretching the card one.
/**
 * Photographs from the experience itself.
 *
 * Empty for a tour with fewer than three approved photographs — the source
 * leaves the list undefined in that case, because two pictures read as a pair
 * that lost one rather than as a gallery.
 */
function renderGallery(tour) {
  const photos = tour.gallery || [];
  if (!photos.length) return '';
  const figures = photos.map(photo => `
      <figure class="gallery-item${photo.tall ? '' : ' is-wide'}">
        <img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt)}" loading="lazy" decoding="async" />
        ${photo.caption ? `<figcaption>${escapeHtml(photo.caption)}</figcaption>` : ''}
      </figure>`).join('');
  return `
<div class="tour-gallery">
  <div class="tour-gallery-inner">
    <div class="tour-gallery-head">
      <div class="tour-gallery-eyebrow">From this experience</div>
      <h2 class="tour-gallery-title">Photographs from the day</h2>
    </div>
    <div class="tour-gallery-grid">${figures}
    </div>
  </div>
</div>`;
}

function heroImageFor(tour) {
  if (tour.heroImage) return tour.heroImage;
  const card = String(tour.image || '');
  // A Studio photo arrives already cropped to card size around its focal
  // point. Widen it for the hero at the same crop rather than letting a
  // 1200px card image be stretched across the top of the page.
  if (card.includes('cdn.sanity.io')) {
    return card.replace(/([?&])w=\d+/, '$1w=1920').replace(/([?&])h=\d+/, '$1h=1344');
  }
  if (!card.includes('images.unsplash.com')) return card;
  return card.replace(/([?&])w=\d+/, '$1w=1920').replace(/&h=\d+/, '');
}

// Matches the catalogue's formatting so a page never shows $400 beside $400.00.
const formatMoney = value => (typeof value === 'number'
  ? `$${value.toLocaleString('en-US')}`
  : String(value ?? ''));

const CHEVRON = '<span class="faq-q-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></span>';

export async function loadTourPageTemplate(projectRoot) {
  return readFile(join(projectRoot, 'src/templates/tour-page.html'), 'utf8');
}

const listItems = values => (values || []).map(value => `<li>${escapeHtml(value)}</li>`).join('');

function renderFaqs(faqs) {
  return (faqs || []).map(faq =>
    '      <div class="faq-item">\n'
    + `        <div class="faq-q">${escapeHtml(faq.question)} ${CHEVRON}</div>\n`
    + `        <div class="faq-a">${escapeHtml(faq.answer)}</div>\n`
    + '      </div>\n').join('').replace(/\n$/, '');
}

function renderTripDetails(tour) {
  const rows = [
    ['Duration', tour.duration],
    ['Departure', tour.startingPoint || 'Accra, Ghana'],
    ['Group Size', tour.groupSize],
    ['Local Guide', 'Included'],
    ['Transport', 'Included'],
  ].filter(([, value]) => value);
  return '\n' + rows.map(([label, value]) =>
    `      <div class="highlight-row"><span>${escapeHtml(label)}</span><span>${escapeHtml(value)}</span></div>`,
  ).join('\n');
}

// Derived rather than authored: the plan calls for this, and a hand-picked
// list is how a withdrawn tour ends up still being advertised from three
// other pages.
function relatedTours(tour, catalogue) {
  const sameCategory = catalogue.filter(other =>
    other.slug !== tour.slug
    && (other.categories || []).some(category => (tour.categories || []).includes(category)));
  const rest = catalogue.filter(other => other.slug !== tour.slug && !sameCategory.includes(other));
  return [...sameCategory, ...rest].slice(0, 3);
}

function renderAlsoCards(tour, catalogue) {
  return relatedTours(tour, catalogue).map(other => {
    const tags = (other.vibes || []).slice(0, 2)
      .map(vibe => `<span class="tag">${escapeHtml(vibe)}</span>`).join('');
    return `\n    <a href="${escapeHtml(other.detailUrl)}" class="also-card">`
      + `<div class="also-card-img"><img src="${escapeHtml(other.image)}" alt="" style="width:100%;height:100%;object-fit:cover;display:block;" loading="lazy" width="600" height="400" decoding="async" /></div>`
      + `<div class="also-card-body"><div class="tag-row">${tags}</div>`
      + `<h3>${escapeHtml(other.title)}</h3>`
      + `<p class="also-price">From ${escapeHtml(other.price)} · ${escapeHtml(other.duration)}</p></div></a>`;
  }).join('') + '\n  ';
}

export function renderTourPage({template, tour, catalogue}) {
  // A generated page with an empty "What's Covered" is worse than the
  // hand-written one it replaces, so it stops the build instead of shipping.
  if (!tour.included?.length || !tour.excluded?.length) {
    throw new Error(`${tour.slug}: cannot generate a page without both an included and an excluded list`);
  }
  if (!tour.faqs?.length) throw new Error(`${tour.slug}: cannot generate a page with no FAQs`);
  const price = tour.price;
  const seo = tour.seo || {};
  const whatsapp = `https://wa.me/233503673473?text=${encodeURIComponent(`Hi! I'd like to book the ${tour.title}.`)}`;
  const metaRow = '\n'
    + `      <span class="trip-meta-item"><strong>${escapeHtml(tour.duration)}</strong></span>\n`
    + `      <span class="trip-meta-item"><strong>Departure:</strong> ${escapeHtml(tour.startingPoint || 'Accra, Ghana')}</span>\n`
    + `      <span class="trip-meta-item"><strong>From:</strong> ${escapeHtml(price)}/person</span>\n    `;

  const values = {
    TITLE: escapeHtml(tour.title),
    PAGE_TITLE: escapeHtml(seo.title || `${tour.title} | People & Places Tours`),
    META_DESCRIPTION: escapeHtml(seo.description || tour.pageIntro || tour.description || ''),
    ROBOTS_META: seo.indexing === 'noindex' ? '<meta name="robots" content="noindex,follow" />' : '',
    WATERMARK: escapeHtml(tour.heroWatermark || tour.title.toUpperCase()),
    TAGS: (tour.vibes || []).slice(0, 2).map(vibe => `<span class="tag">${escapeHtml(vibe)}</span>`).join(''),
    META_ROW: metaRow,
    HERO_IMAGE: escapeHtml(heroImageFor(tour)),
    HERO_ALT: escapeHtml(tour.heroAlt || ''),
    HEADLINE: escapeHtml(tour.pageHeadline || tour.title),
    // Some pages carry two or three paragraphs, not one. Losing the second was
    // the first thing the generated-versus-written comparison caught.
    INTRO_PARAGRAPHS: String(tour.pageIntro || tour.description || '')
      .split(/\n\s*\n/)
      .map(paragraph => paragraph.trim())
      .filter(Boolean)
      .map(paragraph => `<p>${escapeHtml(paragraph)}</p>`)
      .join('\n    '),
    FUN_FACTS: (tour.funFacts || []).map(fact => `\n        <li>${escapeHtml(fact)}</li>`).join('') + '\n      ',
    INCLUDED: listItems(tour.included),
    EXCLUDED: listItems(tour.excluded),
    PRICE: escapeHtml(price),
    PRICE_SUB: `per person · ${escapeHtml(tour.duration)}`,
    WHATSAPP_HREF: whatsapp,
    SLUG: escapeHtml(tour.slug),
    // A tour with its own minimum says so beside the price, not only in an
    // answer further down. Ada cannot run below three, and the hand-written
    // page said so until generation replaced it.
    // A tour can have a genuinely different way to book at a different price:
    // Kumasi by road or by air, Cape Coast with a naming ceremony added. These
    // sat in the CMS unseen because no page had anywhere to show them.
    PRICE_OPTIONS: (tour.priceOptions || []).length
      ? `<div class="price-options">${(tour.priceOptions || []).map(option =>
          `<div class="price-option"><strong>${escapeHtml(formatMoney(option.price))}</strong> ${escapeHtml(option.label)}</div>`,
        ).join('')}</div>`
      : '',
    GROUP_NOTE: tour.groupSizeNote
      ? `<div class="price-group-note">${escapeHtml(tour.groupSizeNote)}</div>`
      : '',
    TRIP_DETAILS: renderTripDetails(tour),
    FAQS: renderFaqs(tour.faqs),
    GALLERY: renderGallery(tour),
    ALSO_CARDS: renderAlsoCards(tour, catalogue),
  };

  let html = template;
  for (const [key, value] of Object.entries(values)) {
    html = html.replaceAll(`{{${key}}}`, value);
  }
  const leftover = html.match(/\{\{[A-Z_]+\}\}/g);
  if (leftover) throw new Error(`${tour.slug}: template placeholders left unfilled: ${leftover.join(', ')}`);
  return html;
}
