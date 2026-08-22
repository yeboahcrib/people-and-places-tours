// Build-time rendering for the cancellation and refund policy.
//
// The page ships with the committed policy inline, so it is correct and
// readable even if this step never runs. When it does run, the copy and the
// section list are replaced by whatever policy.json — or Sanity — holds.

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const FILE = 'cancellation-refund-policy.html';

function replaceCopy(html, key, value) {
  const pattern = new RegExp(
    `(<([a-zA-Z0-9]+)(?=[^>]*\\sdata-policy-copy="${key}")[^>]*>)([\\s\\S]*?)(</\\2>)`,
  );
  if (!pattern.test(html)) throw new Error(`${FILE} has no element bound to policy copy "${key}"`);
  return html.replace(pattern, (_match, open, _tag, _body, close) => `${open}${escapeHtml(value)}${close}`);
}

function replaceContainer(html, attribute, inner, label) {
  const pattern = new RegExp(`(<([a-zA-Z0-9]+)(?=[^>]*\\s${attribute}\\b)[^>]*>)([\\s\\S]*?)(</\\2>)`);
  if (!pattern.test(html)) throw new Error(`${FILE} has no ${label} container (${attribute})`);
  return html.replace(pattern, (_match, open, _tag, _body, close) => `${open}${inner}${close}`);
}

// "2026-08-22" reads as a filing reference. Travellers deciding whether a
// policy still applies to them need a date they can parse at a glance.
export function formatPolicyDate(value) {
  const [year, month, day] = String(value).split('-').map(Number);
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  if (!year || !month || !day || !months[month - 1]) return String(value);
  return `${day} ${months[month - 1]} ${year}`;
}

// Sections reuse the site's own rhythm: a display heading, a lead line, then
// the terms as a definition list. No bespoke type scale — the policy should
// read like the rest of the site, not like a document pasted into it.
const renderSections = sections => sections.map(section => {
  const intro = section.intro
    ? `<p class="policy-block-intro">${escapeHtml(section.intro)}</p>`
    : '';
  const items = section.items.map(item =>
    `<div class="policy-term"><dt>${escapeHtml(item.term)}</dt><dd>${escapeHtml(item.text)}</dd></div>`,
  ).join('');
  return `<section class="policy-block">`
    + `<h3 class="policy-block-title">${escapeHtml(section.heading)}</h3>`
    + intro
    + `<dl class="policy-terms">${items}</dl>`
    + `</section>`;
}).join('');

export function injectPolicyContent(html, policy, settings) {
  let output = html;
  for (const key of ['title', 'intro', 'contactIntro', 'closing']) {
    output = replaceCopy(output, key, policy[key]);
  }
  output = replaceCopy(output, 'lastUpdated', `Last updated ${formatPolicyDate(policy.lastUpdated)}`);
  output = replaceContainer(output, 'data-policy-sections', renderSections(policy.sections), 'policy sections');

  const email = settings?.email;
  const phone = settings?.primaryPhone;
  if (!email || !phone) throw new Error('Policy page needs a contact email and phone from site settings');
  const contact = `<li><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></li>`
    + `<li><a href="https://wa.me/${escapeHtml(String(phone).replace(/[^0-9]/g, ''))}" target="_blank" rel="noopener">WhatsApp ${escapeHtml(phone)}</a></li>`;
  return replaceContainer(output, 'data-policy-contact', contact, 'policy contact');
}
