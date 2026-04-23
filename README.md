# Rajzik VS Code Theme

This repository uses `pnpm` workspaces and Turborepo to manage the VS Code theme package in `packages/vscode-theme`.

## Commands

```sh
pnpm install
pnpm format
pnpm package
pnpm changeset
```

## Release flow

Changesets opens a release pull request from changeset files merged into `main`. When that release is merged, GitHub creates a release and a separate workflow publishes the extension to the Visual Studio Code Marketplace.
