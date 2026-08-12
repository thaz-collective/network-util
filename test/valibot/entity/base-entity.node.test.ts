import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { baseEntity } from '#src/valibot/entity/base-entity';

describe('baseEntity', () => {
  test('parses a valid audit envelope', () => {
    const value = {
      created_at_timestamp: '2024-06-15T10:30:00Z',
      created_by: 'user-1',
      updated_at_timestamp: '2024-06-16T10:30:00Z',
      updated_by: 'user-2',
    };
    const result = v.parse(baseEntity, value);
    expect(result.created_at_timestamp).toBeInstanceOf(Temporal.Instant);
    expect(result.updated_at_timestamp).toBeInstanceOf(Temporal.Instant);
    expect(result.created_by).toBe('user-1');
    expect(result.updated_by).toBe('user-2');
  });

  test('fails validation when a required field is missing', () => {
    const result = v.safeParse(baseEntity, { created_at_timestamp: '2024-06-15T10:30:00Z' });
    expect(result.success).toBeFalsy();
  });
});
