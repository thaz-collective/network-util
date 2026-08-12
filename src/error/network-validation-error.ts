import { StandardSchemaError } from '@ts-rest/core';

/**
 * Returns `true` if `error` is a `StandardSchemaError` raised by a ts-rest response validation failure.
 *
 * @param error The value to test.
 * @returns A type predicate narrowing `error` to `StandardSchemaError`.
 */
export function isNetworkValidationError(error: unknown): error is StandardSchemaError {
  return error instanceof StandardSchemaError;
}
