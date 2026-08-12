# 011 — `/fetch` overview

## Context

`network-util` currently depends on `@ts-rest/core` as a fetch client/contract-validation
mechanism. It's too heavy for our needs: it supports server-side contracts, nested routers,
zod-specific behavior, and many options we don't use. This body of work replaces it with a small,
standard-schema-only, client-only implementation, exposed as a new `@thaz/network-util/fetch`
subpath.

Design informed by studying `@ts-rest/core`'s source
(`/home/maethron/codingProjects/opensource/ts-rest/libs/ts-rest/core/src/lib/{dsl,client,infer-types,paths,query,standard-schema,standard-schema-utils,validation-error,response-validation-error}.ts`)
and this repo's existing module/testing/build conventions (`src/valibot`, `src/error`,
`src/react-query`).

## Requirements

- Flat contract builder — one top-level object of routes, **no nested routers** like ts-rest's
  `c.router`.
- Every contract field that carries data (path params, query, headers, body, responses) must be
  defined with a real standard-schema schema. Nothing unvalidated can be declared for those
  fields.
- Types for a route's request/response are inferable from the contract alone (no manual
  annotation), the same way ts-rest infers from a zod contract.
- Client performs real `fetch()` calls — not dynamic/pluggable transports.
- Client-only. No server-side contract/router code.

## Confirmed user decisions

- **Test mocking**: `msw` (new devDependency) — one HTTP-mocking strategy shared by the node and
  Playwright-browser vitest projects.
- **Error placement**: `NetworkStandardSchemaValidationError` (base, issues-array error) lives in
  `src/error/`. The new `/fetch` module does **not** reuse any existing higher-level error class
  (`NetworkError`, `NetworkWithMessageListError`, `checkResponseMessageForError`,
  `refineNetworkError`) — `/fetch` defines its own error subtypes, extending only the shared
  `NetworkStandardSchemaValidationError` base.
- **Throw behavior**: every client call always throws on failure (no `{success, error}` result
  object). Different failure modes throw **different, distinct error subtypes** so callers can
  `instanceof`-discriminate.
- **Dependencies**: `@standard-schema/spec` is a regular `dependency` (types-only, zero runtime
  code). `@ts-rest/core` peer dependency is removed entirely once nothing in `src/` imports it.

## API surface

```ts
// src/fetch/dsl.ts
import type { StandardSchemaV1 } from './standard-schema';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

interface RouteDef<
  TPathParams extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  TQuery extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  THeaders extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  TBody extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  TResponses extends Record<number, StandardSchemaV1> = Record<number, StandardSchemaV1>,
> {
  method: Method;
  path: string; // e.g. '/posts/:id'
  pathParams?: TPathParams;
  query?: TQuery;
  headers?: THeaders;
  body?: TBody;
  responses: TResponses; // always required
}

export function defineContract<T extends Record<string, RouteDef>>(routes: T): T;
```

`pathParams`/`query`/`headers`/`body` are optional _keys_, but whenever present the value's type
is constrained to `StandardSchemaV1` — nothing unvalidated can be assigned. `defineContract` is a
generic identity function purely to anchor inference (no chained builder calls) — this is the
"flat, one top-level object" builder.

```ts
// src/fetch/client.ts
export function createFetchClient<T extends Record<string, RouteDef>>(
  contract: T,
  options: { baseUrl: string; headers?: HeadersInit | (() => HeadersInit) },
): { [K in keyof T]: (args: InferRequest<T[K]>) => Promise<InferResponse<T[K]>> };
```

## `src/fetch/` file breakdown

| File                       | Purpose                                                                      | Task |
| -------------------------- | ---------------------------------------------------------------------------- | ---- |
| `dsl.ts`                   | `defineContract`, `RouteDef`, `Method`, runtime path/pathParams sanity check | 012  |
| `infer-types.ts`           | `InferRequest`, `InferResponse`, per-field infer helpers                     | 012  |
| `standard-schema-utils.ts` | `isStandardSchema`, `validateAgainstStandardSchema`                          | 013  |
| `url.ts`                   | `buildUrl(path, pathParams, query)`                                          | 014  |
| `errors.ts`                | `RequestValidationError`, `ResponseValidationError`, `UnexpectedStatusError` | 016  |
| `client.ts`                | `createFetchClient`                                                          | 017  |
| `index.ts`                 | barrel (`export * from './x'`)                                               | 017  |

Plus one addition to `src/error/`: `network-standard-schema-validation-error.ts` (task 015).

## Task index

- `012-fetch-dsl-and-infer-types.md`
- `013-fetch-standard-schema-utils.md`
- `014-fetch-url-utils.md`
- `015-error-standard-schema-validation-error.md`
- `016-fetch-errors.md`
- `017-fetch-client.md`
- `018-fetch-msw-testing.md`
- `019-fetch-config-wiring-and-ts-rest-removal.md`

Each task file states its purpose, the exact files it creates/modifies with source-level detail,
and its own local verification step, so each can be implemented and tested one at a time.

## Overall verification (final task, 019)

- `vp run test --browser.headless` — all suites (node, browser×2, types) pass, coverage
  thresholds (80% branches/functions/lines/statements) hold for new `src/fetch/**` files.
- `vp check --fix` — lint/format/typecheck clean.
- `vp run build` — confirm `./fetch` subpath builds and `package.json`'s `exports` map picks up
  the new entry automatically.
