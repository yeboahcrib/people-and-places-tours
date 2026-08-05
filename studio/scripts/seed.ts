/**
 * One-time content seed for Sprint 3A. Sources:
 * - docs/sprint-1-tour-inventory.md (corrected tour fields)
 * - docs/sprint-1-review-source-register.md + the founder's Google Business
 *   Profile Takeout export (verbatim review text, real ratings/dates)
 * - docs/people-and-places-brand-foundation.md (origin story, founder bios)
 * - docs/sprint-1-claim-register.md (site settings facts)
 *
 * Deliberately NOT seeded here: featuredTourCollection (founders still need
 * to cut the current 6 down to the approved 3-5), trustFact/cta/policy/
 * homepageSection (Sprint 3B content work, not yet drafted), and all media —
 * no real approved photography exists yet.
 *
 * Run from studio/: npx sanity exec scripts/seed.ts --with-user-token
 * Safe to re-run — every document uses a fixed _id via createOrReplace.
 */
import {getCliClient} from 'sanity/cli'

const client = getCliClient()

const trustApproved = (source: string) => ({
  source,
  verificationDate: '2026-07-25',
  permissionState: 'notRequired' as const,
  approvalState: 'approved' as const,
  publicationState: 'draft' as const,
  owner: 'Founders',
})

const trustDraft = (source: string) => ({
  source,
  verificationDate: '2026-07-25',
  permissionState: 'notRequired' as const,
  approvalState: 'draft' as const,
  publicationState: 'draft' as const,
  owner: 'Founders',
})

const STANDARD_START =
  'Pickup and drop-off from Accra or your hotel, unless a different arrangement is requested.'

type TourSeed = {
  slug: string
  title: string
  offerType: 'day' | 'tailoredMultiDay'
  duration: string
  locations: string[]
  price: number
  groupSizeMax: number
  groupSizeNote?: string
  description: string
  culturalContext?: string
  categories: string[]
  vibes: string[]
  destination: string
  commandSummary: string
  included?: string[]
}

const tours: TourSeed[] = [
  {
    slug: 'just-go-ghana',
    title: 'Just Go Ghana',
    offerType: 'tailoredMultiDay',
    duration: '8 Days / 7 Nights',
    locations: ['Accra', 'Cape Coast', 'Elmina', 'Kumasi', 'Kakum National Park', 'Volta Lake'],
    price: 3000,
    groupSizeMax: 12,
    groupSizeNote:
      'Larger community/reunion groups by arrangement, up to 30 — the largest group hosted to date.',
    description:
      'The ultimate Ghana experience. Accra, Cape Coast castles, Elmina, Kumasi market, Kakum canopy walk, Volta Lake, and more - fully guided.',
    culturalContext:
      'An immersive 8-day Ghana journey with culture, nature, heritage, accommodation, meals, local guides, and airport transfers handled for you.',
    categories: ['multi-day', 'culture', 'adventure', 'nature', 'relaxation'],
    vibes: ['Multi-Day', 'Culture', 'Adventure'],
    destination: 'accra',
    commandSummary: 'Accra, Cape Coast, Kumasi, Volta Lake, culture and nature',
    included: ['Pickup and drop-off from Accra or your hotel'],
  },
  {
    slug: 'accra-city',
    title: 'Accra City Tour',
    offerType: 'day',
    duration: 'Half Day',
    locations: ['Accra'],
    price: 100,
    groupSizeMax: 8,
    description:
      'Independence Square, Kwame Nkrumah Memorial, the vibrant Makola market, Labadi Beach, and the best local chop bars.',
    culturalContext:
      'Visit Makola Market, the National Museum, Kwame Nkrumah Mausoleum, and the historic Jamestown lighthouse in one epic half-day circuit.',
    categories: ['culture'],
    vibes: ['Culture', 'History'],
    destination: 'accra',
    commandSummary: 'Makola Market, Kwame Nkrumah Mausoleum, Jamestown',
  },
  {
    slug: 'jamestown',
    title: 'Jamestown Heritage Walk',
    offerType: 'day',
    duration: '4 Hours',
    locations: ['Accra (Jamestown)'],
    price: 85,
    groupSizeMax: 10,
    description:
      'A heritage walk through old Accra with murals, boxing gyms, lighthouse views, fishing boats, and stories no guidebook captures.',
    culturalContext:
      "Stroll through one of Accra's oldest and most vibrant neighborhoods. Murals, boxing gyms, fishermen, and the iconic lighthouse await.",
    categories: ['culture', 'heritage'],
    vibes: ['Culture', 'Walking'],
    destination: 'accra',
    commandSummary: 'Lighthouse, Bukom, fishing boats, murals',
  },
  {
    slug: 'accra-food',
    title: 'Accra After Dark Food Tour',
    offerType: 'day',
    duration: 'Evening',
    locations: ['Accra'],
    price: 110,
    groupSizeMax: 8,
    description:
      'Discover Accra after dark through waakye stalls, kelewele vendors, rooftop bars, chop bars, and night markets.',
    culturalContext:
      "From waakye stalls to kelewele vendors and rooftop bars - taste Accra's legendary food scene as the city lights up at night.",
    categories: ['food', 'culture'],
    vibes: ['Foodie', 'Nightlife'],
    destination: 'accra',
    commandSummary: 'Waakye, kelewele, chop bars, night markets',
  },
  {
    slug: 'cape-coast',
    title: 'Cape Coast Ancestral Tour',
    offerType: 'day',
    duration: 'Full Day',
    locations: ['Cape Coast', 'Elmina', 'Kakum National Park'],
    price: 160,
    groupSizeMax: 12,
    description:
      'Walk the Door of No Return. Explore Cape Coast Castle, Elmina, and the Kakum National Park canopy walkway.',
    culturalContext:
      'Cape Coast Castle, the dungeon, and the Door of No Return. A deeply emotional, historically profound journey into a complex legacy.',
    categories: ['culture', 'heritage'],
    vibes: ['Heritage', 'History'],
    destination: 'cape-coast',
    commandSummary: 'Castle, Door of No Return, canopy walkway',
  },
  {
    slug: 'elmina',
    title: 'Elmina Castle & Fishing Village',
    offerType: 'day',
    duration: 'Full Day',
    locations: ['Cape Coast area (Elmina)'],
    price: 130,
    groupSizeMax: 12,
    description:
      'Walk the oldest European building in sub-Saharan Africa and visit a living fishing community full of color and history.',
    culturalContext:
      "Africa's oldest European building and the vibrant Elmina fishing community - a perfect blend of history and everyday Ghanaian life.",
    categories: ['culture', 'heritage'],
    vibes: ['Heritage', 'History'],
    destination: 'cape-coast',
    commandSummary: 'Elmina Castle, fishing village, heritage',
  },
  {
    slug: 'kumasi',
    title: 'Kumasi Cultural Immersion',
    offerType: 'day',
    // Corrected: tours.js said "2 Days" but kumasi-tour.html (authoritative)
    // says "1 Day" in two places, with an optional priced overnight add-on.
    duration: '1 Day',
    locations: ['Kumasi'],
    price: 250,
    groupSizeMax: 10,
    description:
      'Journey into the proud heart of the Ashanti Kingdom with markets, palaces, weaving villages, and rich cultural traditions.',
    culturalContext:
      "The Ashanti Kingdom's beating heart - Manhyia Palace, Kejetia Market, Kente weaving villages, and the rich traditions of the Ashanti people. An overnight stay in Kumasi can be arranged as a priced add-on at booking.",
    categories: ['culture'],
    vibes: ['Culture', 'Craft'],
    destination: 'kumasi',
    commandSummary: 'Manhyia Palace, Kejetia Market, Kente villages',
  },
  {
    slug: 'kente',
    title: 'Kente Weaving Village',
    offerType: 'day',
    duration: 'Full Day',
    locations: ['Kumasi (Bonwire)'],
    price: 115,
    groupSizeMax: 8,
    description:
      'Visit Bonwire, watch master weavers at work, learn the symbolism of each pattern, and try weaving yourself.',
    culturalContext:
      'Visit Bonwire, the spiritual home of Kente weaving. Watch master weavers at work, learn the symbolism of each pattern, and take home a piece of Ghana.',
    categories: ['culture', 'craft'],
    vibes: ['Craft', 'Culture'],
    destination: 'kumasi',
    commandSummary: 'Bonwire, weaving, symbols, artisan craft',
  },
  {
    slug: 'ada-foah',
    title: 'Ada Foah Beach & Canoe Safari',
    offerType: 'day',
    duration: 'Full Day',
    locations: ['Ada Foah'],
    price: 150,
    groupSizeMax: 15,
    description:
      'Where the Volta River meets the Atlantic Ocean. Kayak the estuary, relax on pristine beaches, and spot sea turtles.',
    culturalContext:
      "Where the Volta River meets the Atlantic. Glide through mangroves, spot river birds, and unwind on one of Ghana's most beautiful beaches.",
    categories: ['relaxation', 'nature'],
    vibes: ['Beach', 'Nature'],
    destination: 'ada-foah',
    commandSummary: 'Volta River, Atlantic beach, canoe safari',
  },
  {
    slug: 'quad-bike',
    title: 'Quad Bike & Waterfalls',
    offerType: 'day',
    duration: 'Full Day',
    locations: ['Volta Region'],
    price: 130,
    groupSizeMax: 8,
    description:
      "Rip through forest trails on quad bikes, then cool off under powerful waterfalls for Ghana's wildest day out.",
    culturalContext:
      "Rip through forest trails on quad bikes, then cool off under the powerful Boti or Wli waterfalls. Ghana's wildest day out.",
    categories: ['adventure', 'nature'],
    vibes: ['Adventure', 'Thrills'],
    destination: 'volta',
    commandSummary: 'Quad biking, waterfalls, forest trails',
  },
  {
    slug: 'volta',
    title: 'Wli Waterfalls Hike',
    offerType: 'day',
    duration: 'Full Day',
    locations: ['Volta Region'],
    price: 180,
    groupSizeMax: 12,
    description:
      "Cruise along the Volta, hike to Ghana's highest waterfall at Wli, and experience the lush greenery of the Eastern Volta Region.",
    culturalContext:
      "West Africa's highest waterfall is breathtaking. A guided jungle hike brings you through butterfly gardens and bat colonies to the roaring falls.",
    categories: ['nature', 'adventure'],
    vibes: ['Adventure', 'Nature'],
    destination: 'volta',
    commandSummary: 'Wli Waterfalls, Volta Region, guided hike',
  },
  {
    slug: 'shai-hills',
    title: 'Shai Hills & Boat Cruise',
    offerType: 'day',
    duration: 'Full Day',
    locations: ['Accra Area'],
    price: 130,
    groupSizeMax: 10,
    description:
      "Trek through Ghana's most accessible game reserve. Spot baboons, antelopes, and ostriches in the wild just outside Accra.",
    culturalContext:
      'Wildlife reserve safari, baboon encounters, crocodile sightings, and a sunset boat cruise on the Volta River. One day, everything.',
    categories: ['adventure', 'nature'],
    vibes: ['Nature', 'Wildlife'],
    destination: 'accra',
    commandSummary: 'Wildlife reserve, baboons, boat cruise',
  },
  {
    slug: 'aburi',
    title: 'Aburi Day Tour',
    offerType: 'day',
    duration: 'Full Day',
    locations: ['Aburi Hills'],
    price: 100,
    groupSizeMax: 15,
    description:
      'Escape Accra for cool Aburi hills, botanical gardens, cocoa history, waterfalls, and scenic views.',
    culturalContext:
      'Escape the Accra heat to the lush Aburi Botanical Gardens in the hills. Cool air, exotic trees, and panoramic views of the plains below.',
    categories: ['nature', 'relaxation'],
    vibes: ['Nature', 'Relaxation'],
    destination: 'accra',
    commandSummary: 'Botanical Gardens, hill views, cocoa farm',
  },
  {
    slug: 'akosombo',
    title: 'Akosombo Dam & Lake Volta Cruise',
    offerType: 'day',
    duration: 'Full Day',
    locations: ['Akosombo'],
    price: 110,
    groupSizeMax: 12,
    description: 'Visit the engineering marvel of Akosombo Dam and cruise the calm waters of Lake Volta.',
    culturalContext:
      "Tour the iconic Akosombo Hydroelectric Dam, then board a boat on Lake Volta - one of the world's largest man-made lakes - for a serene cruise.",
    categories: ['nature', 'history'],
    vibes: ['Nature', 'History'],
    destination: 'akosombo',
    commandSummary: 'Akosombo Dam, Lake Volta, boat cruise',
  },
  {
    slug: 'batik-workshop',
    title: 'Batik & Pottery Workshop',
    offerType: 'day',
    duration: '1 Day',
    locations: ['Accra'],
    price: 120,
    groupSizeMax: 8,
    description:
      'Learn batik fabric-making and pottery from master artisans, then take home a piece you made yourself.',
    culturalContext:
      "Get hands-on with Ghana's craft traditions. Learn batik fabric-making and pottery from master artisans and take home a unique piece you made yourself.",
    categories: ['culture', 'craft'],
    vibes: ['Craft', 'Workshop'],
    destination: 'accra',
    commandSummary: 'Batik, pottery, artisan workshop',
  },
]

type ReviewSeed = {
  id: string
  reviewerName: string
  sourceText: string
  selectedExcerpt?: string
  reviewDate: string
  hostsNamed?: string[]
  relatedExperienceSlug?: string
  approved: boolean
}

const reviews: ReviewSeed[] = [
  {
    id: 'review-cynthia-muldrow',
    reviewerName: 'Cynthia Muldrow',
    sourceText:
      'Our family had a deeply moving and unforgettable experience visiting Assin Manso Slave River Site and Cape Coast Castle with Kojo from People & Places Tours. This was not just a tour — it was emotional, educational, spiritual, and incredibly meaningful for all of us.\nAt Assin Manso, we learned the history of the "Last Bath" — where enslaved Africans were brought before being sold and transported. Walking to the river and standing in that space was powerful beyond words. Our guide led a beautiful moment of reflection, prayer, and connection with our ancestors. We shared blessings with one another as a family, centered on love, remembrance, and resilience. It was heavy, but also healing and grounding.\nAfterward, Kojo arranged lunch for us at Lemon Beach Resort, where we shared a birthday celebration for my son— a joyful pause in the middle of a very emotional day — and everything was handled smoothly.\nCape Coast Castle was equally powerful and heartbreaking. Walking through the dungeons, learning the history, and physically standing in those spaces brought the reality into focus in a way no book or documentary ever could. When the lights were turned off in the dungeon, it was overwhelming — many of us were in tears. We also held a moment of prayer and song to honor those who suffered and those who survived. Kojo arranged for our family to lay a wreath with our family name, which was incredibly meaningful and something we will never forget.\nThroughout the entire experience, Kojo was patient, knowledgeable, and compassionate. Our guide at the castle understood the emotional weight of these sites and gave us space to process while also sharing important history and context. Just as important, Kojo made sure everything was accessible and manageable for me, which meant a great deal to our family.\nWe have wanted to visit Cape Coast Castle for many years, and we are so deeply grateful that this experience happened with such care and intention. If you are looking for a company who is thoughtful, organized, culturally grounded, and truly invested in your experience, People & Places Tours is the one to book.',
    selectedExcerpt:
      'This was not just a tour — it was emotional, educational, spiritual, and incredibly meaningful for all of us.',
    reviewDate: '2026-02-12',
    hostsNamed: ['Kojo'],
    relatedExperienceSlug: 'cape-coast',
    approved: true,
  },
  {
    id: 'review-louis-cameron',
    reviewerName: 'Louis Cameron',
    sourceText:
      'We had an incredible experience with People & Places Tours. Our guide, Kojo, was incredible! My family and I did the city tour by car, and it was one of the best ways we could have possibly been introduced to Accra and Ghanaian history and culture.\n\nWe visited the W.E.B. Du Bois Center, the Arts Centre, Black Star Square, Makola Market, and the Kwame Nkrumah Memorial, where we learned about Ghana\'s first president and his impact. Each stop was meaningful and educational. The tour was filled with history, context, and cultural connection — especially the ties between Ghana and the African diaspora — and we learned so many things we had never been taught before.\n\nKojo is an outstanding guide — knowledgeable, patient, and genuinely passionate about sharing Ghana with visitors. During the planning stages, he answered all of my many questions ahead of time and during the tour, explained everything to us clearly, and made the entire experience easy and customizable.\n\nWhat meant the most to me personally was how intentional he was about accessibility and comfort for my mom. He made sure she was supported at every stop and that getting around was manageable and smooth for her. That level of care did not go unnoticed.\n\nPeople & Places Tours brings pride, warmth, and joy to their work, and it shows. We are truly grateful for the experience and highly recommend this tour to anyone visiting Accra who wants a rich, well-guided introduction to the city.',
    selectedExcerpt: 'People & Places Tours brings pride, warmth, and joy to their work.',
    reviewDate: '2026-02-07',
    hostsNamed: ['Kojo'],
    relatedExperienceSlug: 'accra-city',
    approved: true,
  },
  {
    id: 'review-jacoya-miller',
    reviewerName: 'Jacoya Miller',
    sourceText:
      '10/10! Loved my entire experience. I really appreciated how accommodating they were especially since this was a very last minute booking during a busy time. Even with short notice, everything was handled smoothly and without any stress which honestly says a lot. Communication was clear pickup was on time the ride to Aqua Safari was comfortable and I liked that everything was already arranged. The resort is beautiful relaxing so many amenities and things to do. We had time to walk around take photos enjoy the water. The owner and his team were professional and very present the entire time.',
    reviewDate: '2026-02-01',
    approved: false,
  },
  {
    id: 'review-ben-nwokeleme',
    reviewerName: 'Ben Nwokeleme',
    sourceText:
      'They are the best! They provide exceptional customer service and are very timely and friendly. I highly recommend them for anyone taking a trip to Ghana.',
    reviewDate: '2025-10-13',
    approved: false,
  },
  {
    id: 'review-precious-nwokeleme',
    reviewerName: 'Precious Nwokeleme',
    sourceText:
      'It was a wonderful experience in Ghana. People and Places took care of everything and planned an excellent itinerary. We laughed and made wonderful memories. They were also willing to work within our budget and make the necessary adjustments to make the trip worthwhile. My favorite part was definitely the food. If you are planning a trip to Ghana, definitely look them up.',
    reviewDate: '2025-10-11',
    approved: false,
  },
  {
    id: 'review-tamaro-diallo',
    reviewerName: 'Tamaro Diallo',
    sourceText:
      "Our best trip in a long time! We discovered P&P through Melanin Travel Magic, and from start to finish, we didn't have to worry about a thing — just enjoy the moment. The P&P crew took care of us like royalty from the moment we landed to the day we flew back home. They were respectful, kind, reliable, genuinely funny — and incredibly resourceful when things didn't go as planned. I highly recommend them — 100%.",
    reviewDate: '2025-05-29',
    approved: false,
  },
  {
    id: 'review-shy-osler',
    reviewerName: 'Shy osler',
    sourceText:
      'The tag team who runs and operates the brand People & Places, Kojo & Nana… they hands down score high in my book! 5 out of 5 stars without hesitation. They were dynamic in every way. Communication was excellent and they were very flexible in terms of making sure to deliver only what I wanted on my tour of Ghana. They truly make your cultural experience of Ghana special to you as an individual. But of course you have to bring good vibes too. Your trip to Ghana will only be what you make it, it\'s not all on the guides. People & Places were very present, on time for pick ups, well informed about Ghana, they recommend restaurants and activities, the payment for tour services was safe and uncomplicated and overall my experience felt seamless. I would and will use People & Places tour services again.',
    selectedExcerpt:
      'The tag team who runs and operates the brand People & Places, Kojo & Nana… they hands down score high in my book!',
    reviewDate: '2025-03-21',
    hostsNamed: ['Kojo', 'Nana'],
    approved: true,
  },
  {
    id: 'review-heather-harlin',
    reviewerName: 'Heather Harlin',
    sourceText:
      "An Unforgettable Experience with Exceptional Hospitality\n\nI recently had the pleasure of going on the City Tour with People and Places and I can confidently say it was one of the best travel experiences I've had! From start to finish, everything was meticulously organized and well thought out, making it seamless and stress-free.\nThe highlight of the tour was undoubtedly the hospitality. My tour guide Nana Yeboah was not only knowledgeable but also warm and genuinely passionate about sharing his expertise. He went above and beyond to make me feel welcome, ensuring I was comfortable and engaged throughout the entire experience.\nThe itinerary was well-paced, offering a perfect balance of sightseeing and interactions. The local insights provided by Nana added so much depth to my experience. I truly felt immersed in the culture and history of each destination!!\n\nOverall, this tour was an awesome experience made even better by the wonderful hospitality and thoughtful attention to every aspect. I highly recommend it to anyone looking to explore with a company that truly values its guests!",
    selectedExcerpt:
      'My tour guide Nana Yeboah was not only knowledgeable but also warm and genuinely passionate about sharing his expertise.',
    reviewDate: '2025-01-08',
    hostsNamed: ['Nana Yeboah'],
    relatedExperienceSlug: 'accra-city',
    approved: true,
  },
  {
    id: 'review-myra-mirabel-aboagye',
    reviewerName: 'Myra Mirabel Aboagye',
    sourceText:
      "I was very delighted to share my Cape Coast experience with People & Places Tours and i wouldn't want to have it in any other way. From the minute I requested this solo trip (1 day before - so very short notice) to the second i was dropped off at home, I felt safe, protected and well taken care of. The reason why I give 5 Stars is simply because after a night i am still amazed by the Service and i have already told everyone around me. Booking this tour i definitely got the value for the money i paid and it was worth every penny. Evans was very helpful and hospitabel by assisting me in taking pictures, explaining history to me and making sure I am good. His time management was very good as well, neither did he rush me nor did he delay me. I am grateful to God that i chose to do this with People & Places and i would do this over and over again. I recommend it not only to my close friends, or family members, but to everyone reading this!\nThank you.",
    reviewDate: '2024-05-08',
    hostsNamed: ['Evans'],
    relatedExperienceSlug: 'cape-coast',
    approved: false,
  },
  {
    id: 'review-iga-gawronska',
    reviewerName: 'Iga Gawronska',
    sourceText:
      "When I think of my memories from Ghana, the trip with People and Places to the Shai hills and Lake Volta is right there at the top. Quojo and the team have set up an incredible trip. The experience of planning and booking all the way till the end of the trip was super professional and high quality. During the trip, you could feel the warmth and passion at every step of the way, and that's completely contagious for the group! They even go the extra mile of taking professional pictures of you which is a lovely detail. If I could go back I would book 3 days not 1!",
    reviewDate: '2024-02-26',
    hostsNamed: ['Kojo'],
    relatedExperienceSlug: 'shai-hills',
    approved: false,
  },
  {
    id: 'review-abre-conner',
    reviewerName: 'Abre Conner',
    sourceText: '',
    reviewDate: '2024-01-11',
    approved: false,
  },
  {
    id: 'review-sonora',
    reviewerName: 'Sonora',
    sourceText:
      'Samuel is an Awesome Guide his escorts are the best! He was very knowledgeable of Ghanaian history which enhanced the entire experience! Thank you Samuel! Thank You People and Places!',
    reviewDate: '2023-12-31',
    hostsNamed: ['Samuel'],
    approved: false,
  },
  {
    id: 'review-denise-collins',
    reviewerName: 'Denise Collins',
    sourceText:
      "I had an amazing time with People and Places! I loved every moment of my four days tour, The itinerary was well-planned, the accommodations were top-notch, and the group dynamics were fantastic. Also, the guides were knowledgeable and the destinations were breathtaking, I can't wait for my next adventure with them! Highly recommend them whenever you visit Ghana!",
    reviewDate: '2023-08-11',
    approved: false,
  },
  {
    id: 'review-eman-c',
    reviewerName: 'Eman C',
    sourceText:
      'Kojo & the team helped to make our experience at Shai hills special one. They ensured the day was carefully planned and were very friendly, so it felt as if you had known them your whole life. I would highly recommend.',
    selectedExcerpt: 'it felt as if you had known them your whole life.',
    reviewDate: '2023-07-11',
    hostsNamed: ['Kojo'],
    relatedExperienceSlug: 'shai-hills',
    approved: false,
  },
  {
    id: 'review-shirley-borah',
    reviewerName: 'Shirley Borah',
    sourceText:
      'The tours are unforgettable, guides were amazing. I feel like I got more than I paid for. Great experience',
    reviewDate: '2023-07-11',
    approved: false,
  },
]

async function seed() {
  console.log('Seeding tours...')
  for (const t of tours) {
    await client.createOrReplace({
      _id: `tour-${t.slug}`,
      _type: 'tour',
      slug: {_type: 'slug', current: t.slug},
      title: t.title,
      offerType: t.offerType,
      active: true,
      duration: t.duration,
      locations: t.locations,
      startingPoint: STANDARD_START,
      groupSizeMin: 1,
      groupSizeMax: t.groupSizeMax,
      groupSizeNote: t.groupSizeNote,
      included: t.included ?? [],
      excluded: [],
      availabilityNote: 'Available any day with advance notice.',
      price: t.price,
      currency: 'USD',
      priceUnit: 'Per Person',
      description: t.description,
      culturalContext: t.culturalContext,
      categories: t.categories,
      vibes: t.vibes,
      destination: t.destination,
      commandSummary: t.commandSummary,
    })
    console.log(`  ✓ tour-${t.slug}`)
  }

  console.log('Seeding reviews...')
  for (const r of reviews) {
    await client.createOrReplace({
      _id: r.id,
      _type: 'review',
      reviewerName: r.reviewerName,
      sourceText: r.sourceText,
      selectedExcerpt: r.selectedExcerpt,
      rating: 5,
      platform: 'Google',
      reviewDate: r.reviewDate,
      relatedExperience: r.relatedExperienceSlug
        ? {_type: 'reference', _ref: `tour-${r.relatedExperienceSlug}`}
        : undefined,
      hostsNamed: r.hostsNamed ?? [],
      trust: r.approved
        ? trustApproved('Google Business Profile Takeout export, reviews.json')
        : trustDraft('Google Business Profile Takeout export, reviews.json'),
    })
    console.log(`  ✓ ${r.id}`)
  }

  console.log('Seeding guest story...')
  await client.createOrReplace({
    _id: 'guestStory-cynthia-muldrow',
    _type: 'guestStory',
    guestName: 'Cynthia Muldrow',
    headline: 'A family homecoming at Cape Coast',
    storyText:
      'A family visit to the Assin Manso Slave River Site and Cape Coast Castle, guided by Kojo — a moment of reflection, prayer and remembrance, followed by a family wreath-laying at the castle. "This was not just a tour — it was emotional, educational, spiritual, and incredibly meaningful for all of us."',
    relatedTour: {_type: 'reference', _ref: 'tour-cape-coast'},
    relatedReview: {_type: 'reference', _ref: 'review-cynthia-muldrow'},
    trust: trustApproved('Google Business Profile Takeout export, reviews.json; Brand Foundation §25 permission confirmation'),
  })
  console.log('  ✓ guestStory-cynthia-muldrow')

  console.log('Seeding founder profiles...')
  await client.createOrReplace({
    _id: 'founder-isaac-yeboah',
    _type: 'founderProfile',
    name: 'Isaac Yeboah',
    preferredName: 'Nana Yeboah',
    role: 'Co-founder and Tech Lead',
    languages: ['English', 'Twi', 'Ga', 'Hausa (some)'],
    background:
      'Information technology, digital media, marketing, hospitality, business analysis and process improvement. His photography was featured by BET Music during Afrochella 2019.',
    bio: 'Isaac represents visual storytelling, connection and the bridge between Ghana and the diaspora.',
    isFounder: true,
  })
  console.log('  ✓ founder-isaac-yeboah')

  await client.createOrReplace({
    _id: 'founder-evans-yirenkyi',
    _type: 'founderProfile',
    name: 'Evans Yirenkyi',
    preferredName: 'Kojo',
    role: 'Co-founder and Manager',
    languages: ['English', 'Twi', 'Fante'],
    background:
      'Communication Studies and Public Relations, with more than five years of experience across hospitality, tourism, destination storytelling, event marketing, customer experience and tour operations.',
    bio: 'Kojo represents cultural interpretation, guest care and the on-the-ground hosting experience.',
    isFounder: true,
  })
  console.log('  ✓ founder-evans-yirenkyi')

  console.log('Seeding origin story...')
  await client.createOrReplace({
    _id: 'originStory',
    _type: 'originStory',
    headline: 'Why We Started People & Places',
    shortVersion:
      'People & Places was founded in 2021 by two Ghanaians who kept hearing the same question whenever they shared images from home: "I never knew Ghana looked like this." They created People & Places to tell a fuller story — first through photography and film, and then through hosted experiences that bring guests into Ghana\'s culture, history, food, landscapes and everyday life.',
    fullVersion:
      'People & Places was founded in 2021 by Isaac Yeboah and Evans Yirenkyi, two Ghanaians who knew that the Ghana they experienced every day was richer and more varied than the version many people saw from outside the country.\n\nWhen they shared photographs and videos from their travels around Ghana, people often responded with surprise: "Does Ghana really have places like this?" and "I never knew Ghana looked like this." Kojo encountered the same gap while hosting international travellers. Guests were repeatedly surprised by Ghana\'s modern life, landscapes, culture and hospitality.\n\nThose reactions revealed the problem People & Places was created to address: Ghana, and Africa more broadly, was still being understood through incomplete images and inherited stereotypes.\n\nPeople & Places began as a way to tell a fuller story through photography, film and first-hand travel. The company now creates experiences that allow guests to encounter Ghana for themselves: through its people, food, history, craft, landscapes and everyday rhythms.\n\nThe purpose is not simply to show that Ghana is beautiful. It is to replace distance with understanding and turn a visit into a lasting personal connection.',
  })
  console.log('  ✓ originStory')

  console.log('Seeding site settings...')
  await client.createOrReplace({
    _id: 'siteSettings',
    _type: 'siteSettings',
    businessName: 'People & Places',
    primaryPhone: '+233 50 367 3473',
    internationalPhone: '+1 803 477 6489',
    email: 'peopandplaces@gmail.com',
    hours: 'Monday–Friday, 9:00 a.m.–5:00 p.m.',
    responsePromise: 'Usually within one hour during business hours',
    serviceArea: 'Accra and the Adenta Municipality, with experiences across Ghana',
    instagramHandle: '@peopleand.places',
    instagramUrl: 'https://instagram.com/peopleand.places',
    googleBusinessUrl: 'https://share.google/3hMHBjwElAGuIUtcv',
  })
  console.log('  ✓ siteSettings')

  console.log('Seeding navigation...')
  await client.createOrReplace({
    _id: 'navigation',
    _type: 'navigation',
    navLinks: [
      {_type: 'navLink', _key: 'home', label: 'Home', href: 'index.html'},
      {_type: 'navLink', _key: 'about', label: 'About', href: 'about.html'},
      {_type: 'navLink', _key: 'packages', label: 'Experiences', href: 'packages.html'},
      {_type: 'navLink', _key: 'contact', label: 'Contact', href: 'contact.html'},
    ],
    footerColumns: [
      {
        _type: 'footerColumn',
        _key: 'quick-links',
        heading: 'Quick Links',
        links: [
          {_type: 'footerLink', _key: 'home', label: 'Home', href: 'index.html'},
          {_type: 'footerLink', _key: 'about', label: 'About', href: 'about.html'},
          {_type: 'footerLink', _key: 'packages', label: 'Experiences', href: 'packages.html'},
          {_type: 'footerLink', _key: 'contact', label: 'Contact', href: 'contact.html'},
        ],
      },
      {
        _type: 'footerColumn',
        _key: 'day-tours',
        heading: 'Day Tours',
        links: [
          {_type: 'footerLink', _key: 'accra-city', label: 'Accra City Tour', href: 'accra-city-tour.html'},
          {_type: 'footerLink', _key: 'cape-coast', label: 'Cape Coast & Elmina', href: 'cape-coast-tour.html'},
          {_type: 'footerLink', _key: 'kumasi', label: 'Kumasi Cultural Tour', href: 'kumasi-tour.html'},
          {_type: 'footerLink', _key: 'volta', label: 'Volta River & Wli Falls', href: 'volta-tour.html'},
          {_type: 'footerLink', _key: 'ada', label: 'Ada Foah Beach', href: 'ada-tour.html'},
          {_type: 'footerLink', _key: 'shai-hills', label: 'Shai Hills Wildlife', href: 'shai-hills-tour.html'},
          {_type: 'footerLink', _key: 'aburi', label: 'Aburi Botanical Gardens', href: 'aburi-tour.html'},
          {_type: 'footerLink', _key: 'quad-bike', label: 'Quad Bike Adventure', href: 'quad-bike-tour.html'},
          {_type: 'footerLink', _key: 'batik', label: 'Batik Workshop', href: 'batik-workshop.html'},
        ],
      },
      {
        _type: 'footerColumn',
        _key: 'get-in-touch',
        heading: 'Get in Touch',
        links: [
          {_type: 'footerLink', _key: 'email', label: 'peopandplaces@gmail.com', href: 'mailto:peopandplaces@gmail.com'},
          {_type: 'footerLink', _key: 'phone', label: '+233 50 367 3473', href: 'tel:+233503673473'},
          {_type: 'footerLink', _key: 'whatsapp', label: 'WhatsApp Us', href: 'https://wa.me/233503673473'},
        ],
      },
    ],
  })
  console.log('  ✓ navigation')

  console.log('\nDone.')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
