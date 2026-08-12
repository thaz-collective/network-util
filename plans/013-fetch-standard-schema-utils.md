# 013 — standard-schema validation utils

See `011-fetch-overview.md` for full context.

## Purpose

Standalone (no `@ts-rest/core` import) reimplementation of ts-rest's standard-schema validation
core, reused by the client (task 017) for validating path params, query, headers, body, and
responses.

## Files to create

### `src/fetch/standard-schema-utils.ts`

```ts
import type { StandardSchemaV1 } from './standard-schema';

export function isStandardSchema(value: unknown): value is StandardSchemaV1 {
  return (
    typeof value === 'object' &&
    value !== null &&
    '~standard' in value &&
    typeof (value as StandardSchemaV1)['~standard']?.validate === 'function'
  );
}

export async function validateAgainstStandardSchema<T extends StandardSchemaV1>(
  schema: T,
  data: unknown,
): Promise<
  | { success: true; value: StandardSchemaV1.InferOutput<T> }
  | { success: false; issues: readonly StandardSchemaV1.Issue[] }
> {
  const result = await schema['~standard'].validate(data);
  if (result.issues) {
    return { success: false, issues: result.issues };
  }
  return { success: true, value: result.value };
}
```

Note: `~standard.validate` can return synchronously or a `Promise` per spec — `await` handles
both. Keep the function signature `async` throughout the client for consistency (ts-rest does the
same).

### `test/fetch/standard-schema-utils.node.test.ts`

Using `describe`/`test`/`expect` from `vite-plus/test` and `valibot` schemas:

- `isStandardSchema` returns `true` for a valibot schema, `false` for `undefined`, a plain object,
  a function, `null`.
- `validateAgainstStandardSchema` returns `{ success: true, value }` for valid input against a
  simple valibot schema (e.g. `v.string()`), with `value` equal to the parsed/transformed output.
- `validateAgainstStandardSchema` returns `{ success: false, issues }` for invalid input, with
  `issues` non-empty and matching valibot's issue shape.

## Verification

- `vp run test --browser.headless` — new node test passes.
- `vp check --fix` — clean.
