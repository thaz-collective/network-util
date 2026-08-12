import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { plainMonthDay } from '#src/valibot/schema/plain-month-day';

describe('plainMonthDay', () => {
  test('parses a Temporal.PlainMonthDay instance', () => {
    const value = Temporal.PlainMonthDay.from('06-15');
    expect(v.parse(plainMonthDay, value)).toStrictEqual(value);
  });

  test('parses an ISO-8601 month-day string', () => {
    const result = v.parse(plainMonthDay, '06-15');
    expect(result).toBeInstanceOf(Temporal.PlainMonthDay);
    expect(result.equals(Temporal.PlainMonthDay.from('06-15'))).toBeTruthy();
  });

  test('fails validation for garbage input', () => {
    const result = v.safeParse(plainMonthDay, 'not-a-month-day');
    expect(result.success).toBeFalsy();
  });

  test('fails validation for non-string, non-PlainMonthDay input', () => {
    const result = v.safeParse(plainMonthDay, 42);
    expect(result.success).toBeFalsy();
  });
});
