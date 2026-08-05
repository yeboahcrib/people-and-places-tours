const {chromium} = require('playwright');
const http = require('node:http');
const {createReadStream, existsSync} = require('node:fs');
const {extname, join, normalize} = require('node:path');

// These checks only make sense against dist/. The homepage and the packages
// grid are assembled at build time, so the editable source tree legitimately
// has an empty homepage shell and no tour cards — pointing this suite at the
// dev server reports failures that are not real. Serve dist/ ourselves rather
// than relying on whoever runs this to remember a port.
const DIST_ROOT = join(__dirname, '..', 'dist');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function serveDist() {
  if (!existsSync(DIST_ROOT)) {
    throw new Error('dist/ is missing — run `npm run build` before this suite, or set BASE_URL to an already-served build.');
  }
  const server = http.createServer((request, response) => {
    const path = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const relative = normalize(path).replace(/^(\.\.[/\\])+/, '').replace(/^[/\\]+/, '');
    const file = join(DIST_ROOT, relative || 'index.html');
    if (!file.startsWith(DIST_ROOT) || !existsSync(file)) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, {'Content-Type': MIME[extname(file)] || 'application/octet-stream'});
    createReadStream(file).pipe(response);
  });
  return new Promise(resolve => {
    server.listen(0, '127.0.0.1', () => resolve({server, origin: `http://127.0.0.1:${server.address().port}`}));
  });
}

(async () => {
  // An explicit BASE_URL still wins, for CI setups that already serve a build.
  const hosted = process.env.BASE_URL ? null : await serveDist();
  const BASE_URL = process.env.BASE_URL || hosted.origin;

  const browser = await chromium.launch({headless: true});
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: {width: 375, height: 900},
    reducedMotion: 'reduce',
  });

  const home = await context.newPage();
  // Wait for stylesheets as well as HTML. Measuring layout at
  // `domcontentloaded` can briefly report overflow before CSS is applied.
  await home.goto(`${BASE_URL}/index.html`, {waitUntil: 'load'});
  const homeState = await home.evaluate(() => ({
    sections: document.querySelectorAll('[data-home-section]').length,
    cards: document.querySelectorAll('.trip-card').length,
    h1: document.querySelector('h1')?.textContent.trim(),
    invisibleContent: [...document.querySelectorAll('.reveal')].filter(element => getComputedStyle(element).opacity === '0').length,
  }));
  assert(homeState.sections === 7, `JavaScript-free homepage has ${homeState.sections} sections`);
  assert(homeState.cards === 0, `JavaScript-free homepage still has ${homeState.cards} featured tours`);
  assert(homeState.h1, 'JavaScript-free homepage has no h1');
  assert(homeState.invisibleContent === 0, `JavaScript-free homepage hides ${homeState.invisibleContent} reveal elements`);

  const packages = await context.newPage();
  await packages.goto(`${BASE_URL}/packages.html`, {waitUntil: 'load'});
  const packageState = await packages.evaluate(() => ({
    cards: document.querySelectorAll('.tour-card').length,
    detailLinks: document.querySelectorAll('.tour-card-stretched-link').length,
    inquiryLinks: document.querySelectorAll('.tour-card-book-btn').length,
    width: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
    viewport: document.documentElement.clientWidth,
    overflowing: [...document.querySelectorAll('body *')]
      .map(element => {
        const rect = element.getBoundingClientRect();
        return {tag: element.tagName, className: String(element.className || '').slice(0, 100), left: Math.round(rect.left), right: Math.round(rect.right), width: Math.round(rect.width)};
      })
      .filter(rect => rect.right > document.documentElement.clientWidth + 1 || rect.left < -1)
      .slice(0, 10),
  }));
  assert(packageState.cards === 15, `JavaScript-free packages page has ${packageState.cards} tours`);
  assert(packageState.detailLinks === 15, 'JavaScript-free tour detail links are incomplete');
  assert(packageState.inquiryLinks === 15, 'JavaScript-free inquiry links are incomplete');
  assert(packageState.width <= packageState.viewport + 1, `JavaScript-free packages page overflows horizontally: ${JSON.stringify(packageState.overflowing)}`);

  await context.close();
  await browser.close();
  if (hosted) hosted.server.close();
  console.log('JavaScript-free resilient-rendering checks passed against dist/.');
})().catch(error => {
  console.error(error.message);
  process.exit(1);
});
