import type { StandardSchemaV1 } from '#src/standard-schema';

export function isStandardSchema(value: unknown): value is StandardSchemaV1 {
  if (typeof value !== 'object' || value === null || !('~standard' in value)) {
    return false;
  }
  const standard = (value as { '~standard'?: unknown })['~standard'];
  return (
    typeof standard === 'object' &&
    standard !== null &&
    'validate' in standard &&
    typeof (standard as { validate?: unknown }).validate === 'function'
  );
}

export async function validateAgainstStandardSchema<T extends StandardSchemaV1>(
  schema: T,
  data: unknown,
): Promise<
  | { success: true; value: StandardSchemaV1.InferOutput<T> }
  | { success: false; issues: readonly StandardSchemaV1.Issue[] }
> {
  const result = await schema['~standard'].validate(data);
  if (result.issues) {
    return { success: false, issues: result.issues };
  }
  return { success: true, value: result.value };
}
