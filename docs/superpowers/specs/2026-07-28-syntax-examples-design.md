# Syntax theme examples design

Date: 2026-07-28  
Status: approved

## Goal

Add local-only sample source files under `packages/vscode-theme/examples/` that showcase syntax highlighting for Rajzik Dark. Files should exercise scopes already defined in `themes/rajzik_dark.json`, plus a broader language set that relies on shared TextMate scopes.

## Non-goals

- New theme variants or changes to `tokenColors` / UI colors
- Zed-specific examples (optional later reuse)
- Automated screenshots or CI visual regression
- Shipping `examples/` inside the published `.vsix`

## Layout & packaging

```
packages/vscode-theme/
  examples/
    README.md
    typescript.ts
    javascript.js
    html.html
    css.css
    less.less
    scss.scss
    json.json
    markdown.md
    python.py
    java.java
    diff.diff
    git-rebase.txt
    go.go
    rust.rs
    yaml.yaml
    shell.sh
    sql.sql
    php.php
    cpp.cpp
  README.md          # one Local Development paragraph pointing here
  package.json       # keep `files` whitelist unchanged (no `examples`)
```

`package.json` `files` already lists only `assets`, `themes`, `CHANGELOG.md`, `LICENSE`, `README.md`, and `package.json`. Leaving `examples` off that list keeps samples out of the VSIX with no further ignore changes.

## Content rules

- One file per language; short (~40–120 lines), valid-looking code
- Deliberately hit themed scopes (comments, keywords, types, strings, regex, markup, CSS selectors, preprocessor, etc.)
- Prefer realistic constructs over token-catalog comments
- Intentional invalid tokens only if clearly marked and useful for the `invalid` scope
- Static files only — no generators or tests for examples

## Language set

### Core (scopes already in theme)

| File | Focus |
|------|--------|
| `typescript.ts` | keywords, types, classes, enums, template strings, regex, control flow, object keys, constants |
| `javascript.js` | same without TS types; string interpolation |
| `html.html` | tags, attributes, tag punctuation |
| `css.css`, `less.less`, `scss.scss` | selectors, properties, units, colors, pseudo-classes/elements |
| `json.json` | keys/values, JSON support constants |
| `markdown.md` | headings, bold/italic/strike, lists, quotes, inline raw, links |
| `python.py` | comments, dict keys, logical operators, builtins |
| `java.java` | package/import modifiers, types, annotations |
| `diff.diff` | inserted/deleted/changed, diff headers |
| `git-rebase.txt` | `support.function.git-rebase`, `constant.sha.git-rebase` |

### Broader (shared / fallback scopes)

| File | Why |
|------|-----|
| `go.go` | Go `storage.type.*` scopes in theme |
| `rust.rs` | types, macros, keywords |
| `yaml.yaml` | keys, strings, structure |
| `shell.sh` | comments, strings, variables |
| `sql.sql` | keywords, identifiers |
| `php.php` | `<?php ?>` embedded punctuation |
| `cpp.cpp` | preprocessor, operators, labels |

## Usage

1. Open the monorepo in VS Code / Cursor
2. Run **Launch Extension**
3. Select **Rajzik Dark**
4. Open files under `packages/vscode-theme/examples/`
5. Use `examples/README.md` as an audit checklist while scanning colors

## Success criteria

- Every language in the tables above has a sample file
- Core theme scopes are visibly exercised in at least one file
- `pnpm --filter rajzik-theme run package` produces a VSIX that does not contain `examples/`
- Package README documents how contributors find and use the samples
