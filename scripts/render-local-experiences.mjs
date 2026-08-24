// Fills the add-on list on the experiences page. Names only, and a note that
// carries the minimum group size from content rather than from the markup.
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight'];

export function injectLocalExperiences(html, content) {
  if (!html.includes('data-local-experiences')) return html;

  const items = content.experiences
    .map(experience => `<li>${escapeHtml(experience.name)}</li>`)
    .join('');
  const withList = html.replace(
    /(<ul[^>]*\sdata-local-experiences\b[^>]*>)([\s\S]*?)(<\/ul>)/,
    (_match, open, _body, close) => `${open}${items}${close}`,
  );

  const minimum = NUMBER_WORDS[content.minimumGroup] || String(content.minimumGroup);
  return withList.replace(
    /(<p[^>]*\sdata-local-experiences-note\b[^>]*>)([\s\S]*?)(<\/p>)/,
    (_match, open, _body, close) => `${open}Available for groups of ${minimum} or more.${close}`,
  );
}
