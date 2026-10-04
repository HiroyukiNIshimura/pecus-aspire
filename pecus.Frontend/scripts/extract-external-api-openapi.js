#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');

const HTTP_METHODS = new Set(['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace']);
const DEFAULT_TAG = 'ExternalAPI';
const DEFAULT_INPUT = path.join(__dirname, '../.spec/open-api-scheme.json');
const DEFAULT_OUTPUT = path.join(__dirname, '../.spec/external-api-openapi-scheme.json');

function parseArguments(args) {
  const options = {
    input: DEFAULT_INPUT,
    output: DEFAULT_OUTPUT,
    tag: DEFAULT_TAG,
    help: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--help' || argument === '-h') {
      options.help = true;
      continue;
    }

    const optionNames = {
      '--input': 'input',
      '--output': 'output',
      '--tag': 'tag',
    };
    const optionName = optionNames[argument];
    if (!optionName) {
      throw new Error(`Unknown option: ${argument}`);
    }

    const value = args[index + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for ${argument}`);
    }

    options[optionName] = value;
    index += 1;
  }

  return options;
}

function getOperations(pathItem) {
  return Object.entries(pathItem ?? {}).filter(
    ([method, operation]) => HTTP_METHODS.has(method.toLowerCase()) && operation && typeof operation === 'object',
  );
}

function getAvailableTags(paths) {
  const tags = new Set();

  for (const pathItem of Object.values(paths ?? {})) {
    for (const [, operation] of getOperations(pathItem)) {
      for (const tag of operation.tags ?? []) {
        tags.add(tag);
      }
    }
  }

  return [...tags].sort();
}

function filterPathItems(pathItems, tag) {
  const filteredPathItems = {};
  let operationCount = 0;

  for (const [route, pathItem] of Object.entries(pathItems ?? {})) {
    const filteredPathItem = { ...pathItem };
    let hasMatchingOperation = false;

    for (const [method, operation] of getOperations(pathItem)) {
      if (operation.tags?.includes(tag)) {
        hasMatchingOperation = true;
        operationCount += 1;
      } else {
        delete filteredPathItem[method];
      }
    }

    if (hasMatchingOperation) {
      filteredPathItems[route] = filteredPathItem;
    }
  }

  return { pathItems: filteredPathItems, operationCount };
}

function decodeJsonPointerSegment(segment) {
  return decodeURIComponent(segment.replace(/~1/g, '/').replace(/~0/g, '~'));
}

function getComponentReference(ref) {
  if (!ref.startsWith('#/components/')) {
    return null;
  }

  const [, , section, name] = ref.split('/');
  if (!section || !name) {
    return null;
  }

  return { section, name: decodeJsonPointerSegment(name) };
}

function collectReferences(value, pendingReferences) {
  if (Array.isArray(value)) {
    for (const entry of value) {
      collectReferences(entry, pendingReferences);
    }
    return;
  }

  if (!value || typeof value !== 'object') {
    return;
  }

  if (typeof value.$ref === 'string') {
    const reference = getComponentReference(value.$ref);
    if (reference) {
      pendingReferences.push(reference);
    }
  }

  if (Array.isArray(value.security)) {
    for (const requirement of value.security) {
      for (const name of Object.keys(requirement ?? {})) {
        pendingReferences.push({ section: 'securitySchemes', name });
      }
    }
  }

  for (const child of Object.values(value)) {
    collectReferences(child, pendingReferences);
  }
}

function collectReferencedComponents(spec, selectedPathItems) {
  const sourceComponents = spec.components ?? {};
  const pendingReferences = [];
  const selectedComponents = {};
  const visited = new Set();

  collectReferences(selectedPathItems, pendingReferences);
  collectReferences(spec.security, pendingReferences);

  while (pendingReferences.length > 0) {
    const { section, name } = pendingReferences.pop();
    const key = `${section}/${name}`;
    if (visited.has(key)) {
      continue;
    }
    visited.add(key);

    const definition = sourceComponents[section]?.[name];
    if (definition === undefined) {
      continue;
    }

    selectedComponents[section] ??= {};
    selectedComponents[section][name] = definition;
    collectReferences(definition, pendingReferences);
  }

  return selectedComponents;
}

function extractByTag(spec, tag) {
  if (!spec || typeof spec !== 'object' || !spec.paths) {
    throw new Error('The input file is not a valid OpenAPI document with paths.');
  }

  const { pathItems, operationCount } = filterPathItems(spec.paths, tag);
  if (operationCount === 0) {
    const availableTags = getAvailableTags(spec.paths);
    const availableTagMessage = availableTags.length > 0 ? availableTags.join(', ') : '(none)';
    throw new Error(`No operations found for tag "${tag}". Available tags: ${availableTagMessage}`);
  }

  const extractedSpec = {
    ...spec,
    paths: pathItems,
    components: collectReferencedComponents(spec, pathItems),
  };

  if (Array.isArray(spec.tags)) {
    extractedSpec.tags = spec.tags.filter((definition) => definition.name === tag);
  }

  if (Object.keys(extractedSpec.components).length === 0) {
    delete extractedSpec.components;
  }

  return { spec: extractedSpec, operationCount };
}

function printUsage() {
  console.log(`Usage: node scripts/extract-external-api-openapi.js [options]

Extracts operations tagged "${DEFAULT_TAG}" from .spec/open-api-scheme.json.

Options:
  --tag <name>       Operation tag to extract (default: ${DEFAULT_TAG})
  --input <path>     Source OpenAPI JSON path
  --output <path>    Destination OpenAPI JSON path
  -h, --help         Show this help`);
}

function main(args = process.argv.slice(2)) {
  try {
    const options = parseArguments(args);
    if (options.help) {
      printUsage();
      return;
    }

    const inputPath = path.resolve(options.input);
    const outputPath = path.resolve(options.output);
    const source = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
    const { spec, operationCount } = extractByTag(source, options.tag);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(spec, null, 2)}\n`, 'utf8');

    console.log(`Extracted ${operationCount} operations tagged "${options.tag}".`);
    console.log(`Source: ${inputPath}`);
    console.log(`Output: ${outputPath}`);
  } catch (error) {
    console.error(`Failed to extract OpenAPI operations: ${error.message}`);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main();
}

module.exports = { extractByTag, main };
