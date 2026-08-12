# 004 — Valibot response-message schemas

Source only. Depends on: `002-valibot-primitive-schemas.md`. No `test/` files (later plan).

## Goal

Port the response-envelope schemas into `src/valibot/response-message/`. These are consumed later
by `src/error/check-response-message-for-error.ts` and `src/error/refine-network-response.ts`
(task 007) and by `src/error/network-with-message-list-error.ts` (task 006) for the `messageList`
type.

## Files to create

### `src/valibot/response-message/message-type.ts`

Port verbatim from `thaz-utils/packages/network-util/src/valibot/response-message/message-type.ts`:

```ts
import * as v from 'valibot';

export const MESSAGE_TYPE = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
} as const;

export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

export const MESSAGE_TYPE_OPTIONS = Object.values(MESSAGE_TYPE) as MessageType[];

export const messageType = v.picklist(MESSAGE_TYPE_OPTIONS);
```

### `src/valibot/response-message/message.ts`

Port verbatim from legacy `response-message/message.ts`:

```ts
import * as v from 'valibot';

import { messageType } from './message-type';

export const message = v.object({
  type: messageType,
  code: v.string(),
  description: v.string(),
});
```

### `src/valibot/response-message/response.ts`

Port from legacy `response-message/response.ts`, updating the `responseArray` import to this
package's own alias:

```ts
import * as v from 'valibot';

import { responseArray } from '#src/valibot/schema/array';

import { message } from './message';

export const response = v.object({
  message_list: responseArray(message),
});
```

### `src/valibot/response-message/index.ts`

```ts
export * from './message';
export * from './message-type';
export * from './response';
```

Keep original JSDoc comments (they explain the severity levels and envelope shape).

## Verification

- `v.InferOutput<typeof response>['message_list']` type-checks the same shape task 006 needs for
  `NetworkWithMessageListErrorProps['messageList']`.
