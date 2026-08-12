import { describe, test, expect } from 'vite-plus/test';

import { NetworkError } from '#src/error/network-error';
import { NetworkWithMessageListError } from '#src/error/network-with-message-list-error';
import { refineNetworkError } from '#src/error/refine-network-response';

describe('refineNetworkError', () => {
  test('does not throw when statusCode matches successCode', () => {
    const headers = new Headers();
    expect(() => {
      refineNetworkError(200, 200, {}, headers);
    }).not.toThrow();
  });

  test('throws NetworkWithMessageListError when status mismatches with a parseable JSON body', () => {
    const headers = new Headers({ 'content-type': 'application/json' });
    const body = {
      message_list: [{ type: 'ERROR', code: 'E001', description: 'Something failed' }],
    };

    expect(() => {
      refineNetworkError(400, 200, body, headers);
    }).toThrow(NetworkWithMessageListError);
  });

  test('throws plain NetworkError when status mismatches with a non-JSON content-type', () => {
    const headers = new Headers({ 'content-type': 'text/plain' });

    let thrown: unknown;
    try {
      refineNetworkError(500, 200, 'oops', headers);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(NetworkError);
    expect(NetworkWithMessageListError.isNetworkWithMessageListError(thrown)).toBeFalsy();
  });

  test('throws plain NetworkError when the JSON body fails to parse against the response schema', () => {
    const headers = new Headers({ 'content-type': 'application/json' });

    let thrown: unknown;
    try {
      refineNetworkError(400, 200, 'not-an-object', headers);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(NetworkError);
    expect(NetworkWithMessageListError.isNetworkWithMessageListError(thrown)).toBeFalsy();
  });
});
