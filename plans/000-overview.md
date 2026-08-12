# network-util — source implementation plan

## Context

- **Sibling repos** `thaz-collective/temporal-util` (`feat/initialize-util`) and
  `thaz-collective/form-util` (`util/initialize-util`) establish the current tooling/conventions for
  the `@thaz` scope: `vite-plus` + `pnpm` catalog workspace, `oxlint`/`oxfmt`, `vitest` (node + type-test
  projects, istanbul coverage @ 80%), `temporal-polyfill` as an optional peer dep, subpath exports
  built via `vp pack` with `preserveModules`, and `#src/*` import aliases.
- **Legacy reference** `thazlett16/thaz-utils/packages/network-util` (old `@thazstack` scope) has
  the actual domain content we're porting: network error classes, response-message/entity valibot
  schemas, primitive valibot wrappers (array/boolean/nullable/instant/etc.), and a
  `useSuspenseQueryDeferred` hook. Its dependency on `@thazstack/temporal-valibot-util` must be
  swapped for the new sibling's `@thaz/temporal-util/valibot` subpath export.

## Target structure

```
src/
  index.ts              # root export — re-exports src/error only
  error/
    index.ts
    network-error.ts
    network-validation-error.ts
    network-with-message-list-error.ts
    check-response-message-for-error.ts
    refine-network-response.ts
  valibot/
    index.ts             # exported via "./valibot" subpath
    schema/               # primitives (temporal + null/array/boolean wrappers)
      index.ts
      array.ts
      boolean.ts
      nullish.ts
      instant.ts
      plain-date.ts
      plain-date-time.ts
      plain-time.ts
      zoned-date-time.ts
    entity/
      index.ts
      base-entity.ts
      active-entity.ts
      extended-audit-entity.ts
      soft-deleted-entity.ts
    response-message/
      index.ts
      message-type.ts
      message.ts
      response.ts
  react-query/
    index.ts              # exported via "./react-query" subpath
    use-suspense-query-deferred.ts
```

Package exports mirror `temporal-util`'s pattern (root + named subpaths, not everything bundled
into root):

- `"."` → `src/index.ts` (errors)
- `"./valibot"` → `src/valibot/index.ts` (primitives + entity + response-message schemas)
- `"./react-query"` → `src/react-query/index.ts` (the hook)

Rationale for req #4: `valibot` and `react-query` are opt-in, dependency-heavy slices (pull in
`valibot`, `@thaz/temporal-util`, `@tanstack/react-query`, `spin-delay`, `use-deep-compare`
respectively) — same reasoning `temporal-util` used to split `./valibot` from root. Bundling them
into root would force every consumer to carry those peer deps. `src/error` has no such deps beyond
`valibot`/`@ts-rest/core` types, so it's the natural root export.

## Tasks

Do these roughly in order; later tasks depend on earlier ones existing.

1. `001-project-scaffold.md` — package.json, tsconfig, vite.config, pnpm-workspace, .nvmrc, CONTRIBUTING
2. `002-valibot-primitive-schemas.md` — array/boolean/nullable/instant/plain-date\*/zoned-date-time
3. `003-valibot-entity-schemas.md` — base/active/extended-audit/soft-deleted entity schemas
4. `004-valibot-response-message-schemas.md` — message-type/message/response schemas
5. `005-valibot-index-and-exports.md` — wire src/valibot/index.ts + package.json "./valibot" subpath
6. `006-error-classes.md` — NetworkError, NetworkWithMessageListError, isNetworkValidationError
7. `007-error-response-helpers.md` — checkResponseMessageForError, refineNetworkError, src/error/index.ts
8. `008-react-query-hook.md` — useSuspenseQueryDeferred + src/react-query/index.ts + subpath export
9. `009-main-index-and-package-exports.md` — src/index.ts + finalize package.json exports map
10. `010-tooling-lint-fmt-precommit.md` — oxlint/oxfmt wiring, vite-plus pre-commit hook, README update

Tests (`*.node.test.ts`, `*.test-d.ts`) are explicitly out of scope for this pass — a later plan
will cover them.
