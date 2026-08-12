import { describe, test, expect } from 'vite-plus/test';

import { NetworkStandardSchemaValidationError } from '#src/error/network-standard-schema-validation-error';

describe('networkStandardSchemaValidationError', () => {
  test('stores the given issues', () => {
    const issues = [{ message: 'invalid' }];
    const error = new NetworkStandardSchemaValidationError(issues);
    expect(error.issues).toBe(issues);
  });

  test('sets name to NetworkStandardSchemaValidationError', () => {
    const error = new NetworkStandardSchemaValidationError([]);
    expect(error.name).toBe('NetworkStandardSchemaValidationError');
  });

  test('is an instanceof Error', () => {
    const error = new NetworkStandardSchemaValidationError([]);
    expect(error).toBeInstanceOf(Error);
  });

  test('isStandardSchemaValidationError returns true for a real instance', () => {
    const error = new NetworkStandardSchemaValidationError([]);
    expect(NetworkStandardSchemaValidationError.isNetworkStandardSchemaValidationError(error)).toBeTruthy();
  });

  test('isNetworkStandardSchemaValidationError returns false for a plain Error', () => {
    expect(NetworkStandardSchemaValidationError.isNetworkStandardSchemaValidationError(new Error('nope'))).toBeFalsy();
  });
});
