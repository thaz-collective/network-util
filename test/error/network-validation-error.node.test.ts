import { describe, test, expect } from 'vite-plus/test';

import { StandardSchemaError } from '@ts-rest/core';

import { isNetworkValidationError } from '#src/error/network-validation-error';

describe('isNetworkValidationError', () => {
  test('returns true for a real StandardSchemaError instance', () => {
    const error = new StandardSchemaError([{ message: 'invalid' }]);
    expect(isNetworkValidationError(error)).toBeTruthy();
  });

  test('returns false for a plain Error', () => {
    expect(isNetworkValidationError(new Error('nope'))).toBeFalsy();
  });

  test('returns false for non-error values', () => {
    expect(isNetworkValidationError(undefined)).toBeFalsy();
    expect(isNetworkValidationError('error')).toBeFalsy();
    expect(isNetworkValidationError({ issues: [] })).toBeFalsy();
  });
});
