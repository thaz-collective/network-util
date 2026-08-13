import { describe, test, expectTypeOf } from 'vite-plus/test';

import type { InferOutput } from 'valibot';

import type { NetworkWithMessageListErrorProps } from '#src/error/errors';
import type { response } from '#src/valibot/response-message/response';
import { NetworkWithMessageListError } from '#src/error/errors';

describe('networkWithMessageListError', () => {
  test('constructor accepts NetworkWithMessageListErrorProps', () => {
    expectTypeOf(NetworkWithMessageListError).toBeConstructibleWith({ statusCode: 400, messageList: [] });
  });

  test('messageList matches the response schema message_list output', () => {
    expectTypeOf<NetworkWithMessageListErrorProps['messageList']>().toEqualTypeOf<
      InferOutput<typeof response>['message_list']
    >();
  });

  test('messageList property is exposed on instances', () => {
    const error = new NetworkWithMessageListError({ statusCode: 400, messageList: [] });
    expectTypeOf(error.messageList).toEqualTypeOf<NetworkWithMessageListErrorProps['messageList']>();
    expectTypeOf(error.statusCode).toEqualTypeOf<number>();
  });
});
