import * as v from 'valibot';

import { instant } from '#src/valibot/schema/instant';
import { nullish } from '#src/valibot/schema/nullish';

/**
 * Valibot schema for the soft-delete timestamp field.
 */
export const softDeletedEntity = v.object({
  soft_deleted_at_timestamp: nullish(instant),
});
