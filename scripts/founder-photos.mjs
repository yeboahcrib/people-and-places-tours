import {readFile} from 'node:fs/promises';
import {join} from 'node:path';

/* Founder photographs committed with the site.
 *
 * The homepage and About page both read their founders from whichever source
 * won (Storyblok, Sanity or the committed copy), and neither CMS holds a
 * founder photo yet. These fill the gap after that choice is made, so a photo
 * shows whichever source is live. They never replace a photo a CMS supplies:
 * an approved CMS photograph always wins.
 *
 * Matching is by name, with a quoted nickname ignored, so "Isaac “Nana”
 * Yeboah" on About and "Isaac Yeboah" / "Nana Yeboah" on the homepage are the
 * same person. A founder with no entry keeps their initials. */

const nameKey = value => String(value || '')
  .split(/\s+/)
  .filter(part => part && !/^["“”'‘’]/.test(part))
  .join(' ')
  .toLowerCase();

export async function loadFounderPhotos(projectRoot) {
  const file = JSON.parse(await readFile(join(projectRoot, 'src/content/founder-photos.json'), 'utf8'));
  for (const [index, founder] of (file.founders || []).entries()) {
    if (!founder.names?.length || !founder.alt || !founder.circle?.src || !founder.portrait?.src) {
      throw new Error(`founder-photos.json founders[${index}] needs names, alt, circle and portrait`);
    }
  }
  return file.founders || [];
}

const find = (photos, ...names) => {
  const keys = new Set(names.map(nameKey).filter(Boolean));
  return photos.find(entry => entry.names.some(name => keys.has(nameKey(name))));
};

/** The homepage content, with each founder who lacks a photo given theirs. */
export function withHomepageFounderPhotos(content, photos) {
  const founders = content?.founderStory?.founders;
  if (!Array.isArray(founders)) return content;
  return {
    ...content,
    founderStory: {
      ...content.founderStory,
      founders: founders.map(founder => {
        if (founder.image?.src) return founder;
        const entry = find(photos, founder.name, founder.preferredName);
        return entry ? {...founder, image: {...entry.circle, alt: entry.alt}} : founder;
      }),
    },
  };
}

/** The About content, with each team member who lacks a photo given theirs. */
export function withAboutFounderPhotos(content, photos) {
  if (!Array.isArray(content?.team)) return content;
  return {
    ...content,
    team: content.team.map(member => {
      if (member.photo?.src) return member;
      const entry = find(photos, member.name);
      return entry ? {
        ...member,
        photo: {...entry.portrait, alt: entry.alt, publicApprovalState: 'approved', placeholderState: 'approved'},
      } : member;
    }),
  };
}
