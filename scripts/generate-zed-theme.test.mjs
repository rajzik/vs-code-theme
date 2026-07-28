import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  buildZedThemeFamily,
  generateZedTheme,
  parseJsonc,
} from './generate-zed-theme.mjs';

const fixtureThemePath = path.resolve(
  'packages/vscode-theme/themes/rajzik_dark.json',
);
const fixturePackagePath = path.resolve('packages/vscode-theme/package.json');

describe('generate-zed-theme', () => {
  it('parses JSONC theme input with comments intact in the source file', async () => {
    const sourceThemeText = await fs.readFile(fixtureThemePath, 'utf8');

    const parsedTheme = parseJsonc(sourceThemeText);

    expect(parsedTheme.name).toBe('Rajzik Dark');
    expect(parsedTheme.tokenColors).toBeInstanceOf(Array);
    expect(parsedTheme.semanticTokenColors.numberLiteral).toBe('#B5CEA8');
  });

  it('builds a Zed theme family with mapped core editor and syntax colors', async () => {
    const [sourceThemeText, sourcePackageText] = await Promise.all([
      fs.readFile(fixtureThemePath, 'utf8'),
      fs.readFile(fixturePackagePath, 'utf8'),
    ]);

    const zedTheme = buildZedThemeFamily(
      parseJsonc(sourceThemeText),
      JSON.parse(sourcePackageText),
    );
    const [generatedTheme] = zedTheme.themes;
    const { style } = generatedTheme;

    expect(zedTheme.$schema).toBe('https://zed.dev/schema/themes/v0.2.0.json');
    expect(generatedTheme.name).toBe('Rajzik Dark');
    expect(style['editor.background']).toBe('#181818');
    expect(style['editor.foreground']).toBe('#E4E4E4EB');
    expect(style.syntax.keyword.color).toBe('#569CD6');
    expect(style.syntax.string.color).toBe('#CE9178');
    expect(style['terminal.ansi.red']).toBe('#AB4642');
  });

  it('generates stable output when run repeatedly', async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'zed-theme-'));

    try {
      const firstOutputPath = path.join(tempDir, 'rajzik-first.json');
      const secondOutputPath = path.join(tempDir, 'rajzik-second.json');

      await generateZedTheme({
        outputThemePath: firstOutputPath,
      });
      await generateZedTheme({
        outputThemePath: secondOutputPath,
      });

      const [firstOutput, secondOutput] = await Promise.all([
        fs.readFile(firstOutputPath, 'utf8'),
        fs.readFile(secondOutputPath, 'utf8'),
      ]);

      expect(firstOutput).toBe(secondOutput);
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  });
});
