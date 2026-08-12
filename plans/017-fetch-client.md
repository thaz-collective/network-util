# 017 — `createFetchClient`

See `011-fetch-overview.md` for full context. Depends on `012`, `013`, `014`, `016`.

## Purpose

The runtime fetch client: binds one async function per contract route that validates the request,
builds the URL, performs a real `fetch()`, and validates the response.

## Files to create

### `src/fetch/client.ts`

```ts
import { validateAgainstStandardSchema } from './standard-schema-utils';
import { buildUrl } from './url';
import { RequestValidationError, ResponseValidationError, UnexpectedStatusError } from './errors';
import type { RouteDef } from './dsl';
import type { InferRequest, InferResponse } from './infer-types';

export interface CreateFetchClientOptions {
  baseUrl: string;
  headers?: HeadersInit | (() => HeadersInit);
}

export function createFetchClient<T extends Record<string, RouteDef>>(
  contract: T,
  options: CreateFetchClientOptions,
): { [K in keyof T]: (args: InferRequest<T[K]>) => Promise<InferResponse<T[K]>> } {
  const client = {} as { [K in keyof T]: (args: InferRequest<T[K]>) => Promise<InferResponse<T[K]>> };

  for (const key of Object.keys(contract) as (keyof T)[]) {
    const route = contract[key];
    client[key] = (async (args: Record<string, unknown>) => {
      const pathParams = route.pathParams
        ? await validateField(route, 'pathParams', route.pathParams, args.pathParams)
        : undefined;
      const query = route.query ? await validateField(route, 'query', route.query, args.query) : undefined;
      const headers = route.headers
        ? await validateField(route, 'headers', route.headers, args.headers)
        : undefined;
      const body = route.body ? await validateField(route, 'body', route.body, args.body) : undefined;

      const url = buildUrl(options.baseUrl, route.path, pathParams as Record<string, unknown>, query as Record<string, unknown>);

      const mergedHeaders = new Headers(
        typeof options.headers === 'function' ? options.headers() : options.headers,
      );
      if (headers) {
        for (const [k, v] of Object.entries(headers)) mergedHeaders.set(k, String(v));
      }
      if (body !== undefined && route.method !== 'GET' && route.method !== 'HEAD') {
        mergedHeaders.set('content-type', 'application/json');
      }

      const res = await fetch(url, {
        method: route.method,
        headers: mergedHeaders,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      const contentType = res.headers.get('content-type') ?? '';
      const parsedBody = contentType.includes('json')
        ? await res.json()
        : contentType.startsWith('text/')
          ? await res.text()
          : await res.blob();

      const responseSchema = route.responses[res.status];
      if (!responseSchema) {
        throw new UnexpectedStatusError({
          method: route.method,
          path: route.path,
          status: res.status,
          body: parsedBody,
        });
      }

      const result = await validateAgainstStandardSchema(responseSchema, parsedBody);
      if (!result.success) {
        throw new ResponseValidationError(result.issues, {
          method: route.method,
          path: route.path,
          status: res.status,
        });
      }

      return { status: res.status, body: result.value, headers: res.headers };
    }) as (args: InferRequest<T[typeof key]>) => Promise<InferResponse<T[typeof key]>>;
  }

  return client;
}

async function validateField(
  route: RouteDef,
  field: 'pathParams' | 'query' | 'headers' | 'body',
  schema: NonNullable<RouteDef[typeof field]>,
  value: unknown,
) {
  const result = await validateAgainstStandardSchema(schema, value);
  if (!result.success) {
    throw new RequestValidationError(result.issues, { method: route.method, path: route.path, field });
  }
  return result.value;
}
```

Treat the above as a strong draft, not gospel — adjust casts/typing as needed once compiled
against the real `InferRequest`/`InferResponse` types from task 012 (some `as`-casts here are
expected at the object-building boundary, matching how ts-rest's own `initClient` handles the
same generic-to-concrete gap).

### `src/fetch/index.ts` (barrel)

```ts
export * from './dsl';
export * from './infer-types';
export * from './client';
export * from './errors';
```

(`standard-schema-utils.ts` and `url.ts` stay internal/unexported — they're implementation
details, not public API, matching the "much smaller than ts-rest" surface goal. Confirm this
against sibling barrels' convention of what's public vs. internal before finalizing.)

## Testing

Defer integration tests (real `fetch` via `msw`) to task 018. This task's own verification is
purely that it compiles and wires together correctly — no new test file here unless a trivial
node-level unit test of `createFetchClient`'s pure branching logic (e.g. path builder invocation)
is easy to isolate without mocking network calls; skip if not.

## Verification

- `vp check --fix` — the new client compiles cleanly against `InferRequest`/`InferResponse`.
- `vp run build` — `src/fetch/index.ts` builds without type errors (full integration test comes in
  018).
