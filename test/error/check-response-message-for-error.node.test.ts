import { describe, test, expect } from 'vite-plus/test';

import { checkResponseMessageForError } from '#src/error/check-response-message-for-error';
import { NetworkWithMessageListError } from '#src/error/errors';

describe('checkResponseMessageForError', () => {
  test('throws NetworkWithMessageListError when an ERROR message is present and content-type is JSON', () => {
    const body = {
      message_list: [{ type: 'ERROR', code: 'E001', description: 'Something failed' }],
    };
    const headers = new Headers({ 'content-type': 'application/json' });

    expect(() => {
      checkResponseMessageForError(body, 400, headers);
    }).toThrow(NetworkWithMessageListError);
  });

  test('does not throw when there are no ERROR-type messages', () => {
    const body = {
      message_list: [{ type: 'INFO', code: 'I001', description: 'All good' }],
    };
    const headers = new Headers({ 'content-type': 'application/json' });

    expect(() => {
      checkResponseMessageForError(body, 200, headers);
    }).not.toThrow();
  });

  test('does not throw when content-type is not JSON', () => {
    const body = {
      message_list: [{ type: 'ERROR', code: 'E001', description: 'Something failed' }],
    };
    const headers = new Headers({ 'content-type': 'text/plain' });

    expect(() => {
      checkResponseMessageForError(body, 400, headers);
    }).not.toThrow();
  });

  test('does not throw when the body fails to parse against the response schema', () => {
    const headers = new Headers({ 'content-type': 'application/json' });

    expect(() => {
      checkResponseMessageForError('not-an-object', 400, headers);
    }).not.toThrow();
  });

  test('does not throw when content-type header is absent', () => {
    const body = {
      message_list: [{ type: 'ERROR', code: 'E001', description: 'Something failed' }],
    };
    const headers = new Headers();

    expect(() => {
      checkResponseMessageForError(body, 400, headers);
    }).not.toThrow();
  });
});
