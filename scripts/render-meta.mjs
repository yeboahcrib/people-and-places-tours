// Build-time SEO and social metadata.
//
// Open Graph, Twitter and canonical tags were absent from all 20 pages, so a
// link shared to WhatsApp or Instagram rendered as a bare URL. Rather than
// paste fifteen lines into every file and have them drift, this derives them
// from the <title> and description each page already carries. Editors keep
// maintaining one title and one description; everything else follows.
//
// The site URL is a single build variable so the production domain and any
// preview host emit correct absolute URLs without a code change. sitemap.xml
// and robots.txt read the same value.
//
// The default is the production domain so a build that omits SITE_URL degrades
// to the correct answer rather than emitting canonical tags for another host.
// Preview environments should set their own value.

export const DEFAULT_SITE_URL = 'https://peopleplacesgh.com';

const escapeAttr = value => String(value ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const decodeEntities = value => String(value ?? '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'");

export function normaliseSiteUrl(value) {
  const url = String(value || DEFAULT_SITE_URL).trim().replace(/\/+$/, '');
  if (!/^https?:\/\/[^\s"'<>]+$/.test(url)) throw new Error(`Unsafe site URL: ${url}`);
  return url;
}

// Canonical tags, Open Graph URLs and the sitemap all come through here, so
// the extension is stripped in one place. Cloudflare Pages serves /about and
// 308-redirects /about.html to it — pointing our own canonical tags and sitemap
// at the redirecting form told search engines the authoritative address was one
// that immediately bounces somewhere else.
export const pageUrl = (siteUrl, file) =>
  file === 'index.html' ? `${siteUrl}/` : `${siteUrl}/${file.replace(/\.html$/i, '')}`;

/**
 * The colour a browser paints its own chrome with, taken from the page.
 *
 * --pap-charcoal is what `.page-hero` and the footer are filled with, so the
 * browser bar continues the band it sits above instead of cutting a white
 * stripe across the top of a dark hero. It is a value the stylesheet already
 * holds; tests/seo-metadata.mjs reads style.css and fails if the two drift.
 */
export const THEME_COLOR = '#1A1A1A';

// Storyblok encodes a transform in the path, so an image already cropped for a
// link preview states its own size. Nothing is guessed: a URL that does not
// carry the crop simply ships without dimensions.
const imageDimensions = url => {
  const match = /\/m\/(\d{1,5})x(\d{1,5})\//.exec(String(url || ''));
  return match ? {width: match[1], height: match[2]} : null;
};

/**
 * Adds social and canonical metadata to one page. Pages that already declare
 * og: tags are left alone, so hand-authored overrides always win.
 *
 * `structuredData` is a function rather than a string because the record a
 * page carries is built from the same title, description, image and URL these
 * tags are, plus the finished markup. Deriving both from one set of values is
 * what stops a page from describing itself one way to a crawler and another
 * way to a link preview.
 */
export function injectPageMeta(html, {file, siteUrl, siteName, ogImage, canonicalOverride, structuredData}) {
  if (/property="og:/i.test(html)) return html;

  const title = decodeEntities((html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1] || siteName).trim();
  const description = decodeEntities(
    (html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || [])[1] || '',
  ).trim();
  const url = /^https?:\/\/[^\s"'<>]+$/.test(String(canonicalOverride || ''))
    ? canonicalOverride
    : pageUrl(siteUrl, file);
  const socialImage = /^https?:\/\/[^\s"'<>]+$/.test(String(ogImage || ''))
    ? ogImage
    : `${siteUrl}/${ogImage}`;
  // thanks.html is noindex; it should never be the canonical target of a share.
  const robotsNoindex = /name="robots"[^>]*noindex/i.test(html);
  const size = imageDimensions(socialImage);

  const tags = [
    `<link rel="canonical" href="${escapeAttr(url)}" />`,
    `<meta property="og:type" content="${file === 'index.html' ? 'website' : 'article'}" />`,
    `<meta property="og:site_name" content="${escapeAttr(siteName)}" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:url" content="${escapeAttr(url)}" />`,
    `<meta property="og:image" content="${escapeAttr(socialImage)}" />`,
    ...(size ? [
      `<meta property="og:image:width" content="${escapeAttr(size.width)}" />`,
      `<meta property="og:image:height" content="${escapeAttr(size.height)}" />`,
    ] : []),
    `<meta property="og:image:alt" content="${escapeAttr(title)}" />`,
    // en_GB, not en_GH. og:locale is a rendering hint for the platform showing
    // the preview, and its value has to be one that platform actually carries.
    // Ghana has no Open Graph locale of its own; en_GB is the supported locale
    // whose conventions Ghanaian English follows. It is not a search signal, so
    // reaching for an unsupported value would trade a working tag for nothing.
    `<meta property="og:locale" content="en_GB" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(socialImage)}" />`,
    `<meta name="twitter:image:alt" content="${escapeAttr(title)}" />`,
    `<meta name="theme-color" content="${THEME_COLOR}" />`,
  ];
  if (robotsNoindex) tags.shift();
  const record = typeof structuredData === 'function'
    ? structuredData({title, description, url, image: socialImage, html})
    : '';
  if (record) tags.push(record);

  const block = tags.map(tag => `  ${tag}`).join('\n');
  if (!/<\/head>/i.test(html)) throw new Error(`${file} has no </head> to inject metadata into`);
  return html.replace(/<\/head>/i, `${block}\n</head>`);
}

/**
 * Identity for the site, and only on the homepage.
 *
 * The site carried no structured data at all, so a search engine had to infer
 * from prose that People & Places is a Ghanaian tour operator, that the number
 * in the footer is how you reach it, and that the Instagram and TikTok accounts
 * belong to the same business. Those are facts the pages already state; this
 * states them in the form a crawler reads directly.
 *
 * Every value comes from the same siteSettings the footer and contact page
 * render, so it cannot drift from what a visitor sees, and nothing is asserted
 * that is not already published. Claims a crawler could check and find wrong —
 * ratings, prices, opening hours as structured times — are deliberately left
 * out. Those belong with a decision about what the business wants to stand
 * behind, not in a metadata pass.
 *
 * The @id is what every tour page's brand points at, so the catalogue and the
 * business read as one graph rather than thirteen unrelated sellers.
 */
export const organizationId = siteUrl => `${siteUrl}/#organization`;

export function organizationNode({siteUrl, settings = {}, social = {}}) {
  const sameAs = [social.instagramUrl, social.tiktokUrl].filter(Boolean);
  return {
    '@type': 'TravelAgency',
    '@id': organizationId(siteUrl),
    name: settings.businessName,
    url: `${siteUrl}/`,
    ...(settings.email ? {email: settings.email} : {}),
    ...(settings.primaryPhone ? {telephone: settings.primaryPhone} : {}),
    ...(sameAs.length ? {sameAs} : {}),
    address: {'@type': 'PostalAddress', addressCountry: 'GH'},
    areaServed: {'@type': 'Country', name: 'Ghana'},
  };
}

export function renderSitemap(siteUrl, files, lastmod) {
  const urls = files
    .filter(file => !file.startsWith('404'))
    .sort()
    .map(file => `  <url>\n    <loc>${escapeAttr(pageUrl(siteUrl, file))}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

// No "User-agent: *" group of our own.
//
// On the live domain Cloudflare prepends its managed block, which already
// opens with "User-agent: *", grants "Allow: /" and carries the Content-Signal
// line that reserves the site's content against AI training. A second group
// with the same token adds no rule the first does not already grant — every
// conformant parser merges them — but a parser that instead takes the last
// matching group would find ours, which has no Content-Signal, and read the
// reservation as absent. Dropping it leaves crawl permission exactly where it
// was and stops it shadowing the owner's opt-out. Sitemap is a non-group
// directive, so it stands on its own.
export const renderRobots = siteUrl =>
  '# Crawl rules for the live site come from Cloudflare\'s managed robots.txt\n'
  + '# block, prepended above this line at the edge.\n'
  + `Sitemap: ${siteUrl}/sitemap.xml\n`;
