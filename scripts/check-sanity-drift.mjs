/**
 * Report whether Sanity still holds the same content as the committed files.
 *
 * The site can be built from either source. While the deployed build reads the
 * committed content, Sanity receives no traffic and nothing reveals that it has
 * fallen behind — which is how its menu labels, contact details and all fifteen
 * tour descriptions came to be months out of date without anyone noticing.
 *
 * This builds the site both ways and compares the rendered pages. Identical
 * output means Sanity is current and the build could be switched over safely.
 * Any difference is drift, and the affected pages are named.
 *
 *   npm run check:sanity
 *
 * Reads the project id from the environment, falling back to studio/.env.
 * Exits non-zero on drift so it can gate a release if that is ever wanted.
 */
import {execFileSync} from 'node:child_process';
import {cp, mkdtemp, readFile, readdir, rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const projectRoot = process.cwd();
const dist = join(projectRoot, 'dist');

async function sanityCredentials() {
  if (process.env.SANITY_STUDIO_PROJECT_ID) {
    return {
      SANITY_STUDIO_PROJECT_ID: process.env.SANITY_STUDIO_PROJECT_ID,
      SANITY_STUDIO_DATASET: process.env.SANITY_STUDIO_DATASET || 'production',
    };
  }
  const envFile = join(projectRoot, 'studio', '.env');
  if (!existsSync(envFile)) return null;
  const text = await readFile(envFile, 'utf8');
  const read = key => text.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim();
  const projectId = read('SANITY_STUDIO_PROJECT_ID');
  if (!projectId || projectId === 'REPLACE_WITH_PROJECT_ID') return null;
  return {
    SANITY_STUDIO_PROJECT_ID: projectId,
    SANITY_STUDIO_DATASET: read('SANITY_STUDIO_DATASET') || 'production',
  };
}

// The build validates as it goes, so a failure here is a real problem rather
// than something to work around. Output is captured so the comparison is not
// buried under two full build logs.
function build(extraEnv) {
  try {
    execFileSync('node', ['scripts/build-static.mjs'], {
      cwd: projectRoot,
      env: {...process.env, ...extraEnv},
      stdio: 'pipe',
    });
  } catch (error) {
    const detail = (error.stderr || error.stdout || Buffer.from('')).toString().trim();
    throw new Error(`Build failed${detail ? `:\n${detail.split('\n').slice(-6).join('\n')}` : ''}`);
  }
}

async function snapshot(label, extraEnv) {
  build(extraEnv);
  const target = await mkdtemp(join(tmpdir(), `pap-${label}-`));
  await cp(dist, target, {recursive: true});
  return target;
}

// Only rendered pages are compared. health.json carries a build timestamp and
// the source name, so it differs by design and would report drift every time.
async function comparePages(a, b) {
  const pages = (await readdir(a)).filter(name => name.endsWith('.html')).sort();
  const differing = [];
  for (const page of pages) {
    const [left, right] = await Promise.all([
      readFile(join(a, page), 'utf8'),
      readFile(join(b, page), 'utf8').catch(() => null),
    ]);
    if (right === null) { differing.push({page, lines: null}); continue; }
    if (left === right) continue;
    const leftLines = left.split('\n');
    const rightLines = right.split('\n');
    let changed = 0;
    for (let i = 0; i < Math.max(leftLines.length, rightLines.length); i += 1) {
      if (leftLines[i] !== rightLines[i]) changed += 1;
    }
    differing.push({page, lines: changed});
  }
  return {pages, differing};
}

const credentials = await sanityCredentials();
if (!credentials) {
  console.log('No Sanity project configured — set SANITY_STUDIO_PROJECT_ID or add it to studio/.env.');
  console.log('Nothing to compare.');
  process.exit(0);
}

console.log(`Comparing builds for Sanity project ${credentials.SANITY_STUDIO_PROJECT_ID} (${credentials.SANITY_STUDIO_DATASET}).\n`);

let fromSanity;
let fromFiles;
try {
  process.stdout.write('  building from Sanity...   ');
  fromSanity = await snapshot('sanity', credentials);
  console.log('done');

  process.stdout.write('  building from files...    ');
  fromFiles = await snapshot('files', {
    SANITY_STUDIO_PROJECT_ID: '',
    SANITY_STUDIO_DATASET: '',
  });
  console.log('done\n');

  const {pages, differing} = await comparePages(fromFiles, fromSanity);

  if (differing.length === 0) {
    console.log(`Sanity matches the committed content — ${pages.length} pages identical.`);
    console.log('The build could be switched to Sanity without changing the site.');
  } else {
    console.log(`Sanity has drifted from the committed content on ${differing.length} of ${pages.length} pages:\n`);
    for (const {page, lines} of differing) {
      console.log(`  ${page.padEnd(28)} ${lines === null ? 'missing from the Sanity build' : `${lines} differing lines`}`);
    }
    console.log('\nRun `npm run sync:sanity` to push the committed content into Sanity, then check again.');
    process.exitCode = 1;
  }
} finally {
  // Leave dist/ built from the committed content, which is what every other
  // command in this project assumes.
  build({SANITY_STUDIO_PROJECT_ID: '', SANITY_STUDIO_DATASET: ''});
  await Promise.all([
    fromSanity && rm(fromSanity, {recursive: true, force: true}),
    fromFiles && rm(fromFiles, {recursive: true, force: true}),
  ]);
}
