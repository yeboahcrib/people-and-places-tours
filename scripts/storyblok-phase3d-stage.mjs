import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';

const DEFAULT_SPACE_ID = '294832753590557';

function usage() {
  throw new Error('Usage: node scripts/storyblok-phase3d-stage.mjs <schema|list-item> --source <component.json> --out <directory> [--space <id>]');
}

function options(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (!key.startsWith('--')) continue;
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) usage();
    values[key.slice(2)] = value;
    index += 1;
  }
  return values;
}

function stagedTourComponent(component) {
  const schema = structuredClone(component.schema || {});
  if (component.name !== 'tour' || !schema.card_image || !schema.good_to_know || !schema.gallery) {
    throw new Error('The supplied component is not the reviewed Tour schema.');
  }

  // Free/Starter does not provide a durable conditional-required field rule.
  // Editors must be able to save a genuine content-ready draft while waiting
  // for approved photography. The build adapter remains strict: it will never
  // map a showable website Tour without a valid approved card Asset.
  schema.card_image = {
    ...schema.card_image,
    required: false,
    description: 'Add an approved original photo before this experience can appear on the website. You may save a draft while photography is pending.',
  };
  schema.gallery = {...schema.gallery, maximum_entries: 6};
  return {...component, schema};
}

function stagedListItemComponent(component) {
  const schema = structuredClone(component.schema || {});
  if (component.name !== 'list_item' || !schema.text) {
    throw new Error('The supplied component is not the reviewed reusable list-item schema.');
  }
  // Existing approved guest-facing facts reach 158 characters. Keep the
  // shared editor field concise, but do not force editors to shorten factual
  // content solely for a CMS limit that the current site does not have.
  schema.text = {...schema.text, max_length: 160};
  return {...component, schema};
}

async function stageComponent({source, output, space, componentName, transform, prefix}) {
  const component = JSON.parse(await readFile(resolve(source), 'utf8'));
  const target = resolve(output);
  if (!target.startsWith(prefix)) {
    throw new Error('Refusing to replace a staging directory outside ' + prefix + '.');
  }
  await rm(target, {recursive: true, force: true});
  const componentsDirectory = join(target, 'components', space);
  await mkdir(componentsDirectory, {recursive: true});
  await writeFile(
    join(componentsDirectory, componentName + '.json'),
    JSON.stringify(transform(component), null, 2) + '\n',
    'utf8',
  );
  console.log('Staged the Phase 3D ' + componentName + ' schema in ' + target + '.');
}

const [command, ...rest] = process.argv.slice(2);
const flags = options(rest);
if (command === 'schema' && flags.source && flags.out) {
  await stageComponent({
    source: flags.source,
    output: flags.out,
    space: flags.space || DEFAULT_SPACE_ID,
    componentName: 'tour',
    transform: stagedTourComponent,
    prefix: '/private/tmp/storyblok-phase3d-schema-',
  });
} else if (command === 'list-item' && flags.source && flags.out) {
  await stageComponent({
    source: flags.source,
    output: flags.out,
    space: flags.space || DEFAULT_SPACE_ID,
    componentName: 'list_item',
    transform: stagedListItemComponent,
    prefix: '/private/tmp/storyblok-phase3d-list-item-',
  });
} else {
  usage();
}
