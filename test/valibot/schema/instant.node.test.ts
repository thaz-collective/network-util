import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { instant } from '#src/valibot/schema/instant';

describe('instant', () => {
  test('parses a Temporal.Instant instance', () => {
    const value = Temporal.Instant.from('2024-06-15T10:30:00Z');
    expect(v.parse(instant, value)).toStrictEqual(value);
  });

  test('parses an ISO-8601 instant string', () => {
    const result = v.parse(instant, '2024-06-15T10:30:00Z');
    expect(result).toBeInstanceOf(Temporal.Instant);
    expect(result.equals(Temporal.Instant.from('2024-06-15T10:30:00Z'))).toBeTruthy();
  });

  test('fails validation for garbage input', () => {
    const result = v.safeParse(instant, 'not-a-date');
    expect(result.success).toBeFalsy();
  });

  test('fails validation for non-string, non-Instant input', () => {
    const result = v.safeParse(instant, 42);
    expect(result.success).toBeFalsy();
  });
});
