# Monorepo Scripts and Vitest Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the release notes utility into a top-level `scripts/` directory, migrate its test to Vitest, add a root test command, and run tests in pull request CI.

**Architecture:** Keep repository automation as root-owned tooling rather than package-owned extension code. The implementation creates a top-level `scripts/` directory, converts the existing Node test to a Vitest test at the repo root, and updates root package/workflow wiring without changing the release notes script behavior.

**Tech Stack:** Node.js, pnpm, Vitest, GitHub Actions

---

**Execution note:** The commit checkpoints below document safe breakpoints. Only create git commits during execution if the user explicitly requests them.

---

## File Map

- Create `scripts/release-notes.mjs` for the repo-level changelog extraction utility
- Create `scripts/release-notes.test.mjs` for the Vitest regression test
- Modify `package.json` to add the root `test` script and `vitest`
- Modify `.github/workflows/pull-request.yml` to run tests
- Modify `.github/workflows/release.yml` to use `scripts/release-notes.mjs`
- Remove `.github/scripts/release-notes.mjs`
- Remove `.github/scripts/release-notes.test.mjs`

### Task 1: Add the failing Vitest test at the new root location

**Files:**
- Create: `scripts/release-notes.test.mjs`
- Test: `scripts/release-notes.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const scriptPath = fileURLToPath(new URL('./release-notes.mjs', import.meta.url));

describe('release-notes', () => {
  it('selects the exact release heading instead of a prerelease heading', () => {
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

    const output = execFileSync(process.execPath, [scriptPath, changelogPath, '1.0.0'], {
      encoding: 'utf8',
    });

    expect(output).toBe('## 1.0.0\n\n- Stable release notes');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run scripts/release-notes.test.mjs`

Expected: FAIL because `vitest` is not installed yet or the script file does not exist at `scripts/release-notes.mjs`.

- [ ] **Step 3: Commit**

```bash
git add scripts/release-notes.test.mjs
git commit -m "test: add failing root vitest test"
```

### Task 2: Add the minimal root test wiring

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add the root test command and Vitest dependency**

```json
{
  "scripts": {
    "changeset": "changeset",
    "format": "oxfmt . && turbo run format --continue",
    "format:fix": "oxfmt --write . && turbo run format --continue -- --write",
    "package": "turbo run package",
    "release": "turbo run release",
    "test": "vitest run scripts/**/*.test.mjs",
    "version": "changeset version"
  },
  "devDependencies": {
    "@changesets/changelog-github": "^0.5.1",
    "@changesets/cli": "^2.29.7",
    "oxfmt": "catalog:",
    "prettier": "^3.6.2",
    "turbo": "^2.5.8",
    "vitest": "latest"
  }
}
```

- [ ] **Step 2: Install dependencies**

Run: `pnpm install`

Expected: lockfile updated and `vitest` installed successfully.

- [ ] **Step 3: Run the new test again to verify it still fails for the right reason**

Run: `pnpm test`

Expected: FAIL because `scripts/release-notes.mjs` has not been created yet.

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "build: add root vitest test command"
```

### Task 3: Move the release notes script and make the test pass

**Files:**
- Create: `scripts/release-notes.mjs`
- Modify: `scripts/release-notes.test.mjs`
- Remove: `.github/scripts/release-notes.mjs`

- [ ] **Step 1: Create the root script with the existing implementation**

```js
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
```

- [ ] **Step 2: Run the test to verify it passes**

Run: `pnpm test`

Expected: PASS with the single Vitest test green.

- [ ] **Step 3: Remove the old script copy**

Run: `rm .github/scripts/release-notes.mjs`

Expected: only the new root-owned script remains.

- [ ] **Step 4: Commit**

```bash
git add scripts/release-notes.mjs .github/scripts/release-notes.mjs
git commit -m "refactor: move release notes script to root"
```

### Task 4: Update CI and remove the old Node test

**Files:**
- Modify: `.github/workflows/pull-request.yml`
- Modify: `.github/workflows/release.yml`
- Remove: `.github/scripts/release-notes.test.mjs`

- [ ] **Step 1: Update the pull request workflow to run tests**

```yaml
name: Pull Request

on:
  pull_request:

permissions:
  contents: read

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: lts/*
          cache: pnpm

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test

      - name: Check formatting
        run: pnpm format
```

- [ ] **Step 2: Update the release workflow script path**

```yaml
      - name: Build release notes
        if: steps.version.outputs.changed == 'true'
        run: |
          node scripts/release-notes.mjs \
            packages/vscode-theme/CHANGELOG.md \
            "${{ steps.version.outputs.current }}" > release-notes.md
```

- [ ] **Step 3: Remove the old Node test file**

Run: `rm .github/scripts/release-notes.test.mjs`

Expected: only the Vitest test under `scripts/` remains.

- [ ] **Step 4: Run the full verification commands**

Run: `pnpm test`
Expected: PASS

Run: `pnpm format`
Expected: exit code 0

- [ ] **Step 5: Commit**

```bash
git add .github/workflows/pull-request.yml .github/workflows/release.yml .github/scripts/release-notes.test.mjs
git commit -m "ci: run root tests in pull requests"
```

### Task 5: Final review against the spec

**Files:**
- Modify: none
- Test: `scripts/release-notes.test.mjs`

- [ ] **Step 1: Verify file layout**

Run: `git diff --name-status`

Expected entries include:
- `A scripts/release-notes.mjs`
- `A scripts/release-notes.test.mjs`
- `D .github/scripts/release-notes.mjs`
- `D .github/scripts/release-notes.test.mjs`

- [ ] **Step 2: Verify requirements one by one**

Checklist:
- root `scripts/` directory exists
- Vitest test exists at `scripts/release-notes.test.mjs`
- root `package.json` has a `test` script
- PR workflow runs `pnpm test`
- release workflow uses `scripts/release-notes.mjs`
- `pnpm test` passes without changing release-note extraction behavior

- [ ] **Step 3: Final verification**

Run: `pnpm test`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "test: migrate repo script test to vitest"
```
