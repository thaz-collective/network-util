import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { activeEntity } from '#src/valibot/entity/active-entity';

describe('activeEntity', () => {
  test('parses when expired_at_timestamp is a real instant', () => {
    const result = v.parse(activeEntity, {
      active_at_timestamp: '2024-06-15T10:30:00Z',
      expired_at_timestamp: '2024-07-15T10:30:00Z',
    });
    expect(result.active_at_timestamp).toBeInstanceOf(Temporal.Instant);
    expect(result.expired_at_timestamp).toBeInstanceOf(Temporal.Instant);
  });

  test('defaults expired_at_timestamp to null when missing', () => {
    const result = v.parse(activeEntity, { active_at_timestamp: '2024-06-15T10:30:00Z' });
    expect(result.active_at_timestamp).toBeInstanceOf(Temporal.Instant);
    expect(result.expired_at_timestamp).toBeNull();
  });

  test('coerces expired_at_timestamp null to null', () => {
    const result = v.parse(activeEntity, {
      active_at_timestamp: '2024-06-15T10:30:00Z',
      expired_at_timestamp: null,
    });
    expect(result.active_at_timestamp).toBeInstanceOf(Temporal.Instant);
    expect(result.expired_at_timestamp).toBeNull();
  });

  test('coerces expired_at_timestamp {} to null', () => {
    const result = v.parse(activeEntity, {
      active_at_timestamp: '2024-06-15T10:30:00Z',
      expired_at_timestamp: {},
    });
    expect(result.active_at_timestamp).toBeInstanceOf(Temporal.Instant);
    expect(result.expired_at_timestamp).toBeNull();
  });

  test('fails validation when active_at_timestamp is missing', () => {
    const result = v.safeParse(activeEntity, {});
    expect(result.success).toBeFalsy();
  });
});
