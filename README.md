# [@thaz/network-util](https://github.com/thaz-collective/network-util)

Network utilities for applications and libraries in the thaz-collective namespace. Provides
[Valibot](https://valibot.dev/) schemas for API response envelopes, entity audit fields, and
`Temporal` values, typed network error classes for branching on HTTP status semantics, and a
suspense-aware `react-query` hook for deferred query keys.

---

## Installation

```bash
vp add @thaz/network-util valibot
```

`@tanstack/react-query` and `react` are only needed if you use `@thaz/network-util/react-query`.
`@ts-rest/core` is only needed if you use `isNetworkValidationError`. `@thaz/temporal-util` and
`temporal-polyfill` are only needed for the `Temporal`-backed schemas exported from the root entry
point.

---

## Requirements

The root entry point's `Temporal` schemas (`instant`, `plainDate`, `plainDateTime`, `plainTime`,
`plainMonthDay`, `plainYearMonth`, `zonedDateTime`) assume a global `Temporal` is already available
at runtime — this package does not bundle or import a Temporal polyfill itself. If you need one
then [`temporal-polyfill`](https://www.npmjs.com/package/temporal-polyfill) is the recommendation.
In your application's entry point, before any code from this package runs:

```ts
import 'temporal-polyfill/full/global';
```

And in your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "lib": ["esnext.temporal", "esnext.intl", "esnext.date"]
  }
}
```

If your runtime ships native `Temporal` support, `temporal-polyfill` will detect and prefer it
automatically — the import above is still required to guarantee the ambient global is installed
one way or the other. If you are sure `Temporal` is in your runtime, then you do not need to
install `temporal-polyfill`.

---

## Entry points

| Import                           | Contents                                                                                                       |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `@thaz/network-util`             | Valibot schema primitives, entity fields, and the response-message envelope                                    |
| `@thaz/network-util/error`       | `NetworkError`, `NetworkWithMessageListError`, `isNetworkValidationError`, and the response-checking functions |
| `@thaz/network-util/react-query` | `useSuspenseQueryDeferred`                                                                                     |

---

## Valibot schema primitives

Lower-level wrappers used to build the entity and response-message schemas below. Each accepts
`null`/`undefined` and normalizes to a sensible default rather than requiring the field.

```ts
import * as v from 'valibot';
import { array, boolean, nullish } from '@thaz/network-util';

const schema = v.object({
  tags: array(v.string()), // missing/null -> []
  isActive: boolean(true), // missing/null -> true
  note: nullish(v.string()), // missing/null/{} -> null
});
```

| Schema             | Accepts/transforms             | Output      |
| ------------------ | ------------------------------ | ----------- |
| `array(schema)`    | `T[]`, `null`, `undefined`     | `T[]`       |
| `boolean(default)` | `boolean`, `null`, `undefined` | `boolean`   |
| `nullish(schema)`  | `T`, `null`, `undefined`, `{}` | `T \| null` |

## Valibot temporal schemas

Each accepts the matching `Temporal` instance directly or an ISO-8601 string, which is parsed into
the corresponding `Temporal` type.

```ts
import * as v from 'valibot';
import { instant, plainDate } from '@thaz/network-util';

v.parse(instant, '2024-06-15T10:30:00Z'); // -> Temporal.Instant
v.parse(plainDate, Temporal.PlainDate.from('2024-06-15')); // -> Temporal.PlainDate
```

| Schema           | Accepts                                     | Output                    |
| ---------------- | ------------------------------------------- | ------------------------- |
| `instant`        | `Temporal.Instant` / ISO-8601 string        | `Temporal.Instant`        |
| `plainDate`      | `Temporal.PlainDate` / ISO-8601 string      | `Temporal.PlainDate`      |
| `plainDateTime`  | `Temporal.PlainDateTime` / ISO-8601 string  | `Temporal.PlainDateTime`  |
| `plainTime`      | `Temporal.PlainTime` / ISO-8601 string      | `Temporal.PlainTime`      |
| `plainMonthDay`  | `Temporal.PlainMonthDay` / ISO-8601 string  | `Temporal.PlainMonthDay`  |
| `plainYearMonth` | `Temporal.PlainYearMonth` / ISO-8601 string | `Temporal.PlainYearMonth` |
| `zonedDateTime`  | `Temporal.ZonedDateTime` / ISO-8601 string  | `Temporal.ZonedDateTime`  |

## Entity schemas

Reusable Valibot object schemas for the audit fields commonly present on persisted entities.

```ts
import * as v from 'valibot';
import { activeEntity, baseEntity, extendedAuditEntity, softDeletedEntity } from '@thaz/network-util';

const userSchema = v.object({
  id: v.string(),
  ...baseEntity.entries,
  ...activeEntity.entries,
});
```

| Schema                | Fields                                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------------------------ |
| `baseEntity`          | `created_at_timestamp`, `created_by`, `updated_at_timestamp`, `updated_by`                                   |
| `activeEntity`        | `active_at_timestamp`, `expired_at_timestamp` (nullish `instant`)                                            |
| `extendedAuditEntity` | `created_by_process`, `created_by_user_id`, `updated_by_process`, `updated_by_user_id` (all nullish strings) |
| `softDeletedEntity`   | `soft_deleted_at_timestamp` (nullish `instant`)                                                              |

## Response-message envelope

Schemas for the standard API response envelope used to carry server-side messages alongside a
successful or failed response.

```ts
import * as v from 'valibot';
import { MESSAGE_TYPE, message, response } from '@thaz/network-util';

v.parse(response, {
  message_list: [{ type: MESSAGE_TYPE.ERROR, code: 'E001', description: 'Something failed' }],
});
```

| Export                 | Description                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| `MESSAGE_TYPE`         | Enum-style constant map of the four recognized severity levels        |
| `MessageType`          | Union type of the recognized severity level string values             |
| `MESSAGE_TYPE_OPTIONS` | Array of all `MessageType` values                                     |
| `messageType`          | Picklist schema validating against `MESSAGE_TYPE_OPTIONS`             |
| `message`              | Schema for a single response message (`type`, `code`, `description`)  |
| `response`             | Schema for the response envelope (`message_list`, defaulting to `[]`) |

---

## `@thaz/network-util/error`

Typed error classes and helpers for handling non-success network responses.

```ts
import { checkResponseMessageForError, refineNetworkError } from '@thaz/network-util/error';

const res = await fetch('/api/widgets');
const body = await res.json();

refineNetworkError(res.status, 200, body, res.headers);
checkResponseMessageForError(body, res.status, res.headers);
```

| Export                         | Description                                                                                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NetworkError`                 | Thrown when a status code doesn't match the expected success code; exposes range/exact status getters (`isOk`, `isClientCode`, `isNotFound`, etc.) |
| `NetworkWithMessageListError`  | Extends `NetworkError` with a parsed `messageList` from the response body                                                                          |
| `isNetworkValidationError`     | Type guard for `@ts-rest/core`'s `StandardSchemaError`                                                                                             |
| `checkResponseMessageForError` | Throws `NetworkWithMessageListError` if a JSON response body contains an `ERROR`-type message                                                      |
| `refineNetworkError`           | Asserts `statusCode` equals `successCode`, throwing `NetworkWithMessageListError` or `NetworkError` otherwise                                      |

`NetworkError` and `NetworkWithMessageListError` each expose a static type-guard (`isNetworkError`,
`isNetworkWithMessageListError`) for narrowing `unknown` values caught from a `try`/`catch`.

---

## `@thaz/network-util/react-query`

A `useSuspenseQuery` wrapper that defers the query key so stale data continues to render while a
new key's data is being fetched, instead of reverting to the Suspense fallback.

```ts
import { useSuspenseQueryDeferred } from '@thaz/network-util/react-query';

const { query, isSuspending } = useSuspenseQueryDeferred({
  queryKey: ['widgets', filters],
  queryFn: () => fetchWidgets(filters),
});
```

`isSuspending` is driven by [`spin-delay`](https://www.npmjs.com/package/spin-delay) so it doesn't
flicker `true` during fast transitions — use it to render a loading indicator while stale data is
still on screen. An optional second argument is forwarded to `useSpinDelay` to configure the
minimum visible duration and delay.
