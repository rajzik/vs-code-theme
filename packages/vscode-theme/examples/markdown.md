# Rajzik Dark — Markdown syntax sample

## Headings and emphasis

This document exercises **bold**, *italic*, ***bold italic***, and ~~strikethrough~~ text.

### Inline code and links

Use `meta.object-literal.key` scopes in TypeScript, or read the [theme README](../README.md).

> Block quotes use `punctuation.definition.quote.begin.markdown`.
> Second line in the same quote.

## Lists

Unordered:

- Comments should appear green (`#57A64A`)
- Keywords blue (`#569CD6`)
- Types teal (`#4EC9B0`)

Ordered:

1. Launch the extension development host
2. Select **Rajzik Dark**
3. Open files under `examples/`

Task list:

- [x] Core language samples
- [ ] Optional screenshot tooling

## Code block

```typescript
const theme = "rajzik-dark";
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

## Table

| Scope        | Color     | Example        |
| ------------ | --------- | -------------- |
| `comment`    | `#57A64A` | `// note`      |
| `string`     | `#CE9178` | `"hello"`      |
| `keyword`    | `#569CD6` | `const`        |

## Horizontal rule

---

## Changed / inserted / deleted (diff markup)

~~Removed line~~

**Added emphasis**

`inline raw` tokens use `markup.inline.raw`.
