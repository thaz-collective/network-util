# 010 — Tooling polish, pre-commit hook, docs

Depends on: `009-main-index-and-package-exports.md` (should run last, once all source exists).

## Goal

Close out the scaffold-level pieces that only make sense once real source exists: pre-commit
wiring, and documentation describing the three export paths.

## Files to create/edit

### `.vite-hooks/pre-commit`

Same as both siblings:

```
vp staged
```

(Relies on the `staged: { '*.{js,ts,tsx}': 'vp check --fix' }` block already declared in
`vite.config.ts` from task 001.)

### `README.md` (root — currently just a placeholder)

Replace with a real description covering:

- What the package is (network utilities: typed fetch errors, response-envelope valibot schemas,
  a suspense-friendly react-query hook).
- The three import paths and what each contains:
  - `@thaz/network-util` — `NetworkError`, `NetworkWithMessageListError`, `isNetworkValidationError`,
    `checkResponseMessageForError`, `refineNetworkError`.
  - `@thaz/network-util/valibot` — primitive wrappers (`responseArray`, `responseBoolean`,
    `responseNullable`, temporal schemas) + entity/response-message schemas.
  - `@thaz/network-util/react-query` — `useSuspenseQueryDeferred`.
- Peer dependency notes: `@tanstack/react-query`/`react` only needed for the `react-query` subpath,
  `@ts-rest/core` only needed if using `isNetworkValidationError`, `@thaz/temporal-util` +
  `temporal-polyfill` only needed for the `valibot` subpath's temporal schemas.
- Install/dev instructions, same as siblings' `CONTRIBUTING.md` (`vp i`, `vp test`, `vp check`).

## Verification

- `vp check --fix` runs successfully against a staged file to confirm the pre-commit hook path
  works.
- README accurately lists only symbols that exist after tasks 001–009 (no stale references).
- Re-read all of `plans/001` through `plans/009` once more here to catch any drift — e.g. confirm
  no task ended up referencing a file another task doesn't actually create, and that every import
  path (`#src/*`, `@thaz/temporal-util/valibot`, `@thaz/network-util/*`) is consistent across files.
