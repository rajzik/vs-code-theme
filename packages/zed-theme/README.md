# Rajzik Theme for Zed

This package contains the Zed version of Rajzik Theme.

The theme JSON in `themes/rajzik.json` is generated from the VS Code source theme in `../vscode-theme/themes/rajzik_dark.json`.

## Local Development

```sh
pnpm install
pnpm --filter rajzik-zed-theme run generate
```

Then open Zed and install this package as a dev extension:

1. Open **Extensions**.
2. Run **Install Dev Extension**.
3. Select `packages/zed-theme`.
4. Choose **Rajzik Dark** from the theme picker.

## Publishing

When publishing to Zed's extension registry, reference this package directory as the extension path in the `zed-industries/extensions` repository and keep `extension.toml`, `LICENSE`, and `themes/rajzik.json` in sync.

The current monorepo release automation still targets the VS Code extension only. Zed registry publishing remains a manual follow-up step for now.

Zed extension publishing docs: https://zed.dev/docs/extensions/developing-extensions
