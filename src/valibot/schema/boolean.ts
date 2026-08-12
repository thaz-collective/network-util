import * as v from 'valibot';

/**
 * Wraps a boolean schema as optional and nullish, falling back to `defaultValue` when the
 * field is absent or `null`.
 *
 * @param defaultValue The value used when the field is `null` or `undefined`.
 * @returns An optional nullish boolean schema with the given default.
 */
export function boolean(defaultValue: boolean) {
  return v.optional(v.nullish(v.boolean(), defaultValue), defaultValue);
}
