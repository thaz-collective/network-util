import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { isStandardSchema, validateAgainstStandardSchema } from '#src/fetch/standard-schema-utils';

describe('isStandardSchema', () => {
  test('returns true for a valibot schema', () => {
    expect(isStandardSchema(v.string())).toBeTruthy();
  });

  test('returns false for non-schema values', () => {
    expect(isStandardSchema(undefined)).toBeFalsy();
    expect(isStandardSchema(null)).toBeFalsy();
    expect(isStandardSchema({})).toBeFalsy();
    expect(isStandardSchema(() => {})).toBeFalsy();
  });
});

describe('validateAgainstStandardSchema', () => {
  test('returns success with the parsed value for valid input', async () => {
    const result = await validateAgainstStandardSchema(
      v.pipe(
        v.string(),
        v.transform((s) => s.toUpperCase()),
      ),
      'hi',
    );
    expect(result).toStrictEqual({ success: true, value: 'HI' });
  });

  test('returns failure with issues for invalid input', async () => {
    const result = await validateAgainstStandardSchema(v.string(), 123);
    expect(result.success).toBeFalsy();
    expect(result).toHaveProperty('issues');
  });
});
