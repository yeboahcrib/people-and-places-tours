// Serves dist/ the way Cloudflare Pages does, including extensionless URLs.
// Shared by the suites that must test the built site rather than the source:
// tour pages are generated from the CMS and have no file in the repository.
const http = require('node:http');
const {createReadStream, existsSync} = require('node:fs');
const {extname, join, normalize} = require('node:path');

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
    // Resolve extensionless URLs the way Cloudflare Pages does — /about serves
    // about.html. Internal links carry no extension, so a plain file server
    // would 404 on every one of them and this suite would be testing a site
    // that does not match production.
    const file = [relative || 'index.html', `${relative}.html`]
      .map(candidate => join(DIST_ROOT, candidate))
      .find(candidate => candidate.startsWith(DIST_ROOT) && existsSync(candidate)) || '';
    if (!file || !file.startsWith(DIST_ROOT) || !existsSync(file)) {
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


module.exports = {serveDist, DIST_ROOT};
