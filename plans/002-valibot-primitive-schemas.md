# 002 — Valibot primitive schemas

Source only. Depends on: `001-project-scaffold.md`. No `test/` files (later plan).

## Goal

Port the null/array/boolean wrapper primitives and the temporal primitives into
`src/valibot/schema/`, updating the temporal ones to use `@thaz/temporal-util/valibot` instead of
the legacy `@thazstack/temporal-valibot-util`.

## Files to create

### `src/valibot/schema/array.ts`

Port verbatim from `thaz-utils/packages/network-util/src/valibot/schema/array.ts`:

```ts
import * as v from 'valibot';

export function responseArray<T extends v.GenericSchema>(baseSchema: T) {
  return v.optional(v.nullable(v.array(baseSchema), []), []);
}
```

### `src/valibot/schema/boolean.ts`

Port verbatim from legacy `schema/boolean.ts`:

```ts
import * as v from 'valibot';

export function responseBoolean(defaultValue: boolean) {
  return v.optional(v.nullable(v.boolean(), defaultValue), defaultValue);
}
```

### `../src/valibot/schema/nullish.ts`

Port verbatim from legacy `schema/nullable.ts` (the `{}` → `null` coercion wrapper):

```ts
import * as v from 'valibot';

export function responseNullable<T extends v.GenericSchema>(baseSchema: T) {
  return v.optional(
    v.union([
      baseSchema,
      v.null(),
      v.pipe(
        v.strictObject({}),
        v.transform(() => null),
      ),
    ]),
    null,
  );
}
```

Keep the original JSDoc comments from the legacy files verbatim — they explain non-obvious intent
(why `{}` is treated as `null`, why array/boolean default rather than surface `null | undefined`).

### `src/valibot/schema/instant.ts`

Legacy version:

```ts
import * as t from '@thazstack/temporal-valibot-util';
import * as v from 'valibot';

export const instant = v.union([t.instant(), v.pipe(v.string(), t.toInstant(), t.instant())]);
```

New version — same shape, swap the import to the sibling package's `./valibot` subpath:

```ts
import * as t from '@thaz/temporal-util/valibot';
import * as v from 'valibot';

export const instant = v.union([t.instant(), v.pipe(v.string(), t.toInstant(), t.instant())]);
```

### `src/valibot/schema/plain-date.ts`, `plain-date-time.ts`, `plain-time.ts`, `zoned-date-time.ts`

Same pattern as `instant.ts` — port each from the legacy equivalent
(`thaz-utils/packages/network-util/src/valibot/schema/plain-date.ts`, `plain-date-time.ts`,
`plain-time.ts`, `zoned-date-time.ts`), replacing `@thazstack/temporal-valibot-util` with
`@thaz/temporal-util/valibot` and reusing the matching action names already ported/verified to
exist in `temporal-util/src/valibot/actions/` (`toPlainDateValue`, `toPlainDateTimeValue`,
`toPlainTimeValue`, `toZonedDateTimeValue`, plus the corresponding `plainDate()`/`plainDateTime()`/
`plainTime()`/`zonedDateTime()` schema builders in `temporal-util/src/valibot/schema/`).

### `src/valibot/schema/index.ts`

```ts
export * from './array';
export * from './boolean';
export * from './instant';
export * from './nullable';
export * from './plain-date';
export * from './plain-date-time';
export * from './plain-time';
export * from './zoned-date-time';
```

## Verification

- Import `@thaz/temporal-util/valibot`'s actual exported action/schema names before wiring
  `plain-date-time.ts`/`plain-time.ts`/`zoned-date-time.ts` — confirm names against
  `temporal-util/src/valibot/actions/to-*-value.ts` and `temporal-util/src/valibot/schema/*.ts`
  rather than assuming a 1:1 rename from the legacy package.
- `vp check` (once wired into `src/valibot/index.ts` in task 005) type-checks cleanly.
