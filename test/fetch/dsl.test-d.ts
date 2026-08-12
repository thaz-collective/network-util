import { describe, test, expectTypeOf } from 'vite-plus/test';

import * as v from 'valibot';

import type { RouteDef } from '#src/fetch/dsl';
import type { InferRequest, InferResponse } from '#src/fetch/infer-types';
import { defineContract } from '#src/fetch/dsl';

const pathParamsSchema = v.object({ id: v.pipe(v.string(), v.transform(Number)) });
const querySchema = v.object({ search: v.optional(v.string()) });
const bodySchema = v.object({ title: v.string() });
const okResponseSchema = v.object({ id: v.number(), title: v.string() });
const errorResponseSchema = v.object({ message: v.string() });

const contract = defineContract({
  getPost: {
    method: 'GET',
    path: '/posts/:id',
    pathParams: pathParamsSchema,
    query: querySchema,
    responses: { 200: okResponseSchema },
  },
  createPost: {
    method: 'POST',
    path: '/posts',
    body: bodySchema,
    responses: { 201: okResponseSchema, 400: errorResponseSchema },
  },
  listPosts: {
    method: 'GET',
    path: '/posts',
    responses: { 200: v.array(okResponseSchema) },
  },
});

describe('fetch dsl type inference', () => {
  test('inferRequest only has keys for declared fields', () => {
    expectTypeOf<InferRequest<(typeof contract)['getPost']>>().toEqualTypeOf<{
      pathParams: { id: string };
      query: { search?: string | undefined };
    }>();

    expectTypeOf<InferRequest<(typeof contract)['createPost']>>().toEqualTypeOf<{
      body: { title: string };
    }>();

    // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- asserting the mapped type produces zero keys
    expectTypeOf<InferRequest<(typeof contract)['listPosts']>>().toEqualTypeOf<{}>();
  });

  test('inferResponse is a discriminated union over declared statuses', () => {
    expectTypeOf<InferResponse<(typeof contract)['createPost']>>().toEqualTypeOf<
      | { status: 201; body: { id: number; title: string }; headers: Headers }
      | { status: 400; body: { message: string }; headers: Headers }
    >();
  });

  test('non-standard-schema values are rejected on schema fields', () => {
    expectTypeOf<{ notAStandardSchema: true }>().not.toExtend<RouteDef['pathParams']>();
    expectTypeOf<{ notAStandardSchema: true }>().not.toExtend<RouteDef['query']>();
    expectTypeOf<{ notAStandardSchema: true }>().not.toExtend<RouteDef['headers']>();
    expectTypeOf<{ notAStandardSchema: true }>().not.toExtend<RouteDef['body']>();
    expectTypeOf<{ notAStandardSchema: true }>().not.toExtend<RouteDef['responses'][number]>();
  });
});
