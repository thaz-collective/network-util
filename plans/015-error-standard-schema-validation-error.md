# 015 — `StandardSchemaValidationError` in `src/error`

See `011-fetch-overview.md` for full context.

## Purpose

Add a standalone (no `@ts-rest/core` import) base validation error to `src/error/`, and migrate
the existing `isNetworkValidationError` guard off ts-rest's `StandardSchemaError`. This is a
prerequisite for task 016 (`src/fetch/errors.ts` extends this base) and for task 019 (removing the
`@ts-rest/core` peer dependency).

## Files to create/modify

### `src/error/standard-schema-validation-error.ts` (new)

```ts
import type { StandardSchemaV1 } from '@standard-schema/spec';

/**
 * Raised when data fails standard-schema validation.
 */
export class StandardSchemaValidationError extends Error {
  readonly issues: readonly StandardSchemaV1.Issue[];

  constructor(issues: readonly StandardSchemaV1.Issue[]) {
    super(JSON.stringify(issues, null, 2));
    this.name = 'StandardSchemaValidationError';
    this.issues = issues;
  }

  static isStandardSchemaValidationError(error: unknown): error is StandardSchemaValidationError {
    return error instanceof StandardSchemaValidationError;
  }
}
```

(Match this repo's existing static-guard convention seen on `NetworkError`/
`NetworkWithMessageListError` — read `src/error/network-error.ts` for the exact naming/JSDoc
style used for those static guards and mirror it.)

### `src/error/network-validation-error.ts` (rewrite)

Replace the `@ts-rest/core` import with the new local class:

```ts
import { StandardSchemaValidationError } from './standard-schema-validation-error';

/**
 * Returns `true` if `error` is a `StandardSchemaValidationError` raised by a network
 * request/response validation failure.
 *
 * @param error The value to test.
 * @returns A type predicate narrowing `error` to `StandardSchemaValidationError`.
 */
export function isNetworkValidationError(error: unknown): error is StandardSchemaValidationError {
  return error instanceof StandardSchemaValidationError;
}
```

### `src/error/index.ts` (modify)

Add the new export:

```ts
export * from './network-error';
export * from './network-validation-error';
export * from './network-with-message-list-error';
export * from './standard-schema-validation-error';

export * from './check-response-message-for-error';
export * from './refine-network-response';
```

## Testing

Add `test/error/standard-schema-validation-error.node.test.ts` covering: constructing with a
sample `issues` array stores them on `.issues`, `message` is derived from the issues,
`isStandardSchemaValidationError`/`instanceof` works. Update
`test/error/network-validation-error.node.test.ts` (if it exists — check first) to construct a
`StandardSchemaValidationError` directly instead of relying on ts-rest, and confirm
`isNetworkValidationError` still returns `true`/`false` correctly.

## Verification

- `vp run test --browser.headless` — new + updated error tests pass.
- `vp check --fix` — clean.
- `grep -r "@ts-rest/core" src/error/` returns no matches.
