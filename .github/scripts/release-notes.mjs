import fs from "node:fs";

const [, , changelogPath, version] = process.argv;

if (!changelogPath || !version) {
  console.error("Usage: node release-notes.mjs <changelog-path> <version>");
  process.exit(1);
}

const changelog = fs.readFileSync(changelogPath, "utf8");
const heading = `## ${version}`;
const startIndex = changelog.indexOf(heading);

if (startIndex === -1) {
  process.stdout.write(`Release ${version}`);
  process.exit(0);
}

const nextHeadingIndex = changelog.indexOf(
  "\n## ",
  startIndex + heading.length
);
const endIndex = nextHeadingIndex === -1 ? changelog.length : nextHeadingIndex;
const notes = changelog.slice(startIndex, endIndex).trim();

process.stdout.write(notes);
