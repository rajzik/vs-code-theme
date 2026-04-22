import fs from 'node:fs';

const [, , changelogPath, version] = process.argv;

if (!changelogPath || !version) {
  console.error('Usage: node release-notes.mjs <changelog-path> <version>');
  process.exit(1);
}

const changelog = fs.readFileSync(changelogPath, 'utf8');
const escapedVersion = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const headingPattern = new RegExp(`^## ${escapedVersion}\\r?$`, 'm');
const headingMatch = changelog.match(headingPattern);
const startIndex = headingMatch?.index ?? -1;

if (startIndex === -1) {
  process.stdout.write(`Release ${version}`);
  process.exit(0);
}

const nextHeadingMatch = changelog
  .slice(startIndex + headingMatch[0].length)
  .match(/^## /m);
const nextHeadingIndex =
  nextHeadingMatch === null
    ? -1
    : startIndex + headingMatch[0].length + nextHeadingMatch.index;
const endIndex = nextHeadingIndex === -1 ? changelog.length : nextHeadingIndex;
const notes = changelog.slice(startIndex, endIndex).trim();

process.stdout.write(notes);
