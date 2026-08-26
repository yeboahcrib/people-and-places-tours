(function () {
  const content = window.PEOPLE_PLACES_HOME;

  const icons = {
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    image: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    'user-circle': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="3.5"/><path d="M5.5 19a7 7 0 0 1 13 0"/><circle cx="12" cy="12" r="10"/></svg>',
    briefcase: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="7" width="19" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2"/><path d="M2.5 13h19"/></svg>',
    camera: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 8h2.5l1.5-2h6l1.5 2H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2z"/><circle cx="12" cy="13.5" r="3.5"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>',
    whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>',
  };


  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));

  const renderLines = lines => (lines || []).map(escapeHtml).join('<br> ');
  const renderIcon = name => icons[name] || '';
  const revealClass = index => index % 3 === 1 ? ' reveal-delay-1' : index % 3 === 2 ? ' reveal-delay-2' : index % 3 === 0 && index > 0 ? ' reveal-delay-3' : '';
  const externalAttrs = item => item?.external ? ' target="_blank" rel="noopener"' : '';

  // Original woven-line accent inspired by the rhythm of Ghanaian textiles.
  // This is not presented as a named Adinkra symbol; named symbols will only
  // be added after their form, meaning, and placement have been reviewed.
  const renderWeaveMotif = modifier => `
    <span class="cultural-motif cultural-motif--${escapeHtml(modifier)}" aria-hidden="true">
      <svg viewBox="0 0 160 160" focusable="false">
        <path d="M18 50 50 18l32 32-32 32L18 50Zm60 60 32-32 32 32-32 32-32-32Z" />
        <path d="m50 38 12 12-12 12-12-12 12-12Zm60 60 12 12-12 12-12-12 12-12Z" />
        <path d="M66 66h28v28H66z" />
      </svg>
    </span>`;

  const STAR_SVG = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  const renderStars = label => `<span class="testi-stars" role="img" aria-label="${escapeHtml(label)}">${STAR_SVG.repeat(5)}</span>`;
  const renderCountValue = (value, className) => {
    const text = String(value ?? '');
    const match = text.match(/([\d,.]+)(.*)/);
    if (!match) return `<span class="${className}">${escapeHtml(text)}</span>`;
    const numeric = Number(match[1].replace(/,/g, ''));
    const decimals = (match[1].split('.')[1] || '').length;
    return `<span class="${className}" data-count-value="${escapeHtml(numeric)}" data-count-decimals="${decimals}" data-count-suffix="${escapeHtml(match[2])}">${escapeHtml(text)}</span>`;
  };

  function renderImage(image, className, extraAttrs = '') {
    if (!image?.src) return '';
    return `<img class="${escapeHtml(className)}" src="${escapeHtml(image.src)}" alt="${escapeHtml(image.alt || '')}" width="${escapeHtml(image.width || '')}" height="${escapeHtml(image.height || '')}" ${extraAttrs} decoding="async" />`;
  }

  // The hero takes either a still image or a video, and prefers the image when
  // both are present.
  //
  // It was a video hotlinked from another company's server, which meant two
  // problems: their homepage could break ours by deleting a file, and we had no
  // record of permission to use it — flagged in the media source register and
  // in the messaging brief ("avoid the current externally hosted hero video
  // unless ownership and usage rights are confirmed"). It also cost 3.5 MB on
  // a phone, with no poster frame, so the hero was empty until it arrived.
  //
  // The video branch is kept deliberately. When People & Places has its own
  // footage, restoring it is a content change here — set `video.src` and drop
  // `image` — not a rewrite. Give it a poster too; the still is what most
  // visitors on slow connections will actually see.
  function renderHeroMedia(data) {
    if (data.image?.src) {
      return `<img class="v-hero-video" src="${escapeHtml(data.image.src)}" alt="" width="${escapeHtml(data.image.width || '')}" height="${escapeHtml(data.image.height || '')}" fetchpriority="high" decoding="async" />`;
    }
    if (!data.video?.src) return '';
    const poster = data.video.poster?.src ? ` poster="${escapeHtml(data.video.poster.src)}"` : '';
    return `<video class="v-hero-video" autoplay muted loop playsinline preload="metadata"${poster}>
      <source src="${escapeHtml(data.video.src)}" type="video/mp4" />
    </video>`;
  }

  function renderHeroSection(data) {
    return `
<!-- Hero — editorial bottom-left layout. Keep text out of the media's centre. -->
<section class="v-hero" aria-label="Hero" data-home-section="hero">
  <div class="v-hero-video-wrap" aria-hidden="true">
    ${renderHeroMedia(data)}
    <div class="v-hero-overlay"></div>
  </div>

  <div class="v-hero-content">
    ${data.headline ? `<h1 class="v-hero-headline">${escapeHtml(data.headline)}</h1>` : ''}
    ${data.sub ? `<p class="v-hero-sub">${escapeHtml(data.sub)}</p>` : ''}
    ${data.cta ? `<a href="${escapeHtml(data.cta.href)}" class="v-hero-cta-link">${escapeHtml(data.cta.label)}</a>` : ''}
  </div>
</section>`;
  }

  function renderFounderStorySection(data) {
    return `
<!-- Founder story — editorial split, real founders behind neutral initials placeholders (no stock photos). -->
<section class="founder-story-section white-lift section-pad" aria-label="Our founders" data-home-section="founderStory">
  ${renderWeaveMotif('founder')}
  <div class="container">
    <div class="founder-story-grid">
      <div class="founder-story-text">
        <div class="eyebrow reveal">${escapeHtml(data.eyebrow)}</div>
        <h2 class="section-title reveal reveal-delay-1">${escapeHtml(data.headline)}</h2>
        <div class="founder-story-body reveal reveal-delay-2">${renderLines(String(data.body || '').split(/\n\s*\n/))}</div>
        ${data.cta ? `<a href="${escapeHtml(data.cta.href)}" class="btn btn-outline-dark reveal reveal-delay-3">${escapeHtml(data.cta.label)}</a>` : ''}
      </div>
      <div class="founder-mini-grid">
        ${(data.founders || []).map((f, i) => `
        <div class="founder-mini-card reveal reveal-delay-${i + 4}">
          ${f.image?.src
            ? `<div class="founder-mini-photo">${renderImage(f.image, 'founder-mini-photo-img', 'loading="lazy" sizes="88px"')}</div>`
            : `<div class="founder-mini-avatar" aria-hidden="true">${escapeHtml(f.initials)}</div>`}
          <div class="founder-mini-name">${escapeHtml(f.preferredName || f.name)}</div>
          <div class="founder-mini-role">${escapeHtml(f.role)}</div>
          ${f.quote ? `<blockquote class="founder-mini-quote">“${escapeHtml(f.quote)}”</blockquote>` : ''}
        </div>`).join('')}
        ${data.trustNote ? `<p class="founder-trust-note reveal reveal-delay-5"><span aria-hidden="true">✓</span>${escapeHtml(data.trustNote)}</p>` : ''}
      </div>
    </div>
  </div>
</section>`;
  }

  function renderWaysToExperienceSection(data) {
    // An editor who removes every pathway means it: leave the section out
    // rather than printing a heading over an empty grid.
    if (!(data.pathways || []).length) return '';
    return `
<!-- Experience-style gateways into the filtered catalogue. -->
<section class="pathways-section white-lift section-pad" aria-label="Ways to experience Ghana" data-home-section="waysToExperience">
  ${renderWeaveMotif('pathways')}
  <div class="container">
    <div class="section-split process-heading">
      <div class="split-headline">
        <div class="eyebrow eyebrow-dark reveal">${escapeHtml(data.eyebrow)}</div>
        <h2 class="section-title reveal reveal-delay-1">${escapeHtml(data.title)}</h2>
      </div>
      <p class="split-body section-sub reveal reveal-delay-2">${escapeHtml(data.intro)}</p>
    </div>
    <div class="pathways-grid">
      ${(data.pathways || []).map((p, i) => `
      <a class="pathway-card pathway-card-media reveal pathway-delay-${i + 1}" href="${escapeHtml(p.href || 'packages.html')}" aria-label="Explore ${escapeHtml(p.title)} experiences">
        <div class="pathway-card-img">${renderImage(p.image, 'pathway-img', 'loading="lazy" sizes="(min-width: 901px) 52vw, (min-width: 600px) 50vw, calc(100vw - 56px)"')}</div>
        <div class="pathway-card-body">
          <h3 class="pathway-title">${escapeHtml(p.title)}</h3>
          <p class="pathway-text">${escapeHtml(p.text)}</p>
        </div>
      </a>`).join('')}
    </div>
    ${data.cta ? `<a href="${escapeHtml(data.cta.href)}" class="btn btn-outline-dark pathways-cta reveal"><span>${escapeHtml(data.cta.label)}</span></a>` : ''}
  </div>
</section>`;
  }

  function renderHowHostedSection(data) {
    if (!(data.principles || []).length) return '';
    return `
<!-- Hosting principles, each backed by a real, unedited review excerpt. -->
<section class="why-section" aria-label="How you're hosted" data-home-section="howHosted">
  ${renderWeaveMotif('hosted')}
  ${renderWeaveMotif('hosted-lower')}
  <div class="container">
    <div class="why-editorial">
      <div class="why-editorial-head">
        <div class="why-editorial-heading-group">
          <div class="eyebrow reveal">${escapeHtml(data.eyebrow)}</div>
          <h2 class="why-editorial-title reveal reveal-delay-1">${renderLines(data.titleLines)}</h2>
        </div>
        <p class="why-editorial-intro reveal reveal-delay-2">${escapeHtml(data.intro)}</p>
      </div>
      <ol class="why-editorial-list">
        ${(data.principles || []).map((p, index) => `
        <li class="why-row reveal why-row-delay-${Math.floor(index / 2) + 1}">
          <span class="why-row-icon" aria-hidden="true">${renderIcon(p.icon)}</span>
          <div class="why-row-content">
            <h3>${escapeHtml(p.title)}</h3>
            <p>${escapeHtml(p.text)}</p>
            ${p.proofQuote ? `<blockquote class="principle-proof">&ldquo;${escapeHtml(p.proofQuote)}&rdquo;${p.proofAuthor ? ` <cite>— ${escapeHtml(p.proofAuthor)}</cite>` : ''}</blockquote>` : ''}
          </div>
        </li>`).join('')}
      </ol>
    </div>
  </div>
</section>`;
  }

  function renderBookingStepsSection(data) {
    if (!(data.steps || []).length) return '';
    return `
<!-- Booking steps are content-driven and can be redesigned without touching form logic. -->
<section class="process-section white-lift section-pad" aria-label="How it works" data-home-section="planningProcess">
  <div class="container">
    <div class="section-split" style="margin-bottom:var(--sp-8)">
      <div class="split-headline">
        <div class="eyebrow eyebrow-dark reveal">${escapeHtml(data.eyebrow)}</div>
        <h2 class="section-title process-title reveal reveal-delay-1">${escapeHtml(data.title)}</h2>
      </div>
      ${data.intro ? `<p class="split-body section-sub process-sub reveal reveal-delay-2">${escapeHtml(data.intro)}</p>` : ''}
    </div>

    <div class="process-grid" aria-label="Your planning journey">
      ${(data.steps || []).map((step, index) => `
      <div class="process-step reveal reveal-delay-${index * 2 + 3}">
        <div class="process-step-num">${escapeHtml(step.number)}</div>
        <div class="process-content">
          <h3>${escapeHtml(step.title)}</h3>
          <p>${escapeHtml(step.text)}</p>
        </div>
        ${step.cta ? `<a href="${escapeHtml(step.cta.href)}" class="process-step-link"${externalAttrs(step.cta)}>${escapeHtml(step.cta.label)}</a>` : ''}
        ${index < (data.steps || []).length - 1 ? `<span class="process-connector reveal reveal-delay-${index * 2 + 4}" aria-hidden="true"></span>` : ''}
      </div>`).join('')}
    </div>
  </div>
</section>`;
  }

  function renderReviewsAndTrustSection(data) {
    return `
<!-- Review cards and section header image are isolated here. -->
<section class="testimonials-section" aria-label="What travellers say" data-home-section="reviewsAndTrust">
  <div class="sec-img-head">
    ${renderImage(data.heroImage, 'sec-img-head-media', 'loading="lazy" sizes="100vw"')}
    <div class="container">
      <div class="section-split">
        <div class="split-headline">
          <div class="eyebrow reveal">${escapeHtml(data.eyebrow)}</div>
          <h2 class="section-title reveal reveal-delay-1">${renderLines(data.titleLines)}</h2>
        </div>
        <p class="split-body reveal reveal-delay-2">${escapeHtml(data.intro)}</p>
      </div>
    </div>
  </div>

  <div class="container testimonials-body">
    ${(data.ratingSummary || (data.trustFacts && data.trustFacts.length)) ? `
    <div class="trust-facts-row reveal reveal-delay-1">
      ${data.ratingSummary ? `
      <${data.ratingSummary.href ? 'a' : 'div'} class="trust-rating"${data.ratingSummary.href ? ` href="${escapeHtml(data.ratingSummary.href)}" target="_blank" rel="noopener" aria-label="${escapeHtml(`Rated ${data.ratingSummary.value} out of 5 from ${data.ratingSummary.count} ${data.ratingSummary.source} reviews. Opens ${data.ratingSummary.source} in a new tab.`)}"` : ''}>
        ${data.ratingSummary.source === 'Google' ? GOOGLE_MARK : ''}
        ${renderCountValue(data.ratingSummary.value, 'trust-rating-value')}
        <span class="trust-rating-meta">
          ${renderStars(`Rated ${data.ratingSummary.value} out of 5`)}
          <span class="trust-rating-source">${escapeHtml(`${data.ratingSummary.count} ${data.ratingSummary.source} reviews`)}<svg class="arrow-icon trust-rating-arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></span>
        </span>
      </${data.ratingSummary.href ? 'a' : 'div'}>` : ''}
      ${(data.trustFacts || []).map(f => `
      <div class="trust-fact">
        ${renderCountValue(f.value, 'trust-fact-value')}
        <span class="trust-fact-label">${escapeHtml(f.label)}</span>
      </div>`).join('')}
    </div>` : ''}

    ${(data.items || []).length ? `
    <div class="testimonials-wrap reveal reveal-delay-3">
      <div class="testimonials-track" role="region" aria-label="Traveler reviews carousel" tabindex="0">
        ${(data.items || []).map((item, idx) => `
        <div class="testimonial-slide reveal testimonial-delay-${Math.min(idx + 1, 3)}">
          <div class="testimonial-card${idx === 0 ? ' testimonial-card-feature' : ''}">
            ${renderStars(`Rated ${item.rating || 5} out of 5`)}
            <blockquote class="testi-quote${String(item.quote || '').length > 130 ? ' is-collapsible' : ''}">${escapeHtml(item.quote)}</blockquote>
            ${String(item.quote || '').length > 130 ? '<button type="button" class="testi-read-more" aria-expanded="false">Read more</button>' : ''}
            <div class="testi-author">
              ${item.image ? renderImage(item.image, 'testi-author-photo', 'loading="lazy" sizes="44px"') : `<span class="testi-author-fallback" aria-hidden="true">${escapeHtml(String(item.author || '').split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join(''))}</span>`}
              <div>
                <strong>${escapeHtml(item.author)}</strong>
                <span>${escapeHtml(item.location)}${item.date && formatReviewDate(item.date) ? ` &middot; ${escapeHtml(formatReviewDate(item.date))}` : ''}</span>
              </div>
            </div>
          </div>
        </div>`).join('')}
      </div>

      <div class="testimonials-dots" aria-label="Testimonial navigation">
        ${(data.items || []).map((_, index) => `<button type="button" class="testimonials-dot${index === 0 ? ' active' : ''}" aria-label="Show testimonial ${index + 1}" aria-pressed="${index === 0 ? 'true' : 'false'}"></button>`).join('\n        ')}
      </div>
    </div>` : ''}
  </div>
</section>`;
  }

  // Google's own mark, inline. It appears only where it labels genuine Google
  // reviews, which is what it is for — the reviews carry a documented source in
  // the CMS. It is the shape people scan for; "Google" set in our own type is
  // read as our claim about ourselves rather than as provenance.
  const GOOGLE_MARK = `<svg class="google-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path fill="#4285F4" d="M23.5 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.5 5.5 0 0 1-2.4 3.61v3h3.86c2.26-2.08 3.57-5.15 3.57-8.85z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z"/>
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09z"/>
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"/>
    </svg>`;

  // "February 2026", not "2026-02-07" and not "3 weeks ago". A month is how
  // people remember a trip, and unlike a relative date it does not quietly rot
  // into "2 years ago" on a page nobody has rebuilt.
  function formatReviewDate(value) {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleDateString('en-GB', {month: 'long', year: 'numeric', timeZone: 'UTC'});
  }

  function renderFinalInvitationSection(data) {
    return `
<!-- Closing CTA. Deliberately short: a headline and the two ways to start.
     The reassurance line, the "speaking directly with our team" line and the
     phone numbers were removed in August 2026 — the phones are repeated in
     the footer directly below this, and the rest was explaining an invitation
     that does not need explaining. Both operators the founders compared us
     against close on a headline and a button. -->
<section class="final-invitation-section section-pad" aria-label="Plan your trip" data-home-section="finalInvitation">
  <div class="container final-invitation-inner">
    <div class="eyebrow eyebrow-dark reveal">${escapeHtml(data.eyebrow)}</div>
    <h2 class="final-invitation-headline reveal">${escapeHtml(data.headline)}</h2>
    <div class="final-invitation-ctas">
      <a href="${escapeHtml(data.cta.href)}" class="btn btn-primary final-invitation-action reveal reveal-delay-2">${escapeHtml(data.cta.label)}</a>
      ${data.secondaryCta ? `<a href="${escapeHtml(data.secondaryCta.href)}" class="btn btn-ghost final-invitation-action reveal reveal-delay-3"${data.secondaryCta.external ? ' target="_blank" rel="noopener"' : ''}>${escapeHtml(data.secondaryCta.label)}</a>` : ''}
    </div>
  </div>
</section>`;
  }

  // ── Sections an editor can add ───────────────────────────────────────────
  //
  // The seven sections above are bespoke: each has its own markup because each
  // does something the others do not. That is right for the narrative spine of
  // the homepage, and wrong for everything after it — it means adding an
  // eighth section requires writing one.
  //
  // These four layouts exist so someone who cannot write code can add a
  // section. They are deliberately built from the same vocabulary the fixed
  // sections use — `container`, `section-pad`, `white-lift`, `eyebrow`,
  // `section-title`, `btn`, `reveal` — so a new section inherits the site's
  // type, colour, spacing and motion instead of carrying its own. That is what
  // keeps an added section looking like it belongs rather than like it was
  // pasted in.
  //
  // Adding a fifth layout means adding a renderer here and an option to the
  // `layout` list in studio/schemaTypes/documents/flexibleSection.ts. The
  // contract between the two is asserted by tests/homepage-layouts.mjs.

  const flexSecondaryButton = data => data.tone === 'dark' ? 'btn-ghost' : 'btn-outline-dark';

  const flexShell = (data, layout, inner) => {
    const label = data.headline || data.title || 'More about People & Places';
    return `
<!-- Editor-added section (${escapeHtml(layout)}). -->
<section class="flex-section flex-section--${escapeHtml(layout)}${data.tone === 'dark' ? '' : ' white-lift'} section-pad" aria-label="${escapeHtml(label)}" data-home-section="flexible" data-flex-layout="${escapeHtml(layout)}">
  <div class="container">${inner}
  </div>
</section>`;
  };

  const flexHeading = data => `
    ${data.eyebrow ? `<div class="eyebrow reveal">${escapeHtml(data.eyebrow)}</div>` : ''}
    ${data.headline ? `<h2 class="section-title reveal reveal-delay-1">${escapeHtml(data.headline)}</h2>` : ''}
    ${data.body ? `<div class="flex-body section-sub reveal reveal-delay-2">${renderLines(String(data.body).split(/\n\s*\n/))}</div>` : ''}`;

  const flexActions = (data, delay) => {
    const ctas = (data.ctas || []).filter(cta => cta?.label && cta?.href);
    if (!ctas.length) return '';
    return `
    <div class="flex-actions reveal reveal-delay-${delay}">
      ${ctas.map((cta, index) => `<a href="${escapeHtml(cta.href)}" class="btn ${index === 0 ? 'btn-primary' : flexSecondaryButton(data)}"${externalAttrs(cta)}>${escapeHtml(cta.label)}</a>`).join('\n      ')}
    </div>`;
  };

  function renderFlexPhotoBeside(data) {
    if (!data.headline && !data.image?.src) return '';
    const figure = data.image?.src
      ? `
      <div class="flex-split-figure reveal reveal-delay-2">${renderImage(data.image, 'flex-split-img', 'loading="lazy" sizes="(min-width: 900px) 45vw, calc(100vw - 48px)"')}</div>`
      : '';
    return flexShell(data, 'photo-beside', `
    <div class="flex-split${data.imageSide === 'left' ? ' flex-split--flip' : ''}">
      <div class="flex-split-text">${flexHeading(data)}${flexActions(data, 3)}
      </div>${figure}
    </div>`);
  }

  function renderFlexCards(data) {
    const cards = (data.cards || []).filter(card => card?.title);
    if (!cards.length) return '';
    return flexShell(data, 'cards', `${flexHeading(data)}
    <div class="flex-card-grid">
      ${cards.map((card, index) => {
        const inner = `${card.image?.src ? `
        <div class="flex-card-figure">${renderImage(card.image, 'flex-card-img', 'loading="lazy" sizes="(min-width: 900px) 30vw, calc(100vw - 48px)"')}</div>` : ''}
        <div class="flex-card-body">
          <h3 class="flex-card-title">${escapeHtml(card.title)}</h3>
          ${card.text ? `<p class="flex-card-text">${escapeHtml(card.text)}</p>` : ''}
        </div>`;
        return card.href
          ? `<a class="flex-card reveal${revealClass(index)}" href="${escapeHtml(card.href)}">${inner}
      </a>`
          : `<div class="flex-card reveal${revealClass(index)}">${inner}
      </div>`;
      }).join('\n      ')}
    </div>${flexActions(data, 4)}`);
  }

  function renderFlexQuote(data) {
    if (!data.quote) return '';
    return flexShell(data, 'quote', `
    <figure class="flex-quote reveal">
      ${data.eyebrow ? `<div class="eyebrow">${escapeHtml(data.eyebrow)}</div>` : ''}
      <blockquote class="flex-quote-text">${escapeHtml(data.quote)}</blockquote>
      ${data.attribution ? `<figcaption class="flex-quote-source">${escapeHtml(data.attribution)}</figcaption>` : ''}
    </figure>${flexActions(data, 2)}`);
  }

  function renderFlexInvitation(data) {
    if (!data.headline) return '';
    return flexShell(data, 'invitation', `
    <div class="flex-invitation">${flexHeading(data)}${flexActions(data, 3)}
      ${data.reassurance ? `<p class="flex-invitation-note reveal reveal-delay-4">${escapeHtml(data.reassurance)}</p>` : ''}
    </div>`);
  }

  // The narrative spine. Each key is a section only this site has, so each has
  // its own renderer; the order here is the order they were designed in.
  const BUILT_IN_SECTIONS = {
    hero: renderHeroSection,
    founderStory: renderFounderStorySection,
    waysToExperience: renderWaysToExperienceSection,
    howHosted: renderHowHostedSection,
    reviewsAndTrust: renderReviewsAndTrustSection,
    planningProcess: renderBookingStepsSection,
    finalInvitation: renderFinalInvitationSection,
  };

  const FLEX_LAYOUTS = {
    photoBeside: renderFlexPhotoBeside,
    cards: renderFlexCards,
    quote: renderFlexQuote,
    invitation: renderFlexInvitation,
  };

  const DEFAULT_SECTION_ORDER = Object.keys(BUILT_IN_SECTIONS);

  /**
   * Render the homepage from a plan rather than a fixed sequence of calls.
   *
   * `sectionOrder` is a list of entries, each either `{key}` for one of the
   * seven built-in sections or `{layout, ...content}` for a section an editor
   * added. Content with no plan falls back to the seven in their designed
   * order, which is what the committed homepage does today.
   *
   * An entry naming a layout or key that does not exist renders nothing rather
   * than throwing: a section removed from the code should not take the whole
   * homepage down with it.
   */
  function renderHomepageMarkup(homeContent = content) {
    if (!homeContent) return '';
    const plan = Array.isArray(homeContent.sectionOrder) && homeContent.sectionOrder.length
      ? homeContent.sectionOrder
      : DEFAULT_SECTION_ORDER.map(key => ({key}));
    return plan
      .map(entry => {
        if (entry?.layout) {
          const render = FLEX_LAYOUTS[entry.layout];
          return render ? render(entry) : '';
        }
        const render = BUILT_IN_SECTIONS[entry?.key];
        return render ? render(homeContent[entry.key]) : '';
      })
      .filter(Boolean)
      .join('\n');
  }

  // Exposed so a test can assert the Studio's layout list and the renderers
  // here have not drifted apart.
  window.PEOPLE_PLACES_HOMEPAGE_LAYOUTS = Object.keys(FLEX_LAYOUTS);
  window.PEOPLE_PLACES_HOMEPAGE_SECTIONS = DEFAULT_SECTION_ORDER;

  // The static build evaluates this renderer in an isolated context so the
  // deployed homepage contains meaningful HTML before browser JavaScript runs.
  window.PEOPLE_PLACES_RENDER_HOMEPAGE = renderHomepageMarkup;

  function renderHomepage() {
    // Keyed to the attribute, not an id: the id has to stay `main-content` so
    // the skip link in the shared nav resolves here the way it does on every
    // other page.
    const root = document.querySelector('[data-homepage-renderer]');
    if (!root || !content) return;
    // The deployed homepage is generated at build time, so its root already
    // has children. Only the un-built source tree leaves it empty.
    if (root.children.length) return;
    root.innerHTML = renderHomepageMarkup(content);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderHomepage);
  } else {
    renderHomepage();
  }
})();
