import { buildOxlintConfig } from '@rajzik/oxlint-config';
import { defineConfig } from 'oxlint';

export default defineConfig(
  buildOxlintConfig({
    jsdoc: true,
    node: true,
    turbo: true,
    overrides: {
      rules: {
        'import/unambiguous': 'allow',
        'unicorn/no-process-exit': 'allow',
      },
    },
  }),
);
