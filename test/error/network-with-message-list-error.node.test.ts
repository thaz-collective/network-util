import { describe, test, expect } from 'vite-plus/test';

import { NetworkError } from '#src/error/network-error';
import { NetworkWithMessageListError } from '#src/error/network-with-message-list-error';

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
