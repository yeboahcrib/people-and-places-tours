/**
 * Site-wide globals contract.
 *
 * The claim this file has to earn is requirement 7 of the phase: a failed or
 * hostile Storyblok read cannot break the navigation or remove an essential
 * contact or legal link. That is not established by testing the happy path, so
 * most of what follows is a document that has gone wrong in a specific way,
 * checked against the navigation the site still has to render.
 */
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {
  GLOBALS_STORY_SLUG,
  SOCIAL_DEFAULTS,
  loadStoryblokGlobals,
  mapStoryblokGlobals,
} from '../scripts/storyblok-globals-source.mjs';
import {renderFooterTemplate, renderNavigationTemplate} from '../scripts/shared-shell.mjs';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const base = JSON.parse(await readFile(`${projectRoot}src/content/site.json`, 'utf8'));
const quiet = {warn() {}};
const env = {STORYBLOK_GLOBALS_ENABLED: 'true', STORYBLOK_PREVIEW_API_TOKEN: 'token', STORYBLOK_REGION: 'eu'};

const link = (href, label) => ({component: 'global_link', href, label});
const goodStory = () => ({
  content: {
    component: 'site_globals',
    published: true,
    business_name: 'People & Places',
    primary_phone: '+233 50 367 3473',
    email: 'peopandplaces@gmail.com',
    footer_tagline: 'Ghana-founded, Ghana-led. Hosted by people who grew up here.',
    instagram_url: 'https://instagram.com/peopleand.places',
    tiktok_url: 'https://tiktok.com/@peopandplaces',
    whatsapp_url: 'https://wa.me/233503673473',
    nav_labels: base.navigation.navLinks.map(l => link(l.href, l.label)),
    footer_columns: base.navigation.footerColumns.map(c => ({
      component: 'footer_column', heading: c.heading, links: c.links.map(l => link(l.href, l.label)),
    })),
  },
});
const respondWith = story => async () =>
  new Response(JSON.stringify({story}), {status: 200, headers: {'Content-Type': 'application/json'}});

const hrefs = content => [
  ...content.navigation.navLinks.map(l => l.href),
  ...content.navigation.footerColumns.flatMap(c => c.links.map(l => l.href)),
];
const baseHrefs = hrefs(base);

// ── Every failure path returns the committed globals, with social defaults ──
for (const [label, options] of [
  ['flag off', {env: {}}],
  ['no token', {env: {STORYBLOK_GLOBALS_ENABLED: 'true'}}],
  ['wrong region', {env: {...env, STORYBLOK_REGION: 'us'}}],
  ['network failure', {env, fetchImpl: async () => { throw new Error('down'); }}],
  ['switched off', {env, fetchImpl: respondWith({content: {...goodStory().content, published: false}})}],
  ['wrong component', {env, fetchImpl: respondWith({content: {component: 'policy_page', published: true}})}],
]) {
  const {content, source} = await loadStoryblokGlobals({baseContent: base, logger: quiet, ...options});
  assert.notEqual(source, 'applied', `${label} must not report applied`);
  assert.deepEqual(content.siteSettings, base.siteSettings, `${label} changed the contact details`);
  assert.deepEqual(content.navigation, base.navigation, `${label} changed the navigation`);
  assert.deepEqual(content.social, SOCIAL_DEFAULTS, `${label} left the footer icons without addresses`);
}

// Clearing a field means "I did not edit this", not "delete this". The
// committed value is kept, and — the part worth pinning down — the editor's
// other edits in the same document still apply, because a stray blank is not
// a reason to discard work that was fine.
for (const field of ['business_name', 'primary_phone', 'email']) {
  const story = goodStory();
  story.content[field] = '';
  story.content.footer_tagline = 'An unrelated edit that should survive';
  const {content, source} = await loadStoryblokGlobals({
    baseContent: base, env, logger: quiet, fetchImpl: respondWith(story),
  });
  assert.equal(source, 'applied', `a blank ${field} discarded the whole document`);
  assert.equal(content.navigation.footerTagline, 'An unrelated edit that should survive',
    `a blank ${field} threw away an unrelated edit`);
  assert.deepEqual(content.siteSettings, base.siteSettings,
    `a blank ${field} changed the contact details`);
}

// The site can still only render with these present, so a committed globals
// file that has lost one falls back whole rather than shipping a shell with a
// hole in it. Nothing in Storyblok can rescue that, and nothing should try.
for (const [field, storyField] of [['businessName', 'business_name'], ['primaryPhone', 'primary_phone'], ['email', 'email']]) {
  const hollow = {...base, siteSettings: {...base.siteSettings, [field]: ''}};
  const story = goodStory();
  story.content[storyField] = '';
  assert.equal(mapStoryblokGlobals(story, hollow), undefined,
    `a shell with no ${field} in either source was published anyway`);
  // Storyblok supplying the missing value is a repair, not a failure.
  assert(mapStoryblokGlobals(goodStory(), hollow),
    `Storyblok supplying a missing ${field} was refused`);
}

// ── The happy path edits words, and only words ──
{
  const story = goodStory();
  story.content.hours = 'Monday–Saturday, 8:00 a.m.–6:00 p.m.';
  story.content.nav_labels = [link('packages.html', 'Our Tours')];
  story.content.footer_columns[3] = {...story.content.footer_columns[3], heading: 'Legal & Policies'};
  const {content, source} = await loadStoryblokGlobals({
    baseContent: base, env, logger: quiet, fetchImpl: respondWith(story),
  });
  assert.equal(source, 'applied');
  assert.equal(content.siteSettings.hours, 'Monday–Saturday, 8:00 a.m.–6:00 p.m.');
  assert.equal(content.navigation.navLinks.find(l => l.href === 'packages.html').label, 'Our Tours');
  assert.equal(content.navigation.footerColumns[3].heading, 'Legal & Policies');
  // Named one link; the other four keep the words they had.
  assert.equal(content.navigation.navLinks.find(l => l.href === 'about.html').label, 'About');
  assert.deepEqual(hrefs(content), baseHrefs, 'renaming a link moved a destination');
  // A value the editor left alone still comes from the committed globals.
  assert.equal(content.siteSettings.instagramHandle, base.siteSettings.instagramHandle);
}

// ── Requirement 7: a hostile document cannot change the site's shape ──
{
  const story = goodStory();
  // Invents routes, deletes the legal column, renames Home to an empty string,
  // and points a social icon at a script.
  story.content.nav_labels = [
    link('evil.html', 'Free Money'),
    link('https://example.com/phish', 'Login'),
    link('index.html', ''),
  ];
  story.content.footer_columns = [{component: 'footer_column', heading: 'Only column', links: []}];
  story.content.instagram_url = 'javascript:alert(1)';
  story.content.tiktok_url = 'http://insecure.example.com';
  const {content, source} = await loadStoryblokGlobals({
    baseContent: base, env, logger: quiet, fetchImpl: respondWith(story),
  });
  assert.equal(source, 'applied');
  assert.deepEqual(hrefs(content), baseHrefs, 'a Storyblok document changed the site routes');
  assert.equal(content.navigation.navLinks.length, base.navigation.navLinks.length, 'the navigation gained or lost a link');
  assert.equal(content.navigation.footerColumns.length, base.navigation.footerColumns.length, 'the footer lost a column');
  assert.equal(content.navigation.navLinks[0].label, 'Home', 'an empty label blanked a navigation link');
  assert.equal(content.social.instagramUrl, SOCIAL_DEFAULTS.instagramUrl, 'a javascript: URL reached the footer');
  assert.equal(content.social.tiktokUrl, SOCIAL_DEFAULTS.tiktokUrl, 'a plain-http URL reached the footer');

  // The four legal pages are the ones that must survive anything.
  const legal = content.navigation.footerColumns.find(c => c.heading === 'Legal');
  assert(legal, 'the Legal column disappeared');
  for (const page of ['booking-terms.html', 'cancellation-refund-policy.html', 'travel-insurance.html', 'privacy-policy.html']) {
    assert(legal.links.some(l => l.href === page), `the ${page} link was removed`);
  }
  // And so are the ways to reach a human.
  const reach = content.navigation.footerColumns.find(c => c.heading === 'Get in Touch');
  assert(reach.links.some(l => l.href.startsWith('mailto:')), 'the email link was removed');
  assert(reach.links.some(l => l.href.startsWith('tel:')), 'the phone link was removed');
}

// ── What actually renders ──
{
  const story = goodStory();
  story.content.instagram_url = 'https://instagram.com/moved';
  story.content.nav_labels = [link('travel-information.html', 'Before You Fly')];
  const {content} = await loadStoryblokGlobals({
    baseContent: base, env, logger: quiet, fetchImpl: respondWith(story),
  });
  const nav = renderNavigationTemplate(await readFile(`${projectRoot}src/partials/navigation.html`, 'utf8'), content);
  const footer = renderFooterTemplate(await readFile(`${projectRoot}src/partials/footer.html`, 'utf8'), content, 2026);

  assert(nav.includes('>Before You Fly<'), 'the renamed link did not reach the navigation');
  assert(nav.includes('href="travel-information.html"'), 'the renamed link lost its destination');
  // Desktop list and mobile drawer are built from the same links, so a rename
  // has to appear in both or the two menus disagree.
  assert.equal((nav.match(/>Before You Fly</g) || []).length, 2, 'the rename reached only one of the two menus');
  assert(nav.includes('class="nav-toggle"') && nav.includes('class="nav-mobile"'), 'the mobile menu markup changed');
  assert(nav.includes('href="tel:+233503673473"'), 'the navigation phone link changed');

  assert(footer.includes('href="https://instagram.com/moved"'), 'the Instagram link did not reach the footer');
  assert(footer.includes(`href="${SOCIAL_DEFAULTS.tiktokUrl}"`), 'the TikTok link was lost');
  assert(footer.includes(`href="${SOCIAL_DEFAULTS.whatsappUrl}"`), 'the WhatsApp link was lost');
  assert(!footer.includes('{{'), 'an unresolved placeholder shipped in the footer');
  assert(!nav.includes('{{'), 'an unresolved placeholder shipped in the navigation');
}

// The slug the build reads, spelled out so a rename in Storyblok is a failing
// test rather than a silent fallback on the live site.
assert.equal(GLOBALS_STORY_SLUG, 'globals/site');

// A document that is not a globals record at all is refused, not merged.
assert.equal(mapStoryblokGlobals({content: {component: 'tour', published: true}}, base), undefined);
assert.deepEqual(mapStoryblokGlobals({content: {component: 'site_globals', published: false}}, base), {hidden: true});

console.log('Storyblok globals contract tests passed.');
