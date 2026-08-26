(function () {
  // Homepage copy, links, image URLs and section ordering are edited here.
  // Keep visual class names in homepage-sections.js unless you are intentionally changing CSS.
  // Section keys match the approved 7-section homepage architecture in
  // docs/homepage-messaging-brief.md / studio/schemaTypes/documents/homepageSection.ts.
  window.PEOPLE_PLACES_HOME = {
    hero: {
      // TEMPORARY placeholder, like the rest of the stock imagery — replace
      // with People & Places' own photography or footage after the shoot.
      //
      // This replaced a video hotlinked from another company's server that we
      // had no confirmed right to use. Setting `video: { src, poster }` here
      // instead of `image` switches the hero back to film; the renderer
      // supports both and prefers `image`.
      image: {
        src: 'https://images.unsplash.com/photo-1660675133902-acd1b057f75d?auto=format&fit=crop&w=1920&q=80',
        width: 1920,
        height: 1280,
      },
      headline: 'The People Make the Place.',
      sub: 'Whether it\'s your first time in Ghana or your way back, you\'ll see it with people who live here.',
      cta: { label: 'See Ghana With Us', href: 'packages.html' },
    },
    founderStory: {
      eyebrow: 'The Beginning of Our Story',
      headline: 'Why We Started People & Places',
      body: 'Whenever we shared images from home, we kept hearing the same thing: “I never knew Ghana looked like this.” \n\nSo we created People & Places to share the Ghana we know: its history, food, daily rhythms, and the people who give each place its meaning.',
      founders: [
        { initials: 'IY', name: 'Isaac Yeboah', preferredName: 'Nana Yeboah', role: 'Co-founder & Tech Lead' },
        { initials: 'EY', name: 'Evans Yirenkyi', preferredName: 'Kojo', role: 'Co-founder & Manager' },
      ],
      trustNote: 'Welcoming first-time visitors and people coming home since 2021',
      cta: { label: 'Read our full story', href: 'about.html' },
    },
    tripMoments: {
      eyebrow: 'From Our Trips',
      title: 'Ghana, As Our Guests Met It',
      intro: 'Photographs from the days themselves.',
      // Each slot names the picture that belongs in it. Until a real photograph
      // is dropped in, the slot renders as a labelled placeholder rather than
      // as stock: a wall of strangers is the problem these are meant to fix.
      moments: [
        {shape: 'tall',  caption: 'A guest at Cape Coast Castle'},
        {shape: 'wide',  caption: 'Hands at the loom in Adanwomase'},
        {shape: 'tall',  caption: 'The boat on the Volta at Ada'},
        {shape: 'wide',  caption: 'A chop bar table, mid-meal'},
        {shape: 'tall',  caption: 'Nana and Kojo with a group'},
      ],
    },
    waysToExperience: {
      eyebrow: 'Where Ghana Begins For You',
      title: 'What Pulls You In?',
      intro: 'Some come for the history. Some for the food. Some to stand where their family stood.',
      pathways: [
        {
          title: 'History & Memory',
          text: 'Cape Coast, Elmina, Jamestown and Kumasi hold histories still carried in walls, streets and family stories.',
          href: 'packages.html?category=heritage',
          image: { src: 'assets/photos/pathway-heritage-cannons.jpg', width: 900, height: 900, alt: 'Cannons along the fort ramparts overlooking the Atlantic at Cape Coast' },
        },
        {
          title: 'Food & Everyday Life',
          text: 'Markets in the morning, chop bars after dark, and the people who know exactly where to find the best plate in Accra.',
          href: 'packages.html?category=food',
          image: { src: 'assets/photos/pathway-food-city-jamestown.jpg', width: 675, height: 900, alt: 'Everyday street life near Jamestown, Accra' },
        },
        {
          title: 'Nature & Stillness',
          text: 'Waterfalls, forest paths, quiet beaches, and the slower rhythm of life beyond the city.',
          href: 'packages.html?category=nature',
          image: { src: 'assets/photos/pathway-nature-kakum.jpg', width: 720, height: 900, alt: 'Guests on the Kakum National Park canopy walkway' },
        },
        {
          title: 'Adventure',
          text: 'Canopy walks, mountain trails, quad bikes, and the kind of days that leave dust on your shoes.',
          href: 'packages.html?category=adventure',
          image: { src: 'https://images.unsplash.com/photo-1636389396809-c3ab57b60d93?auto=format&fit=crop&w=1000&q=82&h=760', width: 1000, height: 760, alt: 'Quad bike adventure through forest trails in Ghana' },
        },
        {
          title: 'Craft & Tradition',
          text: 'Kente, batik, and pottery learned beside the makers who continue these traditions by hand.',
          href: 'packages.html?category=craft',
          image: { src: 'https://images.unsplash.com/photo-1720343354398-89c6aa6d12a4?auto=format&fit=crop&w=1000&q=82&h=760', width: 1000, height: 760, alt: 'Kente weaving and artisan traditions in Ghana' },
        },
        {
          title: 'The Longer Story',
          text: 'Take a few days to connect the coast, cities, food, and history, with enough time to let Ghana unfold.',
          href: 'packages.html?category=multi-day',
          image: { src: 'assets/photos/pathway-multiday-group.jpg', width: 675, height: 900, alt: 'A guest group celebrating together after a multi-day Ghana trip' },
        },
      ],
      cta: { label: 'Find Your Way Into Ghana', href: 'packages.html' },
    },
    reviewsAndTrust: {
      eyebrow: 'Real Reviews',
      titleLines: ['What Our', 'Travellers Say'],
      intro: 'From people we’ve welcomed across Ghana.',
      heroImage: {
        src: 'assets/photos/reviews-trust-banner.jpg',
        width: 1120,
        height: 1400,
        alt: 'A group of guests celebrating together at a Ghana heritage site',
      },
      // The Google rating is the strongest signal in this section, so it is
      // pulled out as its own anchor rather than competing as one cell in a
      // four-up row. The founders' names moved out: they are an About fact,
      // not review credibility, and the long value was the reason the row's
      // labels never sat on a shared baseline.
      ratingSummary: {
        value: '5.0',
        source: 'Google',
        count: 15,
        // `stick` anchors the search to this business's own knowledge panel
        // rather than to whatever a text search happens to surface. The session
        // parameters that came with it (sxsrf, ved, sca_esv) are deliberately
        // dropped: they identify a Google session, not a business.
        href: 'https://www.google.com/search?q=People+%26+Places+Tours&stick=H4sIAAAAAAAAAONgU1I1qEg0MzNOMTQxNrdMM7U0TTO0MqhINUozTDYxNjY1SU42SzYyWcQqGpCaX5CTqqCmEJCTmJxarBCSX1pUDAAgUN00QQAAAA',
      },
      trustFacts: [
        { label: 'Guests Hosted', value: '300+' },
        { label: 'Hosting Locally Since', value: '2021' },
      ],
      items: [
        {
          quote: 'People & Places Tours brings pride, warmth, and joy to their work.',
          author: 'Louis Cameron',
          location: 'Verified Google review',
          date: '2026-02-07',
          rating: 5,
        },
        {
          quote: 'They provide exceptional customer service and are very timely and friendly.',
          author: 'Ben Nwokeleme',
          location: 'Verified Google review',
          date: '2025-10-13',
          rating: 5,
        },
        {
          quote: 'People and Places took care of everything and planned an excellent itinerary. We laughed and made wonderful memories.',
          author: 'Precious Nwokeleme',
          location: 'Verified Google review',
          date: '2025-10-11',
          rating: 5,
        },
        {
          quote: 'The P&P crew took care of us like royalty from the moment we landed to the day we flew back home.',
          author: 'Tamaro Diallo',
          location: 'Verified Google review',
          date: '2025-05-29',
          rating: 5,
        },
        {
          quote: 'The tag team who runs and operates the brand People & Places, Kojo & Nana… they hands down score high in my book!',
          author: 'Shy osler',
          location: 'Verified Google review',
          date: '2025-03-21',
          rating: 5,
        },
        {
          quote: 'My tour guide Nana Yeboah was not only knowledgeable but also warm and genuinely passionate about sharing his expertise.',
          author: 'Heather Harlin',
          location: 'Verified Google review',
          date: '2025-01-08',
          rating: 5,
        },
        {
          quote: 'Samuel is an Awesome Guide his escorts are the best! He was very knowledgeable of Ghanaian history which enhanced the entire experience!',
          author: 'Sonora',
          location: 'Verified Google review',
          rating: 5,
        },
        {
          quote: 'The itinerary was well-planned, the accommodations were top-notch, and the group dynamics were fantastic.',
          author: 'Denise Collins',
          location: 'Verified Google review',
          rating: 5,
        },
        {
          quote: 'it felt as if you had known them your whole life.',
          author: 'Eman C',
          location: 'Verified Google review',
          rating: 5,
        },
        {
          quote: 'The tours are unforgettable, guides were amazing. I feel like I got more than I paid for.',
          author: 'Shirley Borah',
          location: 'Verified Google review',
          rating: 5,
        },
      ],
    },
    planningProcess: {
      eyebrow: 'From Dream to Departure',
      title: 'Your Journey in Three Steps',
      steps: [
        {
          icon: 'search',
          number: '01',
          title: 'Tell Us About Your Trip',
          text: 'Share your travel dates, interests, and the pace that feels right for you.',
        },
        {
          icon: 'chat',
          number: '02',
          title: 'We’ll Design Your Journey',
          text: 'We’ll put together an itinerary that fits your interests, comfort, and time.',
        },
        {
          icon: 'play',
          number: '03',
          title: 'Experience Ghana Like a Local',
          text: 'Arrive knowing your host is ready to welcome you and share Ghana as they know it.',
        },
      ],
    },
    finalInvitation: {
      eyebrow: 'Ready When You Are',
      headline: 'Ready to See Ghana With People Who Live Here?',
      cta: { label: 'Start Planning', href: 'contact.html' },
      secondaryCta: {
        label: 'Chat on WhatsApp',
        href: 'https://wa.me/233503673473?text=Hi%21+I%27d+like+to+book+a+tour.',
        external: true,
      },
    },
  };
})();
