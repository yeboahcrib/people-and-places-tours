/**
 * Visual regression harness.
 *
 * The design-system consolidation is meant to change how the stylesheet is
 * written, not what it renders. Asserting that by eye across 21 pages and
 * three breakpoints is not credible, so this captures a full-page screenshot
 * of every page and compares it pixel by pixel against a stored baseline.
 *
 *   node tests/visual-regression.js --baseline   capture the reference set
 *   node tests/visual-regression.js              compare against it
 *
 * Serves dist/ itself, like the resilient-rendering suite, so it always
 * measures the built artifact. Animations are frozen and motion is reduced so
 * repeat runs are deterministic.
 */
const {chromium} = require('playwright');
const http = require('node:http');
const {createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync} = require('node:fs');
const {extname, join} = require('node:path');
const {PNG} = require('pngjs');
// v7 ships ESM with a default export; unwrap it for CommonJS.
const pixelmatch = require('pixelmatch').default || require('pixelmatch');

const DIST = join(__dirname, '..', 'dist');
const BASELINE = join(__dirname, 'visual-baseline');
const DIFFS = join(__dirname, 'visual-diffs');
const WIDTHS = [375, 768, 1440];
// Capture is pinned to a deterministic state (see the settle block below), so
// a clean run produces byte-identical screenshots. The budget is therefore
// near zero: 0.1% was loose enough to hide a real change to every card corner
// on the Experiences page, which is exactly the kind of drift this exists to
// catch. A few pixels of allowance covers font rasterisation only.
const TOLERANCE = 0.00002;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
};

function serve() {
  if (!existsSync(DIST)) throw new Error('dist/ is missing — run `npm run build` first.');
  const server = http.createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, 'http://x').pathname);
    const file = join(DIST, path.replace(/^\/+/, '') || 'index.html');
    if (!file.startsWith(DIST) || !existsSync(file)) return response.writeHead(404).end();
    response.writeHead(200, {'Content-Type': MIME[extname(file)] || 'application/octet-stream'});
    createReadStream(file).pipe(response);
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () =>
    resolve({server, origin: `http://127.0.0.1:${server.address().port}`})));
}

(async () => {
  const capture = process.argv.includes('--baseline');
  const {server, origin} = await serve();
  const pages = readdirSync(DIST).filter(f => f.endsWith('.html')).sort();
  mkdirSync(capture ? BASELINE : DIFFS, {recursive: true});

  const browser = await chromium.launch();
  const failures = [];
  let compared = 0;

  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: {width, height: 900},
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      hasTouch: width <= 768,
    });
    await context.route('**/*', route => {
      const host = new URL(route.request().url()).host;
      return host === new URL(origin).host ? route.continue() : route.abort();
    });
    for (const file of pages) {
      const page = await context.newPage();
      await page.goto(`${origin}/${file}`, {waitUntil: 'load'});
      // Freeze anything still in flight so runs are byte-comparable.
      await page.addStyleTag({content: `*,*::before,*::after{
        animation-duration:0s!important;animation-delay:0s!important;
        transition-duration:0s!important;transition-delay:0s!important;
        caret-color:transparent!important}`});
      // Determinism. Three sources of drift, each pinned rather than waited out:
      //
      // 1. Scroll-triggered reveals. Removing the `reveal-ready` class drops the
      //    stylesheet back to `.reveal { opacity: 1 }`, the same state a visitor
      //    without JavaScript sees, so every section is settled and identical.
      // 2. The testimonials carousel, which advances on requestAnimationFrame
      //    and never checks prefers-reduced-motion. Stop it rescheduling and
      //    rewind it, after the reveals are already pinned so nothing else needs
      //    the frame loop.
      // 3. Layout that only resolves once scrolled.
      await page.evaluate(async () => {
        const step = window.innerHeight;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise(resolve => setTimeout(resolve, 30));
        }
        window.scrollTo(0, 0);
      });
      // 4. Lazy images. A scroll pass starts them but does not guarantee they
      //    have decoded by capture, which is why the homepage pathway cards
      //    were intermittently blank. Force eager and await the decode.
      await page.evaluate(async () => {
        document.querySelectorAll('img[loading="lazy"]').forEach(image => { image.loading = 'eager'; });
        await Promise.all([...document.images].map(image => image.decode().catch(() => {})));
      });
      await page.evaluate(() => {
        document.documentElement.classList.remove('reveal-ready');
        document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
        // The Experiences filter adds `filter-enter` inside a rAF callback, so
        // whether it lands before the frame loop is stopped is a coin toss.
        // Apply it to every visible card: with animations frozen that is the
        // settled end state either way.
        document.querySelectorAll('.tour-card:not([hidden])').forEach(el => el.classList.add('filter-enter'));
        document.getElementById('tours-grid')?.classList.remove('is-filtering');
        // The nav toggles `scrolled` (and can hide itself) from a scroll
        // handler that is rAF-throttled, so after scrolling back to the top it
        // may not have settled. Pin it to its at-rest state.
        const nav = document.querySelector('.nav');
        if (nav) nav.classList.remove('scrolled', 'nav--hidden');
        window.requestAnimationFrame = () => 0;
      });
      await page.waitForTimeout(120);
      await page.evaluate(() => {
        document.querySelectorAll('*').forEach(el => { if (el.scrollLeft) el.scrollLeft = 0; });
      });
      await page.waitForTimeout(120);

      const name = `${file.replace(/\.html$/, '')}-${width}.png`;
      const shot = await page.screenshot({fullPage: true});
      await page.close();

      const reference = join(BASELINE, name);
      if (capture) {
        writeFileSync(reference, shot);
        continue;
      }
      if (!existsSync(reference)) {
        failures.push(`${name}: no baseline (re-run with --baseline)`);
        continue;
      }

      const before = PNG.sync.read(readFileSync(reference));
      const after = PNG.sync.read(shot);
      compared += 1;
      if (before.width !== after.width || before.height !== after.height) {
        failures.push(`${name}: size changed ${before.width}x${before.height} -> ${after.width}x${after.height}`);
        continue;
      }
      const diff = new PNG({width: before.width, height: before.height});
      const changed = pixelmatch(before.data, after.data, diff.data, before.width, before.height, {threshold: 0.1});
      const ratio = changed / (before.width * before.height);
      if (ratio > TOLERANCE) {
        writeFileSync(join(DIFFS, name), PNG.sync.write(diff));
        failures.push(`${name}: ${changed} px changed (${(ratio * 100).toFixed(3)}%) -> tests/visual-diffs/${name}`);
      }
    }
    await context.close();
  }

  await browser.close();
  server.close();

  if (capture) {
    console.log(`Captured ${pages.length * WIDTHS.length} baseline screenshots into tests/visual-baseline/.`);
    return;
  }
  if (failures.length) {
    console.error(`Visual regressions in ${failures.length} of ${compared} screenshots:`);
    failures.forEach(f => console.error(`  ${f}`));
    process.exit(1);
  }
  console.log(`No visual change across ${compared} screenshots (${pages.length} pages x ${WIDTHS.join('/')}px).`);
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
