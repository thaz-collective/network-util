import { describe, test, expect } from 'vite-plus/test';

import { NetworkError, NetworkWithMessageListError } from '#src/error/errors';

describe('networkError', () => {
  test('sets statusCode and name', () => {
    const error = new NetworkError({ statusCode: 404 });
    expect(error.statusCode).toBe(404);
    expect(error.name).toBe('NetworkError');
    expect(error).toBeInstanceOf(Error);
  });

  describe('isNetworkError', () => {
    test('returns true for a NetworkError instance', () => {
      expect(NetworkError.isNetworkError(new NetworkError({ statusCode: 500 }))).toBeTruthy();
    });

    test('returns false for a plain Error', () => {
      expect(NetworkError.isNetworkError(new Error('nope'))).toBeFalsy();
    });

    test('returns false for non-error values', () => {
      expect(NetworkError.isNetworkError(undefined)).toBeFalsy();
      expect(NetworkError.isNetworkError('error')).toBeFalsy();
    });
  });

  describe('range getters', () => {
    test.each([
      [100, true, false, false, false, false],
      [199, true, false, false, false, false],
      [200, false, true, false, false, false],
      [299, false, true, false, false, false],
      [300, false, false, true, false, false],
      [399, false, false, true, false, false],
      [400, false, false, false, true, false],
      [499, false, false, false, true, false],
      [500, false, false, false, false, true],
      [599, false, false, false, false, true],
      [600, false, false, false, false, false],
      [99, false, false, false, false, false],
    ])(
      'statusCode %i -> info:%s success:%s redirect:%s client:%s server:%s',
      (statusCode, isInformationCode, isSuccessCode, isRedirectCode, isClientCode, isServerCode) => {
        const error = new NetworkError({ statusCode });
        expect(error.isInformationCode).toBe(isInformationCode);
        expect(error.isSuccessCode).toBe(isSuccessCode);
        expect(error.isRedirectCode).toBe(isRedirectCode);
        expect(error.isClientCode).toBe(isClientCode);
        expect(error.isServerCode).toBe(isServerCode);
      },
    );
  });

  describe('exact code getters', () => {
    const cases: [number, keyof NetworkError][] = [
      [200, 'isOk'],
      [201, 'isCreated'],
      [204, 'isNoContent'],
      [400, 'isBadRequest'],
      [401, 'isUnauthorized'],
      [403, 'isForbidden'],
      [404, 'isNotFound'],
      [500, 'isInternalServiceError'],
      [501, 'isNotImplemented'],
      [502, 'isBadGateway'],
      [503, 'isServiceUnavailable'],
      [504, 'isGatewayTimeout'],
    ];

    test.each(cases)('statusCode %i sets %s to true and other exact getters to false', (statusCode, getter) => {
      const error = new NetworkError({ statusCode });
      expect(error[getter]).toBeTruthy();

      const otherGetters = cases.map(([, name]) => name).filter((name) => name !== getter);
      for (const other of otherGetters) {
        expect(error[other]).toBeFalsy();
      }
    });
  });
});

describe('networkWithMessageListError', () => {
  const messageList = [{ type: 'ERROR', code: 'E001', description: 'Something failed' }] as const;

  test('sets statusCode, name, and messageList', () => {
    const error = new NetworkWithMessageListError({ statusCode: 400, messageList: [...messageList] });
    expect(error.statusCode).toBe(400);
    expect(error.name).toBe('NetworkWithMessageListError');
    expect(error.messageList).toStrictEqual([...messageList]);
  });

  test('inherits NetworkError getters', () => {
    const error = new NetworkWithMessageListError({ statusCode: 404, messageList: [] });
    expect(error.isNotFound).toBeTruthy();
    expect(error.isClientCode).toBeTruthy();
    expect(error.isServerCode).toBeFalsy();
    expect(error).toBeInstanceOf(Error);
  });

  describe('isNetworkWithMessageListError', () => {
    test('returns true for a NetworkWithMessageListError instance', () => {
      expect(
        NetworkWithMessageListError.isNetworkWithMessageListError(
          new NetworkWithMessageListError({ statusCode: 500, messageList: [] }),
        ),
      ).toBeTruthy();
    });

    test('returns false for a plain NetworkError', () => {
      expect(
        NetworkWithMessageListError.isNetworkWithMessageListError(new NetworkError({ statusCode: 500 })),
      ).toBeFalsy();
    });

    test('returns false for non-error values', () => {
      expect(NetworkWithMessageListError.isNetworkWithMessageListError(undefined)).toBeFalsy();
    });
  });
});
