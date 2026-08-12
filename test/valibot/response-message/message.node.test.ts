import { expect, test, describe } from 'vite-plus/test';

import * as v from 'valibot';

import { message } from '#src/valibot/response-message/message';

describe('message', () => {
  test('parses a valid message', () => {
    const value = { type: 'ERROR', code: 'E001', description: 'Something failed' };
    expect(v.parse(message, value)).toStrictEqual(value);
  });

  test('fails validation for an invalid type', () => {
    const result = v.safeParse(message, { type: 'UNKNOWN', code: 'E001', description: 'Something failed' });
    expect(result.success).toBeFalsy();
  });

  test('fails validation when a field is missing', () => {
    const result = v.safeParse(message, { type: 'INFO', code: 'E001' });
    expect(result.success).toBeFalsy();
  });
});
