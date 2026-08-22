// Build-time rendering for the cancellation and refund policy.
//
// The page ships with the committed policy inline, so it is correct and
// readable even if this step never runs. When it does run, the copy and the
// section list are replaced by whatever policy.json — or Sanity — holds.

import {findBalancedElementEnd} from './shared-shell.mjs';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function replaceCopy(html, key, value, file) {
  const pattern = new RegExp(
    `(<([a-zA-Z0-9]+)(?=[^>]*\\sdata-policy-copy="${key}")[^>]*>)([\\s\\S]*?)(</\\2>)`,
  );
  if (!pattern.test(html)) throw new Error(`${file} has no element bound to policy copy "${key}"`);
  return html.replace(pattern, (_match, open, _tag, _body, close) => `${open}${escapeHtml(value)}${close}`);
}

// Deliberately not a regex. This container already holds rendered sections by
// the time the build runs over the committed page, and those sections nest
// their own elements of the same tag. A non-greedy match stops at the first
// inner closing tag, silently truncating the page's own <section> — which
// renders as a white band with white text on it.
function replaceContainer(html, attribute, inner, label, file) {
  const opening = new RegExp(`<([a-zA-Z0-9]+)(?=[^>]*\\s${attribute}\\b)[^>]*>`);
  const match = opening.exec(html);
  if (!match) throw new Error(`${file} has no ${label} container (${attribute})`);
  const tag = match[1];
  const openEnd = match.index + match[0].length;
  const elementEnd = findBalancedElementEnd(html, match.index, tag);
  const closeStart = elementEnd - `</${tag}>`.length;
  return `${html.slice(0, openEnd)}${inner}${html.slice(closeStart)}`;
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

export function injectPolicyContent(html, policy, settings, file = 'a policy page') {
  let output = html;
  for (const key of ['title', 'intro', 'contactIntro', 'closing']) {
    output = replaceCopy(output, key, policy[key], file);
  }
  output = replaceCopy(output, 'lastUpdated', `Last updated ${formatPolicyDate(policy.lastUpdated)}`, file);
  output = replaceContainer(output, 'data-policy-sections', renderSections(policy.sections), 'policy sections', file);

  const email = settings?.email;
  const phone = settings?.primaryPhone;
  if (!email || !phone) throw new Error('Policy page needs a contact email and phone from site settings');
  const contact = `<li><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></li>`
    + `<li><a href="https://wa.me/${escapeHtml(String(phone).replace(/[^0-9]/g, ''))}" target="_blank" rel="noopener">WhatsApp ${escapeHtml(phone)}</a></li>`;
  return replaceContainer(output, 'data-policy-contact', contact, 'policy contact', file);
}
