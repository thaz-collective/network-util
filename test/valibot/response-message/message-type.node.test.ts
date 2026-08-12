import { expect, test, describe } from 'vite-plus/test';

import * as v from 'valibot';

import { MESSAGE_TYPE, MESSAGE_TYPE_OPTIONS, messageType } from '#src/valibot/response-message/message-type';

describe('check MESSAGE_TYPE', () => {
  test('contains the four recognized severity levels', () => {
    expect(MESSAGE_TYPE).toStrictEqual({
      INFO: 'INFO',
      SUCCESS: 'SUCCESS',
      WARNING: 'WARNING',
      ERROR: 'ERROR',
    });
  });
});

describe('check MESSAGE_TYPE_OPTIONS', () => {
  test('contains all MESSAGE_TYPE values', () => {
    expect(MESSAGE_TYPE_OPTIONS).toStrictEqual(['INFO', 'SUCCESS', 'WARNING', 'ERROR']);
  });
});

describe('messageType', () => {
  test.each(MESSAGE_TYPE_OPTIONS)('accepts %s', (value) => {
    expect(v.parse(messageType, value)).toBe(value);
  });

  test('rejects an unrecognized value', () => {
    const result = v.safeParse(messageType, 'UNKNOWN');
    expect(result.success).toBeFalsy();
  });
});
