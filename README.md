# [@thaz/network-util](https://github.com/thaz-collective/network-util)

Network utilities for applications and libraries in the thaz-collective namespace. Provides
[Valibot](https://valibot.dev/) schemas for API response envelopes, entity audit fields, and
`Temporal` values; a typed, standard-schema-based `fetch` client builder; typed network error
classes for branching on HTTP status semantics; and a suspense-aware `react-query` hook for
deferred query keys.

---

## Installation

```bash
vp add @thaz/network-util @thaz/temporal-util valibot
```

`@tanstack/react-query` and `react` are only needed if you use `@thaz/network-util/react-query`.
`temporal-polyfill` is only needed for the `Temporal`-backed schemas
exported from the root entry point or errors path.

---

## Requirements

The root entry point's `Temporal` schemas assume a global `Temporal` is already available
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

| Import                           | Contents                                                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `@thaz/network-util`             | Valibot schema primitives, entity fields, and the response-message envelope                                                       |
| `@thaz/network-util/error`       | `NetworkError`, `NetworkWithMessageListError`, response-checking functions, and every error class from `@thaz/network-util/fetch` |
| `@thaz/network-util/fetch`       | `defineContract`, `createFetchClient`, and their supporting types and error classes                                               |
| `@thaz/network-util/react-query` | `useSuspenseQueryDeferred`                                                                                                        |

---

## Valibot schema primitives

Lower-level wrappers used to build the entity and response-message schemas below. Each accepts
`null`/`undefined` and normalizes to a sensible default rather than requiring the field.

```ts
import * as v from 'valibot';
import * as n from '@thaz/network-util';

const schema = v.object({
  tags: n.array(v.string()), // missing/null -> []
  isActive: n.boolean(true), // missing/null -> true
  note: n.nullish(v.string()), // missing/null/{} -> null
});
```

| Schema               | Accepts/transforms             | Output      |
| -------------------- | ------------------------------ | ----------- |
| `n.array(schema)`    | `T[]`, `null`, `undefined`     | `T[]`       |
| `n.boolean(default)` | `boolean`, `null`, `undefined` | `boolean`   |
| `n.nullish(schema)`  | `T`, `null`, `undefined`, `{}` | `T \| null` |

## Valibot temporal schemas

Each accepts the matching `Temporal` instance directly or an ISO-8601 string, which is parsed into
the corresponding `Temporal` type.

```ts
import * as v from 'valibot';
import * as n from '@thaz/network-util';

v.parse(n.instant, '2024-06-15T10:30:00Z'); // -> Temporal.Instant
v.parse(n.plainDate, Temporal.PlainDate.from('2024-06-15')); // -> Temporal.PlainDate
```

| Schema             | Accepts                                     | Output                    |
| ------------------ | ------------------------------------------- | ------------------------- |
| `n.zonedDateTime`  | `Temporal.ZonedDateTime` / ISO-8601 string  | `Temporal.ZonedDateTime`  |
| `n.instant`        | `Temporal.Instant` / ISO-8601 string        | `Temporal.Instant`        |
| `n.plainDateTime`  | `Temporal.PlainDateTime` / ISO-8601 string  | `Temporal.PlainDateTime`  |
| `n.plainDate`      | `Temporal.PlainDate` / ISO-8601 string      | `Temporal.PlainDate`      |
| `n.plainTime`      | `Temporal.PlainTime` / ISO-8601 string      | `Temporal.PlainTime`      |
| `n.plainYearMonth` | `Temporal.PlainYearMonth` / ISO-8601 string | `Temporal.PlainYearMonth` |
| `n.plainMonthDay`  | `Temporal.PlainMonthDay` / ISO-8601 string  | `Temporal.PlainMonthDay`  |

## Entity schemas

Reusable Valibot object schemas for the audit fields commonly present on persisted entities.

```ts
import * as v from 'valibot';
import * as n from '@thaz/network-util';

const userSchema = v.object({
  id: v.string(),
  ...n.baseEntity.entries,
  ...n.activeEntity.entries,
});
```

| Schema                  | Fields                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ |
| `n.baseEntity`          | `created_at_timestamp`, `created_by`, `updated_at_timestamp`, `updated_by`                                   |
| `n.activeEntity`        | `active_at_timestamp` (required `instant`), `expired_at_timestamp` (nullish `instant`)                       |
| `n.extendedAuditEntity` | `created_by_process`, `created_by_user_id`, `updated_by_process`, `updated_by_user_id` (all nullish strings) |
| `n.softDeletedEntity`   | `soft_deleted_at_timestamp` (nullish `instant`)                                                              |

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

Typed error classes and helpers for handling non-success network responses. Also re-exports every
error class from `@thaz/network-util/fetch` (see below), so this entry point alone covers error
handling whether you use the `fetch` client builder or not.

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
| `checkResponseMessageForError` | Throws `NetworkWithMessageListError` if a JSON response body contains an `ERROR`-type message                                                      |
| `refineNetworkError`           | Asserts `statusCode` equals `successCode`, throwing `NetworkWithMessageListError` or `NetworkError` otherwise                                      |

`NetworkError` and `NetworkWithMessageListError` each expose a static type-guard (`isNetworkError`,
`isNetworkWithMessageListError`) for narrowing `unknown` values caught from a `try`/`catch`. So does
every error class re-exported from `@thaz/network-util/fetch` (`isRequestValidationError`, etc.).

---

## `@thaz/network-util/fetch`

A typed `fetch` client builder on top of [standard-schema](https://standardschema.dev/): declare a
contract of routes with a schema for each request/response part, then get back a client with one
async function per route, fully typed from those schemas.

```ts
import * as v from 'valibot';
import { defineContract, createFetchClient } from '@thaz/network-util/fetch';

const contract = defineContract({
  getPost: {
    method: 'GET',
    path: '/posts/:id',
    pathParams: v.object({ id: v.pipe(v.string(), v.transform(Number)) }),
    responses: { 200: v.object({ id: v.number(), title: v.string() }) },
  },
  createPost: {
    method: 'POST',
    path: '/posts',
    body: v.object({ title: v.string() }),
    responses: { 201: v.object({ id: v.number(), title: v.string() }) },
  },
});

const client = createFetchClient(contract, {
  baseUrl: 'https://api.example.com',
});

const { body: post } = await client.getPost({ pathParams: { id: '1' } });

const controller = new AbortController();
await client.createPost({ body: { title: 'Hello' } }, { signal: controller.signal });
```

Each route function's argument object only has keys for the request parts the route actually
declares a schema for (`pathParams`, `query`, `headers`, `body`), typed from that schema's input.
Responses are validated against the schema declared for the returned status code and come back as
`{ status, body }`. A second, optional argument accepts per-call `signal` (forwarded to `fetch` for
cancellation) and `headers` (merged in last, overriding contract- and client-level headers).

An optional `headers` schema can be passed to `defineContract` to validate/require headers on every
route, merged with each route's own `headers` schema — see `DefineContractOptions`.

| Export                      | Description                                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `defineContract`            | Builds a `Contract` from a map of `RouteDef`s, validating path tokens and response status keys at definition time |
| `createFetchClient`         | Builds a `FetchClient` from a `Contract`: one async function per route                                            |
| `RouteDef`                  | Shape of a single route declaration (`method`, `path`, and per-part schemas)                                      |
| `InferRequest`              | Infers a route's full request argument shape                                                                      |
| `InferResponse`             | Infers a route's response as a discriminated union over its declared status codes                                 |
| `InferRequestPathParams`    | Infers a route's `pathParams` schema input alone                                                                  |
| `InferRequestQuery`         | Infers a route's `query` schema input alone                                                                       |
| `InferRequestBody`          | Infers a route's `body` schema input alone                                                                        |
| `InferRequestHeaders`       | Infers a route's combined (global + local) headers schema input                                                   |
| `InferRequestLocalHeaders`  | Infers a route's own `headers` schema input alone                                                                 |
| `InferRequestGlobalHeaders` | Infers the contract-level global headers schema input a route was tagged with                                     |

All error classes below (plus their common base, `StandardSchemaValidationError`) are also
re-exported from `@thaz/network-util/error`.

| Error                           | Thrown when                                                                                        |
| ------------------------------- | -------------------------------------------------------------------------------------------------- |
| `StandardSchemaValidationError` | Common base class of `RequestValidationError` and `ResponseValidationError`                        |
| `ContractPathParamsError`       | `defineContract`: a route's `path` declares a `:token` with no matching `pathParams` schema        |
| `ContractResponseStatusError`   | `defineContract`: a `responses` key isn't a numeric status code                                    |
| `MissingPathParamError`         | Building the URL: a route path token has no matching key (or an `undefined` value) in `pathParams` |
| `InvalidRequestFieldTypeError`  | A schema validates successfully but produces a value that isn't a plain object                     |
| `RequestValidationError`        | A route function's `pathParams`, `query`, `headers`, or `body` fails its schema                    |
| `ResponseValidationError`       | A response body fails the schema declared for its status code                                      |
| `UnexpectedStatusError`         | A response's status code has no matching entry in the route's `responses`                          |

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

---

## References & Acknowledgements

- [Valibot](https://valibot.dev/) - the schema library these schemas and actions extend
- [Temporal proposal](https://tc39.es/proposal-temporal/docs/) - the `Temporal` API these schemas normalize input into
- [`temporal-polyfill`](https://www.npmjs.com/package/temporal-polyfill) - the polyfill this package targets as a peer if you don't already have the `Temporal` API in your runtime
- [`@thaz/temporal-util`](https://github.com/thaz-collective/temporal-util) - `Temporal` schemas and comparison actions this package builds on
- [`@ts-rest/core`](https://github.com/ts-rest/ts-rest/tree/main/libs/ts-rest/core) - previously used but given we only used the contract/client it made more sense to rebuild myself and maintain a simpler syntax for needs of a thaz-collective project
