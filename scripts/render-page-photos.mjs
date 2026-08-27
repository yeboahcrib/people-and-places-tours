/**
 * Swap a page's photograph for the one an editor chose.
 *
 * Three pictures — the contact hero, the experiences hero and the photograph
 * beside "Things You Can Add On" — were plain <img> tags with nothing behind
 * them. They could only be changed by editing code, which is the same gap that
 * left every tour card invisible in the Studio until the cards were migrated.
 *
 * The committed src stays in the markup and is what ships when no approved
 * photograph exists, so a page is never left with an empty frame while
 * photography is still being chosen.
 */
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

const usable = photo => Boolean(
  photo?.src &&
  photo.publicApprovalState === 'approved' &&
  photo.placeholderState === 'approved',
);

/**
 * @param html   the page
 * @param photos {key: mediaAsset} keyed by the data-cms-photo value
 */
export function injectPagePhotos(html, photos = {}) {
  if (!html.includes('data-cms-photo')) return html;
  let output = html;

  for (const [key, photo] of Object.entries(photos)) {
    if (!usable(photo)) continue;
    const pattern = new RegExp(`<img\\b[^>]*\\sdata-cms-photo="${key}"[^>]*>`, 'g');
    output = output.replace(pattern, tag => {
      let next = tag
        .replace(/\ssrc="[^"]*"/, ` src="${escapeHtml(photo.src)}"`)
        .replace(/\swidth="[^"]*"/, photo.width ? ` width="${escapeHtml(photo.width)}"` : '')
        .replace(/\sheight="[^"]*"/, photo.height ? ` height="${escapeHtml(photo.height)}"` : '');
      // A decorative image keeps its empty alt: describing a photograph that
      // sits behind a heading only makes a screen reader read the heading twice.
      if (/\salt="\s*"/.test(next)) return next;
      return next.replace(/\salt="[^"]*"/, ` alt="${escapeHtml(photo.alt || '')}"`);
    });
  }
  return output;
}
