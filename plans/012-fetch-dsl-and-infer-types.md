# 012 — fetch DSL and type inference

See `011-fetch-overview.md` for full context.

## Purpose

Establish the flat contract builder and its type-level inference, validated in isolation via
`.test-d.ts` before any runtime client code exists.

## Files to create

### `src/fetch/dsl.ts`

```ts
import type { StandardSchemaV1 } from './standard-schema';

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export interface RouteDef<
  TPathParams extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  TQuery extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  THeaders extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  TBody extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  TResponses extends Record<number, StandardSchemaV1> = Record<number, StandardSchemaV1>,
> {
  method: Method;
  path: string;
  pathParams?: TPathParams;
  query?: TQuery;
  headers?: THeaders;
  body?: TBody;
  responses: TResponses;
}

export function defineContract<T extends Record<string, RouteDef>>(routes: T): T {
  for (const route of Object.values(routes)) {
    assertPathParamsMatchPathTokens(route);
  }
  return routes;
}
```

Add a private `assertPathParamsMatchPathTokens(route: RouteDef): void` helper: extract `:token`
names from `route.path` via `/:([^/?]+)/g`, and if `route.pathParams` is present and its schema
shape is introspectable (duck-type on vendor-specific internals is out of scope — keep this check
best-effort/simple: e.g. only assert when a token exists but `pathParams` is entirely absent —
throw a plain `Error` naming the route/path). Keep this intentionally minimal per the plan's
"authoring-time sanity check, not a type-level guarantee" design — do not over-engineer schema
introspection here.

### `src/fetch/infer-types.ts`

```ts
import type { StandardSchemaV1 } from './standard-schema';
import type { RouteDef } from './dsl';

export type InferPathParams<T extends RouteDef> = T['pathParams'] extends StandardSchemaV1
  ? StandardSchemaV1.InferOutput<T['pathParams']>
  : undefined;

export type InferQuery<T extends RouteDef> = T['query'] extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T['query']>
  : undefined;

export type InferHeaders<T extends RouteDef> = T['headers'] extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T['headers']>
  : undefined;

export type InferBody<T extends RouteDef> = T['body'] extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T['body']>
  : undefined;

export type InferRequest<T extends RouteDef> = {
  [
    K in 'pathParams' | 'query' | 'headers' | 'body' as T[K] extends StandardSchemaV1 ? K : never
  ]: K extends 'pathParams'
    ? InferPathParams<T>
    : K extends 'query'
      ? InferQuery<T>
      : K extends 'headers'
        ? InferHeaders<T>
        : InferBody<T>;
};

export type InferResponse<T extends RouteDef> = {
  [S in keyof T['responses'] & number]: {
    status: S;
    body: StandardSchemaV1.InferOutput<T['responses'][S]>;
  };
}[keyof T['responses'] & number];
```

Adjust exact mapped-type mechanics as needed once written against the real TS compiler — the goal
is: a route with no `body` key has no `body` key in `InferRequest<T>` at all (not
`body?: undefined`).

### `test/fetch/dsl.test-d.ts`

Using `expectTypeOf`/`describe`/`test` from `vite-plus/test` and `valibot` schemas (valibot
satisfies `StandardSchemaV1` natively):

- Define a contract with `defineContract` covering: a GET route with `pathParams` + `query`, a
  POST route with `body` only, a route with no optional fields at all (just `responses`), and a
  multi-status `responses` map.
- Assert `InferRequest<...>` has exactly the expected keys per route (no extra `body`/`query`/etc.
  keys on routes that don't declare them).
- Assert `InferResponse<...>` is a discriminated union whose `status` values match the declared
  response status codes and whose `body` type matches each schema's inferred output.
- Assert `RouteDef['pathParams']` (and siblings) reject a plain object/`unknown` value — i.e.
  confirm a non-standard-schema value is a type error when assigned to `pathParams`/`query`/
  `headers`/`body`/`responses[...]` (this is the "can't pass random things" guarantee).

## Verification

- `vp run test --browser.headless` — `types` project passes for `test/fetch/dsl.test-d.ts`.
- `vp check --fix` — lint/format/typecheck clean for the two new `src/fetch/*.ts` files.
