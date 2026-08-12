# 009 — Main index + finalize package exports

Source only. Depends on: `007-error-response-helpers.md`, `005-valibot-index-and-exports.md`,
`008-react-query-hook.md`.

## Goal

Wire the root `src/index.ts` and confirm the package.json `exports` map matches the three built
entries exactly.

## Files to create/edit

### `src/index.ts`

```ts
export * from './error';
```

Deliberately **not** re-exporting `./valibot` or `./react-query` — see `000-overview.md`'s
rationale (those are opt-in, dependency-heavy slices, same reasoning `temporal-util` used to keep
`./valibot` out of its root export).

### `package.json`

Confirm final `exports` map (should already match what task 001 declared):

```json
{
  "exports": {
    ".": { "types": "./dist/index.d.mts", "import": "./dist/index.mjs" },
    "./valibot": { "types": "./dist/valibot.d.mts", "import": "./dist/valibot.mjs" },
    "./react-query": { "types": "./dist/react-query.d.mts", "import": "./dist/react-query.mjs" },
    "./package.json": "./package.json"
  }
}
```

Also double check:

- `files: ["dist", "src"]` is present.
- `sideEffects: false` is present (all three entry points are pure — no top-level side effects).

## Verification

- `vp pack` produces `dist/index.mjs`, `dist/valibot.mjs`, `dist/react-query.mjs` plus matching
  `.d.mts` files.
- From a scratch consumer: `import { NetworkError } from '@thaz/network-util'`,
  `import { instant } from '@thaz/network-util/valibot'`,
  `import { useSuspenseQueryDeferred } from '@thaz/network-util/react-query'` all resolve.
- `vp lint` / `vp check` pass across the whole `src/` tree end to end.
