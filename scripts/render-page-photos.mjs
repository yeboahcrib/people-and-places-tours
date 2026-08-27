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
import {sanityImageUrl} from './sanity-image.mjs';

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
      // The width and height already on the tag describe the slot, not the
      // file, and they are what stops the page jumping while the image loads.
      // They are kept, and the photograph is fetched at that size — an earlier
      // version overwrote them with the source's dimensions and shipped a
      // 4100x4100 master into a 1920x720 band.
      const slotWidth = Number((tag.match(/\swidth="(\d+)"/) || [])[1]) || undefined;
      const slotHeight = Number((tag.match(/\sheight="(\d+)"/) || [])[1]) || undefined;
      const src = sanityImageUrl(photo, {width: slotWidth, height: slotHeight}) || photo.src;
      const next = tag.replace(/\ssrc="[^"]*"/, ` src="${escapeHtml(src)}"`);
      // A decorative image keeps its empty alt: describing a photograph that
      // sits behind a heading only makes a screen reader read the heading twice.
      if (/\salt="\s*"/.test(next)) return next;
      return next.replace(/\salt="[^"]*"/, ` alt="${escapeHtml(photo.alt || '')}"`);
    });
  }
  return output;
}
