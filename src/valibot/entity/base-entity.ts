import * as v from 'valibot';

import { instant } from '#src/valibot/schema/instant';

/**
 * Valibot schema for the standard audit fields present on every persisted entity.
 */
export const baseEntity = v.object({
  created_at_timestamp: instant,
  created_by: v.string(),
  updated_at_timestamp: instant,
  updated_by: v.string(),
});
