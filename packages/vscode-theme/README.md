# Rajzik Theme

A dark Visual Studio Code theme with a calm charcoal editor surface, soft foreground contrast, and cool blue accents.

## Theme

- **Rajzik Dark**: a dark theme for long coding sessions.
- Balanced UI colors for the activity bar, side bar, editor, panels, diffs, and notifications.
- Syntax colors tuned for readable contrast without an overly saturated palette.

## Installation

Install the theme from one of the extension registries:

- [Visual Studio Code Marketplace](https://marketplace.visualstudio.com/items?itemName=rajzik.rajzik-theme)
- [Open VSX Registry](https://open-vsx.org/extension/rajzik/rajzik-theme)

You can also install it from VS Code:

1. Open **Extensions**.
2. Search for `Rajzik theme`.
3. Click **Install**.
4. Open **Preferences: Color Theme** and select **Rajzik Dark**.

## Local Development

```sh
pnpm install
pnpm --filter rajzik-theme run package
```

To test the extension locally, launch this workspace from VS Code and use the `Launch Extension` configuration.

## Package

The extension package is generated at `packages/vscode-theme/dist/rajzik-theme.vsix`:

```sh
pnpm --filter rajzik-theme run package
```

## License

MIT
