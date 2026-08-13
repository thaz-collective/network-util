import { defineConfig } from 'vite-plus';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { externalizeDeps } from 'vite-plugin-externalize-deps';

import { oxfmtConfig } from '@thaz/oxfmt-config';
import { nativeConfig, libraryCodeConfigRules } from '@thaz/oxlint-config';

export default defineConfig({
  staged: {
    '*.{js,ts,tsx}': 'vp check --fix',
  },
  run: {
    cache: {
      scripts: false,
      tasks: true,
    },
    tasks: {
      build: {
        command: 'vp pack',
      },
      test: {
        command: 'vp test',
      },
      check: {
        command: 'vp check',
      },
      fmt: {
        command: 'vp fmt',
      },
      lint: {
        command: 'vp lint',
      },
    },
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [externalizeDeps(), react()],
  pack: {
    dts: {
      build: true,
    },
    outputOptions: {
      preserveModules: true,
    },
    entry: {
      index: './src/index.ts',
      error: './src/error/index.ts',
      fetch: './src/fetch/index.ts',
      'react-query': './src/react-query/index.ts',
    },
    exports: {
      customExports: {
        '.': {
          types: './dist/index.d.mts',
          import: './dist/index.mjs',
        },
        './error': {
          types: './dist/error.d.mts',
          import: './dist/error.mjs',
        },
        './fetch': {
          types: './dist/fetch.d.mts',
          import: './dist/fetch.mjs',
        },
        './react-query': {
          types: './dist/react-query.d.mts',
          import: './dist/react-query.mjs',
        },
      },
    },
  },
  test: {
    setupFiles: ['test/setup.ts'],
    coverage: {
      enabled: true,
      include: ['src/**/*.ts'],
      provider: 'istanbul',
      thresholds: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: ['test/**/*.node.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          include: ['test/**/*.browser.test.{ts,tsx}'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [
              { name: 'browser-chromium', browser: 'chromium' },
              { name: 'browser-firefox', browser: 'firefox' },
            ],
          },
        },
      },
      {
        extends: true,
        test: {
          name: 'types',
          include: ['test/**/*.test-d.ts'],
          typecheck: {
            enabled: true,
          },
        },
      },
    ],
  },
  fmt: oxfmtConfig,
  lint: {
    extends: [nativeConfig],
    options: {
      typeAware: true,
      typeCheck: true,
    },
    ignorePatterns: ['public/mockServiceWorker.js'],
    rules: {
      ...libraryCodeConfigRules.rules,
      'import/no-default-export': 'off',
    },
  },
});
