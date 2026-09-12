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

/* Pages that are not part of the website at all.
 *
 * go.html is shell-less but still ours to present — it gets the link-hub
 * treatment. These get nothing: no navigation, no footer, no contact details
 * woven in. dashboard.html is an internal tool that happens to be served from
 * the same origin, and the less of the site it carries, the less there is to
 * keep in step with it. */
export const INTERNAL_PAGES = new Set(['dashboard.html']);

/**
 * The link-in-bio page at /go.
 *
 * It carries no navigation and no footer, so it cannot pick up the contact and
 * social addresses the way every other page does. This gives it the same three
 * social hrefs the footer resolves, through the same validation, so the two can
 * never drift apart — and the business name and phone from the same settings
 * the rest of the site renders. It throws rather than shipping a page with a
 * placeholder still in it.
 */
export function renderLinkHubTemplate(template, content) {
  const settings = content.siteSettings;
  const social = content.social ?? {};
  const phoneHref = `tel:${String(settings.primaryPhone).replace(/[^+\d]/g, '')}`;
  let output = template
    .replaceAll('{{businessName}}', escapeHtml(settings.businessName))
    .replaceAll('{{primaryPhone}}', escapeHtml(settings.primaryPhone))
    .replaceAll('{{primaryPhoneHref}}', escapeHtml(phoneHref));
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
