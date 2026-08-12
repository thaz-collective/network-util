import { expect, test, describe } from 'vite-plus/test';

import * as v from 'valibot';

import { response } from '#src/valibot/response-message/response';

describe('response', () => {
  test('parses a response with messages', () => {
    const value = {
      message_list: [{ type: 'INFO', code: 'I001', description: 'All good' }],
    };
    expect(v.parse(response, value)).toStrictEqual(value);
  });

  test('defaults message_list to an empty array when missing', () => {
    expect(v.parse(response, {})).toStrictEqual({ message_list: [] });
  });

  test('defaults message_list to an empty array when null', () => {
    expect(v.parse(response, { message_list: null })).toStrictEqual({ message_list: [] });
  });
});
