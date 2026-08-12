import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { plainDateTime } from '#src/valibot/schema/plain-date-time';

describe('plainDateTime', () => {
  test('parses a Temporal.PlainDateTime instance', () => {
    const value = Temporal.PlainDateTime.from('2024-06-15T10:30:00');
    expect(v.parse(plainDateTime, value)).toStrictEqual(value);
  });

  test('parses an ISO-8601 date-time string', () => {
    const result = v.parse(plainDateTime, '2024-06-15T10:30:00');
    expect(result).toBeInstanceOf(Temporal.PlainDateTime);
    expect(result.equals(Temporal.PlainDateTime.from('2024-06-15T10:30:00'))).toBeTruthy();
  });

  test('fails validation for garbage input', () => {
    const result = v.safeParse(plainDateTime, 'not-a-date');
    expect(result.success).toBeFalsy();
  });

  test('fails validation for non-string, non-PlainDateTime input', () => {
    const result = v.safeParse(plainDateTime, {});
    expect(result.success).toBeFalsy();
  });
});
