import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const scriptPath = fileURLToPath(new URL('./release-notes.mjs', import.meta.url));

test('selects the exact release heading instead of a prerelease heading', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-notes-'));
  const changelogPath = path.join(tempDir, 'CHANGELOG.md');

  fs.writeFileSync(
    changelogPath,
    `## 1.0.0-rc.1

- Release candidate notes

## 1.0.0

- Stable release notes
`,
  );

  const output = execFileSync(
    process.execPath,
    [scriptPath, changelogPath, '1.0.0'],
    { encoding: 'utf8' },
  );

  assert.equal(output, '## 1.0.0\n\n- Stable release notes');
});
