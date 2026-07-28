import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const scriptDir = import.meta.dirname;
const rootDir = path.resolve(scriptDir, '..');

const defaultSourceThemePath = path.join(
  rootDir,
  'packages',
  'vscode-theme',
  'themes',
  'rajzik_dark.json',
);
const defaultSourcePackagePath = path.join(
  rootDir,
  'packages',
  'vscode-theme',
  'package.json',
);
const defaultOutputThemePath = path.join(
  rootDir,
  'packages',
  'zed-theme',
  'themes',
  'rajzik.json',
);

function stripJsonComments(sourceText) {
  let output = '';
  let inString = false;
  let stringDelimiter = '';
  let isEscaped = false;

  for (let index = 0; index < sourceText.length; index += 1) {
    const currentCharacter = sourceText[index];
    const nextCharacter = sourceText[index + 1] ?? '';

    if (inString) {
      output += currentCharacter;

      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (currentCharacter === '\\') {
        isEscaped = true;
        continue;
      }

      if (currentCharacter === stringDelimiter) {
        inString = false;
        stringDelimiter = '';
      }

      continue;
    }

    if (currentCharacter === '"' || currentCharacter === "'") {
      inString = true;
      stringDelimiter = currentCharacter;
      output += currentCharacter;
      continue;
    }

    if (currentCharacter === '/' && nextCharacter === '/') {
      index += 2;

      while (index < sourceText.length && sourceText[index] !== '\n') {
        index += 1;
      }

      if (index < sourceText.length) {
        output += sourceText[index];
      }

      continue;
    }

    if (currentCharacter === '/' && nextCharacter === '*') {
      index += 2;

      while (
        index < sourceText.length - 1 &&
        !(sourceText[index] === '*' && sourceText[index + 1] === '/')
      ) {
        index += 1;
      }

      index += 1;
      continue;
    }

    output += currentCharacter;
  }

  return output;
}

function stripTrailingCommas(sourceText) {
  return sourceText.replaceAll(
    /,\s*(?<closingToken>[}\]])/gu,
    '$<closingToken>',
  );
}

export function parseJsonc(sourceText) {
  return JSON.parse(stripTrailingCommas(stripJsonComments(sourceText)));
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function parseHexColor(color) {
  if (typeof color !== 'string') {
    return null;
  }

  const normalized = color.trim().replace(/^#/u, '');

  if (![3, 4, 6, 8].includes(normalized.length)) {
    return null;
  }

  const expanded =
    normalized.length <= 4
      ? [...normalized].map((character) => character.repeat(2)).join('')
      : normalized;

  const red = Number.parseInt(expanded.slice(0, 2), 16);
  const green = Number.parseInt(expanded.slice(2, 4), 16);
  const blue = Number.parseInt(expanded.slice(4, 6), 16);
  const alpha =
    expanded.length === 8 ? Number.parseInt(expanded.slice(6, 8), 16) : 255;

  if ([red, green, blue, alpha].some(Number.isNaN)) {
    return null;
  }

  return { red, green, blue, alpha };
}

function toHexColor({ red, green, blue, alpha }) {
  return `#${[red, green, blue, alpha]
    .map((channel) =>
      clamp(Math.round(channel), 0, 255).toString(16).padStart(2, '0'),
    )
    .join('')
    .toUpperCase()}`;
}

function withAlpha(color, alpha) {
  const parsed = parseHexColor(color);

  if (!parsed) {
    return color;
  }

  return toHexColor({
    ...parsed,
    alpha: clamp(Math.round(alpha * 255), 0, 255),
  });
}

function mixColors(primaryColor, secondaryColor, amount) {
  const primary = parseHexColor(primaryColor);
  const secondary = parseHexColor(secondaryColor);

  if (!primary || !secondary) {
    return primaryColor ?? secondaryColor ?? null;
  }

  const weight = clamp(amount, 0, 1);

  return toHexColor({
    red: primary.red + (secondary.red - primary.red) * weight,
    green: primary.green + (secondary.green - primary.green) * weight,
    blue: primary.blue + (secondary.blue - primary.blue) * weight,
    alpha: primary.alpha + (secondary.alpha - primary.alpha) * weight,
  });
}

function darkenColor(color, amount = 0.2) {
  return mixColors(color, '#000000FF', amount);
}

function brightenColor(color, amount = 0.2) {
  return mixColors(color, '#FFFFFFFF', amount);
}

function firstDefined(colors, ...keys) {
  for (const key of keys) {
    const value = colors[key];

    if (value) {
      return value;
    }
  }

  return null;
}

function normalizeScopes(scope) {
  return Array.isArray(scope) ? scope : [scope];
}

function scopeMatches(scopeEntry, patterns) {
  return patterns.some(
    (pattern) => scopeEntry === pattern || scopeEntry.includes(pattern),
  );
}

function fontStyleToHighlightStyle(fontStyle) {
  if (!fontStyle) {
    return {};
  }

  const parts = fontStyle.split(/\s+/u);
  const style = {};

  if (parts.includes('italic')) {
    style.font_style = 'italic';
  } else if (parts.includes('oblique')) {
    style.font_style = 'oblique';
  }

  if (parts.includes('bold')) {
    style.font_weight = 700;
  }

  return style;
}

function themeSettingsToHighlightStyle(settings) {
  if (!settings) {
    return null;
  }

  const style = {
    background_color: settings.background ?? null,
    color: settings.foreground ?? null,
    ...fontStyleToHighlightStyle(settings.fontStyle),
  };

  return cleanObject(style);
}

function resolveTokenStyle(
  sourceTheme,
  { semanticKeys = [], scopePatterns = [] },
) {
  for (const semanticKey of semanticKeys) {
    const value = sourceTheme.semanticTokenColors?.[semanticKey];

    if (typeof value === 'string') {
      return { color: value };
    }

    if (value && typeof value === 'object') {
      const style = themeSettingsToHighlightStyle(value);

      if (style) {
        return style;
      }
    }
  }

  const tokenColors = sourceTheme.tokenColors ?? [];

  for (let index = tokenColors.length - 1; index >= 0; index -= 1) {
    const tokenColor = tokenColors[index];
    const scopes = normalizeScopes(tokenColor.scope ?? []);

    if (scopes.some((scope) => scopeMatches(scope, scopePatterns))) {
      return themeSettingsToHighlightStyle(tokenColor.settings);
    }
  }

  return null;
}

const syntaxDefinitions = {
  attribute: {
    scopePatterns: ['entity.other.attribute-name'],
  },
  boolean: {
    scopePatterns: ['constant.language.boolean'],
  },
  comment: {
    scopePatterns: ['comment'],
  },
  constant: {
    scopePatterns: ['constant'],
    semanticKeys: ['customLiteral'],
  },
  constructor: {
    scopePatterns: ['entity.name.type', 'support.class'],
  },
  embedded: {
    scopePatterns: ['meta.embedded', 'source.groovy.embedded'],
  },
  enum: {
    scopePatterns: ['variable.other.enummember'],
  },
  function: {
    scopePatterns: ['entity.name.function', 'support.function'],
  },
  hint: {
    scopePatterns: ['meta.diff.header'],
  },
  keyword: {
    scopePatterns: ['keyword', 'storage'],
    semanticKeys: ['newOperator'],
  },
  link_text: {
    scopePatterns: ['markup.underline.link'],
  },
  number: {
    scopePatterns: ['constant.numeric'],
    semanticKeys: ['numberLiteral'],
  },
  operator: {
    scopePatterns: ['keyword.operator', 'entity.name.operator'],
    semanticKeys: ['newOperator'],
  },
  preproc: {
    scopePatterns: ['meta.preprocessor'],
  },
  property: {
    scopePatterns: ['variable.other.property', 'support.type.property-name'],
  },
  punctuation: {
    scopePatterns: ['punctuation'],
  },
  string: {
    scopePatterns: ['string'],
    semanticKeys: ['stringLiteral'],
  },
  'string.escape': {
    scopePatterns: ['constant.character.escape'],
  },
  'string.regex': {
    scopePatterns: ['constant.regexp'],
  },
  tag: {
    scopePatterns: ['entity.name.tag'],
  },
  text: {
    scopePatterns: ['meta.diff', 'markup.inserted', 'markup.deleted'],
  },
  title: {
    scopePatterns: ['markup.heading', 'header'],
  },
  type: {
    scopePatterns: ['entity.name.type', 'storage.type', 'support.type'],
  },
  variable: {
    scopePatterns: ['variable', 'entity.name.namespace'],
  },
  'variable.special': {
    scopePatterns: ['variable.language', 'variable.legacy.builtin.python'],
  },
};

function buildSyntax(sourceTheme) {
  const syntax = {};

  for (const [key, definition] of Object.entries(syntaxDefinitions)) {
    const style = resolveTokenStyle(sourceTheme, definition);

    if (style) {
      syntax[key] = style;
    }
  }

  return syntax;
}

function buildPlayers(accent, selection, background) {
  if (!accent || !selection || !background) {
    return undefined;
  }

  return [
    {
      cursor: accent,
      background: mixColors(accent, background, 0.3),
      selection,
    },
    {
      cursor: brightenColor(accent, 0.12),
      background: mixColors(accent, background, 0.45),
      selection: withAlpha(selection, 0.35),
    },
    {
      cursor: darkenColor(accent, 0.12),
      background: mixColors(accent, background, 0.55),
      selection: withAlpha(selection, 0.25),
    },
  ];
}

function cleanObject(value) {
  if (Array.isArray(value)) {
    const cleanedArray = value
      .map((item) => cleanObject(item))
      .filter((item) => item !== undefined);

    return cleanedArray.length > 0 ? cleanedArray : undefined;
  }

  if (value && typeof value === 'object') {
    const cleanedEntries = Object.entries(value)
      .map(([key, entryValue]) => [key, cleanObject(entryValue)])
      .filter(([, entryValue]) => entryValue !== undefined);

    return cleanedEntries.length > 0
      ? Object.fromEntries(cleanedEntries)
      : undefined;
  }

  return value ?? undefined;
}

export function buildZedThemeFamily(sourceTheme, sourcePackage) {
  const colors = sourceTheme.colors ?? {};

  const background = firstDefined(
    colors,
    'editor.background',
    'sideBar.background',
  );
  const foreground = firstDefined(colors, 'editor.foreground', 'foreground');
  const accent = firstDefined(
    colors,
    'button.background',
    'textLink.foreground',
    'list.highlightForeground',
  );
  const selection = firstDefined(
    colors,
    'editor.selectionBackground',
    'selection.background',
  );
  const mutedText = firstDefined(
    colors,
    'descriptionForeground',
    'sideBarTitle.foreground',
    'tab.inactiveForeground',
  );
  const placeholderText = firstDefined(
    colors,
    'input.placeholderForeground',
    'titleBar.inactiveForeground',
  );
  const border = firstDefined(
    colors,
    'panel.border',
    'sideBar.border',
    'editorGroup.border',
  );
  const borderFocused = firstDefined(
    colors,
    'focusBorder',
    'inputValidation.infoBorder',
  );
  const borderSelected = firstDefined(
    colors,
    'inputOption.activeBorder',
    'tab.activeBorder',
    'list.activeSelectionBackground',
  );

  const style = cleanObject({
    accents: accent ? [accent] : undefined,
    background,
    'background.appearance': 'opaque',
    border,
    'border.disabled': withAlpha(border ?? foreground ?? '#E4E4E4', 0.3),
    'border.focused': borderFocused,
    'border.selected': borderSelected,
    'border.transparent': withAlpha(border ?? foreground ?? '#E4E4E4', 0),
    'border.variant': firstDefined(
      colors,
      'tab.border',
      'editorGroup.border',
      'panel.border',
    ),
    conflict: firstDefined(
      colors,
      'gitDecoration.modifiedResourceForeground',
      'editorWarning.foreground',
    ),
    'conflict.background': firstDefined(
      colors,
      'merge.currentContentBackground',
    ),
    'conflict.border': firstDefined(colors, 'merge.currentHeaderBackground'),
    created: firstDefined(
      colors,
      'gitDecoration.addedResourceForeground',
      'charts.green',
    ),
    'created.background': firstDefined(
      colors,
      'diffEditor.insertedLineBackground',
    ),
    'created.border': firstDefined(colors, 'diffEditor.insertedTextBackground'),
    deleted: firstDefined(
      colors,
      'gitDecoration.deletedResourceForeground',
      'charts.red',
    ),
    'deleted.background': firstDefined(
      colors,
      'diffEditor.removedLineBackground',
    ),
    'deleted.border': firstDefined(colors, 'diffEditor.removedTextBackground'),
    'drop_target.background': firstDefined(
      colors,
      'list.dropBackground',
      'editorGroup.dropBackground',
    ),
    'editor.active_line.background': firstDefined(
      colors,
      'editor.lineHighlightBackground',
    ),
    'editor.active_line_number': firstDefined(
      colors,
      'editorLineNumber.activeForeground',
    ),
    'editor.active_wrap_guide': firstDefined(colors, 'editorRuler.foreground'),
    'editor.background': background,
    'editor.document_highlight.bracket_background': firstDefined(
      colors,
      'editorBracketMatch.background',
    ),
    'editor.document_highlight.read_background': firstDefined(
      colors,
      'editor.wordHighlightBackground',
      'editor.hoverHighlightBackground',
    ),
    'editor.document_highlight.write_background': firstDefined(
      colors,
      'editor.wordHighlightStrongBackground',
      'editor.selectionHighlightBackground',
    ),
    'editor.foreground': foreground,
    'editor.gutter.background': firstDefined(
      colors,
      'editorGutter.background',
      'editor.background',
    ),
    'editor.highlighted_line.background': firstDefined(
      colors,
      'editor.rangeHighlightBackground',
      'editor.findRangeHighlightBackground',
    ),
    'editor.indent_guide': firstDefined(
      colors,
      'editorIndentGuide.background1',
      'tree.inactiveIndentGuidesStroke',
    ),
    'editor.indent_guide_active': firstDefined(
      colors,
      'editorIndentGuide.activeBackground1',
      'tree.indentGuidesStroke',
    ),
    'editor.invisible': firstDefined(colors, 'editorWhitespace.foreground'),
    'editor.line_number': firstDefined(colors, 'editorLineNumber.foreground'),
    'editor.subheader.background': firstDefined(
      colors,
      'peekViewTitle.background',
      'editorGroupHeader.tabsBackground',
    ),
    'editor.wrap_guide': firstDefined(colors, 'editorRuler.foreground'),
    'element.active': firstDefined(colors, 'list.activeSelectionBackground'),
    'element.background': firstDefined(
      colors,
      'dropdown.background',
      'input.background',
    ),
    'element.disabled': withAlpha(mutedText ?? foreground ?? '#E4E4E4', 0.4),
    'element.hover': firstDefined(
      colors,
      'list.hoverBackground',
      'button.hoverBackground',
    ),
    'element.selected': firstDefined(colors, 'list.activeSelectionBackground'),
    error: firstDefined(colors, 'editorError.foreground', 'errorForeground'),
    'error.background': firstDefined(colors, 'inputValidation.errorBackground'),
    'error.border': firstDefined(colors, 'inputValidation.errorBorder'),
    'ghost_element.active': firstDefined(
      colors,
      'statusBarItem.activeBackground',
    ),
    'ghost_element.background': firstDefined(
      colors,
      'statusBarItem.prominentBackground',
    ),
    'ghost_element.disabled': withAlpha(
      mutedText ?? foreground ?? '#E4E4E4',
      0.25,
    ),
    'ghost_element.hover': firstDefined(
      colors,
      'statusBarItem.hoverBackground',
    ),
    'ghost_element.selected': firstDefined(
      colors,
      'statusBarItem.activeBackground',
    ),
    hint: firstDefined(
      colors,
      'minimap.findMatchHighlight',
      'editor.findMatchHighlightBackground',
    ),
    'hint.background': firstDefined(
      colors,
      'editor.findMatchHighlightBackground',
    ),
    'hint.border': firstDefined(colors, 'editorWidget.resizeBorder'),
    foreground,
    'icon.accent': accent,
    'icon.disabled': withAlpha(mutedText ?? foreground ?? '#E4E4E4', 0.4),
    'icon.muted': mutedText,
    'icon.placeholder': placeholderText,
    info: firstDefined(
      colors,
      'inputValidation.infoForeground',
      'textLink.foreground',
    ),
    'info.background': firstDefined(colors, 'inputValidation.infoBackground'),
    'info.border': firstDefined(colors, 'inputValidation.infoBorder'),
    'link_text.hover': firstDefined(colors, 'textLink.activeForeground'),
    'panel.background': firstDefined(
      colors,
      'panel.background',
      'sideBar.background',
    ),
    'panel.focused_border': borderFocused,
    'panel.indent_guide': firstDefined(
      colors,
      'tree.inactiveIndentGuidesStroke',
    ),
    'panel.indent_guide_active': firstDefined(
      colors,
      'tree.indentGuidesStroke',
    ),
    'panel.indent_guide_hover': firstDefined(colors, 'tree.indentGuidesStroke'),
    players: buildPlayers(accent, selection, background),
    predictive: withAlpha(accent ?? foreground ?? '#E4E4E4', 0.6),
    'predictive.background': firstDefined(colors, 'editorInlayHint.background'),
    'predictive.border': firstDefined(colors, 'editorWidget.resizeBorder'),
    renamed: firstDefined(
      colors,
      'gitDecoration.modifiedResourceForeground',
      'charts.yellow',
    ),
    'renamed.background': firstDefined(
      colors,
      'diffEditor.insertedTextBackground',
    ),
    'renamed.border': firstDefined(
      colors,
      'editorOverviewRuler.modifiedForeground',
    ),
    'scrollbar.thumb.background': firstDefined(
      colors,
      'scrollbarSlider.background',
    ),
    'scrollbar.thumb.border': withAlpha(border ?? foreground ?? '#E4E4E4', 0),
    'scrollbar.thumb.hover_background': firstDefined(
      colors,
      'scrollbarSlider.hoverBackground',
    ),
    'scrollbar.track.background': firstDefined(
      colors,
      'scrollbar.shadow',
      'editor.background',
    ),
    'scrollbar.track.border': withAlpha(border ?? foreground ?? '#E4E4E4', 0),
    'search.match_background': firstDefined(
      colors,
      'editor.findMatchBackground',
    ),
    'status_bar.background': firstDefined(colors, 'statusBar.background'),
    success: firstDefined(
      colors,
      'charts.green',
      'gitDecoration.addedResourceForeground',
    ),
    'success.background': firstDefined(
      colors,
      'diffEditor.insertedLineBackground',
    ),
    'success.border': firstDefined(colors, 'diffEditor.insertedTextBackground'),
    'surface.background': firstDefined(
      colors,
      'editorWidget.background',
      'panel.background',
    ),
    syntax: buildSyntax(sourceTheme),
    'tab.active_background': firstDefined(colors, 'tab.activeBackground'),
    'tab.inactive_background': firstDefined(colors, 'tab.inactiveBackground'),
    'tab_bar.background': firstDefined(
      colors,
      'editorGroupHeader.tabsBackground',
      'tab.inactiveBackground',
    ),
    'terminal.ansi.background': firstDefined(colors, 'terminal.background'),
    'terminal.ansi.black': firstDefined(colors, 'terminal.ansiBlack'),
    'terminal.ansi.blue': firstDefined(colors, 'terminal.ansiBlue'),
    'terminal.ansi.bright_black': firstDefined(
      colors,
      'terminal.ansiBrightBlack',
    ),
    'terminal.ansi.bright_blue': firstDefined(
      colors,
      'terminal.ansiBrightBlue',
    ),
    'terminal.ansi.bright_cyan': firstDefined(
      colors,
      'terminal.ansiBrightCyan',
    ),
    'terminal.ansi.bright_green': firstDefined(
      colors,
      'terminal.ansiBrightGreen',
    ),
    'terminal.ansi.bright_magenta': firstDefined(
      colors,
      'terminal.ansiBrightMagenta',
    ),
    'terminal.ansi.bright_red': firstDefined(colors, 'terminal.ansiBrightRed'),
    'terminal.ansi.bright_white': firstDefined(
      colors,
      'terminal.ansiBrightWhite',
    ),
    'terminal.ansi.bright_yellow': firstDefined(
      colors,
      'terminal.ansiBrightYellow',
    ),
    'terminal.ansi.cyan': firstDefined(colors, 'terminal.ansiCyan'),
    'terminal.ansi.dim_black': darkenColor(
      firstDefined(colors, 'terminal.ansiBlack') ?? '#181818',
    ),
    'terminal.ansi.dim_blue': darkenColor(
      firstDefined(colors, 'terminal.ansiBlue') ?? '#7CAFC2',
    ),
    'terminal.ansi.dim_cyan': darkenColor(
      firstDefined(colors, 'terminal.ansiCyan') ?? '#86C1B9',
    ),
    'terminal.ansi.dim_green': darkenColor(
      firstDefined(colors, 'terminal.ansiGreen') ?? '#A1B56C',
    ),
    'terminal.ansi.dim_magenta': darkenColor(
      firstDefined(colors, 'terminal.ansiMagenta') ?? '#BA8BAF',
    ),
    'terminal.ansi.dim_red': darkenColor(
      firstDefined(colors, 'terminal.ansiRed') ?? '#AB4642',
    ),
    'terminal.ansi.dim_white': darkenColor(
      firstDefined(colors, 'terminal.ansiWhite') ?? '#D8D8D8',
    ),
    'terminal.ansi.dim_yellow': darkenColor(
      firstDefined(colors, 'terminal.ansiYellow') ?? '#F7CA88',
    ),
    'terminal.ansi.green': firstDefined(colors, 'terminal.ansiGreen'),
    'terminal.ansi.magenta': firstDefined(colors, 'terminal.ansiMagenta'),
    'terminal.ansi.red': firstDefined(colors, 'terminal.ansiRed'),
    'terminal.ansi.white': firstDefined(colors, 'terminal.ansiWhite'),
    'terminal.ansi.yellow': firstDefined(colors, 'terminal.ansiYellow'),
    'terminal.background': firstDefined(colors, 'terminal.background'),
    'terminal.bright_foreground': firstDefined(colors, 'terminal.foreground'),
    'terminal.dim_foreground': darkenColor(
      firstDefined(colors, 'terminal.foreground') ?? '#E4E4E4',
    ),
    'terminal.foreground': firstDefined(colors, 'terminal.foreground'),
    'text.accent': accent,
    'text.disabled': withAlpha(mutedText ?? foreground ?? '#E4E4E4', 0.4),
    'text.muted': mutedText,
    'text.placeholder': placeholderText,
    'toolbar.background': firstDefined(
      colors,
      'statusBar.background',
      'panel.background',
    ),
    warning: firstDefined(colors, 'editorWarning.foreground'),
    'warning.background': firstDefined(
      colors,
      'inputValidation.warningBackground',
    ),
    'warning.border': firstDefined(colors, 'inputValidation.warningBorder'),
  });

  const author =
    typeof sourcePackage.author === 'string'
      ? sourcePackage.author
      : (sourcePackage.author?.name ?? 'Rajzik');

  return {
    $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
    name: 'Rajzik',
    author,
    themes: [
      {
        name: sourceTheme.name ?? 'Rajzik Dark',
        appearance: 'dark',
        style,
      },
    ],
  };
}

export async function generateZedTheme({
  sourceThemePath = defaultSourceThemePath,
  sourcePackagePath = defaultSourcePackagePath,
  outputThemePath = defaultOutputThemePath,
} = {}) {
  const [sourceThemeText, sourcePackageText] = await Promise.all([
    readFile(sourceThemePath, 'utf8'),
    readFile(sourcePackagePath, 'utf8'),
  ]);

  const sourceTheme = parseJsonc(sourceThemeText);
  const sourcePackage = JSON.parse(sourcePackageText);
  const zedTheme = buildZedThemeFamily(sourceTheme, sourcePackage);

  await mkdir(path.dirname(outputThemePath), { recursive: true });
  await writeFile(outputThemePath, `${JSON.stringify(zedTheme, null, 2)}\n`);

  return {
    outputThemePath,
    zedTheme,
  };
}

async function runCli() {
  const [
    sourceThemePath = defaultSourceThemePath,
    outputThemePath = defaultOutputThemePath,
  ] = process.argv.slice(2);

  const { outputThemePath: generatedPath } = await generateZedTheme({
    sourceThemePath: path.resolve(sourceThemePath),
    outputThemePath: path.resolve(outputThemePath),
  });

  process.stdout.write(
    `Generated ${path.relative(rootDir, generatedPath).replaceAll(path.sep, '/')}\n`,
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  void runCli().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
