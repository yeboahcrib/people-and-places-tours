const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const safeRelativeUrl = value => {
  const url = String(value ?? '').trim();
  if (!/^[a-z0-9][a-z0-9-]*\.html(?:\?[^\s]*)?$/i.test(url)) throw new Error(`Unsafe tour URL: ${url}`);
  return escapeHtml(url);
};

const safeImageUrl = value => {
  const url = String(value ?? '').trim();
  if (!/^(?:https:\/\/images\.unsplash\.com\/|assets\/)[^\s"']+$/i.test(url)) throw new Error(`Unsafe tour image URL: ${url}`);
  return escapeHtml(url);
};

const arrowIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
const clockIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
const peopleIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>';
const pinIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
const cardImageSizes = '(min-width: 1180px) 360px, (min-width: 760px) 45vw, 100vw';
const delayClass = index => index % 3 === 1 ? ' reveal-delay-1' : index % 3 === 2 ? ' reveal-delay-2' : '';
const bookingUrl = slug => `contact.html?tour=${encodeURIComponent(slug)}`;

export function renderHomeTourCards(tours) {
  return tours
    .filter(tour => tour.homeFeatured)
    .sort((a, b) => (a.homeOrder ?? 999) - (b.homeOrder ?? 999))
    .map((tour, index) => {
      const ctaUrl = tour.slug === 'just-go-ghana' ? tour.detailUrl : bookingUrl(tour.slug);
      const ctaLabel = tour.slug === 'just-go-ghana' ? 'View Tour' : 'Request Tour';
      const tags = (tour.vibes || []).slice(0, 3).map(tag => `<span class="trip-tag">${escapeHtml(tag)}</span>`).join('');
      const badge = tour.badge ? `<div class="trip-card-badge">${escapeHtml(tour.badge.toUpperCase())}</div>` : '';
      return `
      <article class="trip-card reveal${delayClass(index)}" data-trip-cats="${escapeHtml((tour.categories || []).join(' '))}" data-tour-slug="${escapeHtml(tour.slug)}">
        <div class="trip-card-img">
          <img src="${safeImageUrl(tour.image)}" alt="${escapeHtml(tour.alt || tour.title)}" width="800" height="560" loading="lazy" decoding="async" sizes="${cardImageSizes}">
          ${badge}
        </div>
        <div class="trip-card-body">
          <div class="trip-card-tags">${tags}</div>
          <h3 class="trip-card-title">${escapeHtml(tour.homeTitle || tour.title)}</h3>
          <p class="trip-card-desc">${escapeHtml(tour.description)}</p>
          <div class="trip-card-footer">
            <span class="trip-card-price">From <strong>${escapeHtml(tour.price)}</strong></span>
            <a href="${tour.slug === 'just-go-ghana' ? safeRelativeUrl(ctaUrl) : escapeHtml(ctaUrl)}" class="trip-card-link">${ctaLabel} ${arrowIcon}</a>
          </div>
        </div>
      </article>`;
    }).join('');
}

export function renderPackageTourCards(tours) {
  return tours
    .filter(tour => tour.packageOrder !== undefined)
    .sort((a, b) => (a.packageOrder ?? 999) - (b.packageOrder ?? 999))
    .map((tour, index) => {
      const tags = (tour.vibes || []).slice(0, 2).map(tag => `<span class="tour-vibe-tag">${escapeHtml(tag)}</span>`).join('');
      const badge = tour.badge ? `<div class="tour-card-badge">${escapeHtml(tour.badge)}</div>` : '';
      return `
        <article class="tour-card reveal${delayClass(index)}" data-destination="${escapeHtml(tour.destination)}" data-tour-slug="${escapeHtml(tour.slug)}" aria-label="${escapeHtml(tour.title)}">
          <div class="tour-card-img">
            <img src="${safeImageUrl(tour.packageImage || tour.image)}" alt="${escapeHtml(tour.alt || tour.title)}" width="800" height="550" loading="lazy" decoding="async" sizes="${cardImageSizes}">
            ${badge}
            <div class="tour-card-price">${escapeHtml(tour.price)} <span>${escapeHtml(tour.priceUnit || '')}</span></div>
          </div>
          <div class="tour-card-body">
            <div class="tour-card-meta">
              <span class="tour-meta-item">${clockIcon}${escapeHtml(tour.duration)}</span>
              <span class="tour-meta-item">${peopleIcon}${escapeHtml(tour.groupSize)}</span>
              <span class="tour-meta-item">${pinIcon}${escapeHtml(tour.location)}</span>
            </div>
            <div class="tour-vibe-tags">${tags}</div>
            <h3 class="tour-card-title"><a href="${safeRelativeUrl(tour.detailUrl)}" class="tour-card-stretched-link">${escapeHtml(tour.title)}</a></h3>
            <p class="tour-card-desc">${escapeHtml(tour.packageDescription || tour.description)}</p>
            <div class="tour-card-footer">
              <div class="tour-stars" aria-label="5 out of 5 stars"><span>★</span><span>★</span><span>★</span><span>★</span><span>★</span></div>
              <a href="${escapeHtml(bookingUrl(tour.slug))}" class="tour-card-book-btn">Request Tour</a>
            </div>
          </div>
        </article>`;
    }).join('');
}

export function injectTourCards(html, tours) {
  const homeMarker = '<div class="trips-grid" id="trips-grid" data-tour-source="catalog"></div>';
  const packageMarker = '<div class="packages-grid" id="tours-grid" data-tour-source="catalog"></div>';
  return html
    .replace(homeMarker, `<div class="trips-grid" id="trips-grid" data-tour-source="catalog">${renderHomeTourCards(tours)}</div>`)
    .replace(packageMarker, `<div class="packages-grid" id="tours-grid" data-tour-source="catalog">${renderPackageTourCards(tours)}</div>`);
}
