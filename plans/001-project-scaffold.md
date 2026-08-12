# 001 — Project scaffold

Source only. No `test/` files (later plan).

## Goal

Stand up the package config so subsequent tasks can just add `src/**` files. Model everything on
`thaz-collective/temporal-util` (closest sibling: also ships a `./valibot` subpath), adapted for
network-util's extra `./react-query` subpath and dependencies.

## Files to create

### `package.json`

- `name`: `@thaz/network-util`
- `version`: `1.0.0-rc.1`
- `description`: `"Network utilities for fetching and validating data in thaz collective applications"`
- `keywords`: `["fetch", "network", "react-query", "temporal", "utils", "valibot"]`
- `homepage`/`bugs`/`repository`: point at `thaz-collective/network-util`
- `license: "MIT"`, `author: "Tim Hazlett"`
- `files: ["dist", "src"]`
- `type: "module"`, `sideEffects: false`
- `exports` (root + two subpaths, matches the vite pack entries from task 001/005/008/009):
  ```json
  {
    ".": { "types": "./dist/index.d.mts", "import": "./dist/index.mjs" },
    "./valibot": { "types": "./dist/valibot.d.mts", "import": "./dist/valibot.mjs" },
    "./react-query": { "types": "./dist/react-query.d.mts", "import": "./dist/react-query.mjs" },
    "./package.json": "./package.json"
  }
  ```
- `publishConfig`: `{ "access": "public", "tag": "latest" }`
- `scripts`: same as siblings — `prepack: "vp run build"`, plus the `taze`/`taze:major/minor/patch` scripts
- `dependencies`: `spin-delay`, `use-deep-compare` (used unconditionally by the react-query hook)
- `devDependencies`: `@thaz/oxfmt-config`, `@thaz/oxlint-config`, `@thaz/temporal-util` (workspace/catalog),
  `@thaz/typescript-config`, `@tanstack/react-query`, `@ts-rest/core`, `@types/node`, `@types/react`,
  `@vitejs/plugin-react`, `@vitest/coverage-istanbul`, `@vitest/ui`, `react`, `temporal-polyfill`,
  `typescript`, `valibot`, `vite`, `vite-plugin-externalize-deps`, `vite-plus`, `vitest`
- `peerDependencies`: `@tanstack/react-query`, `@thaz/temporal-util`, `@ts-rest/core`, `react`,
  `temporal-polyfill`, `valibot`
- `peerDependenciesMeta`: mark `temporal-polyfill`, `@tanstack/react-query`, `react`, `@ts-rest/core`
  as `{ "optional": true }` — each is only required by the specific subpath that uses it
  (`react-query`/`valibot`/`error`'s `isNetworkValidationError` respectively), not by every consumer.
- `engines`: `{ "node": ">=24" }`
- `packageManager`: `"pnpm@11.20.0"`

### `tsconfig.json`

Same as `temporal-util/tsconfig.json`:

```json
{
  "extends": [
    "@thaz/typescript-config/bundler.json",
    "@thaz/typescript-config/lib.json",
    "@thaz/typescript-config/paths.json"
  ],
  "include": ["src", "test", "vite.config.ts"],
  "compilerOptions": {
    "types": ["node", "react"],
    "lib": ["es2023", "esnext.temporal", "esnext.intl", "esnext.date", "dom"]
  }
}
```

(add `"react"` to types and `"dom"` to lib since the react-query hook uses React.)

### `vite.config.ts`

Model on `temporal-util/vite.config.ts`, with three pack entries instead of two:

```ts
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
    cache: { scripts: false, tasks: true },
    tasks: {
      build: { command: 'vp pack' },
      test: { command: 'vp test' },
      check: { command: 'vp check' },
      fmt: { command: 'vp fmt' },
      lint: { command: 'vp lint' },
    },
  },
  resolve: { tsconfigPaths: true },
  plugins: [externalizeDeps(), react()],
  pack: {
    dts: { build: true },
    outputOptions: { preserveModules: true },
    entry: {
      index: './src/index.ts',
      valibot: './src/valibot/index.ts',
      'react-query': './src/react-query/index.ts',
    },
    exports: {
      customExports: {
        '.': { types: './dist/index.d.mts', import: './dist/index.mjs' },
        './valibot': { types: './dist/valibot.d.mts', import: './dist/valibot.mjs' },
        './react-query': { types: './dist/react-query.d.mts', import: './dist/react-query.mjs' },
      },
    },
  },
  test: {
    setupFiles: ['test/setup.ts'],
    coverage: {
      enabled: true,
      include: ['src/**/*.ts'],
      provider: 'istanbul',
      thresholds: { branches: 80, functions: 80, lines: 80, statements: 80 },
    },
    projects: [
      { extends: true, test: { name: 'node', include: ['test/**/*.node.test.ts'], environment: 'jsdom' } },
      { extends: true, test: { name: 'types', include: ['test/**/*.test-d.ts'], typecheck: { enabled: true } } },
    ],
  },
  fmt: oxfmtConfig,
  lint: {
    extends: [nativeConfig],
    options: { typeAware: true, typeCheck: true },
    rules: { ...libraryCodeConfigRules.rules, 'import/no-default-export': 'off' },
  },
});
```

(`@vitejs/plugin-react` + `environment: 'jsdom'` on the node test project are added over the
`temporal-util` baseline because this package has a React hook under test in the next plan.)

### `pnpm-workspace.yaml`

Same shape as `temporal-util/pnpm-workspace.yaml`, catalog extended with this package's own new
deps:

```yaml
blockExoticSubdeps: true

catalog:
  '@tanstack/react-query': <pin to latest v5>
  '@thaz/oxfmt-config': 1.0.0-rc.1
  '@thaz/oxlint-config': 1.0.0-rc.1
  '@thaz/temporal-util': 1.0.0-rc.2
  '@thaz/typescript-config': 1.0.0-rc.1
  '@ts-rest/core': <pin to latest v3>
  '@types/node': 24.13.3
  '@types/react': <pin to latest v19>
  '@vitejs/plugin-react': <pin to latest v4>
  '@vitest/coverage-istanbul': 4.1.10
  '@vitest/ui': 4.1.10
  jsdom: <pin to latest v25>
  react: <pin to latest v19>
  spin-delay: <pin to latest v2>
  temporal-polyfill: 1.0.3
  typescript: 6.0.3
  use-deep-compare: <pin to latest v1>
  valibot: 1.4.2
  vite: npm:@voidzero-dev/vite-plus-core@0.2.4
  vite-plugin-externalize-deps: 0.10.0
  vite-plus: 0.2.4
  vitest: 4.1.10

catalogMode: prefer
minimumReleaseAge: 4320

minimumReleaseAgeExclude:
  - '@thaz/typescript-config@1.0.0-rc.1'
  - '@thaz/oxfmt-config@1.0.0-rc.1'
  - '@thaz/oxlint-config@1.0.0-rc.1'

overrides:
  vite: 'catalog:'

peerDependencyRules:
  allowAny:
    - vite
  allowedVersions:
    vite: '*'
```

Resolve the actual `<pin to latest vX>` placeholders to real pinned versions at implementation time
(check npm for current majors compatible with the sibling repos' toolchain).

### `.nvmrc`

`24.18.0` (same as siblings).

### `test/setup.ts`

Placeholder only (real tests come later), but the file must exist because `vite.config.ts`
references it as `setupFiles`:

```ts
// oxlint-disable-next-line import/no-unassigned-import
import 'temporal-polyfill/full/global';
```

### `CONTRIBUTING.md`

Copy verbatim from `temporal-util/CONTRIBUTING.md` (generic thaz-collective contributing doc, no
package-specific content to change).

## Verification

- `vp i` installs without dependency resolution errors.
- `vp check` runs (will have nothing to lint/typecheck yet beyond the config files themselves).
