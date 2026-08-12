# 005 — Valibot barrel + package export wiring

Source only. Depends on: `002`, `003`, `004`.

## Goal

Wire up the `./valibot` subpath so consumers get primitives + entity + response-message schemas
from one import.

## Files to create/edit

### `src/valibot/index.ts`

```ts
export * from './entity';
export * from './response-message';
export * from './schema';
```

(Mirrors legacy `thaz-utils/packages/network-util/src/valibot/index.ts` exactly — same three
re-exports, no changes needed beyond what tasks 002–004 already produced.)

## package.json / vite.config.ts

Already declared in `001-project-scaffold.md` (the `"./valibot"` exports entry and the `valibot:
'./src/valibot/index.ts'` pack entry). This task is just confirming nothing else needs to change —
no edits expected here if task 001 was done correctly. If task 001 was scoped down for some reason,
add the `"./valibot"` entry to both `package.json#exports` and `vite.config.ts`'s `pack.entry` /
`pack.exports.customExports` now.

## Verification

- `import { instant, responseArray, baseEntity, response } from '@thaz/network-util/valibot'`
  resolves once the package is built (`vp pack`).
- `vp lint` passes on the new barrel file.
