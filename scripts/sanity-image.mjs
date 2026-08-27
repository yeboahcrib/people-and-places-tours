/**
 * Ask Sanity's image CDN for a photograph at the size it will actually be
 * shown, cropped around the focal point the editor set.
 *
 * Without this the bare asset URL is emitted and the browser downloads the
 * original — a homepage carrying five-megapixel masters came to 10.4MB of
 * images, and the focal-point circle did nothing because no crop was ever
 * requested. The CDN does the work; the site only has to say what it needs.
 *
 * Sizes are given at the width the image occupies on screen and doubled here,
 * so a caller never has to remember to think about retina.
 */
export function sanityImageUrl(photo, {width, height, quality = 78} = {}) {
  if (!photo?.src) return undefined;
  if (!photo.src.includes('cdn.sanity.io')) return photo.src;

  const params = new URLSearchParams({auto: 'format', q: String(quality), fit: 'crop'});
  // Never ask for more than the master holds: upscaling costs bytes and
  // returns a softer picture than the original would have given.
  const cap = value => (photo.width ? Math.min(value, photo.width) : value);
  if (width) params.set('w', String(Math.round(cap(width * 2))));
  if (height) params.set('h', String(Math.round(height * 2 * (width ? cap(width * 2) / (width * 2) : 1))));

  const {x, y} = photo.hotspot || {};
  if (Number.isFinite(x) && Number.isFinite(y)) {
    params.set('crop', 'focalpoint');
    params.set('fp-x', x.toFixed(4));
    params.set('fp-y', y.toFixed(4));
  }
  return `${photo.src}?${params}`;
}

/** Returns the photo with its src resized, leaving alt and dimensions intact. */
export function sizedPhoto(photo, options) {
  const src = sanityImageUrl(photo, options);
  return src ? {...photo, src} : photo;
}
