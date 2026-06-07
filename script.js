/* ============================================================
   PEOPLE & PLACES TOURS — Main JavaScript
   ============================================================ */

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

  /* ── STICKY NAV ── */
  const nav = document.querySelector('.nav');
  if (nav) {
    const handleScroll = () => nav.classList.toggle('scrolled', window.scrollY > 50);
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
  }

  /* ── MOBILE MENU ── */
  const toggle = document.querySelector('.nav-toggle');
  const mobileMenu = document.querySelector('.nav-mobile');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
      const spans = toggle.querySelectorAll('span');
      if (open) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
      } else {
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      }
    });
    // Close menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileMenu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        const spans = toggle.querySelectorAll('span');
        spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      });
    });
  }

  /* ── ACTIVE NAV LINK ── */
  const currentPage = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .nav-mobile a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

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

  /* ── TESTIMONIALS SLIDER ── */
  const testimonialsTrack = document.querySelector('.testimonials-track');
  const testimonialSlides = document.querySelectorAll('.testimonial-slide');
  const testimonialDots   = document.querySelectorAll('.testimonials-dot');
  let testimonialIndex = 0;
  let testimonialInterval;

  function showTestimonial(idx) {
    if (!testimonialsTrack) return;
    testimonialIndex = idx;
    testimonialsTrack.style.transform = `translateX(-${idx * 100}%)`;
    testimonialDots.forEach((d, i) => d.classList.toggle('active', i === idx));
  }

  if (testimonialsTrack && testimonialSlides.length > 0) {
    showTestimonial(0);
    testimonialInterval = setInterval(() => {
      showTestimonial((testimonialIndex + 1) % testimonialSlides.length);
    }, 6000);
    testimonialDots.forEach((dot, i) => {
      dot.addEventListener('click', () => { clearInterval(testimonialInterval); showTestimonial(i); });
    });
  }

  /* ── TRIP CATEGORY FILTER (home page) ── */
  const tripFilterTags = document.querySelectorAll('.trip-filter-tag');
  if (tripFilterTags.length > 0) {
    tripFilterTags.forEach(tag => {
      tag.addEventListener('click', () => {
        tripFilterTags.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        tag.classList.add('active');
        tag.setAttribute('aria-selected', 'true');
        const filter = tag.dataset.tripFilter;
        document.querySelectorAll('.trip-card').forEach(card => {
          const cats = card.dataset.tripCats || '';
          card.style.display = (filter === 'all' || cats.includes(filter)) ? '' : 'none';
        });
      });
    });
  }

  /* ── PACKAGE FILTER TABS (packages page) ── */
  const filterTabs = document.querySelectorAll('.filter-tab');
  if (filterTabs.length > 0) {
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filter = tab.dataset.filter;
        document.querySelectorAll('.tour-card[data-destination]').forEach(card => {
          card.style.display = (filter === 'all' || card.dataset.destination === filter) ? '' : 'none';
        });
      });
    });
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

  /* ── FAQ ── */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      item.closest('.faq-list')?.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ── EMAIL SIGNUP ── */
  const emailForm = document.querySelector('.email-form');
  if (emailForm) {
    emailForm.addEventListener('submit', async e => {
      e.preventDefault();
      const input = emailForm.querySelector('.email-input');
      const btn   = emailForm.querySelector('.email-submit');
      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value.trim());
      if (!emailOk) {
        input.style.outline = '2px solid #ef4444';
        setTimeout(() => { input.style.outline = ''; }, 2000);
        return;
      }
      const orig = btn.textContent;
      btn.textContent = 'Subscribing…';
      btn.disabled = true;
      try {
        const body = new URLSearchParams(new FormData(emailForm)).toString();
        const res  = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        if (res.ok) {
          btn.textContent = 'Subscribed!';
          btn.style.background = '#22c55e';
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
    contactForm.addEventListener('submit', async e => {
      e.preventDefault();
      const btn = contactForm.querySelector('button[type="submit"]');

      // Validate required fields
      const firstName = contactForm.querySelector('#first-name').value.trim();
      const lastName  = contactForm.querySelector('#last-name').value.trim();
      const email     = contactForm.querySelector('#email').value.trim();
      const emailOk   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      let errEl = contactForm.querySelector('.form-error');
      if (!errEl) {
        errEl = document.createElement('p');
        errEl.className = 'form-error';
        const actions = contactForm.querySelector('.form-actions');
        actions.parentNode.insertBefore(errEl, actions);
      }

      if (!firstName || !lastName || !emailOk) {
        errEl.textContent = 'Please fill in your first name, last name, and a valid email address.';
        return;
      }
      errEl.textContent = '';

      const original = btn.innerHTML;
      btn.textContent = 'Sending…';
      btn.disabled = true;

      try {
        const body = new URLSearchParams(new FormData(contactForm)).toString();
        const res  = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        if (res.ok) {
          btn.textContent = 'Inquiry Sent! We\'ll be in touch within 2 hours.';
          btn.style.background = '#22c55e';
          contactForm.reset();
          setTimeout(() => { btn.innerHTML = original; btn.style.background = ''; btn.disabled = false; }, 5000);
        } else { throw new Error(); }
      } catch {
        btn.textContent = 'Couldn\'t send — please try WhatsApp';
        btn.style.background = '#ef4444';
        setTimeout(() => { btn.innerHTML = original; btn.style.background = ''; btn.disabled = false; }, 4500);
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
      <button class="lb-close" aria-label="Close">&times;</button>
      <button class="lb-prev" aria-label="Previous">&#8592;</button>
      <button class="lb-next" aria-label="Next">&#8594;</button>
      <div class="lb-img-wrap"><img class="lb-img" src="" alt="" /></div>
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

    const imgs = [...galleryItems].map(i => i.querySelector('img')?.src).filter(Boolean);
    let lbIdx = 0;

    function openLb(idx) { lbIdx = idx; lb.querySelector('.lb-img').src = imgs[idx]; lb.style.display = 'flex'; document.body.style.overflow = 'hidden'; }
    function closeLb()   { lb.style.display = 'none'; document.body.style.overflow = ''; }

    galleryItems.forEach((item, i) => item.addEventListener('click', () => openLb(i)));
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

  /* ── SCROLL REVEAL ── */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); revealObserver.unobserve(entry.target); }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

  /* ── STATS COUNTER ── */
  function animateCounter(el) {
    const target   = parseInt(el.dataset.target, 10);
    const duration = 2000;
    const step     = target / (duration / 16);
    let current    = 0;
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

/* ── GSAP ANIMATIONS (runs after full page load so layout is complete) ── */
window.addEventListener('load', () => {
  if (typeof gsap === 'undefined') return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  /* Hero entrance — eyebrow, tagline, scroll chevron (headline is CSS-animated marquee) */
  if (document.querySelector('.v-hero-eyebrow')) {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.from('.v-hero-eyebrow', { opacity: 0, y: 20, duration: 0.6 }, 0.2)
      .from('.v-hero-tagline', { opacity: 0, y: 20, duration: 0.6 }, 0.5)
      .from('.v-hero-scroll',  { opacity: 0, y: 12, duration: 0.5 }, 0.8);
  }

  /* Marquee — scrollWidth is accurate after load */
  const track = document.querySelector('.marquee-track');
  if (track) {
    track.style.animation = 'none';
    gsap.to(track, {
      x: -(track.scrollWidth / 2),
      ease: 'none',
      duration: 22,
      repeat: -1,
    });
  }
});
