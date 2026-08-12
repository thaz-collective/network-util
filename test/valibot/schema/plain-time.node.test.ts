import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { plainTime } from '#src/valibot/schema/plain-time';

describe('plainTime', () => {
  test('parses a Temporal.PlainTime instance', () => {
    const value = Temporal.PlainTime.from('10:30:00');
    expect(v.parse(plainTime, value)).toStrictEqual(value);
  });

  test('parses an ISO-8601 time string', () => {
    const result = v.parse(plainTime, '10:30:00');
    expect(result).toBeInstanceOf(Temporal.PlainTime);
    expect(result.equals(Temporal.PlainTime.from('10:30:00'))).toBeTruthy();
  });

  test('fails validation for garbage input', () => {
    const result = v.safeParse(plainTime, 'not-a-time');
    expect(result.success).toBeFalsy();
  });

  test('fails validation for non-string, non-PlainTime input', () => {
    const result = v.safeParse(plainTime, 42);
    expect(result.success).toBeFalsy();
  });
});
