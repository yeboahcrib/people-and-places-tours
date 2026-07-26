(function () {
  // Claude Code handoff: edit homepage copy, links, image URLs, and section ordering here.
  // Keep visual class names in homepage-sections.js unless you are intentionally changing CSS.
  // Section keys match the approved 10-section homepage architecture in
  // docs/homepage-messaging-brief.md / studio/schemaTypes/documents/homepageSection.ts.
  window.PEOPLE_PLACES_HOME = {
    hero: {
      video: {
        src: 'https://cdn.prod.website-files.com/651d7335c96bc896d80e6981/65403a4d370634439edde7cc_1030%20(1)(1)-transcode.mp4',
      },
      headline: 'The People Make the Place.',
      sub: 'Hosted by people who grew up here. Stories, traditions and the everyday moments of the streets they call home.',
      cta: { label: 'Explore Experiences', href: 'packages.html' },
    },
    founderStory: {
      eyebrow: "Who You'll Meet",
      headline: 'Founded By Two Ghanaians Who Kept Hearing The Same Thing',
      body: 'People & Places was founded in 2021 by two Ghanaians who kept hearing the same question whenever they shared images from home: "I never knew Ghana looked like this." They created People & Places to tell a fuller story — first through photography and film, and then through hosted experiences that bring guests into Ghana\'s culture, history, food, landscapes and everyday life.',
      founders: [
        { initials: 'IY', name: 'Isaac Yeboah', preferredName: 'Nana Yeboah', role: 'Co-founder & Tech Lead' },
        { initials: 'EY', name: 'Evans Yirenkyi', preferredName: 'Kojo', role: 'Co-founder & Manager' },
      ],
      cta: { label: 'Read our full story', href: 'about.html' },
    },
    waysToExperience: {
      eyebrow: 'Ways To Experience Ghana',
      title: 'Pick Your Way In',
      intro: "Every guest arrives with a different pull — history, food, craft, adventure, or a trip that needs its own itinerary. Here's how our tours group by what actually draws people in.",
      pathways: [
        {
          title: 'Heritage & Ancestry',
          text: "Cape Coast, Elmina, Jamestown and Kumasi — the sites and stories that carry Ghana's history and its ties to the diaspora.",
          tourCount: 4,
        },
        {
          title: 'Food & City Life',
          text: 'Accra by day and after dark — markets, monuments, and the food that makes the city what it is.',
          tourCount: 2,
        },
        {
          title: 'Craft & Artisan Traditions',
          text: "Bonwire's kente looms and hands-on batik and pottery work with the people who make it.",
          tourCount: 2,
        },
        {
          title: 'Nature & Adventure',
          text: 'Waterfalls, wildlife, beaches and lakes across the Volta Region, Shai Hills, Ada Foah and Akosombo.',
          tourCount: 6,
        },
        {
          title: 'Tailored Multi-Day Journeys',
          text: 'The full Ghana story in one guided trip, built around what you actually want to see.',
          tourCount: 1,
        },
      ],
      cta: { label: 'Explore all tours', href: 'packages.html' },
    },
    availableTours: {
      eyebrow: 'Pick Your Adventure',
      title: 'Our Tours & Experiences',
      cta: { label: 'View All Tours', href: 'packages.html' },
      filters: [
        { label: 'All', value: 'all', active: true },
        { label: 'Multi-Day', value: 'multi-day' },
        { label: 'Adventure', value: 'adventure' },
        { label: 'Culture', value: 'culture' },
        { label: 'Nature', value: 'nature' },
        { label: 'Relaxation', value: 'relaxation' },
      ],
    },
    howHosted: {
      eyebrow: "How You're Hosted",
      titleLines: ['Care You Can', 'Actually Feel'],
      intro: "We're not a travel agency — we're Ghanaians who love showing the world what this country really is. Every guide is a local. Every route is personal.",
      principles: [
        {
          icon: 'pin',
          title: 'Context Before Checklists',
          text: 'We explain the history and meaning behind a place before we ever hand you a schedule.',
          proofQuote: 'This was not just a tour — it was emotional, educational, spiritual, and incredibly meaningful for all of us.',
          proofAuthor: 'Cynthia Muldrow',
        },
        {
          icon: 'heart',
          title: 'Care You Can Feel',
          text: 'From solo travelers to families, every guest gets the same attention to comfort and pace.',
          proofQuote: 'I felt safe, protected and well taken care of.',
          proofAuthor: 'Myra Mirabel Aboagye',
        },
        {
          icon: 'user-circle',
          title: 'Real Local Knowledge',
          text: 'Every guide grew up here — the routes, the people, and the stories come from lived experience, not a script.',
          proofQuote: 'During the trip, you could feel the warmth and passion at every step of the way, and that\'s completely contagious for the group!',
          proofAuthor: 'Iga Gawronska',
        },
        {
          icon: 'calendar',
          title: 'Flexible, Honest Planning',
          text: 'Plans change. We work with short notice, real budgets, and whatever shape your trip actually needs.',
          proofQuote: 'Even with short notice, everything was handled smoothly and without any stress which honestly says a lot.',
          proofAuthor: 'Jacoya Miller',
        },
      ],
    },
    guestStory: {
      eyebrow: 'A Guest Story',
      headline: 'A Family Homecoming At Cape Coast',
      body: 'A family visit to the Assin Manso Slave River Site and Cape Coast Castle, guided by Kojo — a moment of reflection, prayer and remembrance, followed by a family wreath-laying at the castle. "This was not just a tour — it was emotional, educational, spiritual, and incredibly meaningful for all of us... If you are looking for a company who is thoughtful, organized, culturally grounded, and truly invested in your experience, People & Places Tours is the one to book."',
      guestName: 'Cynthia Muldrow',
      cta: { label: 'View This Tour', href: 'cape-coast-tour.html' },
    },
    reviewsAndTrust: {
      eyebrow: 'Real Reviews',
      titleLines: ['What Our', 'Travellers Say'],
      intro: "Don't take our word for it. Here's what people who've actually done the trip have to say about travelling with People & Places.",
      heroImage: {
        src: 'https://images.unsplash.com/photo-1660675133902-acd1b057f75d?auto=format&fit=crop&w=1920&q=80',
        width: 1920,
        height: 720,
      },
      trustFacts: [
        { label: 'Founded', value: 'Ghana, 2021' },
        { label: 'Founders', value: 'Isaac Yeboah & Evans Yirenkyi' },
        { label: 'Guests Hosted', value: '300+' },
        { label: 'Google Rating', value: '5.0 (15 reviews)' },
      ],
      items: [
        {
          quote: 'Kojo is an outstanding guide — knowledgeable, patient, and genuinely passionate about sharing Ghana with visitors. People & Places Tours brings pride, warmth, and joy to their work.',
          author: 'Louis Cameron',
          location: 'Google review',
        },
        {
          quote: 'My tour guide Nana Yeboah was not only knowledgeable but also warm and genuinely passionate about sharing his expertise.',
          author: 'Heather Harlin',
          location: 'Google review',
        },
        {
          quote: 'The tag team who runs and operates the brand People & Places, Kojo & Nana… they hands down score high in my book!',
          author: 'Shy osler',
          location: 'Google review',
        },
      ],
    },
    planningProcess: {
      eyebrow: 'Simple Process',
      title: 'Three Steps to Ghana',
      intro: "From your first browse to the moment your guide meets you at the hotel — we've made the whole thing effortless.",
      steps: [
        {
          icon: 'search',
          number: '01',
          title: 'Browse & Pick Your Tour',
          text: 'Filter by destination or vibe — half-day city tours, beach escapes, heritage trips, or the full 8-day Ghana adventure.',
          cta: { label: 'View all tours →', href: 'packages.html' },
        },
        {
          icon: 'chat',
          number: '02',
          title: 'Book in Minutes',
          text: "WhatsApp us or fill the inquiry form — we usually reply within one hour during business hours. Multi-day tours are secured with a 30% deposit, balance due 30 days before your trip.",
          cta: {
            label: 'WhatsApp us →',
            href: 'https://wa.me/233503673473?text=Hi%21+I%27d+like+to+book+a+tour.',
            external: true,
          },
        },
        {
          icon: 'play',
          number: '03',
          title: 'Show Up & We Handle the Rest',
          text: 'Your local guide meets you at your hotel. Transport, entry fees, every detail — sorted. You just experience Ghana.',
        },
      ],
    },
    stories: {
      handle: '@peopleand.places',
      tagline: 'Follow along for the everyday moments between the stops.',
      cta: { label: 'Follow on Instagram', href: 'https://instagram.com/peopleand.places' },
    },
    finalInvitation: {
      eyebrow: 'Ready When You Are',
      headline: "Let's Plan Your Ghana Trip",
      body: "Tell us what you're picturing and we'll take it from there. We usually reply within one hour during business hours (Monday–Friday, 9am–5pm).",
      cta: { label: 'Start Planning', href: 'contact.html' },
      secondaryCta: {
        label: 'WhatsApp Us',
        href: 'https://wa.me/233503673473?text=Hi%21+I%27d+like+to+book+a+tour.',
        external: true,
      },
      phone: '+233 50 367 3473',
      internationalPhone: '+1 803 477 6489',
    },
  };
})();
