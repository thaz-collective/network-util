import * as v from 'valibot';

import { messageType } from './message-type';

/**
 * Valibot schema for a single response message, containing a severity type, a code, and a human-readable description.
 */
export const message = v.object({
  type: messageType,
  code: v.string(),
  description: v.string(),
});
