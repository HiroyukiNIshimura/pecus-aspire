#!/usr/bin/env node
/**
 * Convert a JPEG image to WebP without overwriting existing files.
 *
 * Usage:
 *   node scripts/convert-to-webp.js <input.jpg|input.jpeg> [output.webp] [--keep]
 *
 * Paths are resolved relative to the repository root unless absolute.
 * The source JPEG is deleted after a successful conversion unless --keep is set.
 */

const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

const REPOSITORY_ROOT = path.resolve(__dirname, '..');

function resolvePath(value) {
  return path.resolve(REPOSITORY_ROOT, value);
}

async function main() {
  const argumentsList = process.argv.slice(2);

  if (argumentsList.includes('--help') || argumentsList.includes('-h')) {
    console.log('Usage: node scripts/convert-to-webp.js <input.jpg|input.jpeg> [output.webp] [--keep]');
    return;
  }

  const keepSource = argumentsList.includes('--keep');
  const positionalArguments = argumentsList.filter((argument) => argument !== '--keep');
  const [inputArgument, outputArgument, ...extraArguments] = positionalArguments;

  if (!inputArgument || extraArguments.length > 0) {
    throw new Error('Usage: node scripts/convert-to-webp.js <input.jpg|input.jpeg> [output.webp] [--keep]');
  }

  const inputPath = resolvePath(inputArgument);
  const inputExtension = path.extname(inputPath).toLowerCase();
  if (inputExtension !== '.jpg' && inputExtension !== '.jpeg') {
    throw new Error(`Input must be a .jpg or .jpeg file: ${inputPath}`);
  }

  const outputPath = outputArgument
    ? resolvePath(outputArgument)
    : inputPath.slice(0, -inputExtension.length) + '.webp';
  if (path.extname(outputPath).toLowerCase() !== '.webp') {
    throw new Error(`Output must use the .webp extension: ${outputPath}`);
  }

  const image = sharp(inputPath).rotate();
  const metadata = await image.metadata();
  const webpBuffer = await image.webp({ quality: 90 }).toBuffer();

  // Exclusive creation ensures an existing image is never silently replaced.
  await fs.writeFile(outputPath, webpBuffer, { flag: 'wx' });

  if (keepSource) {
    console.log(`Kept source ${path.relative(REPOSITORY_ROOT, inputPath)} (--keep)`);
  } else {
    try {
      await fs.unlink(inputPath);
      console.log(`Removed source ${path.relative(REPOSITORY_ROOT, inputPath)}`);
    } catch (error) {
      throw new Error(
        `Converted WebP was created, but failed to remove source ${inputPath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  const dimensions = metadata.width && metadata.height ? ` (${metadata.width}x${metadata.height})` : '';
  console.log(
    `Converted ${path.relative(REPOSITORY_ROOT, inputPath)} -> ${path.relative(REPOSITORY_ROOT, outputPath)}${dimensions}`,
  );
}

main().catch((error) => {
  console.error(`Image conversion failed: ${error.message}`);
  process.exitCode = 1;
});
