// Rajzik Dark — TypeScript syntax sample

/** Parses a semver string into major, minor, and patch. */
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
}

export const MAX_RETRIES = 3;
export const DEFAULT_TIMEOUT_MS = 5_000;

interface SemVer {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
}

type Result<T> = { ok: true; value: T } | { ok: false; error: Error };

class ThemeValidator {
  private readonly level: LogLevel;

  constructor(level: LogLevel = LogLevel.Info) {
    this.level = level;
  }

  parseVersion(input: string): Result<SemVer> {
    const pattern = /^(\d+)\.(\d+)\.(\d+)(?:-[\w.]+)?$/;
    const match = input.match(pattern);

    if (!match) {
      return { ok: false, error: new Error(`Invalid semver: ${input}`) };
    }

  const [, major, minor, patch] = match;
    return {
      ok: true,
      value: {
        major: Number(major),
        minor: Number(minor),
        patch: Number(patch),
      },
    };
  }

  async validateScopes(files: string[]): Promise<string[]> {
    const issues: string[] = [];

    for (const file of files) {
      if (!file.endsWith(".ts") && !file.endsWith(".tsx")) {
        continue;
      }

      const content = await fetch(file).then((r) => r.text());
      const hasKeywords = /\b(const|let|async|await|interface)\b/.test(content);

      if (!hasKeywords) {
        issues.push(file);
      }
    }

    return issues;
  }
}

function formatReport(level: LogLevel, message: string): string {
  const prefix = LogLevel[level];
  return `[${prefix}] ${message} — checked at ${new Date().toISOString()}`;
}

// Template literal with interpolation and nested expression
const summary = `Theme audit: ${MAX_RETRIES} retries, timeout ${DEFAULT_TIMEOUT_MS}ms`;

// Object literal keys and shorthand
const config = {
  theme: "rajzik-dark",
  semanticHighlighting: true,
  retries: MAX_RETRIES,
};

// Control flow
switch (config.theme) {
  case "rajzik-dark":
    console.log(summary);
    break;
  default:
    throw new Error("Unknown theme");
}

// Regex with character classes and quantifiers
const HEX_COLOR = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})\b/g;

export { ThemeValidator, formatReport, HEX_COLOR };
