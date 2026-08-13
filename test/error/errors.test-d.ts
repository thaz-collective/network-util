import { describe, test, expectTypeOf } from 'vite-plus/test';

import type { InferOutput } from 'valibot';

import type { NetworkErrorProps, NetworkWithMessageListErrorProps } from '#src/error/errors';
import type { response } from '#src/valibot/response-message/response';
import { NetworkError, NetworkWithMessageListError } from '#src/error/errors';

describe('networkError', () => {
  test('constructor accepts NetworkErrorProps', () => {
    expectTypeOf(NetworkError).toBeConstructibleWith({ statusCode: 200 });
  });

  test('statusCode is a number', () => {
    expectTypeOf<NetworkErrorProps['statusCode']>().toEqualTypeOf<number>();
  });

  test('boolean getters return boolean', () => {
    const error = new NetworkError({ statusCode: 200 });
    expectTypeOf(error.isInformationCode).toEqualTypeOf<boolean>();
    expectTypeOf(error.isSuccessCode).toEqualTypeOf<boolean>();
    expectTypeOf(error.isRedirectCode).toEqualTypeOf<boolean>();
    expectTypeOf(error.isClientCode).toEqualTypeOf<boolean>();
    expectTypeOf(error.isServerCode).toEqualTypeOf<boolean>();
    expectTypeOf(error.isOk).toEqualTypeOf<boolean>();
    expectTypeOf(error.isCreated).toEqualTypeOf<boolean>();
    expectTypeOf(error.isNoContent).toEqualTypeOf<boolean>();
    expectTypeOf(error.isBadRequest).toEqualTypeOf<boolean>();
    expectTypeOf(error.isUnauthorized).toEqualTypeOf<boolean>();
    expectTypeOf(error.isForbidden).toEqualTypeOf<boolean>();
    expectTypeOf(error.isNotFound).toEqualTypeOf<boolean>();
    expectTypeOf(error.isInternalServiceError).toEqualTypeOf<boolean>();
    expectTypeOf(error.isNotImplemented).toEqualTypeOf<boolean>();
    expectTypeOf(error.isBadGateway).toEqualTypeOf<boolean>();
    expectTypeOf(error.isServiceUnavailable).toEqualTypeOf<boolean>();
    expectTypeOf(error.isGatewayTimeout).toEqualTypeOf<boolean>();
  });

  test('isNetworkError narrows unknown to NetworkError', () => {
    type IsNetworkError = typeof NetworkError.isNetworkError;
    expectTypeOf<ReturnType<IsNetworkError>>().toEqualTypeOf<boolean>();
  });
});

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
