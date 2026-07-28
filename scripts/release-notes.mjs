import { readFile } from 'node:fs/promises';

const [changelogPath, version] = process.argv.slice(2);

if (!changelogPath || !version) {
  console.error('Usage: node release-notes.mjs <changelog-path> <version>');
  process.exit(1);
}

async function main() {
  const changelog = await readFile(changelogPath, 'utf8');

  const escapedVersion = version.replaceAll(
    /[.*+?^${}()|[\]\\]/gu,
    String.raw`\$&`,
  );
  const headingPattern = new RegExp(`^## ${escapedVersion}\\r?$`, 'mu');
  const headingMatch = changelog.match(headingPattern);
  const startIndex = headingMatch?.index ?? -1;

  if (startIndex === -1) {
    process.stdout.write(`Release ${version}`);
    return;
  }

  const nextHeadingMatch = changelog
    .slice(startIndex + headingMatch[0].length)
    .match(/^## /mu);
  const nextHeadingIndex =
    nextHeadingMatch === null
      ? -1
      : startIndex + headingMatch[0].length + nextHeadingMatch.index;
  const endIndex =
    nextHeadingIndex === -1 ? changelog.length : nextHeadingIndex;
  const notes = changelog.slice(startIndex, endIndex).trim();

  process.stdout.write(notes);
}

async function run() {
  try {
    await main();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

// `node/no-top-level-await` forbids `await run()` in this published CLI module.
// oxlint-disable-next-line unicorn/prefer-top-level-await
void run();
