# Monorepo Script Relocation and Vitest Migration

## Goal

Move repository-level automation scripts out of `.github/scripts` into a top-level `scripts/` directory, migrate the existing release notes test from `node:test` to Vitest, add a repository test command, and run that command in the pull request workflow.

## Scope

In scope:

- Move `release-notes.mjs` to `scripts/release-notes.mjs`
- Move `release-notes.test.mjs` to `scripts/release-notes.test.mjs`
- Replace the current `node:test` test with a Vitest test
- Add the dependencies and scripts needed to run tests from the monorepo root
- Update GitHub Actions workflows to use the new script location and run tests in pull requests

Out of scope:

- Restructuring the extension package
- Adding package-level test suites where none exist today
- Refactoring unrelated release or packaging logic

## Current State

The repository currently contains one automation utility under `.github/scripts/`:

- `release-notes.mjs`, used by the release workflow to extract a specific changelog section
- `release-notes.test.mjs`, a `node:test` file that validates heading selection behavior

The pull request workflow currently installs dependencies and checks formatting only. There is no root `test` command and no Vitest dependency.

## Proposed Approach

Use the repository root as the home for repository-level tooling:

1. Create a top-level `scripts/` directory
2. Move the release notes script and its test into that directory
3. Install Vitest as a root development dependency
4. Add a root `test` script that runs Vitest against repository-level tests
5. Update workflows to run the moved script and execute tests in pull requests

This keeps release automation clearly repository-owned instead of attaching it to the extension package, while still giving CI and local development a single, predictable test entry point.

## Architecture and Boundaries

### Repository-level scripts

The release notes utility is a repository automation concern, not an extension runtime concern. It belongs in `scripts/` because:

- it is invoked from GitHub Actions
- it operates on repository files
- it is not shipped as part of the VS Code extension runtime

### Test runner ownership

Vitest will be installed and invoked from the root `package.json`. This test surface is intentionally scoped to repo utilities rather than package code. The root command will be the entry point used both locally and in CI.

### Command ownership

The root `test` script will run Vitest directly. These tests exercise repository tooling rather than a workspace package, so the executable command should remain root-owned instead of being forced through package-level Turbo orchestration.

## File Changes

Planned changes:

- Add `scripts/release-notes.mjs`
- Add `scripts/release-notes.test.mjs`
- Remove `.github/scripts/release-notes.mjs`
- Remove `.github/scripts/release-notes.test.mjs`
- Update `package.json`
- Update `.github/workflows/pull-request.yml`
- Update `.github/workflows/release.yml`

## Testing Strategy

Follow a test-first path for the migration:

1. Create the Vitest version of the existing release notes test in its new root location
2. Run that test before updating the implementation references, so the test initially fails due to missing setup or moved code expectations
3. Add Vitest configuration through package scripts and dependencies
4. Move/update the implementation and workflow references until the test passes
5. Run the repository test command as the final verification

The migrated test should preserve the current behavioral guarantee: selecting the exact release heading instead of matching a prerelease heading.

## Error Handling

The release notes script behavior remains unchanged:

- if arguments are missing, it exits with usage information
- if the requested version heading does not exist, it prints a fallback title
- if the heading exists, it prints only the matching changelog section

The migration should not alter those semantics.

## CI Plan

### Pull request workflow

Add a `Run tests` step after dependency installation. This step should call the root test command so pull requests validate the repository utility test suite.

### Release workflow

Update the release notes generation step to call `scripts/release-notes.mjs` instead of `.github/scripts/release-notes.mjs`.

## Risks and Mitigations

- Path regressions in GitHub Actions: mitigated by updating workflow references and running the test command locally
- Test runner mismatch after migration: mitigated by converting the test fully to Vitest APIs instead of mixing frameworks
- Over-scoping repo tests into package tests: mitigated by limiting the new test command to repository-level script tests only

## Success Criteria

- Repository scripts live under top-level `scripts/`
- `pnpm test` runs the migrated Vitest test successfully
- Pull request workflow runs tests
- Release workflow uses the new script path
- Existing release notes behavior remains unchanged
