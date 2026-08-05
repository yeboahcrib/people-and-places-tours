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

export function renderFooterTemplate(template, content, year = new Date().getUTCFullYear()) {
  const settings = content.siteSettings;
  const navigation = content.navigation;
  const columns = navigation.footerColumns.map(column => {
    const links = column.links.map(link => {
      const href = safeFooterHref(link.href);
      const external = /^https:/i.test(link.href) ? ' target="_blank" rel="noopener"' : '';
      return `          <li><a href="${href}"${external}>${escapeHtml(link.label)}</a></li>`;
    }).join('\n');
    return `      <div class="footer-col">\n        <h2>${escapeHtml(column.heading)}</h2>\n        <ul role="list">\n${links}\n        </ul>\n      </div>`;
  }).join('\n\n');

  return template
    .replaceAll('{{businessName}}', escapeHtml(settings.businessName))
    .replaceAll('{{footerTagline}}', escapeHtml(navigation.footerTagline))
    .replaceAll('{{year}}', escapeHtml(year))
    .replace('      <!-- shared: footer-columns -->', columns);
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
