import { describe, test, expectTypeOf } from 'vite-plus/test';

import * as v from 'valibot';

import { defineContract } from '#src/fetch/contract';

describe('defineContract', () => {
  test('preserves each route literal shape on the returned contract', () => {
    const contract = defineContract({
      getPost: {
        method: 'GET',
        path: '/posts/:id',
        pathParams: v.object({ id: v.string() }),
        responses: { 200: v.object({ id: v.string() }) },
      },
    });

    expectTypeOf(contract.getPost.method).toEqualTypeOf<'GET'>();
    expectTypeOf(contract.getPost.path).toEqualTypeOf<string>();
  });

  test('preserves the routes object identity in its return type (no options)', () => {
    const routes = {
      getPost: {
        method: 'GET' as const,
        path: '/posts/:id',
        pathParams: v.object({ id: v.string() }),
        responses: { 200: v.object({ id: v.string() }) },
      },
    };

    const contract = defineContract(routes);

    expectTypeOf(contract.getPost.pathParams).toEqualTypeOf(routes.getPost.pathParams);
    expectTypeOf(contract.getPost.responses).toEqualTypeOf(routes.getPost.responses);
  });
});
