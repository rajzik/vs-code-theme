import { execFile as execFileCallback } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

import { describe, expect, it } from 'vitest';

const scriptPath = fileURLToPath(new URL('release-notes.mjs', import.meta.url));
const execFile = promisify(execFileCallback);

describe('release-notes', () => {
  it('prints usage and exits with code 1 when required args are missing', async () => {
    await expect(
      execFile(process.execPath, [scriptPath], { encoding: 'utf8' }),
    ).rejects.toMatchObject({
      code: 1,
      stderr: 'Usage: node release-notes.mjs <changelog-path> <version>\n',
    });
  });

  it('prints fallback release text when the version heading is absent', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'release-notes-'));
    try {
      const changelogPath = path.join(tempDir, 'CHANGELOG.md');

      await fs.writeFile(
        changelogPath,
        `## 0.9.0

- Previous release notes
`,
      );

      const { stdout } = await execFile(
        process.execPath,
        [scriptPath, changelogPath, '1.0.0'],
        {
          encoding: 'utf8',
        },
      );

      expect(stdout).toBe('Release 1.0.0');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('outputs only the matching changelog section when the heading is present', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'release-notes-'));
    try {
      const changelogPath = path.join(tempDir, 'CHANGELOG.md');

      await fs.writeFile(
        changelogPath,
        `## 1.1.0

- Latest release notes

## 1.0.0

- Stable release notes

## 0.9.0

- Older release notes
`,
      );

      const { stdout } = await execFile(
        process.execPath,
        [scriptPath, changelogPath, '1.0.0'],
        {
          encoding: 'utf8',
        },
      );

      expect(stdout).toBe('## 1.0.0\n\n- Stable release notes');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });

  it('selects the exact release heading instead of a prerelease heading', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'release-notes-'));
    try {
      const changelogPath = path.join(tempDir, 'CHANGELOG.md');

      await fs.writeFile(
        changelogPath,
        `## 1.0.0-rc.1

- Release candidate notes

## 1.0.0

- Stable release notes
`,
      );

      const { stdout } = await execFile(
        process.execPath,
        [scriptPath, changelogPath, '1.0.0'],
        {
          encoding: 'utf8',
        },
      );

      expect(stdout).toBe('## 1.0.0\n\n- Stable release notes');
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
