import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { array } from '#src/valibot/schema/array';

describe('array', () => {
  const schema = v.object({ value: array(v.string()) });

  test('passes through a real array', () => {
    expect(v.parse(schema, { value: ['a', 'b'] })).toStrictEqual({ value: ['a', 'b'] });
  });

  test('defaults to an empty array for null', () => {
    expect(v.parse(schema, { value: null })).toStrictEqual({ value: [] });
  });

  test('defaults to an empty array for undefined', () => {
    expect(v.parse(schema, { value: undefined })).toStrictEqual({ value: [] });
  });

  test('defaults to an empty array when the field is missing', () => {
    expect(v.parse(schema, {})).toStrictEqual({ value: [] });
  });

  test('fails validation when an element is the wrong type', () => {
    const result = v.safeParse(schema, { value: ['a', 1] });
    expect(result.success).toBeFalsy();
  });
});
