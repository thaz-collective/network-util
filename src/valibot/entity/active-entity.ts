import * as v from 'valibot';

import { instant } from '#src/valibot/schema/instant';
import { nullish } from '#src/valibot/schema/nullish';

/**
 * Valibot schema for the activation-window fields that indicate when an entity is considered active.
 */
export const activeEntity = v.object({
  active_at_timestamp: instant,
  expired_at_timestamp: nullish(instant),
});
