// Build-time content injection for the About page.
//
// About was the last page with no CMS coverage at all: the founder bios, the
// mission, the six difference cards, the impact figures and the FAQs were only
// in HTML, so nobody could change them without a developer. This mirrors
// render-booking.mjs: the page ships with the approved copy inline and stays
// correct if the step never runs, and every bound element is replaced when it
// does.

import {findBalancedElementEnd} from './shared-shell.mjs';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function replaceText(html, key, value) {
  const pattern = new RegExp(
    `(<([a-zA-Z0-9]+)(?=[^>]*\\sdata-about-copy="${key}")[^>]*>)([\\s\\S]*?)(</\\2>)`,
  );
  if (!pattern.test(html)) throw new Error(`about.html has no element bound to "${key}"`);
  return html.replace(pattern, (_m, open, _t, _b, close) => `${open}${escapeHtml(value)}${close}`);
}

// Depth-aware, because these containers hold children of the same tag: a
// .why-grid of .why-item divs, a stats grid of stat-block divs. A non-greedy
// regex stops at the first inner </div> and silently mangles the section.
function replaceList(html, attribute, inner, label) {
  const opening = new RegExp(`<([a-zA-Z0-9]+)(?=[^>]*\\s${attribute}\\b)[^>]*>`);
  const match = opening.exec(html);
  if (!match) throw new Error(`about.html has no ${label} container (${attribute})`);
  const end = findBalancedElementEnd(html, match.index, match[1]);
  const closeTag = `</${match[1]}>`;
  return html.slice(0, match.index) + match[0] + inner + closeTag + html.slice(end);
}

const renderStory = paragraphs => paragraphs
  .map(text => `\n          <p style="font-size:16px;color:var(--gray-2);line-height:1.85;margin-bottom:20px;">${escapeHtml(text)}</p>`)
  .join('');

// The mission proof row. These three names are the section's only concrete
// evidence, so they are typeset as anchors rather than buried in the prose
// where they used to live.
const renderMissionProof = items => items.map(item => `
        <div>
          <dt>${escapeHtml(item.place)}</dt>
          <dd>${escapeHtml(item.craft)}</dd>
        </div>`).join('');

// Icons stay in code deliberately. They are part of the design system, not
// content, and letting editors pick arbitrary SVG is how a design system rots.
const renderDifference = (items, icons) => items.map((item, index) => `
        <div class="why-item reveal${index % 3 === 1 ? ' reveal-delay-1' : index % 3 === 2 ? ' reveal-delay-2' : ''}">
          <div class="why-number">${String(index + 1).padStart(2, '0')}</div>
          <span class="why-icon">${icons[index % icons.length]}</span>
          <h3 class="why-title">${escapeHtml(item.title)}</h3>
          <p class="why-text">${escapeHtml(item.text)}</p>
        </div>`).join('');

// Drops a quoted nickname whatever quote style it uses, so "Isaac “Nana”
// Yeboah" initialises as IY rather than I“.
const initials = name => String(name)
  .split(/\s+/)
  .filter(part => part && !/^["“”'‘’]/.test(part))
  .slice(0, 2)
  .map(part => part[0])
  .join('')
  .toUpperCase();

const photoApproved = photo => Boolean(
  photo?.src && photo.alt &&
  photo.publicApprovalState === 'approved' && photo.placeholderState === 'approved',
);

// Falls back to initials whenever there is no approved photograph, so the
// section stays presentable while photography is still being shot and
// an unapproved image can never reach the public site.
const renderTeam = members => members.map((member, index) => {
  const photo = member.photo;
  const media = photoApproved(photo)
    ? `<div class="team-photo has-photo">
            <img src="${escapeHtml(photo.src)}" alt="${escapeHtml(photo.alt)}"${photo.width ? ` width="${escapeHtml(photo.width)}"` : ''}${photo.height ? ` height="${escapeHtml(photo.height)}"` : ''} loading="lazy" decoding="async" />
          </div>`
    : `<div class="team-photo">
            <div class="team-photo-placeholder" aria-hidden="true">${escapeHtml(initials(member.name))}</div>
          </div>`;
  return `
        <div class="team-card team-feature reveal${index ? ' reveal-delay-1' : ''}">
          ${media}
          <div class="team-name">${escapeHtml(member.name)}</div>
          <div class="team-role">${escapeHtml(member.role)}</div>
          <p class="team-bio">${escapeHtml(member.bio)}</p>
        </div>`;
}).join('');

// The figure is written into the markup, not just the counter, so the page is
// truthful with JavaScript disabled.
const renderStats = stats => stats.map(stat => {
  const numeric = /^\d+$/.test(stat.value);
  const target = numeric ? ` data-target="${escapeHtml(stat.value)}"` : '';
  return `
        <div class="stat-block">
          <span class="stat-num"${target}>${escapeHtml(stat.value)}</span>
          <span class="stat-lbl">${escapeHtml(stat.label)}</span>
        </div>`;
}).join('');

const renderFaqs = faqs => faqs.map((faq, index) => `
          <li class="faq-item${index === 0 ? ' open' : ''}">
            <button class="faq-question" aria-expanded="${index === 0}">
              ${escapeHtml(faq.question)}
              <div class="faq-q-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg></div>
            </button>
            <div class="faq-answer">
              <div class="faq-answer-inner">${escapeHtml(faq.answer)}</div>
            </div>
          </li>`).join('');

export function injectAboutContent(html, about) {
  if (!html.includes('data-about-copy')) return html;

  const icons = [...html.matchAll(/<span class="why-icon">([\s\S]*?)<\/span>/g)].map(match => match[1]);
  if (icons.length === 0) throw new Error('about.html has no why-icon set to reuse');

  let output = html;
  for (const [key, value] of Object.entries(about)) {
    if (typeof value === 'string') output = replaceText(output, key, value);
  }
  output = replaceList(output, 'data-about-story', renderStory(about.storyParagraphs), 'story');
  output = replaceList(output, 'data-about-mission-proof', renderMissionProof(about.missionProof), 'mission proof row');
  output = replaceList(output, 'data-about-difference', renderDifference(about.differenceItems, icons), 'difference grid');
  output = replaceList(output, 'data-about-team', renderTeam(about.team), 'team grid');
  // The "photography in progress" note is a placeholder-state message. Once
  // every member has an approved photo it is no longer true, so it retires
  // itself rather than waiting for somebody to remember to delete it.
  if (about.team.every(member => photoApproved(member.photo))) {
    output = output.replace(/<p class="team-placeholder-note[^>]*>[\s\S]*?<\/p>/, '');
  }
  output = replaceList(output, 'data-about-stats', renderStats(about.impactStats), 'impact stats');
  output = replaceList(output, 'data-about-faqs', renderFaqs(about.faqs), 'FAQ list');
  return output;
}
