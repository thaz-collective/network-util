import { describe, test, expect } from 'vite-plus/test';

import { NetworkStandardSchemaValidationError } from '#src/error/network-standard-schema-validation-error';
import { RequestValidationError, ResponseValidationError, UnexpectedStatusError } from '#src/fetch/errors';

const issues = [{ message: 'invalid' }];

describe('requestValidationError', () => {
  test('sets name and extends StandardSchemaValidationError', () => {
    const error = new RequestValidationError(issues, { method: 'GET', path: '/posts/:id', field: 'pathParams' });
    expect(error.name).toBe('RequestValidationError');
    expect(error).toBeInstanceOf(NetworkStandardSchemaValidationError);
    expect(error).toBeInstanceOf(Error);
  });

  test('carries issues and context fields', () => {
    const error = new RequestValidationError(issues, { method: 'POST', path: '/posts', field: 'body' });
    expect(error.issues).toBe(issues);
    expect(error.method).toBe('POST');
    expect(error.path).toBe('/posts');
    expect(error.field).toBe('body');
  });
});

describe('responseValidationError', () => {
  test('sets name and extends StandardSchemaValidationError', () => {
    const error = new ResponseValidationError(issues, { method: 'GET', path: '/posts', status: 200 });
    expect(error.name).toBe('ResponseValidationError');
    expect(error).toBeInstanceOf(NetworkStandardSchemaValidationError);
  });

  test('carries issues and context fields', () => {
    const error = new ResponseValidationError(issues, { method: 'GET', path: '/posts/:id', status: 200 });
    expect(error.issues).toBe(issues);
    expect(error.method).toBe('GET');
    expect(error.path).toBe('/posts/:id');
    expect(error.status).toBe(200);
  });
});

describe('unexpectedStatusError', () => {
  test('sets name and extends Error', () => {
    const error = new UnexpectedStatusError({ method: 'GET', path: '/posts', status: 418, body: { foo: 'bar' } });
    expect(error.name).toBe('UnexpectedStatusError');
    expect(error).toBeInstanceOf(Error);
  });

  test('carries context fields', () => {
    const error = new UnexpectedStatusError({ method: 'GET', path: '/posts', status: 418, body: { foo: 'bar' } });
    expect(error.method).toBe('GET');
    expect(error.path).toBe('/posts');
    expect(error.status).toBe(418);
    expect(error.body).toStrictEqual({ foo: 'bar' });
  });
});
