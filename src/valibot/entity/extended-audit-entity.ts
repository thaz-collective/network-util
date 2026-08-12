import * as v from 'valibot';

import { nullish } from '#src/valibot/schema/nullish';

/**
 * Valibot schema for the optional extended audit fields that identify the process or user
 * responsible for creation and last update.
 */
export const extendedAuditEntity = v.object({
  created_by_process: nullish(v.string()),
  created_by_user_id: nullish(v.string()),
  updated_by_process: nullish(v.string()),
  updated_by_user_id: nullish(v.string()),
});
