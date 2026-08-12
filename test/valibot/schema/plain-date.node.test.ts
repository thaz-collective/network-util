import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { plainDate } from '#src/valibot/schema/plain-date';

describe('plainDate', () => {
  test('parses a Temporal.PlainDate instance', () => {
    const value = Temporal.PlainDate.from('2024-06-15');
    expect(v.parse(plainDate, value)).toStrictEqual(value);
  });

  test('parses an ISO-8601 date string', () => {
    const result = v.parse(plainDate, '2024-06-15');
    expect(result).toBeInstanceOf(Temporal.PlainDate);
    expect(result.equals(Temporal.PlainDate.from('2024-06-15'))).toBeTruthy();
  });

  test('fails validation for garbage input', () => {
    const result = v.safeParse(plainDate, 'not-a-date');
    expect(result.success).toBeFalsy();
  });

  test('fails validation for non-string, non-PlainDate input', () => {
    const result = v.safeParse(plainDate, true);
    expect(result.success).toBeFalsy();
  });
});
