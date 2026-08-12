import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { softDeletedEntity } from '#src/valibot/entity/soft-deleted-entity';

describe('softDeletedEntity', () => {
  test('parses a real instant', () => {
    const result = v.parse(softDeletedEntity, { soft_deleted_at_timestamp: '2024-06-15T10:30:00Z' });
    expect(result.soft_deleted_at_timestamp).toBeInstanceOf(Temporal.Instant);
  });

  test('defaults to null when missing', () => {
    expect(v.parse(softDeletedEntity, {})).toStrictEqual({ soft_deleted_at_timestamp: null });
  });

  test('passes through null', () => {
    expect(v.parse(softDeletedEntity, { soft_deleted_at_timestamp: null })).toStrictEqual({
      soft_deleted_at_timestamp: null,
    });
  });
});
