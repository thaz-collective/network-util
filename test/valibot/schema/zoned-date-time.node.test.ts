import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { zonedDateTime } from '#src/valibot/schema/zoned-date-time';

describe('zonedDateTime', () => {
  test('parses a Temporal.ZonedDateTime instance', () => {
    const value = Temporal.ZonedDateTime.from('2024-06-15T10:30:00-04:00[America/New_York]');
    expect(v.parse(zonedDateTime, value)).toStrictEqual(value);
  });

  test('parses an ISO-8601 zoned date-time string', () => {
    const result = v.parse(zonedDateTime, '2024-06-15T10:30:00-04:00[America/New_York]');
    expect(result).toBeInstanceOf(Temporal.ZonedDateTime);
    expect(result.equals(Temporal.ZonedDateTime.from('2024-06-15T10:30:00-04:00[America/New_York]'))).toBeTruthy();
  });

  test('fails validation for garbage input', () => {
    const result = v.safeParse(zonedDateTime, 'not-a-zoned-date-time');
    expect(result.success).toBeFalsy();
  });

  test('fails validation for non-string, non-ZonedDateTime input', () => {
    const result = v.safeParse(zonedDateTime, 42);
    expect(result.success).toBeFalsy();
  });
});
