import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { plainYearMonth } from '#src/valibot/schema/plain-year-month';

describe('plainYearMonth', () => {
  test('parses a Temporal.PlainYearMonth instance', () => {
    const value = Temporal.PlainYearMonth.from('2024-06');
    expect(v.parse(plainYearMonth, value)).toStrictEqual(value);
  });

  test('parses an ISO-8601 year-month string', () => {
    const result = v.parse(plainYearMonth, '2024-06');
    expect(result).toBeInstanceOf(Temporal.PlainYearMonth);
    expect(result.equals(Temporal.PlainYearMonth.from('2024-06'))).toBeTruthy();
  });

  test('fails validation for garbage input', () => {
    const result = v.safeParse(plainYearMonth, 'not-a-year-month');
    expect(result.success).toBeFalsy();
  });

  test('fails validation for non-string, non-PlainYearMonth input', () => {
    const result = v.safeParse(plainYearMonth, 42);
    expect(result.success).toBeFalsy();
  });
});
