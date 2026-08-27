/* ============================================================
   PEOPLE & PLACES TOURS — Main JavaScript
   ============================================================ */

/* Identify a page by name, independent of how its URL is written.
 *
 * Cloudflare Pages serves clean URLs, so the About page is /about while links
 * and catalogue data may still say "about.html". Comparing raw strings fails
 * across that difference. Normalising both sides accepts "about.html",
 * "/about", "about", "/about?x=1#y" and a trailing slash alike; "" and "/"
 * both mean the homepage.
 *
 * Used for the active navigation link and for matching a tour detail page to
 * its catalogue entry.
 */
/* Convert a page name that may carry .html into the address to link to.
 *
 * Tour data stores detailUrl as the real filename; Cloudflare serves it
 * without the extension and redirects the other form. These links are built
 * in the browser, after the build's link rewriting has run, so they need
 * converting here to avoid a redirect on every click.
 */
/* Named hrefForPage rather than pageHref: a local `const pageHref` exists in
 * the navigation block below, in the same scope as this function's callers.
 * Reusing that name places every call in the constant's temporal dead zone,
 * which throws on load and halts the rest of the script. */
function hrefForPage(value) {
  const raw = String(value || '');
  const [path, suffix = ''] = [raw.split(/(?=[?#])/)[0], raw.slice(raw.split(/(?=[?#])/)[0].length)];
  const cleaned = path.replace(/\.html$/i, '');
  return (cleaned === 'index' ? '/' : cleaned) + suffix;
}

function pageKey(value) {
  const withoutQuery = String(value || '').split(/[?#]/)[0];
  const last = withoutQuery.split('/').filter(Boolean).pop() || '';
  return last.replace(/\.html$/i, '').toLowerCase() || 'index';
}

/* ── PAGE TRANSITION (runs before DOMContentLoaded) ── */
(function () {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  /* Fade-in on arrival */
  document.body.classList.add('page-entering');

  /* Intercept same-site navigation clicks */
  document.addEventListener('click', e => {
    const link = e.target.closest('a[href]');
    if (!link) return;
    const href = link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || href.startsWith('http') ||
        link.target === '_blank') return;

    e.preventDefault();
    document.body.classList.add('page-leaving');
    setTimeout(() => { window.location.href = href; }, 230);
  }, true);
})();

document.addEventListener('DOMContentLoaded', () => {

  /* Keep the hero efficient and respectful of motion preferences: the
     background video pauses whenever it is offscreen or the tab is hidden.

     The selector is tag-qualified because the hero may hold a still image
     instead, and an <img> has no play() or pause(). An unguarded call here
     throws on the first line of DOMContentLoaded and stops every later
     feature on the page from initialising. */
  const homepageHeroVideo = document.querySelector('video.v-hero-video');
  if (homepageHeroVideo) {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let heroVideoInView = true;
    const syncHeroVideo = () => {
      if (prefersReducedMotion || document.hidden || !heroVideoInView) {
        homepageHeroVideo.pause();
      } else {
        homepageHeroVideo.play().catch(() => {});
      }
    };
    if (prefersReducedMotion) homepageHeroVideo.removeAttribute('autoplay');
    if ('IntersectionObserver' in window) {
      const heroVideoObserver = new IntersectionObserver(entries => {
        heroVideoInView = entries.some(entry => entry.isIntersecting);
        syncHeroVideo();
      }, {threshold: 0.05});
      heroVideoObserver.observe(homepageHeroVideo);
    }
    document.addEventListener('visibilitychange', syncHeroVideo);
    syncHeroVideo();
  }

  const usesExternalFormEndpoint = form => {
    try {
      return new URL(form.action).hostname === 'formsubmit.co';
    } catch {
      return false;
    }
  };

  const tours = Array.isArray(window.PEOPLE_PLACES_TOURS) ? window.PEOPLE_PLACES_TOURS : [];
  const bySlug = new Map(tours.map(tour => [tour.slug, tour]));
  const bookingUrl = slug => `${hrefForPage('contact.html')}?tour=${encodeURIComponent(slug)}#booking-flow`;
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
  const delayClass = index => index % 3 === 1 ? ' reveal-delay-1' : index % 3 === 2 ? ' reveal-delay-2' : '';
  const tourInitials = title => title.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  const clockIcon = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
  const peopleIcon = '<svg viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>';
  const pinIcon = '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';
  const arrowIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>';
  const cardImageSizes = '(min-width: 1180px) 360px, (min-width: 760px) 45vw, 100vw';

  /* ── HOMEPAGE PATHWAYS — SCROLL EXPANSION ──
     The existing yellow section is the animated object. It starts as a
     smaller framed composition, expands to its normal layout as it enters,
     and reverses naturally when the visitor scrolls back above it. */
  const pathwaySection = document.querySelector('[data-home-section="waysToExperience"]');
  if (pathwaySection) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const pathwayCards = [...pathwaySection.querySelectorAll('.pathway-card')];
    const cardMotion = [
      [-34, 24, -1.8], [28, 46, 1.5], [-24, 34, -1.1],
      [36, 20, 1.7], [-30, 42, -1.4], [24, 28, 1.2],
    ];
    let pathwayFrame = 0;

    const updatePathwayProgress = () => {
      pathwayFrame = 0;
      if (reducedMotion) {
        pathwaySection.style.setProperty('--pathway-progress', '1');
        pathwaySection.style.setProperty('--pathway-scale', '1');
        return;
      }
      const rect = pathwaySection.getBoundingClientRect();
      const start = window.innerHeight * 0.94;
      const distance = Math.max(window.innerHeight * 0.72, 520);
      const progress = Math.max(0, Math.min(1, (start - rect.top) / distance));
      const inverse = 1 - progress;
      pathwaySection.style.setProperty('--pathway-progress', progress.toFixed(4));
      pathwaySection.style.setProperty('--pathway-scale', (0.86 + (progress * 0.14)).toFixed(4));
      pathwayCards.forEach((card, index) => {
        const [x, y, rotation] = cardMotion[index] || [0, 24, 0];
        card.style.setProperty('--pathway-card-x', `${(x * inverse).toFixed(2)}px`);
        card.style.setProperty('--pathway-card-y', `${(y * inverse).toFixed(2)}px`);
        card.style.setProperty('--pathway-card-rotation', `${(rotation * inverse).toFixed(2)}deg`);
      });
      pathwaySection.classList.toggle('is-pathway-expanded', progress > 0.98);
    };

    const requestPathwayUpdate = () => {
      if (!pathwayFrame) pathwayFrame = requestAnimationFrame(updatePathwayProgress);
    };

    window.addEventListener('scroll', requestPathwayUpdate, {passive: true});
    window.addEventListener('resize', requestPathwayUpdate, {passive: true});
    requestAnimationFrame(updatePathwayProgress);
  }

  function renderPackageTours() {
    const grid = document.getElementById('tours-grid');
    if (!grid || tours.length === 0) return;

    const packageTours = tours
      .filter(tour => tour.packageOrder !== undefined)
      .sort((a, b) => (a.packageOrder ?? 999) - (b.packageOrder ?? 999));

    grid.innerHTML = packageTours.map((tour, index) => {
      const tags = (tour.vibes || []).slice(0, 2).map(tag => `<span class="tour-vibe-tag">${escapeHtml(tag)}</span>`).join('');
      const badge = tour.badge ? `<div class="tour-card-badge">${escapeHtml(tour.badge)}</div>` : '';
      const highlight = tour.cardHighlight ? `<p class="tour-card-highlight">${escapeHtml(tour.cardHighlight)}</p>` : '';

      return `
        <article class="tour-card reveal${delayClass(index)}" data-destination="${escapeHtml(tour.destination)}" data-categories="${escapeHtml((tour.categories || []).join(' '))}" data-tour-slug="${escapeHtml(tour.slug)}" aria-label="${escapeHtml(tour.title)}">
          <div class="tour-card-img">
            <img src="${escapeHtml(tour.packageImage || tour.image)}" alt="${escapeHtml(tour.alt || tour.title)}" width="800" height="550" loading="lazy" decoding="async" sizes="${cardImageSizes}" />
            ${badge}
            <div class="tour-vibe-tags">${tags}</div>
          </div>
          <div class="tour-card-body">
            <h3 class="tour-card-title"><a href="${escapeHtml(hrefForPage(tour.detailUrl))}" class="tour-card-stretched-link">${escapeHtml(tour.title)}</a></h3>
            <p class="tour-card-desc">${escapeHtml(tour.packageDescription || tour.description)}</p>
            <div class="tour-card-meta">
              <span class="tour-meta-item">${clockIcon}${escapeHtml(tour.duration)}</span>
              <span class="tour-meta-item">${pinIcon}${escapeHtml(tour.location)}</span>
              <span class="tour-meta-item">${peopleIcon}${escapeHtml(tour.groupSize)}</span>
            </div>
            ${highlight}
            <div class="tour-card-footer">
              <div class="tour-card-price"><span>From</span>${escapeHtml(tour.price)} <small>${escapeHtml(tour.priceUnit || '')}</small></div>
              <a href="${escapeHtml(hrefForPage(tour.detailUrl))}" class="tour-card-book-btn">View Experience</a>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  function renderCommandPaletteTours() {
    const list = document.getElementById('cmd-list');
    if (!list || tours.length === 0) return;

    list.innerHTML = tours
      .slice()
      .sort((a, b) => (a.packageOrder ?? 999) - (b.packageOrder ?? 999))
      .map(tour => `
        <li><a class="cmd-item" href="${escapeHtml(hrefForPage(tour.detailUrl))}">
          <span class="cmd-item-icon">${escapeHtml(tourInitials(tour.title))}</span>
          <span class="cmd-item-text">
            <strong>${escapeHtml(tour.title)}</strong>
            <span>${escapeHtml(tour.commandSummary || tour.description)}</span>
          </span>
          <span class="cmd-item-meta">${escapeHtml(tour.price)} | ${escapeHtml(tour.duration)}</span>
        </a></li>`).join('');
  }

  function renderContactTourOptions() {
    const select = document.getElementById('tour-interest');
    if (!select || tours.length === 0) return;

    const options = tours
      .slice()
      .sort((a, b) => (a.packageOrder ?? 999) - (b.packageOrder ?? 999))
      .map(tour => `<option value="${escapeHtml(tour.slug)}">${escapeHtml(tour.title)} - ${escapeHtml(tour.price)}</option>`)
      .join('');

    select.innerHTML = `
      <option value="" selected>I'm open to ideas</option>
      ${options}
      <option value="custom">Something made around me</option>`;
  }

  function hydrateTourDetailFromCatalog() {
    if (tours.length === 0) return;
    const page = pageKey(location.pathname);
    const tour = tours.find(item => pageKey(item.detailUrl) === page);
    if (!tour) return;

    document.querySelectorAll('.booking-card .big-price, .booking-card .price').forEach(el => {
      el.textContent = tour.price;
    });
    document.querySelectorAll('.booking-card .price-sub').forEach(el => {
      el.textContent = `per person · ${tour.duration}`;
    });
    document.querySelectorAll('.booking-card .booking-btns a.btn-outline-white').forEach(link => {
      link.href = bookingUrl(tour.slug);
    });
    document.querySelectorAll('.trip-meta-item').forEach(item => {
      if (item.textContent.includes('From:')) item.innerHTML = `<strong>From:</strong> ${escapeHtml(tour.price)}/person`;
    });
  }

  renderPackageTours();
  renderCommandPaletteTours();
  renderContactTourOptions();
  hydrateTourDetailFromCatalog();

  /* ── NAV: light, compact state after the hero ──
     One passive, rAF-throttled listener updates only when the threshold state
     changes. The nav stays visible so its glass-to-white transition can read. */
  const nav = document.querySelector('.nav');
  if (nav) {
    const SCROLL_THRESHOLD = 90;
    let ticking = false;
    let compact = window.scrollY >= SCROLL_THRESHOLD;

    const update = () => {
      const nextCompact = window.scrollY >= SCROLL_THRESHOLD;
      if (nextCompact !== compact) {
        compact = nextCompact;
        nav.classList.toggle('scrolled', compact);
        window.setTimeout(() => window.dispatchEvent(new Event('navstatechange')), 310);
      }
      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    // Initial state
    nav.classList.toggle('scrolled', compact);
  }

  /* ── MOBILE MENU ── */
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.nav-mobile');
  if (toggle && mobileMenu) {
    mobileMenu.id ||= 'mobile-navigation';
    toggle.setAttribute('aria-controls', mobileMenu.id);
    // One writer for the drawer's state. The open and close paths used to be
    // written out separately, which is how Escape ended up wired to neither.
    const setMenu = open => {
      mobileMenu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      const spans = toggle.querySelectorAll('span');
      if (open) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    };
    toggle.addEventListener('click', () => setMenu(!mobileMenu.classList.contains('open')));
    // Close menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => setMenu(false));
    });
    // Escape closes it and hands focus back to the toggle. Without the focus
    // return, closing from inside the drawer drops focus onto <body> and a
    // keyboard user restarts the page. The lightbox and the command palette
    // already did this; the drawer did not.
    document.addEventListener('keydown', event => {
      if (event.key !== 'Escape' || !mobileMenu.classList.contains('open')) return;
      setMenu(false);
      toggle.focus();
    });
  }

  /* ── ACTIVE NAV LINK + HOMEPAGE STORY POSITION ── */
  const currentPage = pageKey(location.pathname);
  const isTourDetail = tours.some(tour => pageKey(tour.detailUrl) === currentPage);
  const desktopNavLinks = [...document.querySelectorAll('.nav-links a')];
  const mobileNavLinks = [...document.querySelectorAll('.nav-mobile a:not(.btn)')];
  const navLinks = [...desktopNavLinks, ...mobileNavLinks];
  const navList = document.querySelector('.nav-links');

  const positionActivePill = () => {
    if (!navList) return;
    const activeLink = desktopNavLinks.find(link => link.classList.contains('active'));
    if (!activeLink) { navList.classList.remove('has-active-indicator'); return; }
    const listRect = navList.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    navList.style.setProperty('--nav-active-x', `${linkRect.left - listRect.left}px`);
    navList.style.setProperty('--nav-active-y', `${linkRect.top - listRect.top}px`);
    navList.style.setProperty('--nav-active-width', `${linkRect.width}px`);
    navList.style.setProperty('--nav-active-height', `${linkRect.height}px`);
    navList.classList.add('has-active-indicator');
  };

  const setActiveNav = (activeHref, storyPosition = false) => {
    navLinks.forEach(link => {
      const active = pageKey(link.getAttribute('href')) === pageKey(activeHref);
      link.classList.toggle('active', active);
      if (active && !storyPosition) link.setAttribute('aria-current', 'page');
      else link.removeAttribute('aria-current');
    });
    requestAnimationFrame(positionActivePill);
  };

  const pageHref = isTourDetail ? 'packages' : currentPage;
  setActiveNav(pageHref);

  const homepageSections = [...document.querySelectorAll('[data-home-section]')];
  if (currentPage === 'index' && homepageSections.length) {
    const storyNavMap = {
      hero: 'index.html',
      founderStory: 'about.html',
      waysToExperience: 'packages.html',
      howHosted: 'packages.html',
      reviewsAndTrust: 'packages.html',
      planningProcess: 'contact.html',
      finalInvitation: 'contact.html',
    };
    const storyObserver = new IntersectionObserver(entries => {
      const visible = entries.find(entry => entry.isIntersecting);
      const activeHref = visible && storyNavMap[visible.target.dataset.homeSection];
      if (activeHref) setActiveNav(activeHref, pageKey(activeHref) !== 'index');
    }, {rootMargin: '-34% 0px -55% 0px', threshold: 0});
    homepageSections.forEach(section => storyObserver.observe(section));
  }

  window.addEventListener('resize', positionActivePill, {passive: true});
  window.addEventListener('navstatechange', positionActivePill);
  if ('ResizeObserver' in window && navList) new ResizeObserver(positionActivePill).observe(navList);

  /* ── HERO SLIDER ── */
  const heroSlides = document.querySelectorAll('.hero-slide');
  const heroDots   = document.querySelectorAll('.hero-dot');
  let heroIndex = 0;
  let heroInterval;

  function showHeroSlide(idx) {
    heroSlides.forEach((s, i) => s.classList.toggle('active', i === idx));
    heroDots.forEach((d, i) => d.classList.toggle('active', i === idx));
    heroIndex = idx;
  }
  function nextHeroSlide() { showHeroSlide((heroIndex + 1) % heroSlides.length); }
  function prevHeroSlide() { showHeroSlide((heroIndex - 1 + heroSlides.length) % heroSlides.length); }
  function startHeroAuto() { heroInterval = setInterval(nextHeroSlide, 5500); }
  function resetHeroAuto() { clearInterval(heroInterval); startHeroAuto(); }

  if (heroSlides.length > 0) {
    showHeroSlide(0);
    startHeroAuto();
    document.querySelector('.hero-next')?.addEventListener('click', () => { nextHeroSlide(); resetHeroAuto(); });
    document.querySelector('.hero-prev')?.addEventListener('click', () => { prevHeroSlide(); resetHeroAuto(); });
    heroDots.forEach((dot, i) => dot.addEventListener('click', () => { showHeroSlide(i); resetHeroAuto(); }));
  }

  /* ── SCROLL CHEVRON (hero → first section) ── */
  const scrollChevron = document.querySelector('.v-hero-scroll');
  if (scrollChevron) {
    scrollChevron.addEventListener('click', () => {
      const next = document.querySelector('.marquee-strip, .page-hero + *, .v-hero + *');
      if (next) next.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ── TESTIMONIALS RAIL ── */
  const testimonialsTrack = document.querySelector('.testimonials-track');
  const testimonialDots   = document.querySelectorAll('.testimonials-dot');

  if (testimonialsTrack && testimonialDots.length > 0) {
    const originalSlides = Array.from(testimonialsTrack.querySelectorAll('.testimonial-slide'));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let carouselPaused = reducedMotion;
    let carouselInView = false;
    let cycleWidth = 0;
    let lastFrame = 0;
    let resumeTimer = 0;
    let dragStartX = 0;
    let dragStartScroll = 0;
    let isDragging = false;

    if (!reducedMotion) {
      originalSlides.forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.remove('reveal', 'visible');
        clone.setAttribute('aria-hidden', 'true');
        clone.querySelectorAll('a, button').forEach(control => control.setAttribute('tabindex', '-1'));
        testimonialsTrack.appendChild(clone);
      });
      testimonialsTrack.classList.add('is-auto-scrolling');
    }

    const allSlides = () => Array.from(testimonialsTrack.querySelectorAll('.testimonial-slide'));
    const measureCarousel = () => {
      const first = originalSlides[0];
      const firstClone = allSlides()[originalSlides.length];
      cycleWidth = first && firstClone ? firstClone.offsetLeft - first.offsetLeft : testimonialsTrack.scrollWidth;
    };

    const syncTestimonialDots = () => {
      if (testimonialsTrack.scrollWidth - testimonialsTrack.clientWidth <= 1) return;
      const trackLeft = testimonialsTrack.getBoundingClientRect().left;
      let nearest = 0;
      let smallest = Infinity;
      originalSlides.forEach((slide, i) => {
        const offset = Math.abs(slide.getBoundingClientRect().left - trackLeft);
        if (offset < smallest) { smallest = offset; nearest = i; }
      });
      if (cycleWidth && testimonialsTrack.scrollLeft >= cycleWidth) {
        const cloneIndex = allSlides().slice(originalSlides.length).reduce((best, slide, i) => {
          const offset = Math.abs(slide.getBoundingClientRect().left - trackLeft);
          return offset < best.offset ? {index: i, offset} : best;
        }, {index: 0, offset: Infinity}).index;
        nearest = cloneIndex;
      }
      testimonialDots.forEach((dot, i) => {
        const active = i === nearest;
        dot.classList.toggle('active', active);
        dot.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
    };

    let testimonialRaf = 0;
    testimonialsTrack.addEventListener('scroll', () => {
      cancelAnimationFrame(testimonialRaf);
      testimonialRaf = requestAnimationFrame(syncTestimonialDots);
    }, { passive: true });

    testimonialDots.forEach((dot, i) => {
      dot.addEventListener('click', () => {
        const slide = originalSlides[i];
        if (!slide) return;
        const delta = slide.getBoundingClientRect().left - testimonialsTrack.getBoundingClientRect().left;
        testimonialsTrack.scrollTo({
          left: testimonialsTrack.scrollLeft + delta,
          behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        });
      });
    });

    const pauseCarousel = () => { carouselPaused = true; testimonialsTrack.classList.remove('is-auto-scrolling'); };
    const resumeCarousel = (delay = 0) => {
      clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => {
        if (!reducedMotion) { carouselPaused = false; testimonialsTrack.classList.add('is-auto-scrolling'); }
      }, delay);
    };

    testimonialsTrack.addEventListener('mouseenter', pauseCarousel);
    testimonialsTrack.addEventListener('mouseleave', () => resumeCarousel(600));
    testimonialsTrack.addEventListener('focusin', pauseCarousel);
    testimonialsTrack.addEventListener('focusout', event => {
      if (!testimonialsTrack.contains(event.relatedTarget)) resumeCarousel(600);
    });
    testimonialsTrack.addEventListener('pointerdown', event => {
      pauseCarousel();
      if (event.pointerType !== 'mouse' || event.target.closest('button, a')) return;
      isDragging = true;
      dragStartX = event.clientX;
      dragStartScroll = testimonialsTrack.scrollLeft;
      testimonialsTrack.classList.add('is-dragging');
      testimonialsTrack.setPointerCapture(event.pointerId);
    });
    testimonialsTrack.addEventListener('pointermove', event => {
      if (!isDragging) return;
      testimonialsTrack.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
    });
    const endDrag = event => {
      if (!isDragging) { resumeCarousel(3500); return; }
      isDragging = false;
      testimonialsTrack.classList.remove('is-dragging');
      if (testimonialsTrack.hasPointerCapture(event.pointerId)) testimonialsTrack.releasePointerCapture(event.pointerId);
      resumeCarousel(3500);
    };
    testimonialsTrack.addEventListener('pointerup', endDrag);
    testimonialsTrack.addEventListener('pointercancel', endDrag);

    testimonialsTrack.addEventListener('click', event => {
      const button = event.target.closest('.testi-read-more');
      if (!button) return;
      const quote = button.previousElementSibling;
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      button.textContent = expanded ? 'Read more' : 'Show less';
      quote?.classList.toggle('is-expanded', !expanded);
    });

    /*
     * Show "Read more" only on quotes that are actually cut off.
     *
     * The button used to be decided at build time by character count, which
     * cannot know how many lines a quote wraps to — the clamp is three lines at
     * every width, so a quote short enough to miss the threshold could still be
     * truncated with no way to open it. Measuring the rendered box answers the
     * real question, and answers it again when the width changes.
     *
     * Only collapsed quotes are measured: an expanded one has no clamp, so it
     * never overflows and would have its button taken away mid-read.
     */
    const syncQuoteButtons = () => {
      document.querySelectorAll('.testi-read-more').forEach(button => {
        const quote = button.previousElementSibling;
        if (!quote || quote.classList.contains('is-expanded')) return;
        const overflows = quote.scrollHeight > quote.clientHeight + 1;
        button.hidden = !overflows;
        quote.classList.toggle('is-collapsible', overflows);
      });
    };

    syncQuoteButtons();
    // Web fonts land after first paint and change how many lines a quote takes.
    if (document.fonts?.ready) document.fonts.ready.then(syncQuoteButtons).catch(() => {});
    let quoteResizeTimer;
    window.addEventListener('resize', () => {
      window.clearTimeout(quoteResizeTimer);
      quoteResizeTimer = window.setTimeout(syncQuoteButtons, 150);
    });

    const advanceCarousel = timestamp => {
      if (!lastFrame) lastFrame = timestamp;
      const elapsed = Math.min(timestamp - lastFrame, 50);
      lastFrame = timestamp;
      if (!carouselPaused && carouselInView && cycleWidth > 0) {
        testimonialsTrack.scrollLeft += elapsed * 0.008;
        if (testimonialsTrack.scrollLeft >= cycleWidth) testimonialsTrack.scrollLeft -= cycleWidth;
      }
      requestAnimationFrame(advanceCarousel);
    };

    const carouselObserver = new IntersectionObserver(entries => {
      carouselInView = entries.some(entry => entry.isIntersecting);
    }, { threshold: 0.2 });
    carouselObserver.observe(testimonialsTrack);

    window.addEventListener('resize', () => { measureCarousel(); syncTestimonialDots(); });
    measureCarousel();
    syncTestimonialDots();
    requestAnimationFrame(advanceCarousel);
  }

  /* ── EXPERIENCE FILTERS (experiences page) ── */
  const experienceFilterNav = document.querySelector('.experience-filter-nav');
  if (experienceFilterNav) {
    const grid = document.getElementById('tours-grid');
    const cards = Array.from(grid?.querySelectorAll('.tour-card[data-categories]') || []);
    const groups = Array.from(experienceFilterNav.querySelectorAll('[data-filter-group]'));
    const destinationSelect = experienceFilterNav.querySelector('[data-destination-filter]');
    const queryParams = new URLSearchParams(window.location.search);
    const allowedCategories = new Set(['culture', 'history', 'heritage', 'food', 'craft', 'nature', 'adventure', 'multi-day']);
    const allowedDestinations = new Set(['accra', 'cape-coast', 'kumasi', 'ada-foah', 'volta', 'akosombo']);
    const categoryAliases = {
      history: ['history', 'heritage'],
      heritage: ['history', 'heritage'],
    };
    const requestedCategory = queryParams.get('category') || queryParams.get('experience');
    const filterState = {
      category: allowedCategories.has(requestedCategory) ? (requestedCategory === 'heritage' ? 'history' : requestedCategory) : 'all',
      destination: allowedDestinations.has(queryParams.get('destination')) ? queryParams.get('destination') : 'all',
    };
    const filterReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let filterTimer;

    const categoryMatches = (card, filter) => {
      if (filter === 'all') return true;
      const categories = card.dataset.categories.split(/\s+/);
      return (categoryAliases[filter] || [filter]).some(category => categories.includes(category));
    };

    const setActiveButton = (group, value) => {
      group.querySelectorAll('.filter-tab').forEach(button => {
        const active = button.dataset.filter === value;
        button.classList.toggle('active', active);
        button.setAttribute('aria-pressed', String(active));
      });
    };

    const syncFilterUrl = () => {
      const nextParams = new URLSearchParams(window.location.search);
      if (filterState.category === 'all') nextParams.delete('category');
      else nextParams.set('category', filterState.category);
      if (filterState.destination === 'all') nextParams.delete('destination');
      else nextParams.set('destination', filterState.destination);
      nextParams.delete('experience');
      const query = nextParams.toString();
      history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}${location.hash}`);
    };

    const emptyPanel = document.querySelector('[data-experience-empty]');
    const emptyCombo = document.querySelector('[data-empty-combo]');
    const resetButton = document.querySelector('[data-experience-reset]');

    // What the visitor actually picked, in their words rather than slugs.
    const activeFilterLabel = () => {
      const parts = [];
      groups.forEach(group => {
        const kind = group.dataset.filterGroup;
        if (filterState[kind] === 'all') return;
        const active = group.querySelector(`.filter-tab[data-filter="${filterState[kind]}"]`);
        if (active) parts.push(active.textContent.trim());
      });
      if (destinationSelect && filterState.destination !== 'all') {
        const option = destinationSelect.selectedOptions[0];
        if (option) parts.push(option.textContent.trim());
      }
      return parts.join(' in ');
    };

    const reportResultCount = count => {
      if (!emptyPanel) return;
      emptyPanel.hidden = count > 0;
      if (count === 0 && emptyCombo) emptyCombo.textContent = activeFilterLabel() || 'that combination';
    };

    const applyFilters = (animate = true) => {
      if (!grid) return;
      window.clearTimeout(filterTimer);
      grid.classList.toggle('is-filtering', animate);

      const updateCards = () => {
        let visibleIndex = 0;
        cards.forEach(card => {
          const matchesCategory = categoryMatches(card, filterState.category);
          const matchesDestination = filterState.destination === 'all' || card.dataset.destination === filterState.destination;
          const visible = matchesCategory && matchesDestination;
          card.hidden = !visible;
          card.classList.remove('filter-enter');
          if (visible) {
            card.style.setProperty('--filter-index', visibleIndex);
            visibleIndex += 1;
          }
        });
        grid.classList.remove('is-filtering');
        // visibleIndex was computed and thrown away. Craft in Kumasi matches
        // nothing, and the page simply went blank — no message, no count, and
        // no control anywhere to undo it.
        reportResultCount(visibleIndex);
        if (animate) {
          requestAnimationFrame(() => cards.filter(card => !card.hidden).forEach(card => card.classList.add('filter-enter')));
        }
      };

      if (animate && !filterReducedMotion) filterTimer = window.setTimeout(updateCards, 160);
      else updateCards();
    };

    groups.forEach(group => {
      const kind = group.dataset.filterGroup;
      setActiveButton(group, filterState[kind]);
      group.addEventListener('click', event => {
        const button = event.target.closest('.filter-tab');
        if (!button || button.dataset.filter === filterState[kind]) return;
        filterState[kind] = button.dataset.filter;
        setActiveButton(group, filterState[kind]);
        syncFilterUrl();
        applyFilters();
      });
    });

    if (destinationSelect) {
      destinationSelect.value = filterState.destination;
      destinationSelect.addEventListener('change', () => {
        filterState.destination = destinationSelect.value;
        syncFilterUrl();
        applyFilters();
      });
    }

    if (resetButton) {
      resetButton.addEventListener('click', () => {
        groups.forEach(group => {
          filterState[group.dataset.filterGroup] = 'all';
          setActiveButton(group, 'all');
        });
        if (destinationSelect) {
          filterState.destination = 'all';
          destinationSelect.value = 'all';
        }
        syncFilterUrl();
        applyFilters();
        grid?.scrollIntoView({behavior: filterReducedMotion ? 'auto' : 'smooth', block: 'start'});
      });
    }

    applyFilters(false);
  }

  /* ── DESTINATION TABS ── */
  const destTabs   = document.querySelectorAll('.dest-tab');
  const destPanels = document.querySelectorAll('.dest-panel');
  if (destTabs.length > 0) {
    destTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        destTabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        destPanels.forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        const panel = document.querySelector(`.dest-panel[data-panel="${tab.dataset.dest}"]`);
        if (panel) panel.classList.add('active');
      });
    });
  }

  /* ── ACCORDION (general — .accordion-item) ── */
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item   = header.closest('.accordion-item');
      const isOpen = item.classList.contains('open');
      item.closest('.accordion-list')?.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── ITINERARY ACCORDION (.itin-item) ── */
  document.querySelectorAll('.itin-header').forEach(header => {
    header.addEventListener('click', () => {
      const item   = header.closest('.itin-item');
      const isOpen = item.classList.contains('open');
      // allow multiple open itinerary days OR close-all-then-open (choose below)
      item.closest('.itin-list')?.querySelectorAll('.itin-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── TOUR DETAIL ACCORDIONS ── */
  function bindStandaloneToggle(control, itemSelector) {
    const item = control.closest(itemSelector);
    if (!item) return;

    control.setAttribute('role', 'button');
    control.setAttribute('tabindex', control.getAttribute('tabindex') || '0');
    control.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');

    const toggleItem = () => {
      item.classList.toggle('open');
      control.setAttribute('aria-expanded', item.classList.contains('open') ? 'true' : 'false');
    };

    control.addEventListener('click', toggleItem);
    control.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      toggleItem();
    });
  }

  document.querySelectorAll('.day-header').forEach(header => {
    bindStandaloneToggle(header, '.day-item');
  });

  document.querySelectorAll('.faq-q').forEach(question => {
    bindStandaloneToggle(question, '.faq-item');
  });

  /* ── FAQ ── */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      item.closest('.faq-list')?.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) item.classList.add('open');
      btn.setAttribute('aria-expanded', !isOpen ? 'true' : 'false');
    });
  });

  /* ── EMAIL SIGNUP ── */
  const emailForm = document.querySelector('.email-form');
  if (emailForm) {
    emailForm.addEventListener('submit', async e => {
      const input = emailForm.querySelector('.email-input');
      const btn   = emailForm.querySelector('.email-submit');
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      if (!emailOk) {
        e.preventDefault();
        input.style.outline = '2px solid #ef4444';
        setTimeout(() => { input.style.outline = ''; }, 2000);
        return;
      }
      const orig = btn.textContent;
      btn.textContent = 'Subscribing…';
      btn.disabled = true;
      if (usesExternalFormEndpoint(emailForm)) return;
      e.preventDefault();
      try {
        const body = new URLSearchParams(new FormData(emailForm)).toString();
        const res  = await fetch(emailForm.action || '/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        if (res.ok) {
          btn.textContent = 'Subscribed!';
          btn.style.background = 'var(--color-success)';
          input.value = '';
          setTimeout(() => { btn.textContent = orig; btn.style.background = ''; btn.disabled = false; }, 3500);
        } else { throw new Error(); }
      } catch {
        btn.textContent = 'Error — try again';
        btn.disabled = false;
        setTimeout(() => { btn.textContent = orig; }, 2500);
      }
    });
  }

  /* ── CONTACT FORM ── */
  const contactForm = document.querySelector('.contact-form');
  if (contactForm) {
    // Disable native validation from script rather than with a `novalidate`
    // attribute in the markup.
    //
    // The attribute exists to stop the browser interrupting the step-by-step
    // flow, which only runs when this script does. In the markup it would also
    // apply when the script fails to load, leaving nothing validating at all —
    // an enquiry could then be submitted without an email address to reply to.
    // Setting it here means the browser enforces the required fields for
    // visitors without JavaScript.
    contactForm.noValidate = true;

    // `data-inquiry-mode` is written by the build, which knows whether the
    // deployment it is producing has a Function behind it. That is the source
    // of truth; the hostname check below is only a fallback for *.pages.dev
    // previews.
    //
    // Do not infer the environment from the hostname alone. A hostname test
    // cannot distinguish a custom domain with a Function from one without, and
    // getting it wrong sends enquiries to the fallback endpoint — bypassing
    // Turnstile and the configured delivery address, with no error raised.
    const useCloudflareInquiry = contactForm.dataset.inquiryMode === 'cloudflare' || location.hostname.endsWith('.pages.dev');

    // FormSubmit needs an absolute redirect target, and a hard-coded one 404s
    // everywhere except the single host it names. Resolve thanks.html against
    // the current page instead, so the same markup lands correctly on GitHub
    // Pages (which serves this site from a /people-and-places-tours/ subpath),
    // on Cloudflare Pages, on a custom domain, and on localhost. The committed
    // value stays as the no-JS fallback.
    const nextField = contactForm.querySelector('input[name="_next"]');
    if (nextField) nextField.value = new URL('thanks.html', window.location.href).href;

    /* ── Turnstile ──
       Loaded only when a site key was injected at build time, so the GitHub
       Pages fallback — which has no Function to verify a token against —
       pulls in no third-party script at all.

       Executed at submit rather than on load: a token expires after five
       minutes and this is a two-step form people take their time over, so
       minting it at the moment of sending avoids a stale-token rejection.
       `interaction-only` keeps it invisible unless a challenge is genuinely
       needed, and even then it resolves inline instead of sending anyone to
       a CAPTCHA page. */
    const turnstileSiteKey = contactForm.dataset.turnstileSitekey;
    const turnstileMount = contactForm.querySelector('[data-turnstile]');
    let turnstileWidget = null;
    let pendingTurnstile = null;

    const settleTurnstile = token => {
      if (!pendingTurnstile) return;
      const resolve = pendingTurnstile;
      pendingTurnstile = null;
      resolve(token);
    };

    if (turnstileSiteKey && turnstileMount) {
      window.onBookingTurnstileLoad = () => {
        turnstileWidget = window.turnstile.render(turnstileMount, {
          sitekey: turnstileSiteKey,
          action: 'inquiry',
          appearance: 'interaction-only',
          execution: 'execute',
          callback: token => settleTurnstile(token),
          'error-callback': () => settleTurnstile(''),
          'timeout-callback': () => settleTurnstile(''),
        });
      };
      const turnstileScript = document.createElement('script');
      turnstileScript.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onBookingTurnstileLoad&render=explicit';
      turnstileScript.async = true;
      turnstileScript.defer = true;
      document.head.appendChild(turnstileScript);
    }

    const requestTurnstileToken = () => new Promise(resolve => {
      if (!turnstileSiteKey || turnstileWidget === null || !window.turnstile) return resolve('');
      pendingTurnstile = resolve;
      // Never leave somebody watching a spinner for a challenge that is not
      // coming back. An empty token fails the server check honestly instead.
      setTimeout(() => settleTurnstile(''), 15000);
      try {
        window.turnstile.reset(turnstileWidget);
        window.turnstile.execute(turnstileWidget);
      } catch {
        settleTurnstile('');
      }
    });
    const tourSelect = contactForm.querySelector('#tour-interest');
    const tourNameInput = contactForm.querySelector('#tour-name');
    const overnightDetails = [...contactForm.querySelectorAll('[data-trip-detail="overnight"]')];
    const childrenSelect = contactForm.querySelector('#traveling-with-children');
    const childrenDetail = contactForm.querySelector('[data-children-detail]');
    const childrenAges = contactForm.querySelector('#children-age-ranges');
    const departureDate = contactForm.querySelector('#departure-date');
    const contactMethod = contactForm.querySelector('#contact-method');
    const phone = contactForm.querySelector('#phone');
    const overnightTours = new Set(['custom', 'just-go-ghana']);
    const setConditionalVisibility = (elements, visible) => {
      elements.filter(Boolean).forEach(element => {
        element.toggleAttribute('data-conditional-hidden', !visible);
        element.querySelectorAll('input, select, textarea').forEach(field => { field.disabled = !visible; });
      });
    };
    const updateTripDetails = () => {
      // With no chosen experience we leave the planning questions available.
      // A specific day tour hides fields that cannot affect that booking.
      const showOvernight = !tourSelect?.value || overnightTours.has(tourSelect.value);
      setConditionalVisibility(overnightDetails, showOvernight);
      const showChildrenAges = childrenSelect?.value === 'yes';
      setConditionalVisibility([childrenDetail], showChildrenAges);
    };
    let updateTourName = () => {};
    if (tourSelect) {
      updateTourName = () => {
        const selected = tourSelect.options[tourSelect.selectedIndex];
        if (tourNameInput) tourNameInput.value = selected?.value ? selected.textContent.trim() : '';
      };
      const requestedTour = new URLSearchParams(window.location.search).get('tour');
      if (requestedTour && [...tourSelect.options].some(option => option.value === requestedTour)) {
        tourSelect.value = requestedTour;
      }
      tourSelect.addEventListener('change', () => {
        updateTourName();
        updateTripDetails();
      });
      updateTourName();
    }
    childrenSelect?.addEventListener('change', updateTripDetails);

    /* ── Booking flow ──
       Two progressively disclosed steps. Visibility is driven by
       data-booking-current on the form, so CSS owns the layout and no nodes
       are moved at runtime. Without JavaScript the form stays a single page
       and still posts natively, so this only ever adds behaviour. */
    const bookingPanel = contactForm.closest('.booking-panel');
    const bookingSteps = [...contactForm.querySelectorAll('[data-booking-step]')]
      .sort((a, b) => Number(a.dataset.bookingStep) - Number(b.dataset.bookingStep));
    const progressBar = contactForm.querySelector('[data-booking-progress]');
    const progressItems = [...contactForm.querySelectorAll('[data-booking-progress-step]')];
    const announcer = contactForm.querySelector('[data-booking-announce]');
    const nextButton = contactForm.querySelector('.booking-next');
    const backButton = contactForm.querySelector('.booking-back');
    const travelDate = contactForm.querySelector('#travel-date');
    const successPanel = bookingPanel?.querySelector('[data-booking-success]');
    const errorEl = contactForm.querySelector('.form-error');
    const totalSteps = bookingSteps.length;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let currentBookingStep = 1;
    let inquirySubmissionId = '';
    let showBookingStep = () => {};

    const requiredFields = () => [
      [contactForm.querySelector('#first-name'), value => Boolean(value)],
      [contactForm.querySelector('#last-name'), value => Boolean(value)],
      [contactForm.querySelector('#email'), value => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)],
      ...(contactMethod?.value === 'whatsapp' ? [[phone, value => Boolean(value)]] : []),
    ];

    const clearFieldError = field => {
      field.setAttribute('aria-invalid', 'false');
      if (errorEl && requiredFields().every(([input, isValid]) => isValid(input.value.trim()))) {
        errorEl.textContent = '';
      }
    };

    requiredFields().forEach(([field]) => {
      field?.addEventListener('input', () => clearFieldError(field));
    });
    contactMethod?.addEventListener('change', () => {
      if (phone) phone.setAttribute('aria-required', String(contactMethod.value === 'whatsapp'));
    });

    if (totalSteps > 1) {
      contactForm.classList.add('booking-flow-ready');
      updateTripDetails();

      showBookingStep = (step, moveFocus = false) => {
        currentBookingStep = Math.min(Math.max(step, 1), totalSteps);
        contactForm.dataset.bookingCurrent = String(currentBookingStep);

        let stepName = '';
        progressItems.forEach(item => {
          const index = Number(item.dataset.bookingProgressStep);
          item.classList.toggle('is-complete', index < currentBookingStep);
          if (index === currentBookingStep) {
            item.setAttribute('aria-current', 'step');
            stepName = item.querySelector('.booking-progress-name')?.textContent.trim() || '';
          } else {
            item.removeAttribute('aria-current');
          }
        });
        if (progressBar) progressBar.style.transform = `scaleX(${currentBookingStep / totalSteps})`;
        if (announcer) announcer.textContent = `Step ${currentBookingStep} of ${totalSteps}. ${stepName}.`;

        if (!moveFocus) return;
        const panel = bookingSteps.find(item => Number(item.dataset.bookingStep) === currentBookingStep);
        const legend = panel?.querySelector('legend');
        if (legend) {
          legend.tabIndex = -1;
          legend.focus({preventScroll: true});
        }
        // Only pull the flow back into view when the step heading has scrolled
        // off; scrolling on every click makes the transition feel jumpy.
        const top = bookingPanel?.getBoundingClientRect().top ?? 0;
        if (top < 0) {
          bookingPanel.scrollIntoView({behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'start'});
        }
      };

      nextButton?.addEventListener('click', () => showBookingStep(currentBookingStep + 1, true));
      backButton?.addEventListener('click', () => showBookingStep(currentBookingStep - 1, true));
      showBookingStep(1);
    }

    // A past travel date is never a useful answer, and the browser can say so
    // before anyone submits.
    if (travelDate) {
      const now = new Date();
      travelDate.min = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      if (departureDate) departureDate.min = travelDate.min;
      travelDate.addEventListener('change', () => {
        if (departureDate) departureDate.min = travelDate.value || travelDate.min;
      });
    }

    const showBookingSuccess = reference => {
      if (!successPanel || !bookingPanel) return false;
      const referenceEl = successPanel.querySelector('[data-booking-reference]');
      if (referenceEl) referenceEl.textContent = reference || 'sent';
      successPanel.hidden = false;
      bookingPanel.classList.add('is-complete');
      const heading = successPanel.querySelector('.booking-success-title');
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({preventScroll: true});
      }
      successPanel.scrollIntoView({behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'center'});
      return true;
    };

    contactForm.addEventListener('submit', async e => {
      // Pressing Enter in a step 1 field implicitly submits the form. Treat
      // that as "continue" rather than firing an inquiry the person has not
      // finished writing.
      if (totalSteps > 1 && currentBookingStep < totalSteps) {
        e.preventDefault();
        showBookingStep(currentBookingStep + 1, true);
        return;
      }

      const btn = contactForm.querySelector('button[type="submit"]');

      const fields = requiredFields();
      fields.forEach(([field, isValid]) => field?.setAttribute('aria-invalid', String(!isValid(field.value.trim()))));
      const firstInvalid = fields.find(([field, isValid]) => !isValid(field.value.trim()))?.[0];

      if (firstInvalid) {
        e.preventDefault();
        if (errorEl) errorEl.textContent = firstInvalid === phone
          ? 'Please add a phone number so we can contact you on WhatsApp.'
          : 'Please share your name and a valid email so we know how to reach you.';
        if (totalSteps > 1 && currentBookingStep !== totalSteps) showBookingStep(totalSteps);
        firstInvalid.focus();
        return;
      }
      if (errorEl) errorEl.textContent = '';

      const original = btn.innerHTML;
      btn.textContent = 'Sending…';
      btn.disabled = true;

      // A deployment without a Pages Function keeps the form's native
      // FormSubmit action as a working fallback. Where a Function is available
      // the submission is sent to the same-origin endpoint instead.
      if (!useCloudflareInquiry) return;
      e.preventDefault();

      try {
        const endpoint = contactForm.dataset.cloudflareEndpoint || '/api/inquiry';
        const payload = Object.fromEntries(new FormData(contactForm).entries());
        inquirySubmissionId ||= crypto.randomUUID();
        payload['client-submission-id'] = inquirySubmissionId;
        payload['cf-turnstile-response'] = await requestTurnstileToken();
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
          body: JSON.stringify(payload),
        });
        const result = await res.json().catch(() => ({}));

        // The function's own messages are written for travellers to read, and
        // a rejected challenge needs its specific "reload and try again"
        // wording rather than the generic delivery warning below.
        if (!res.ok) {
          if (errorEl) errorEl.textContent = result.error || 'Your message could not be sent. Please try again in a moment.';
          btn.innerHTML = original;
          btn.disabled = false;
          return;
        }

        contactForm.reset();
        inquirySubmissionId = '';
        updateTourName();
        updateTripDetails();
        if (totalSteps > 1) showBookingStep(1);
        if (!showBookingSuccess(result.reference)) {
          btn.textContent = 'Your Ghana journey has started.';
          btn.style.background = 'var(--color-success)';
          setTimeout(() => { btn.innerHTML = original; btn.style.background = ''; btn.disabled = false; }, 5000);
        }
      } catch {
        // Do not automatically submit to the fallback here. The function may
        // have delivered the email even if its response was interrupted, and
        // an automatic retry could create a duplicate inquiry.
        if (errorEl) errorEl.textContent = 'We could not confirm that your message reached us. Please try again in a moment, or send us a note on WhatsApp and we will pick it up from there.';
        btn.innerHTML = original;
        btn.disabled = false;
      }
    });
  }

  /* ── LIGHTBOX ── */
  const galleryItems = document.querySelectorAll('.gallery-item');
  if (galleryItems.length > 0) {
    const lb = document.createElement('div');
    lb.id = 'lightbox';
    lb.innerHTML = `
      <div class="lb-backdrop"></div>
      <button type="button" class="lb-close" aria-label="Close image viewer">&times;</button>
      <button type="button" class="lb-prev" aria-label="Previous image">&#8592;</button>
      <button type="button" class="lb-next" aria-label="Next image">&#8594;</button>
      <div class="lb-img-wrap"><img class="lb-img" src="" alt="" decoding="async" /></div>
    `;
    Object.assign(lb.style, { position:'fixed', inset:'0', zIndex:'10000', display:'none', alignItems:'center', justifyContent:'center' });
    const lbStyle = document.createElement('style');
    lbStyle.textContent = `
      #lightbox{background:rgba(0,0,0,.95);}
      .lb-backdrop{position:absolute;inset:0;}
      .lb-img-wrap{position:relative;z-index:1;}
      .lb-img{max-width:90vw;max-height:90vh;object-fit:contain;border-radius:4px;}
      .lb-close{position:absolute;top:24px;right:32px;z-index:2;background:none;border:none;color:#fff;font-size:40px;cursor:pointer;line-height:1;}
      .lb-prev,.lb-next{position:absolute;top:50%;transform:translateY(-50%);z-index:2;background:rgba(255,171,0,.15);border:1.5px solid rgba(255,171,0,.3);color:#FFAB00;font-size:24px;width:52px;height:52px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;}
      .lb-prev{left:24px;}.lb-next{right:24px;}
      .lb-prev:hover,.lb-next:hover{background:#FFAB00;color:#0A0A0A;}
    `;
    document.head.appendChild(lbStyle);
    document.body.appendChild(lb);

    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Image viewer');

    const imgs = [...galleryItems].map(i => {
      const image = i.querySelector('img');
      return image ? {src: image.src, alt: image.alt || ''} : null;
    }).filter(Boolean);
    let lbIdx = 0;
    let lightboxTrigger = null;

    function openLb(idx, trigger = lightboxTrigger) {
      lbIdx = idx;
      lightboxTrigger = trigger;
      const image = lb.querySelector('.lb-img');
      image.src = imgs[idx].src;
      image.alt = imgs[idx].alt;
      lb.style.display = 'flex';
      document.body.style.overflow = 'hidden';
      lb.querySelector('.lb-close').focus();
    }
    function closeLb() {
      lb.style.display = 'none';
      document.body.style.overflow = '';
      lightboxTrigger?.focus();
    }

    galleryItems.forEach((item, i) => item.addEventListener('click', () => openLb(i, item)));
    lb.querySelector('.lb-close').addEventListener('click', closeLb);
    lb.querySelector('.lb-backdrop').addEventListener('click', closeLb);
    lb.querySelector('.lb-next').addEventListener('click', () => openLb((lbIdx + 1) % imgs.length));
    lb.querySelector('.lb-prev').addEventListener('click', () => openLb((lbIdx - 1 + imgs.length) % imgs.length));
    document.addEventListener('keydown', e => {
      if (lb.style.display !== 'flex') return;
      if (e.key === 'Escape')     closeLb();
      if (e.key === 'ArrowRight') openLb((lbIdx + 1) % imgs.length);
      if (e.key === 'ArrowLeft')  openLb((lbIdx - 1 + imgs.length) % imgs.length);
    });
  }

  /* ── SMOOTH ANCHOR LINKS ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });

  /* ── SCROLL REVEAL ──
     Above-the-fold elements are revealed synchronously on first paint to avoid
     the brief "stuck hidden" gap before the observer's first async callback.
     Below-the-fold elements are observed and fade in as they scroll into view. */
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
      });
    }, { threshold: 0, rootMargin: '0px 0px -10% 0px' });

    // Content is visible by default. Only opt into the hidden animation state
    // after the observer was created successfully, so a script/API failure can
    // never strand meaningful content at opacity: 0.
    document.documentElement.classList.add('reveal-ready');

    function initReveals() {
      const vh = window.innerHeight;
      document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
        const r = el.getBoundingClientRect();
        const inViewport = r.top < vh && r.bottom > 0;
        if (inViewport) {
          el.classList.add('reveal-no-stagger', 'visible');
        } else {
          revealObserver.observe(el);
        }
      });
    }
    // Wait one frame so layout has computed before measuring positions.
    requestAnimationFrame(() => requestAnimationFrame(initReveals));

    const founderSection = document.querySelector('[data-home-section="founderStory"]');
    const homepageHero = document.querySelector('[data-home-section="hero"]');
    if (founderSection && homepageHero) {
      document.documentElement.classList.add('founder-transition-ready');
      const founderTransitionObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          document.documentElement.classList.toggle('founder-transition-active', entry.isIntersecting);
        });
      }, { threshold: 0.06, rootMargin: '0px 0px -8% 0px' });
      founderTransitionObserver.observe(founderSection);
    }
  }

  /* ── STATS COUNTER ── */
  function animateCounter(el) {
    const target   = parseInt(el.dataset.target, 10);
    // The markup carries the real figure so it is correct with no JavaScript
    // and for anyone who never scrolls this far. Only wind back to zero when
    // an animation is actually going to play.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = target.toLocaleString();
      return;
    }
    const duration = 2000;
    const step     = target / (duration / 16);
    let current    = 0;
    el.textContent = '0';
    const timer = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(timer); }
      el.textContent = Math.floor(current).toLocaleString();
    }, 16);
  }

  const statObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll('[data-target]').forEach(animateCounter);
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('.stats-section, .about-stats-row, .stats-bar').forEach(el => statObserver.observe(el));

  const trustMetrics = document.querySelector('.trust-facts-row');
  if (trustMetrics && 'IntersectionObserver' in window) {
    const trustMetricObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll('[data-count-value]').forEach(metric => {
          const target = Number(metric.dataset.countValue);
          const decimals = Number(metric.dataset.countDecimals || 0);
          const suffix = metric.dataset.countSuffix || '';
          if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            metric.textContent = `${target.toFixed(decimals)}${suffix}`;
            return;
          }
          metric.textContent = `${(0).toFixed(decimals)}${suffix}`;
          const start = performance.now();
          const duration = 1600;
          const tick = now => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            metric.textContent = `${(target * eased).toFixed(decimals)}${suffix}`;
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
        trustMetricObserver.unobserve(entry.target);
      });
    }, { threshold: 0.35 });
    trustMetricObserver.observe(trustMetrics);
  }

  /* ── COMMAND PALETTE ── */
  const cmdPalette  = document.getElementById('cmd-palette');
  const cmdInput    = document.getElementById('cmd-input');
  const cmdBackdrop = document.getElementById('cmd-backdrop');
  const cmdClose    = document.getElementById('cmd-close');
  const cmdTrigger  = document.getElementById('cmd-bar-trigger');

  if (cmdPalette && cmdTrigger) {
    const allItems = () => [...cmdPalette.querySelectorAll('.cmd-item')];
    let focusIdx = -1;

    function openPalette() {
      cmdPalette.hidden = false;
      document.body.style.overflow = 'hidden';
      cmdTrigger.setAttribute('aria-expanded', 'true');
      focusIdx = -1;
      setTimeout(() => cmdInput?.focus(), 50);
    }

    function closePalette() {
      cmdPalette.hidden = true;
      document.body.style.overflow = '';
      cmdTrigger.setAttribute('aria-expanded', 'false');
      if (cmdInput) cmdInput.value = '';
      setFocus(-1);
    }

    function setFocus(idx) {
      allItems().forEach((el, i) => el.classList.toggle('cmd-focused', i === idx));
      focusIdx = idx;
    }

    cmdTrigger.addEventListener('click', openPalette);
    cmdBackdrop?.addEventListener('click', closePalette);
    cmdClose?.addEventListener('click', closePalette);

    document.addEventListener('keydown', e => {
      if (!cmdPalette.hidden) {
        if (e.key === 'Escape')     { e.preventDefault(); closePalette(); }
        if (e.key === 'ArrowDown')  { e.preventDefault(); setFocus(Math.min(focusIdx + 1, allItems().length - 1)); }
        if (e.key === 'ArrowUp')    { e.preventDefault(); setFocus(Math.max(focusIdx - 1, 0)); }
        if (e.key === 'Enter' && focusIdx >= 0) { allItems()[focusIdx]?.click(); }
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        openPalette();
      }
    });

    /* Live filter */
    cmdInput?.addEventListener('input', () => {
      const q = cmdInput.value.toLowerCase().trim();
      allItems().forEach(item => {
        const text = item.textContent.toLowerCase();
        item.closest('li').style.display = (!q || text.includes(q)) ? '' : 'none';
      });
      setFocus(-1);
    });
  }

});

/* ── HERO ENTRANCE ──
   Runs on DOMContentLoaded (not window.load) so the animation isn't blocked
   waiting for the hero image to finish downloading. Hero markup is rendered
   by homepage-sections.js's DCL listener which fires first.

   This used to load GSAP from a CDN — 70KB of animation library to fade three
   elements up by a couple of dozen pixels. The same three fades are now CSS
   keyframes, which removes the download and one third-party dependency from
   the most important page on the site.

   The ordering here matters more than it looks. The headline is NOT hidden by
   default: CSS only hides it once this class is on the section. Written the
   other way round — hide in CSS, reveal with JS — a script failure or a
   blocked file would leave the homepage headline permanently invisible, which
   is a far worse outcome than a missing animation. Nothing on this page may
   depend on JavaScript running in order to be readable. */
function runHeroEntrance() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const hero = document.querySelector('.v-hero');
  if (!hero) return;
  if (!hero.querySelector('.v-hero-headline') && !hero.querySelector('.v-hero-cta-link')) return;
  hero.classList.add('v-hero-entrance');
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runHeroEntrance);
} else {
  runHeroEntrance();
}
