import type { StandardSchemaV1 } from '#src/standard-schema';

/**
 * Thrown when data fails standard-schema validation.
 */
export class NetworkStandardSchemaValidationError extends Error {
  readonly issues: readonly StandardSchemaV1.Issue[];

  constructor(issues: readonly StandardSchemaV1.Issue[]) {
    super();
    this.name = 'NetworkStandardSchemaValidationError';
    this.issues = issues;
  }

  /**
   * Returns `true` if `error` is a `NetworkStandardSchemaValidationError` instance.
   *
   * @param error The value to test.
   * @returns A type predicate narrowing `error` to `NetworkStandardSchemaValidationError`.
   */
  public static isNetworkStandardSchemaValidationError(error: unknown): error is NetworkStandardSchemaValidationError {
    return error instanceof NetworkStandardSchemaValidationError;
  }
}
