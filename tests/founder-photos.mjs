import assert from 'node:assert/strict';
import {withAboutFounderPhotos, withHomepageFounderPhotos} from '../scripts/founder-photos.mjs';

const photos = [{
  names: ['Isaac Yeboah', 'Nana Yeboah'],
  alt: 'Nana Yeboah',
  circle: {src: 'assets/photos/founders/nana-circle.jpg', width: 440, height: 440},
  portrait: {src: 'assets/photos/founders/nana-portrait.jpg', width: 615, height: 820},
}];

// Homepage: matched by name or preferred name; others keep initials.
const home = {founderStory: {founders: [
  {name: 'Isaac Yeboah', preferredName: 'Nana Yeboah', initials: 'IY'},
  {name: 'Evans Yirenkyi', preferredName: 'Kojo', initials: 'EY'},
]}};
let out = withHomepageFounderPhotos(home, photos);
assert.equal(out.founderStory.founders[0].image.src, photos[0].circle.src);
assert.equal(out.founderStory.founders[0].image.alt, 'Nana Yeboah');
assert.equal(out.founderStory.founders[1].image, undefined, 'a founder with no photo keeps their initials');
assert.equal(home.founderStory.founders[0].image, undefined, 'the source content is not mutated');
out = withHomepageFounderPhotos({founderStory: {founders: [{name: 'Someone', preferredName: 'Nana Yeboah'}]}}, photos);
assert.equal(out.founderStory.founders[0].image?.src, photos[0].circle.src, 'the preferred name matches too');

// A photo the CMS supplies always wins.
out = withHomepageFounderPhotos({founderStory: {founders: [{name: 'Isaac Yeboah', image: {src: 'https://cms/x.jpg'}}]}}, photos);
assert.equal(out.founderStory.founders[0].image.src, 'https://cms/x.jpg');

// About: a quoted nickname is ignored when matching, and the photo passes the approval gate.
const about = {team: [{name: 'Isaac “Nana” Yeboah'}, {name: 'Evans “Kojo” Yirenkyi'}]};
out = withAboutFounderPhotos(about, photos);
assert.deepEqual(out.team[0].photo, {...photos[0].portrait, alt: 'Nana Yeboah', publicApprovalState: 'approved', placeholderState: 'approved'});
assert.equal(out.team[1].photo, undefined);
out = withAboutFounderPhotos({team: [{name: 'Isaac Yeboah', photo: {src: 'https://cms/y.jpg'}}]}, photos);
assert.equal(out.team[0].photo.src, 'https://cms/y.jpg', 'a CMS portrait always wins');

// No match on a different person who shares a surname.
out = withAboutFounderPhotos({team: [{name: 'Ama Yeboah'}]}, photos);
assert.equal(out.team[0].photo, undefined, 'matching is on the whole name, not the surname');

console.log('Founder photo tests passed.');
