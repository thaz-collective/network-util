import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { boolean } from '#src/valibot/schema/boolean';

describe('boolean', () => {
  const schema = v.object({ value: boolean(true) });

  test('passes through a real boolean value', () => {
    expect(v.parse(schema, { value: false })).toStrictEqual({ value: false });
  });

  test('defaults to the given default for null', () => {
    expect(v.parse(schema, { value: null })).toStrictEqual({ value: true });
  });

  test('defaults to the given default for undefined', () => {
    expect(v.parse(schema, { value: undefined })).toStrictEqual({ value: true });
  });

  test('defaults to the given default when the field is missing', () => {
    expect(v.parse(schema, {})).toStrictEqual({ value: true });
  });

  test('supports a false default', () => {
    const falseSchema = v.object({ value: boolean(false) });
    expect(v.parse(falseSchema, {})).toStrictEqual({ value: false });
  });

  test('fails validation for non-boolean values', () => {
    const result = v.safeParse(schema, { value: 'true' });
    expect(result.success).toBeFalsy();
  });
});
