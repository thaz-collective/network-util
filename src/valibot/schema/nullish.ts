import * as v from 'valibot';

/**
 * Wraps a base schema as optional and nullish, coercing empty objects `{}` to `null`.
 *
 * Some API responses represent "no value" as an empty object rather than a JSON `null`.
 * This wrapper normalizes both representations to `null` so consumers receive a consistent
 * `T | null` type. A missing field or `undefined` also defaults to `null`.
 *
 * @param baseSchema The schema to use when the field contains a real value.
 * @returns An optional nullish schema that defaults to `null`.
 */
export function nullish<T extends v.GenericSchema>(baseSchema: T) {
  return v.optional(
    v.union([
      baseSchema,
      v.null(),
      v.pipe(
        v.undefined(),
        v.transform(() => {
          return null;
        }),
      ),
      v.pipe(
        v.strictObject({}),
        v.transform(() => {
          return null;
        }),
      ),
    ]),
    null,
  );
}
