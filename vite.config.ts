import react from '@vitejs/plugin-react';
import { externalizeDeps } from 'vite-plugin-externalize-deps';
import { defineConfig } from 'vite-plus';

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
      valibot: './src/valibot/index.ts',
      'react-query': './src/react-query/index.ts',
    },
    exports: {
      customExports: {
        '.': {
          types: './dist/index.d.mts',
          import: './dist/index.mjs',
        },
        './valibot': {
          types: './dist/valibot.d.mts',
          import: './dist/valibot.mjs',
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
          environment: 'jsdom',
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
    rules: {
      ...libraryCodeConfigRules.rules,
      'import/no-default-export': 'off',
    },
  },
});
