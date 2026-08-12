import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { nullish } from '#src/valibot/schema/nullish';

describe('nullish', () => {
  const schema = v.object({ value: nullish(v.string()) });

  test('passes through a real value', () => {
    expect(v.parse(schema, { value: 'hello' })).toStrictEqual({ value: 'hello' });
  });

  test('coerces an empty object to null', () => {
    expect(v.parse(schema, { value: {} })).toStrictEqual({ value: null });
  });

  test('coerces undefined to null', () => {
    expect(v.parse(schema, { value: undefined })).toStrictEqual({ value: null });
  });

  test('passes through null', () => {
    expect(v.parse(schema, { value: null })).toStrictEqual({ value: null });
  });

  test('defaults to null when field is missing', () => {
    expect(v.parse(schema, {})).toStrictEqual({ value: null });
  });

  test('fails validation for non-empty objects', () => {
    const result = v.safeParse(schema, { value: { a: 1 } });
    expect(result.success).toBeFalsy();
  });

  test('fails validation for values of the wrong type', () => {
    const result = v.safeParse(schema, { value: 42 });
    expect(result.success).toBeFalsy();
  });
});
