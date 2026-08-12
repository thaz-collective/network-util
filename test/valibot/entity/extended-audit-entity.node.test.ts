import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { extendedAuditEntity } from '#src/valibot/entity/extended-audit-entity';

describe('extendedAuditEntity', () => {
  test('parses real string values', () => {
    const result = v.parse(extendedAuditEntity, {
      created_by_process: 'import-job',
      created_by_user_id: 'user-1',
      updated_by_process: 'sync-job',
      updated_by_user_id: 'user-2',
    });
    expect(result).toStrictEqual({
      created_by_process: 'import-job',
      created_by_user_id: 'user-1',
      updated_by_process: 'sync-job',
      updated_by_user_id: 'user-2',
    });
  });

  test('defaults all fields to null when omitted', () => {
    expect(v.parse(extendedAuditEntity, {})).toStrictEqual({
      created_by_process: null,
      created_by_user_id: null,
      updated_by_process: null,
      updated_by_user_id: null,
    });
  });

  test('coerces {} fields to null', () => {
    const result = v.parse(extendedAuditEntity, {
      created_by_process: {},
      created_by_user_id: null,
      updated_by_process: undefined,
      updated_by_user_id: 'user-2',
    });
    expect(result).toStrictEqual({
      created_by_process: null,
      created_by_user_id: null,
      updated_by_process: null,
      updated_by_user_id: 'user-2',
    });
  });
});
