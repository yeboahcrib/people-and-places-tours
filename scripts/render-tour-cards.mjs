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
  if (!/^(?:https:\/\/images\.unsplash\.com\/|https:\/\/cdn\.sanity\.io\/|assets\/)[^\s"']+$/i.test(url)) throw new Error(`Unsafe tour image URL: ${url}`);
  return escapeHtml(url);
};

const clockIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
const peopleIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>';
const pinIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
const cardImageSizes = '(min-width: 1180px) 360px, (min-width: 760px) 45vw, 100vw';
const delayClass = index => index % 3 === 1 ? ' reveal-delay-1' : index % 3 === 2 ? ' reveal-delay-2' : '';
const bookingUrl = slug => `contact.html?tour=${encodeURIComponent(slug)}`;

export function renderPackageTourCards(tours) {
  return tours
    .filter(tour => tour.packageOrder !== undefined)
    .sort((a, b) => (a.packageOrder ?? 999) - (b.packageOrder ?? 999))
    .map((tour, index) => {
      const tags = (tour.vibes || []).slice(0, 2).map(tag => `<span class="tour-vibe-tag">${escapeHtml(tag)}</span>`).join('');
      const badge = tour.badge ? `<div class="tour-card-badge">${escapeHtml(tour.badge)}</div>` : '';
      const highlight = tour.cardHighlight ? `<p class="tour-card-highlight">${escapeHtml(tour.cardHighlight)}</p>` : '';
      return `
        <article class="tour-card reveal${delayClass(index)}" data-destination="${escapeHtml(tour.destination)}" data-categories="${escapeHtml((tour.categories || []).join(' '))}" data-tour-slug="${escapeHtml(tour.slug)}" aria-label="${escapeHtml(tour.title)}">
          <div class="tour-card-img">
            <img src="${safeImageUrl(tour.packageImage || tour.image)}" alt="${escapeHtml(tour.alt || tour.title)}" width="800" height="550" loading="lazy" decoding="async" sizes="${cardImageSizes}">
            ${badge}
            <div class="tour-vibe-tags">${tags}</div>
          </div>
          <div class="tour-card-body">
            <h3 class="tour-card-title"><a href="${safeRelativeUrl(tour.detailUrl)}" class="tour-card-stretched-link">${escapeHtml(tour.title)}</a></h3>
            <p class="tour-card-desc">${escapeHtml(tour.packageDescription || tour.description)}</p>
            <div class="tour-card-meta">
              <span class="tour-meta-item">${clockIcon}${escapeHtml(tour.duration)}</span>
              <span class="tour-meta-item">${pinIcon}${escapeHtml(tour.location)}</span>
              <span class="tour-meta-item">${peopleIcon}${escapeHtml(tour.groupSize)}</span>
            </div>
            ${highlight}
            <div class="tour-card-footer">
              <div class="tour-card-price"><span>From</span>${escapeHtml(tour.price)} <small>${escapeHtml(tour.priceUnit || '')}</small></div>
              <a href="${safeRelativeUrl(tour.detailUrl)}" class="tour-card-book-btn">View Experience</a>
            </div>
          </div>
        </article>`;
    }).join('');
}

export function injectTourCards(html, tours) {
  const packageMarker = '<div class="packages-grid" id="tours-grid" data-tour-source="catalog"></div>';
  return html.replace(packageMarker, `<div class="packages-grid" id="tours-grid" data-tour-source="catalog">${renderPackageTourCards(tours)}</div>`);
}

/**
 * Fill the "Which experience is calling you?" dropdown at build time.
 *
 * The list was only ever built by script.js, so a visitor whose JavaScript did
 * not run saw a single option — "I'm open to ideas" — and had no way to say
 * which of the fifteen experiences they were writing about. The enquiry still
 * arrived, but stripped of the one detail that makes it answerable.
 *
 * The markup here matches what script.js produces, ordering included, so the
 * script re-rendering the same list over the top is a no-op rather than a
 * visible flicker. Keep the two in step: script.js `renderContactTourOptions`.
 */
export function renderContactTourOptions(tours) {
  return tours
    .filter(tour => tour.packageOrder !== undefined)
    .sort((a, b) => (a.packageOrder ?? 999) - (b.packageOrder ?? 999))
    .map(tour => `<option value="${escapeHtml(tour.slug)}">${escapeHtml(tour.title)} - ${escapeHtml(tour.price)}</option>`)
    .join('');
}

export function injectContactTourOptions(html, tours) {
  const marker = `<select class="form-select" id="tour-interest" name="tour-interest">
                    <option value="" selected>I'm open to ideas</option>
                  </select>`;
  if (!html.includes(marker)) return html;
  return html.replace(marker, `<select class="form-select" id="tour-interest" name="tour-interest">
                    <option value="" selected>I'm open to ideas</option>
                    ${renderContactTourOptions(tours)}
                    <option value="custom">Something made around me</option>
                  </select>`);
}
