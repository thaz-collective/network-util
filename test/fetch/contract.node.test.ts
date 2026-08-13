import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { defineContract } from '#src/fetch/contract';
import { ContractPathParamsError, ContractResponseStatusError } from '#src/fetch/errors';

describe('defineContract', () => {
  test('returns the routes unchanged when path tokens have a matching pathParams schema', () => {
    const routes = {
      getPost: {
        method: 'GET' as const,
        path: '/posts/:id',
        pathParams: v.object({ id: v.string() }),
        responses: { 200: v.object({ id: v.string() }) },
      },
    };

    expect(defineContract(routes)).toBe(routes);
  });

  test('throws ContractPathParamsError when a path token has no pathParams schema', () => {
    const routes = {
      getPost: {
        method: 'GET' as const,
        path: '/posts/:id',
        responses: { 200: v.object({ id: v.string() }) },
      },
    };

    expect(() => defineContract(routes)).toThrow(ContractPathParamsError);
  });

  test('contractPathParamsError carries the route context and offending tokens', () => {
    const routes = {
      getComment: {
        method: 'GET' as const,
        path: '/posts/:postId/comments/:commentId',
        responses: { 200: v.object({ id: v.string() }) },
      },
    };

    let caught: unknown;
    try {
      defineContract(routes);
    } catch (error: unknown) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ContractPathParamsError);
    expect(caught).toMatchObject({
      method: 'GET',
      path: '/posts/:postId/comments/:commentId',
      tokens: ['postId', 'commentId'],
    });
  });

  test('isContractPathParamsError returns false for a plain Error', () => {
    expect(ContractPathParamsError.isContractPathParamsError(new Error('nope'))).toBeFalsy();
  });

  test('throws ContractResponseStatusError when a responses key is not a numeric status code', () => {
    const routes = {
      echo: {
        method: 'POST' as const,
        path: '/echo',
        responses: { '200a': v.object({ id: v.string() }) },
      },
    };

    expect(() => defineContract(routes)).toThrow(ContractResponseStatusError);
  });

  test('contractResponseStatusError carries the route context and offending status', () => {
    const routes = {
      echo: {
        method: 'POST' as const,
        path: '/echo',
        responses: { '200a': v.object({ id: v.string() }) },
      },
    };

    let caught: unknown;
    try {
      defineContract(routes);
    } catch (error: unknown) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ContractResponseStatusError);
    expect(caught).toMatchObject({
      method: 'POST',
      path: '/echo',
      status: '200a',
    });
  });

  test('accepts hyphenated path tokens paired with a matching pathParams schema', () => {
    const routes = {
      getComment: {
        method: 'GET' as const,
        path: '/posts/:post-id/comments/:comment-id',
        pathParams: v.object({ 'post-id': v.string(), 'comment-id': v.string() }),
        responses: { 200: v.object({ id: v.string() }) },
      },
    };

    expect(defineContract(routes)).toBe(routes);
  });

  test('does not throw when responses is an empty object', () => {
    const routes = {
      noContent: {
        method: 'DELETE' as const,
        path: '/posts/:id',
        pathParams: v.object({ id: v.string() }),
        responses: {},
      },
    };

    expect(defineContract(routes)).toBe(routes);
  });

  test('throws ContractResponseStatusError for the first of multiple invalid status keys', () => {
    const routes = {
      echo: {
        method: 'POST' as const,
        path: '/echo',
        responses: { '200a': v.object({ id: v.string() }), '400b': v.object({ id: v.string() }) },
      },
    };

    let caught: unknown;
    try {
      defineContract(routes);
    } catch (error: unknown) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ContractResponseStatusError);
    expect(caught).toMatchObject({ status: '200a' });
  });

  test('accepts an optional global headers schema without changing the returned routes reference', () => {
    const routes = {
      getPost: {
        method: 'GET' as const,
        path: '/posts/:id',
        pathParams: v.object({ id: v.string() }),
        responses: { 200: v.object({ id: v.string() }) },
      },
    };

    expect(defineContract(routes, { headers: v.object({ 'x-tenant': v.string() }) })).toBe(routes);
  });
});
