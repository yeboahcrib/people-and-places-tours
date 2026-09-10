export function findBalancedElementEnd(html, startIndex, tagName) {
  const tokenPattern = new RegExp(`<\\/?${tagName}\\b[^>]*>`, 'gi');
  tokenPattern.lastIndex = startIndex;
  let depth = 0;
  let match;

  while ((match = tokenPattern.exec(html))) {
    const closing = match[0].startsWith('</');
    depth += closing ? -1 : 1;
    if (depth === 0) return tokenPattern.lastIndex;
  }

  throw new Error(`Could not find the closing </${tagName}> tag`);
}

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function safeNavigationHref(value) {
  const href = String(value ?? '').trim();
  if (!/^(?:[a-z0-9][a-z0-9-]*\.html(?:\?[^\s]*)?|\/[a-z0-9/_-]*)$/i.test(href)) {
    throw new Error(`Navigation contains an unsafe href: ${href}`);
  }
  return escapeHtml(href);
}

function safeFooterHref(value) {
  const href = String(value ?? '').trim();
  if (!/^(?:(?:[a-z0-9][a-z0-9-]*\.html(?:\?[^\s]*)?)|(?:mailto|tel):[^\s]+|https:\/\/[^\s]+)$/i.test(href)) {
    throw new Error(`Footer contains an unsafe href: ${href}`);
  }
  return escapeHtml(href);
}

export function renderNavigationTemplate(template, content) {
  const settings = content.siteSettings;
  const links = content.navigation.navLinks;
  const desktopLinks = links.map(link => `      <li><a href="${safeNavigationHref(link.href)}">${escapeHtml(link.label)}</a></li>`).join('\n');
  const mobileLinks = links.map(link => `    <a href="${safeNavigationHref(link.href)}">${escapeHtml(link.label)}</a>`).join('\n');
  const phoneHref = `tel:${String(settings.primaryPhone).replace(/[^+\d]/g, '')}`;

  return template
    .replaceAll('{{businessName}}', escapeHtml(settings.businessName))
    .replaceAll('{{primaryPhone}}', escapeHtml(settings.primaryPhone))
    .replaceAll('{{primaryPhoneHref}}', escapeHtml(phoneHref))
    .replace('      <!-- shared: desktop-nav-links -->', desktopLinks)
    .replace('    <!-- shared: mobile-nav-links -->', mobileLinks);
}

/**
 * The footer's social addresses. These were hardcoded in the partial and have
 * never been in Sanity, so the constant below is their source of truth rather
 * than a CMS value that would arrive undefined and leave three icons linking
 * nowhere. Storyblok may replace them; nothing else supplies them.
 */
export const FOOTER_SOCIAL_DEFAULTS = Object.freeze({
  instagramUrl: 'https://instagram.com/peopleand.places',
  tiktokUrl: 'https://tiktok.com/@peopandplaces',
  whatsappUrl: 'https://wa.me/233503673473',
});

function safeSocialHref(value, fallback) {
  const href = String(value ?? '').trim();
  if (!/^https:\/\/[^\s"']+$/i.test(href)) return escapeHtml(fallback);
  return escapeHtml(href);
}

export function renderFooterTemplate(template, content, year = new Date().getUTCFullYear()) {
  const settings = content.siteSettings;
  const navigation = content.navigation;
  const social = content.social ?? {};
  const columns = navigation.footerColumns.map(column => {
    const links = column.links.map(link => {
      const href = safeFooterHref(link.href);
      const external = /^https:/i.test(link.href) ? ' target="_blank" rel="noopener"' : '';
      return `          <li><a href="${href}"${external}>${escapeHtml(link.label)}</a></li>`;
    }).join('\n');
    return `      <div class="footer-col">\n        <h2>${escapeHtml(column.heading)}</h2>\n        <ul role="list">\n${links}\n        </ul>\n      </div>`;
  }).join('\n\n');

  let output = template
    .replaceAll('{{businessName}}', escapeHtml(settings.businessName))
    .replaceAll('{{footerTagline}}', escapeHtml(navigation.footerTagline))
    .replaceAll('{{year}}', escapeHtml(year))
    .replace('      <!-- shared: footer-columns -->', columns);
  for (const [key, fallback] of Object.entries(FOOTER_SOCIAL_DEFAULTS)) {
    output = output.replaceAll(`{{${key}}}`, safeSocialHref(social[key], fallback));
  }
  return output;
}

/**
 * Pages that ship without the navigation and footer every other page shares.
 *
 * One entry, declared here because both the build and tests/build-output.mjs
 * have to agree on it: the test asserts every other page carries exactly one
 * navigation and one footer, and a page could otherwise lose its shell without
 * anything noticing.
 */
export const SHELL_LESS_PAGES = new Set(['go.html']);

/**
 * Re-crop a Storyblok rendition without losing its focal point.
 *
 * The catalogue hands out URLs already sized for a card. /go wants the same
 * master asset at a different shape, and the focal filter is carried in the
 * part of the path after the size, so only the size segment is rewritten.
 */
function recrop(url, width, height) {
  const value = String(url ?? '');
  if (!/^https:\/\/a\.storyblok\.com\/[^\s"']+\/m\/\d+x\d+\//.test(value)) return undefined;
  return value.replace(/\/m\/\d+x\d+\//, `/m/${width}x${height}/`);
}

/**
 * The link-in-bio page at /go.
 *
 * It carries no navigation and no footer, so it cannot pick up the contact and
 * social addresses the way every other page does. This gives it the same three
 * social hrefs the footer resolves, through the same validation, so the two can
 * never drift apart — and the business name and phone from the same settings
 * the rest of the site renders.
 *
 * The photography and the featured tour's price and duration come from the
 * catalogue rather than being written here, for the same reason: a page that
 * restates a price is a page that will one day contradict one. Either block
 * renders empty if its tour is missing, so a withdrawn tour costs the page a
 * picture rather than the build.
 */
export function renderLinkHubTemplate(template, content, media = {}) {
  const settings = content.siteSettings;
  const social = content.social ?? {};
  const phoneHref = `tel:${String(settings.primaryPhone).replace(/[^+\d]/g, '')}`;

  const hero = media.hero;
  const heroSrc = recrop(hero?.image, 900, 1125);
  const heroMedia = heroSrc
    ? `<img src="${escapeHtml(heroSrc)}" alt="${escapeHtml(hero.alt || '')}" width="900" height="1125" fetchpriority="high" decoding="async">`
    : '';

  const featured = media.featured;
  const featuredSrc = recrop(featured?.image, 900, 600);
  const featuredCard = featuredSrc
    ? `<section class="featured">
      <a class="featured-card" href="${escapeHtml(featured.detailUrl)}" data-go-link="featured">
        <img src="${escapeHtml(featuredSrc)}" alt="${escapeHtml(featured.alt || '')}" width="900" height="600" loading="lazy" decoding="async">
        <div class="featured-body">
          <div class="eyebrow">${escapeHtml(media.featuredEyebrow || 'Featured experience')}</div>
          <h2>${escapeHtml(featured.title)}</h2>
          <p class="featured-meta">${escapeHtml(featured.duration)} <span class="dot" aria-hidden="true"></span> from ${escapeHtml(featured.price)} per person<svg class="chev" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg></p>
        </div>
      </a>
    </section>`
    : '';

  let output = template
    .replaceAll('{{businessName}}', escapeHtml(settings.businessName))
    .replaceAll('{{primaryPhone}}', escapeHtml(settings.primaryPhone))
    .replaceAll('{{primaryPhoneHref}}', escapeHtml(phoneHref))
    .replace('{{heroMedia}}', heroMedia)
    .replace('{{featuredCard}}', featuredCard);
  for (const [key, fallback] of Object.entries(FOOTER_SOCIAL_DEFAULTS)) {
    output = output.replaceAll(`{{${key}}}`, safeSocialHref(social[key], fallback));
  }
  const leftover = output.match(/\{\{[a-zA-Z]+\}\}/g);
  if (leftover) throw new Error(`go.html has unfilled placeholders: ${leftover.join(', ')}`);
  return output;
}

export function replacePrimaryNavigation(html, navigation, fileName) {
  const startPattern = /<nav\b[^>]*class="[^"]*\bnav\b[^"]*"[^>]*>/i;
  const match = startPattern.exec(html);
  if (!match) throw new Error(`${fileName} is missing the primary navigation`);

  const start = match.index;
  const end = findBalancedElementEnd(html, start, 'nav');
  return `${html.slice(0, start)}${navigation.trim()}${html.slice(end)}`;
}

export function replaceFooter(html, footer) {
  const match = /<footer\b[^>]*>/i.exec(html);
  if (!match) return html;
  const end = findBalancedElementEnd(html, match.index, 'footer');
  return `${html.slice(0, match.index)}${footer.trim()}${html.slice(end)}`;
}
