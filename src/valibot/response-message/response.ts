import * as v from 'valibot';

import { array } from '#src/valibot/schema/array';

import { message } from './message';

/**
 * Valibot schema for the standard API response envelope, containing an optional list of response messages.
 */
export const response = v.object({
  message_list: array(message),
});
