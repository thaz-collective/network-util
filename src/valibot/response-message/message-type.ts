import * as v from 'valibot';

/**
 * Enum-style constant map of the four recognized response message severity levels.
 */
export const MESSAGE_TYPE = {
  INFO: 'INFO',
  SUCCESS: 'SUCCESS',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
} as const;

/**
 * Union of the recognized response message type string values.
 */
export type MessageType = (typeof MESSAGE_TYPE)[keyof typeof MESSAGE_TYPE];

/**
 * Ordered array of all `MessageType` values, suitable for use as a picklist source.
 */
export const MESSAGE_TYPE_OPTIONS = Object.values(MESSAGE_TYPE) as MessageType[];

/**
 * Valibot schema that validates a string against the four recognized message type values.
 */
export const messageType = v.picklist(MESSAGE_TYPE_OPTIONS);
