# 007 — Error response helpers + error barrel

Source only. Depends on: `004-valibot-response-message-schemas.md`, `006-error-classes.md`.

## Goal

Port the two response-inspection helper functions that throw the error classes from task 006, and
finish the `src/error` barrel.

## Files to create

### `src/error/check-response-message-for-error.ts`

Port from `thaz-utils/packages/network-util/src/network/check-response-message-for-error.ts`,
updating the `response` schema import path:

```ts
import * as v from 'valibot';

import { response } from '#src/valibot/response-message/response';

import { NetworkWithMessageListError } from './network-with-message-list-error';

export function checkResponseMessageForError(body: unknown, statusCode: number, headers: Headers) {
  const contentTypeHeader = headers.get('content-type');

  if (contentTypeHeader?.includes('application/') && contentTypeHeader?.includes('json')) {
    const messageList = v.safeParse(response, body);

    if (messageList.success) {
      for (const message of messageList.output.message_list) {
        if (message.type === 'ERROR') {
          throw new NetworkWithMessageListError({
            statusCode,
            messageList: messageList.output.message_list,
          });
        }
      }
    }
  }
}
```

### `src/error/refine-network-response.ts`

Port from legacy `network/refine-network-response.ts`, same import-path update:

```ts
import * as v from 'valibot';

import { response } from '#src/valibot/response-message/response';

import { NetworkError } from './network-error';
import { NetworkWithMessageListError } from './network-with-message-list-error';

export function refineNetworkError<T extends number>(
  statusCode: number,
  successCode: T,
  body: unknown,
  headers: Headers,
): asserts statusCode is T {
  const contentTypeHeader = headers.get('content-type');

  if (statusCode !== successCode) {
    if (contentTypeHeader?.includes('application/') && contentTypeHeader?.includes('json')) {
      const messageList = v.safeParse(response, body);

      if (messageList.success) {
        throw new NetworkWithMessageListError({
          statusCode,
          messageList: messageList.output.message_list,
        });
      }
    }

    throw new NetworkError({ statusCode });
  }
}
```

Keep original JSDoc (both explain call-ordering: `refineNetworkError` is the catch-all to call
after any status-specific handling, `checkResponseMessageForError` guards against server `ERROR`
messages embedded in an otherwise-successful response).

### `src/error/index.ts`

```ts
export * from './check-response-message-for-error';
export * from './network-error';
export * from './network-validation-error';
export * from './network-with-message-list-error';
export * from './refine-network-response';
```

(Alphabetical, matching the style of the other barrel files in this plan; legacy grouped
error-classes vs. functions but a flat alphabetical list is simpler and this barrel is small enough
not to need grouping.)

## Verification

- `vp lint`/`vp check` pass on `src/error/**`.
- Confirm `refineNetworkError`'s `asserts` return type still narrows correctly once compiled under
  this package's `tsconfig.json` (task 001) — no config here should change that from `temporal-util`'s
  baseline, but verify since assertion signatures are sensitive to `strict` settings.
