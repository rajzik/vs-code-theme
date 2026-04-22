import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const scriptPath = fileURLToPath(
  new URL('./release-notes.mjs', import.meta.url),
);

describe('release-notes', () => {
  it('prints usage and exits with code 1 when required args are missing', () => {
    expect(() =>
      execFileSync(process.execPath, [scriptPath], { encoding: 'utf8' }),
    ).toThrowError(
      expect.objectContaining({
        status: 1,
        stderr: 'Usage: node release-notes.mjs <changelog-path> <version>\n',
      }),
    );
  });

  it('prints fallback release text when the version heading is absent', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-notes-'));
    try {
      const changelogPath = path.join(tempDir, 'CHANGELOG.md');

      fs.writeFileSync(
        changelogPath,
        `## 0.9.0

- Previous release notes
`,
      );

      const output = execFileSync(
        process.execPath,
        [scriptPath, changelogPath, '1.0.0'],
        {
          encoding: 'utf8',
        },
      );

      expect(output).toBe('Release 1.0.0');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('outputs only the matching changelog section when the heading is present', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-notes-'));
    try {
      const changelogPath = path.join(tempDir, 'CHANGELOG.md');

      fs.writeFileSync(
        changelogPath,
        `## 1.1.0

- Latest release notes

## 1.0.0

- Stable release notes

## 0.9.0

- Older release notes
`,
      );

      const output = execFileSync(
        process.execPath,
        [scriptPath, changelogPath, '1.0.0'],
        {
          encoding: 'utf8',
        },
      );

      expect(output).toBe('## 1.0.0\n\n- Stable release notes');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('selects the exact release heading instead of a prerelease heading', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'release-notes-'));
    try {
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
        {
          encoding: 'utf8',
        },
      );

      expect(output).toBe('## 1.0.0\n\n- Stable release notes');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
