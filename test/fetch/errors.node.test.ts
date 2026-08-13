import { describe, test, expect } from 'vite-plus/test';

import {
  StandardSchemaValidationError,
  RequestValidationError,
  ResponseValidationError,
  UnexpectedStatusError,
  ContractPathParamsError,
  MissingPathParamError,
  InvalidRequestFieldTypeError,
} from '#src/fetch/errors';

const issues = [{ message: 'invalid' }];

describe('standardSchemaValidationError', () => {
  test('stores the given issues', () => {
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

describe('contractPathParamsError', () => {
  test('sets name and extends Error', () => {
    const error = new ContractPathParamsError({ method: 'GET', path: '/posts/:id', tokens: ['id'] });
    expect(error.name).toBe('ContractPathParamsError');
    expect(error).toBeInstanceOf(Error);
  });

  test('carries context fields', () => {
    const error = new ContractPathParamsError({ method: 'GET', path: '/posts/:id', tokens: ['id'] });
    expect(error.method).toBe('GET');
    expect(error.path).toBe('/posts/:id');
    expect(error.tokens).toStrictEqual(['id']);
  });

  test('isContractPathParamsError returns true for a real instance and false otherwise', () => {
    const error = new ContractPathParamsError({ method: 'GET', path: '/posts/:id', tokens: ['id'] });
    expect(ContractPathParamsError.isContractPathParamsError(error)).toBeTruthy();
    expect(ContractPathParamsError.isContractPathParamsError(new Error('nope'))).toBeFalsy();
  });
});

describe('missingPathParamError', () => {
  test('sets name and extends Error', () => {
    const error = new MissingPathParamError({ path: '/posts/:id', token: 'id' });
    expect(error.name).toBe('MissingPathParamError');
    expect(error).toBeInstanceOf(Error);
  });

  test('carries context fields', () => {
    const error = new MissingPathParamError({ path: '/posts/:id', token: 'id' });
    expect(error.path).toBe('/posts/:id');
    expect(error.token).toBe('id');
  });

  test('isMissingPathParamError returns true for a real instance and false otherwise', () => {
    const error = new MissingPathParamError({ path: '/posts/:id', token: 'id' });
    expect(MissingPathParamError.isMissingPathParamError(error)).toBeTruthy();
    expect(MissingPathParamError.isMissingPathParamError(new Error('nope'))).toBeFalsy();
  });
});

describe('invalidRequestFieldTypeError', () => {
  test('sets name and extends Error', () => {
    const error = new InvalidRequestFieldTypeError({ method: 'GET', path: '/posts', requestField: 'query' });
    expect(error.name).toBe('InvalidRequestFieldTypeError');
    expect(error).toBeInstanceOf(Error);
  });

  test('carries context fields', () => {
    const error = new InvalidRequestFieldTypeError({ method: 'GET', path: '/posts', requestField: 'query' });
    expect(error.method).toBe('GET');
    expect(error.path).toBe('/posts');
    expect(error.requestField).toBe('query');
  });

  test('isInvalidRequestFieldTypeError returns true for a real instance and false otherwise', () => {
    const error = new InvalidRequestFieldTypeError({ method: 'GET', path: '/posts', requestField: 'query' });
    expect(InvalidRequestFieldTypeError.isInvalidRequestFieldTypeError(error)).toBeTruthy();
    expect(InvalidRequestFieldTypeError.isInvalidRequestFieldTypeError(new Error('nope'))).toBeFalsy();
  });
});
