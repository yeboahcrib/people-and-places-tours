import {mkdir, readFile, rm, writeFile} from 'node:fs/promises';
import {join, resolve} from 'node:path';

const DEFAULT_SPACE_ID = '294832753590557';

function usage() {
  throw new Error(
    'Usage: node scripts/storyblok-phase3c-stage.mjs <schema|asset-folder> --out <directory> [options]',
  );
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
  if (!schema.overview || !schema.included_tab || !schema.gallery) {
    throw new Error('The supplied Storyblok Experience schema is not the reviewed Phase 3A schema.');
  }

  if (!schema.good_to_know) {
    for (const field of Object.values(schema)) {
      if (Number.isFinite(field?.pos) && field.pos >= 30) field.pos += 1;
    }
    schema.good_to_know = {
      type: 'bloks',
      display_name: 'Good to know',
      description: 'Add helpful facts guests see on this experience, in the order you want them shown.',
      required: true,
      restrict_components: true,
      minimum_entries: 1,
      maximum_entries: 6,
      component_whitelist: ['list_item'],
      pos: 30,
    };
  }

  // The renderer has an established three-to-six photo contract. Keeping the
  // editor maximum at six makes an overlong gallery impossible rather than
  // silently discarding photos at build time.
  schema.gallery = {...schema.gallery, maximum_entries: 6};

  return {...component, schema};
}

async function stageSchema({source, output, space}) {
  const component = JSON.parse(await readFile(resolve(source), 'utf8'));
  if (component.name !== 'tour') throw new Error('Expected the Storyblok tour component source.');

  const target = resolve(output);
  await rm(target, {recursive: true, force: true});
  const componentDirectory = join(target, 'components', space);
  await mkdir(componentDirectory, {recursive: true});
  await writeFile(
    join(componentDirectory, 'tour.json'),
    JSON.stringify(stagedTourComponent(component), null, 2) + '\n',
    'utf8',
  );
  console.log('Staged the minimal Phase 3C Experience schema in ' + target + '.');
}

const [command, ...rest] = process.argv.slice(2);
const flags = options(rest);
const space = flags.space || DEFAULT_SPACE_ID;
if (command === 'schema' && flags.source && flags.out) {
  await stageSchema({source: flags.source, output: flags.out, space});
} else if (command === 'asset-folder' && flags.out && flags.parent && flags.name) {
  const parentId = Number(flags.parent);
  const localId = Number(flags.id || '-30000001');
  if (!Number.isSafeInteger(parentId) || !Number.isSafeInteger(localId) || !flags.name.trim()) usage();
  const target = resolve(flags.out);
  await rm(target, {recursive: true, force: true});
  const folderDirectory = join(target, 'assets', space, 'folders');
  await mkdir(folderDirectory, {recursive: true});
  await writeFile(
    join(folderDirectory, 'standard-tours_' + localId + '.json'),
    JSON.stringify({id: localId, name: flags.name.trim(), parent_id: parentId}, null, 2) + '\n',
    'utf8',
  );
  console.log('Staged the Standard Tours asset folder in ' + target + '.');
} else {
  usage();
}
