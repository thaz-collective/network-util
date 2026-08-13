import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { defineContract } from '#src/fetch/contract';
import { ContractPathParamsError } from '#src/fetch/errors';

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
