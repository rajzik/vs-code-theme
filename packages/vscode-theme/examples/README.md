# Syntax highlighting examples

Local-only sample files for auditing **Rajzik Dark** token colors. Open them in the Extension Development Host after **Launch Extension**.

## How to use

1. Open this monorepo in VS Code / Cursor.
2. Run **Launch Extension** (`.vscode/launch.json`).
3. Select **Rajzik Dark** as the color theme.
4. Open files in this folder and scan for expected colors.

## Audit checklist

### Core languages

| File | Scopes to verify |
|------|------------------|
| `typescript.ts` | keywords, types, classes, enums, template strings, regex, control flow, object keys, constants |
| `javascript.js` | keywords, strings, interpolation, regex, control flow, object keys |
| `html.html` | tags, attributes, tag punctuation |
| `css.css` | selectors, properties, units, colors, pseudo-classes/elements |
| `less.less` | variables, nesting, mixins, selectors |
| `scss.scss` | variables, nesting, mixins, selectors |
| `json.json` | keys, values, support constants |
| `markdown.md` | headings, bold/italic/strike, lists, quotes, inline raw, links |
| `python.py` | comments, dict keys, logical operators, builtins |
| `java.java` | package/import modifiers, types, annotations |
| `diff.diff` | inserted, deleted, changed, diff headers |
| `git-rebase.txt` | `support.function.git-rebase`, `constant.sha.git-rebase` |

### Broader languages

| File | Scopes to verify |
|------|------------------|
| `go.go` | `storage.type.*`, keywords, functions |
| `rust.rs` | types, macros, keywords, lifetimes |
| `yaml.yaml` | keys, strings, structure |
| `shell.sh` | comments, strings, variables |
| `sql.sql` | keywords, identifiers, strings |
| `php.php` | `<?php ?>` embedded punctuation, variables |
| `cpp.cpp` | preprocessor, operators, labels |

### Cross-cutting scopes

- [ ] Comments (`#57A64A`)
- [ ] Keywords / control flow (`#569CD6`, `#C586C0`)
- [ ] Types / classes (`#4EC9B0`)
- [ ] Functions (`#DDDCA4`)
- [ ] Strings (`#CE9178`)
- [ ] Regex (`#D16969`, `#DCDCAA`)
- [ ] Numbers / constants (`#B5CEA8`, `#4FC1FF`)
- [ ] Variables / parameters (`#9CDCFE`)
- [ ] Invalid tokens (`#F44747`) — only in marked sections
- [ ] Markup (headings, bold, italic, strike, raw)
