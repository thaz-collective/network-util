import { describe, test, expect } from 'vite-plus/test';

import { StandardSchemaValidationError } from '#src/fetch/errors';

describe('standardSchemaValidationError', () => {
  test('stores the given issues', () => {
    const issues = [{ message: 'invalid' }];
    const error = new StandardSchemaValidationError({ issues });
    expect(error.issues).toBe(issues);
  });

  test('sets name to StandardSchemaValidationError', () => {
    const error = new StandardSchemaValidationError({ issues: [] });
    expect(error.name).toBe('StandardSchemaValidationError');
  });

  test('is an instanceof Error', () => {
    const error = new StandardSchemaValidationError({ issues: [] });
    expect(error).toBeInstanceOf(Error);
  });

  test('isStandardSchemaValidationError returns true for a real instance', () => {
    const error = new StandardSchemaValidationError({ issues: [] });
    expect(StandardSchemaValidationError.isStandardSchemaValidationError(error)).toBeTruthy();
  });

  test('isStandardSchemaValidationError returns false for a plain Error', () => {
    expect(StandardSchemaValidationError.isStandardSchemaValidationError(new Error('nope'))).toBeFalsy();
  });
});
