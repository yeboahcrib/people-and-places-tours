import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import vm from 'node:vm';

function runBrowserDataFile(source, fileName, context) {
  vm.runInContext(source, context, {filename: fileName, timeout: 1000});
}

export async function loadLocalTours(projectRoot) {
  const source = await readFile(join(projectRoot, 'tours.js'), 'utf8');
  const sandbox = {window: {}};
  const context = vm.createContext(sandbox);
  runBrowserDataFile(source, 'tours.js', context);
  const tours = sandbox.window.PEOPLE_PLACES_TOURS;
  if (!Array.isArray(tours) || tours.length === 0) throw new Error('Local tour catalogue is empty');
  return structuredClone(tours);
}

export async function loadLocalHomepageContent(projectRoot) {
  const contentSource = await readFile(join(projectRoot, 'homepage-content.js'), 'utf8');
  const sandbox = {window: {}};
  const context = vm.createContext(sandbox);
  runBrowserDataFile(contentSource, 'homepage-content.js', context);
  const content = sandbox.window.PEOPLE_PLACES_HOME;
  if (!content?.hero || !content?.finalInvitation) throw new Error('Local homepage content is incomplete');
  return structuredClone(content);
}

export async function renderHomepageContent(projectRoot, content) {
  const rendererSource = await readFile(join(projectRoot, 'homepage-sections.js'), 'utf8');
  const sandbox = {
    window: {PEOPLE_PLACES_HOME: content},
    document: {
      readyState: 'loading',
      addEventListener() {},
    },
  };
  const context = vm.createContext(sandbox);
  runBrowserDataFile(rendererSource, 'homepage-sections.js', context);
  const render = sandbox.window.PEOPLE_PLACES_RENDER_HOMEPAGE;
  if (typeof render !== 'function') throw new Error('Homepage renderer did not expose its build contract');
  const markup = render(content);
  if (!markup || !markup.includes('data-home-section="hero"')) throw new Error('Homepage build renderer returned incomplete markup');
  return markup;
}

export async function renderLocalHomepage(projectRoot) {
  return renderHomepageContent(projectRoot, await loadLocalHomepageContent(projectRoot));
}
