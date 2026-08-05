// Build-time copy injection for the booking flow.
//
// contact.html ships with the current approved copy inline, so the page is
// correct even if this step never runs. When it does run, every element
// carrying data-booking-copy (plus the trust list, the "what happens next"
// steps and the FAQs) is replaced with whatever booking.json — or Sanity —
// says. That is what lets an editor change the flow's wording, CTAs and
// confirmation message without touching code.

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const TRUST_ICON_PATHS = {
  pin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
};

function replaceCopy(html, key, value) {
  // Matches the element carrying data-booking-copy="key" and swaps only its
  // text. All bound elements hold plain text, so a non-greedy body is safe.
  const pattern = new RegExp(
    `(<([a-zA-Z0-9]+)(?=[^>]*\\sdata-booking-copy="${key}")[^>]*>)([\\s\\S]*?)(</\\2>)`,
  );
  if (!pattern.test(html)) throw new Error(`contact.html has no element bound to booking copy "${key}"`);
  return html.replace(pattern, (_match, open, _tag, _body, close) => `${open}${escapeHtml(value)}${close}`);
}

function replaceList(html, attribute, inner, label) {
  const pattern = new RegExp(`(<([a-zA-Z0-9]+)(?=[^>]*\\s${attribute}\\b)[^>]*>)([\\s\\S]*?)(</\\2>)`);
  if (!pattern.test(html)) throw new Error(`contact.html has no ${label} container (${attribute})`);
  return html.replace(pattern, (_match, open, _tag, _body, close) => `${open}${inner}${close}`);
}

const renderTrustPoints = points => points.map(point => {
  const icon = TRUST_ICON_PATHS[point.icon];
  if (!icon) throw new Error(`Unknown booking trust icon: ${point.icon}`);
  return `<li><svg viewBox="0 0 24 24" aria-hidden="true">${icon}</svg>${escapeHtml(point.label)}</li>`;
}).join('');

const renderNextSteps = steps => steps.map((step, index) => `
            <li class="booking-next-step">
              <span class="booking-next-step-num" aria-hidden="true">${index + 1}</span>
              <div>
                <h4 class="booking-next-step-title">${escapeHtml(step.title)}</h4>
                <p class="booking-next-step-text">${escapeHtml(step.description)}</p>
              </div>
            </li>`).join('');

const renderFaqs = faqs => faqs.map((faq, index) => `
          <li class="faq-item${index === 0 ? ' open' : ''}">
            <button class="faq-question" aria-expanded="${index === 0}">
              ${escapeHtml(faq.question)}
              <div class="faq-q-icon"><svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg></div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-inner">${escapeHtml(faq.answer)}</div>
            </div>
          </li>`).join('');

export function injectBookingContent(html, booking) {
  if (!html.includes('data-booking-copy')) return html;

  let output = html;
  for (const [key, value] of Object.entries(booking)) {
    if (typeof value === 'string') output = replaceCopy(output, key, value);
  }
  output = replaceList(output, 'data-booking-trust', renderTrustPoints(booking.trustPoints), 'trust list');
  output = replaceList(output, 'data-booking-next-steps', renderNextSteps(booking.nextSteps), 'next steps list');
  output = replaceList(output, 'data-booking-faqs', renderFaqs(booking.faqs), 'FAQ list');
  return output;
}
