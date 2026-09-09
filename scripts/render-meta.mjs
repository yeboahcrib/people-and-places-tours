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
 * Adds social and canonical metadata to one page. Pages that already declare
 * og: tags are left alone, so hand-authored overrides always win.
 */
export function injectPageMeta(html, {file, siteUrl, siteName, ogImage, canonicalOverride, organization}) {
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

  const tags = [
    `<link rel="canonical" href="${escapeAttr(url)}" />`,
    `<meta property="og:type" content="${file === 'index.html' ? 'website' : 'article'}" />`,
    `<meta property="og:site_name" content="${escapeAttr(siteName)}" />`,
    `<meta property="og:title" content="${escapeAttr(title)}" />`,
    `<meta property="og:description" content="${escapeAttr(description)}" />`,
    `<meta property="og:url" content="${escapeAttr(url)}" />`,
    `<meta property="og:image" content="${escapeAttr(socialImage)}" />`,
    `<meta property="og:image:alt" content="${escapeAttr(title)}" />`,
    `<meta property="og:locale" content="en_GB" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeAttr(title)}" />`,
    `<meta name="twitter:description" content="${escapeAttr(description)}" />`,
    `<meta name="twitter:image" content="${escapeAttr(socialImage)}" />`,
  ];
  if (robotsNoindex) tags.shift();
  // Homepage only: one identity record for the site, not one per page.
  if (file === 'index.html' && organization) tags.push(organization);

  const block = tags.map(tag => `  ${tag}`).join('\n');
  if (!/<\/head>/i.test(html)) throw new Error(`${file} has no </head> to inject metadata into`);
  return html.replace(/<\/head>/i, `${block}\n</head>`);
}

/**
 * Identity markup for the homepage, and only the homepage.
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
 */
export function renderOrganizationSchema({siteUrl, settings = {}, social = {}}) {
  const sameAs = [social.instagramUrl, social.tiktokUrl].filter(Boolean);
  const data = {
    '@context': 'https://schema.org',
    '@type': 'TravelAgency',
    name: settings.businessName,
    url: `${siteUrl}/`,
    ...(settings.email ? {email: settings.email} : {}),
    ...(settings.primaryPhone ? {telephone: settings.primaryPhone} : {}),
    ...(sameAs.length ? {sameAs} : {}),
    address: {'@type': 'PostalAddress', addressCountry: 'GH'},
    areaServed: {'@type': 'Country', name: 'Ghana'},
  };
  // JSON inside a <script> must not be able to close the tag early.
  //
  // The replacement must be the two-character escape a JSON parser decodes
  // back to "<", written here as a literal backslash. Writing '\u003c' with a
  // single backslash makes JavaScript decode it at parse time, so the call
  // becomes replace('<', '<') — a no-op that reads as protection. The test
  // for this caught exactly that.
  const json = JSON.stringify(data, null, 2).replace(/</g, '\\u003c');
  return `<script type="application/ld+json">\n${json}\n</script>`;
}

export function renderSitemap(siteUrl, files, lastmod) {
  const urls = files
    .filter(file => !file.startsWith('404'))
    .sort()
    .map(file => `  <url>\n    <loc>${escapeAttr(pageUrl(siteUrl, file))}</loc>\n    <lastmod>${lastmod}</lastmod>\n  </url>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

export const renderRobots = siteUrl =>
  `User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
