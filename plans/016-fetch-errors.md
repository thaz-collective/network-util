# 016 — fetch-specific error types

See `011-fetch-overview.md` for full context. Depends on `015-error-standard-schema-validation-error.md`.

## Purpose

Define the distinct error subtypes the fetch client throws for each failure mode, so callers can
`instanceof`-discriminate. These are fetch-only and do **not** reuse `NetworkError`/
`NetworkWithMessageListError`/etc.

## Files to create

### `src/fetch/errors.ts`

```ts
import { StandardSchemaValidationError } from '#src/error/standard-schema-validation-error';
import type { StandardSchemaV1 } from './standard-schema';
import type { Method } from './dsl';

/**
 * Raised when a request's path params, query, headers, or body fail standard-schema validation
 * before the request is sent.
 */
export class RequestValidationError extends StandardSchemaValidationError {
  readonly method: Method;
  readonly path: string;
  readonly field: 'pathParams' | 'query' | 'headers' | 'body';

  constructor(
    issues: readonly StandardSchemaV1.Issue[],
    context: { method: Method; path: string; field: 'pathParams' | 'query' | 'headers' | 'body' },
  ) {
    super(issues);
    this.name = 'RequestValidationError';
    this.method = context.method;
    this.path = context.path;
    this.field = context.field;
  }
}

/**
 * Raised when a response body fails standard-schema validation against the schema declared for
 * its status code.
 */
export class ResponseValidationError extends StandardSchemaValidationError {
  readonly method: Method;
  readonly path: string;
  readonly status: number;

  constructor(issues: readonly StandardSchemaV1.Issue[], context: { method: Method; path: string; status: number }) {
    super(issues);
    this.name = 'ResponseValidationError';
    this.method = context.method;
    this.path = context.path;
    this.status = context.status;
  }
}

/**
 * Raised when a response's status code has no matching entry in the contract's `responses` map.
 */
export class UnexpectedStatusError extends Error {
  readonly method: Method;
  readonly path: string;
  readonly status: number;
  readonly body: unknown;

  constructor(context: { method: Method; path: string; status: number; body: unknown }) {
    super(`Unexpected status ${context.status} for ${context.method} ${context.path}`);
    this.name = 'UnexpectedStatusError';
    this.method = context.method;
    this.path = context.path;
    this.status = context.status;
    this.body = context.body;
  }
}
```

Confirm the `#src/error/...` deep-import path alias resolves correctly (used elsewhere in this
repo, e.g. `src/error/*.ts` importing `#src/valibot/response-message/response`) rather than
importing the barrel `#src/error` (to avoid any barrel-cycle risk between `src/error` and
`src/fetch`).

### `test/fetch/errors.node.test.ts`

Using `describe`/`test`/`expect` from `vite-plus/test`:

- Each error class sets `.name` correctly and is an `instanceof Error` and (for the two
  validation errors) `instanceof StandardSchemaValidationError`.
- `RequestValidationError`/`ResponseValidationError` carry `.issues` from the constructor.
- Each error carries its context fields (`method`, `path`, `field`/`status`, `body` where
  applicable).
- `isNetworkValidationError` (from `src/error`) returns `true` for a `RequestValidationError` and
  a `ResponseValidationError` (since both extend `NetworkStandardSchemaValidationError`), confirming the
  cross-module integration works as designed.

## Verification

- `vp run test --browser.headless` — new tests pass.
- `vp check --fix` — clean.
