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
