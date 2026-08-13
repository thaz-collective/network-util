import { describe, test, expect } from 'vite-plus/test';

import {
  StandardSchemaValidationError,
  RequestValidationError,
  ResponseValidationError,
  UnexpectedStatusError,
} from '#src/fetch/errors';

const issues = [{ message: 'invalid' }];

describe('requestValidationError', () => {
  test('sets name and extends StandardSchemaValidationError', () => {
    const error = new RequestValidationError({ issues, method: 'GET', path: '/posts/:id', requestField: 'pathParams' });
    expect(error.name).toBe('RequestValidationError');
    expect(error).toBeInstanceOf(StandardSchemaValidationError);
    expect(error).toBeInstanceOf(Error);
  });

  test('carries issues and context fields', () => {
    const error = new RequestValidationError({ issues, method: 'POST', path: '/posts', requestField: 'body' });
    expect(error.issues).toBe(issues);
    expect(error.method).toBe('POST');
    expect(error.path).toBe('/posts');
    expect(error.requestField).toBe('body');
  });

  test('isRequestValidationError returns true for a real instance and false otherwise', () => {
    const error = new RequestValidationError({ issues, method: 'GET', path: '/posts', requestField: 'body' });
    expect(RequestValidationError.isRequestValidationError(error)).toBeTruthy();
    expect(RequestValidationError.isRequestValidationError(new Error('nope'))).toBeFalsy();
  });
});

describe('responseValidationError', () => {
  test('sets name and extends StandardSchemaValidationError', () => {
    const error = new ResponseValidationError({ issues, method: 'GET', path: '/posts', status: 200 });
    expect(error.name).toBe('ResponseValidationError');
    expect(error).toBeInstanceOf(StandardSchemaValidationError);
  });

  test('carries issues and context fields', () => {
    const error = new ResponseValidationError({ issues, method: 'GET', path: '/posts/:id', status: 200 });
    expect(error.issues).toBe(issues);
    expect(error.method).toBe('GET');
    expect(error.path).toBe('/posts/:id');
    expect(error.status).toBe(200);
  });

  test('isResponseValidationError returns true for a real instance and false otherwise', () => {
    const error = new ResponseValidationError({ issues, method: 'GET', path: '/posts', status: 200 });
    expect(ResponseValidationError.isResponseValidationError(error)).toBeTruthy();
    expect(ResponseValidationError.isResponseValidationError(new Error('nope'))).toBeFalsy();
  });
});

describe('unexpectedStatusError', () => {
  test('sets name and extends Error', () => {
    const error = new UnexpectedStatusError({ method: 'GET', path: '/posts', status: 418 });
    expect(error.name).toBe('UnexpectedStatusError');
    expect(error).toBeInstanceOf(Error);
  });

  test('carries context fields', () => {
    const error = new UnexpectedStatusError({ method: 'GET', path: '/posts', status: 418 });
    expect(error.method).toBe('GET');
    expect(error.path).toBe('/posts');
    expect(error.status).toBe(418);
  });

  test('isUnexpectedStatusError returns true for a real instance and false otherwise', () => {
    const error = new UnexpectedStatusError({ method: 'GET', path: '/posts', status: 418 });
    expect(UnexpectedStatusError.isUnexpectedStatusError(error)).toBeTruthy();
    expect(UnexpectedStatusError.isUnexpectedStatusError(new Error('nope'))).toBeFalsy();
  });
});
