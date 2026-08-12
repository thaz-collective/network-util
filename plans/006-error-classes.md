# 006 — Error classes

Source only. Depends on: `004-valibot-response-message-schemas.md` (for `NetworkWithMessageListError`'s
`messageList` type). No `test/` files (later plan).

## Goal

Port the three error primitives into `src/error/`.

## Files to create

### `src/error/network-error.ts`

Port verbatim from `thaz-utils/packages/network-util/src/network/network-error.ts` — no changes
needed, it has no external imports:

```ts
export interface NetworkErrorProps {
  readonly statusCode: number;
}

export class NetworkError extends Error {
  readonly statusCode: NetworkErrorProps['statusCode'];

  constructor(data: Readonly<NetworkErrorProps>) {
    super();
    this.name = 'NetworkError';
    this.statusCode = data.statusCode;
  }

  public static isNetworkError(error: unknown): error is NetworkError {
    return error instanceof NetworkError;
  }

  get isInformationCode() {
    return this.statusCode >= 100 && this.statusCode < 200;
  }
  get isSuccessCode() {
    return this.statusCode >= 200 && this.statusCode < 300;
  }
  get isRedirectCode() {
    return this.statusCode >= 300 && this.statusCode < 400;
  }
  get isClientCode() {
    return this.statusCode >= 400 && this.statusCode < 500;
  }
  get isServerCode() {
    return this.statusCode >= 500 && this.statusCode < 600;
  }
  get isOk() {
    return this.statusCode === 200;
  }
  get isCreated() {
    return this.statusCode === 201;
  }
  get isNoContent() {
    return this.statusCode === 204;
  }
  get isBadRequest() {
    return this.statusCode === 400;
  }
  get isUnauthorized() {
    return this.statusCode === 401;
  }
  get isForbidden() {
    return this.statusCode === 403;
  }
  get isNotFound() {
    return this.statusCode === 404;
  }
  get isInternalServiceError() {
    return this.statusCode === 500;
  }
  get isNotImplemented() {
    return this.statusCode === 501;
  }
  get isBadGateway() {
    return this.statusCode === 502;
  }
  get isServiceUnavailable() {
    return this.statusCode === 503;
  }
  get isGatewayTimeout() {
    return this.statusCode === 504;
  }
}
```

Keep the original per-getter JSDoc one-liners from the legacy file.

### `src/error/network-validation-error.ts`

Port verbatim from legacy `network/network-validation-error.ts` (same `@ts-rest/core` dependency —
declared as an optional peer dep in task 001):

```ts
import { StandardSchemaError } from '@ts-rest/core';

export function isNetworkValidationError(error: unknown): error is StandardSchemaError {
  return error instanceof StandardSchemaError;
}
```

### `src/error/network-with-message-list-error.ts`

Port from legacy `network/network-with-message-list-error.ts`, updating the `response` schema
import to this package's own valibot path (task 004's output):

```ts
import type * as v from 'valibot';

import type { response } from '#src/valibot/response-message/response';

import type { NetworkErrorProps } from './network-error';
import { NetworkError } from './network-error';

export interface NetworkWithMessageListErrorProps extends NetworkErrorProps {
  readonly messageList: v.InferOutput<typeof response>['message_list'];
}

export class NetworkWithMessageListError extends NetworkError {
  readonly messageList: NetworkWithMessageListErrorProps['messageList'];

  constructor(data: Readonly<NetworkWithMessageListErrorProps>) {
    super(data);
    this.name = 'NetworkWithMessageListError';
    this.messageList = data.messageList;
  }

  public static isNetworkWithMessageListError(error: unknown): error is NetworkWithMessageListError {
    return error instanceof NetworkWithMessageListError;
  }
}
```

Note: this file lives in `src/error/` but imports a type from `src/valibot/response-message/response`
(task 004) via the `#src/*` internal alias — that's fine at the source level (internal cross-import
between subpath trees), it only affects the _published_ subpath boundary, not internal compilation.

## Verification

- `NetworkError`, `NetworkWithMessageListError`, `isNetworkValidationError` all type-check.
- Confirm `@ts-rest/core` actually exports `StandardSchemaError` at the pinned catalog version
  chosen in task 001 before finalizing the peer dep version range.
