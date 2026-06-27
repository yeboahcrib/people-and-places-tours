(function () {
  // Claude Code handoff: edit homepage copy, links, image URLs, and section ordering here.
  // Keep visual class names in homepage-sections.js unless you are intentionally changing CSS.
  window.PEOPLE_PLACES_HOME = {
    hero: {
      video: {
        src: 'https://cdn.prod.website-files.com/651d7335c96bc896d80e6981/65403a4d370634439edde7cc_1030%20(1)(1)-transcode.mp4',
      },
      headline: 'The People Make the Place.',
      sub: 'Hosted by people who grew up here. Stories, traditions and the everyday moments of the streets they call home.',
      cta: { label: 'Explore Experiences', href: 'packages.html' },
    },
    tours: {
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
    whyTravel: {
      eyebrow: 'Why Travel With Us',
      titleLines: ['Ghana Is Better', 'When Locals Lead'],
      intro: "We're not a travel agency — we're Ghanaians who love showing the world what this country really is. Every guide is a local. Every route is personal. Every trip leaves a mark.",
      cards: [
        {
          icon: 'pin',
          title: 'Expert Local Guides',
          text: 'Every guide is a born-and-raised Ghanaian who knows the backroads, the real spots, and the stories behind the history.',
        },
        {
          icon: 'heart',
          title: 'Stress-Free Logistics',
          text: 'Transport, accommodation, entrance fees, meals — we handle it all. You just show up and enjoy.',
        },
        {
          icon: 'users',
          title: 'Small Group Vibes',
          text: 'We keep group sizes small so you get personal attention, real conversations, and zero tourist-factory energy.',
        },
        {
          icon: 'image',
          title: 'Photo-Ready Moments',
          text: 'We know exactly where the light hits right and which angle tells the story. Your feed will never look better.',
        },
      ],
    },
    stats: [
      { target: 300, suffix: '+', label: 'Happy Travellers' },
      { target: 15, suffix: '+', label: 'Tour Experiences' },
      { target: 5, suffix: '.0', label: 'Google Rating' },
      { target: 10, suffix: '+', label: 'Destinations' },
    ],
    bookingSteps: {
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
          text: 'WhatsApp us or fill the inquiry form. We confirm your spot same day. Multi-day tours secured with a 30% deposit — pay the rest before tour day.',
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
    testimonials: {
      eyebrow: 'Real Reviews',
      titleLines: ['What Our', 'Travellers Say'],
      intro: "Don't take our word for it. Here's what people who've actually done the trip have to say about travelling with People & Places.",
      heroImage: {
        src: 'https://images.unsplash.com/photo-1660675133902-acd1b057f75d?auto=format&fit=crop&w=1920&q=80',
        width: 1920,
        height: 720,
      },
      items: [
        {
          quote: "People & Places turned what could have been a stressful trip into the best experience of my life. The guide knew every corner of Accra — we ate at spots I never would have found on my own. Cape Coast was emotional and beautiful. I'm already planning my return trip with them.",
          author: 'Precious Nwokeleme',
          location: 'Lagos, Nigeria',
          image: 'https://images.unsplash.com/photo-1725114077889-d38ea6c4487d?auto=format&fit=crop&w=160&q=80&h=160',
        },
        {
          quote: "I came to Ghana not knowing what to expect. People & Places exceeded every expectation. From the moment they picked me up at the hotel to the last sunset at Ada Foah, everything was seamless. The guides are passionate, knowledgeable, and genuinely fun to travel with.",
          author: 'Tamaro Diallo',
          location: 'Dakar, Senegal',
          image: 'https://images.unsplash.com/photo-1625191824068-e833954d6c70?auto=format&fit=crop&w=160&q=80&h=160',
        },
      ],
    },
    newsletter: {
      eyebrow: 'Newsletter',
      title: 'Trip ideas for Ghana — once a month.',
      subtitle: 'New tours, seasonal deals, and travel tips. Short emails. No spam.',
      form: {
        name: 'newsletter',
        action: 'https://formsubmit.co/peopandplaces@gmail.com',
        hiddenFields: [
          { name: '_subject', value: 'New People & Places newsletter signup' },
          { name: '_template', value: 'table' },
          { name: '_next', value: 'https://yeboahcrib.github.io/people-and-places-tours/thanks.html' },
          { name: 'source', value: 'Homepage newsletter' },
        ],
        emailPlaceholder: 'Your email address',
        submitLabel: 'Subscribe',
      },
    },
    instagram: {
      handle: '@peopleand.places',
      tagline: 'Real tours. Real people. Real Ghana.',
      cta: { label: 'Follow on Instagram', href: 'https://instagram.com/peopleand.places' },
      images: [
        'https://images.unsplash.com/photo-1712700720456-6027038e9874?auto=format&fit=crop&w=600&q=80&h=600',
        'https://images.unsplash.com/photo-1720343354398-89c6aa6d12a4?auto=format&fit=crop&w=600&q=80&h=600',
        'https://images.unsplash.com/photo-1649519764616-bacf4a942730?auto=format&fit=crop&w=600&q=80&h=600',
        'https://images.unsplash.com/photo-1590409110365-70d93eff6b4c?auto=format&fit=crop&w=600&q=80&h=600',
        'https://images.unsplash.com/photo-1721011694126-e25f493b91f1?auto=format&fit=crop&w=600&q=80&h=600',
        'https://images.unsplash.com/photo-1672537627568-3530c83694f6?auto=format&fit=crop&w=600&q=80&h=600',
      ],
    },
  };
})();
