import { describe, test, expectTypeOf } from 'vite-plus/test';

import * as v from 'valibot';

import type {
  RouteDef,
  InferRequest,
  InferResponse,
  InferRequestPathParams,
  InferRequestQuery,
  InferRequestHeaders,
  InferRequestLocalHeaders,
  InferRequestGlobalHeaders,
  InferRequestBody,
} from '#src/fetch/types';
import { createFetchClient } from '#src/fetch/client';
import { defineContract } from '#src/fetch/contract';

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

  test('inferRequestPathParams infers the path params schema input, or undefined when absent', () => {
    expectTypeOf<InferRequestPathParams<(typeof contract)['getPost']>>().toEqualTypeOf<{ id: string }>();
    expectTypeOf<InferRequestPathParams<(typeof contract)['createPost']>>().toEqualTypeOf<undefined>();
  });

  test('inferRequestQuery infers the query schema input, or undefined when absent', () => {
    expectTypeOf<InferRequestQuery<(typeof contract)['getPost']>>().toEqualTypeOf<{ search?: string | undefined }>();
    expectTypeOf<InferRequestQuery<(typeof contract)['createPost']>>().toEqualTypeOf<undefined>();
  });

  test('inferRequestBody infers the body schema input, or undefined when absent', () => {
    expectTypeOf<InferRequestBody<(typeof contract)['createPost']>>().toEqualTypeOf<{ title: string }>();
    expectTypeOf<InferRequestBody<(typeof contract)['getPost']>>().toEqualTypeOf<undefined>();
  });

  test('inferResponse is a discriminated union over declared statuses', () => {
    expectTypeOf<InferResponse<(typeof contract)['createPost']>>().toEqualTypeOf<
      { status: 201; body: { id: number; title: string } } | { status: 400; body: { message: string } }
    >();
  });

  test('inferResponse narrows to a single status when given as the second type param', () => {
    expectTypeOf<InferResponse<(typeof contract)['createPost'], 201>>().toEqualTypeOf<{
      status: 201;
      body: { id: number; title: string };
    }>();

    expectTypeOf<InferResponse<(typeof contract)['createPost'], 400>>().toEqualTypeOf<{
      status: 400;
      body: { message: string };
    }>();
  });

  test('non-standard-schema values are rejected on schema fields', () => {
    expectTypeOf<{ notAStandardSchema: true }>().not.toExtend<RouteDef['pathParams']>();
    expectTypeOf<{ notAStandardSchema: true }>().not.toExtend<RouteDef['query']>();
    expectTypeOf<{ notAStandardSchema: true }>().not.toExtend<RouteDef['headers']>();
    expectTypeOf<{ notAStandardSchema: true }>().not.toExtend<RouteDef['body']>();
    expectTypeOf<{ notAStandardSchema: true }>().not.toExtend<RouteDef['responses'][number]>();
  });
});

describe('global headers', () => {
  const globalHeadersSchema = v.object({ 'x-tenant': v.string() });

  const contractWithGlobalHeaders = defineContract(
    {
      withOwnHeaders: {
        method: 'GET',
        path: '/a',
        headers: v.object({ 'x-route': v.string() }),
        responses: { 200: okResponseSchema },
      },
      withoutOwnHeaders: {
        method: 'GET',
        path: '/b',
        responses: { 200: okResponseSchema },
      },
    },
    { headers: globalHeadersSchema },
  );

  test('merges global and route headers into a single required object', () => {
    expectTypeOf<InferRequest<(typeof contractWithGlobalHeaders)['withOwnHeaders']>>().toEqualTypeOf<{
      headers: { 'x-tenant': string; 'x-route': string };
    }>();
  });

  test('applies global headers alone when a route has no headers schema', () => {
    expectTypeOf<InferRequest<(typeof contractWithGlobalHeaders)['withoutOwnHeaders']>>().toEqualTypeOf<{
      headers: { 'x-tenant': string };
    }>();
  });

  test('inferRequestLocalHeaders infers only the route-level headers schema input', () => {
    expectTypeOf<InferRequestLocalHeaders<(typeof contractWithGlobalHeaders)['withOwnHeaders']>>().toEqualTypeOf<{
      'x-route': string;
    }>();
    expectTypeOf<
      InferRequestLocalHeaders<(typeof contractWithGlobalHeaders)['withoutOwnHeaders']>
    >().toEqualTypeOf<undefined>();
  });

  test('inferRequestGlobalHeaders infers only the contract-level headers schema input', () => {
    expectTypeOf<InferRequestGlobalHeaders<(typeof contractWithGlobalHeaders)['withOwnHeaders']>>().toEqualTypeOf<{
      'x-tenant': string;
    }>();
    expectTypeOf<InferRequestGlobalHeaders<(typeof contractWithGlobalHeaders)['withoutOwnHeaders']>>().toEqualTypeOf<{
      'x-tenant': string;
    }>();
    expectTypeOf<InferRequestGlobalHeaders<(typeof contract)['getPost']>>().toEqualTypeOf<undefined>();
  });

  test('inferRequestHeaders merges global and local headers, tolerating either being absent', () => {
    expectTypeOf<InferRequestHeaders<(typeof contractWithGlobalHeaders)['withOwnHeaders']>>().toEqualTypeOf<{
      'x-tenant': string;
      'x-route': string;
    }>();
    expectTypeOf<InferRequestHeaders<(typeof contractWithGlobalHeaders)['withoutOwnHeaders']>>().toEqualTypeOf<{
      'x-tenant': string;
    }>();
  });

  test('inferRequestHeaders is undefined when there are no global or local headers', () => {
    expectTypeOf<InferRequestHeaders<(typeof contract)['getPost']>>().toEqualTypeOf<undefined>();
  });

  test('createFetchClient threads the global headers schema through to each route', () => {
    const client = createFetchClient(contractWithGlobalHeaders, { baseUrl: 'https://api.example.com' });

    expectTypeOf(client.withOwnHeaders)
      .parameter(0)
      .toEqualTypeOf<{ headers: { 'x-tenant': string; 'x-route': string } }>();
    expectTypeOf(client.withoutOwnHeaders).parameter(0).toEqualTypeOf<{ headers: { 'x-tenant': string } }>();
  });
});

describe('blob responses', () => {
  const blobContract = defineContract({
    download: {
      method: 'GET',
      path: '/download',
      responses: { 200: v.blob() },
    },
  });

  test('infers the response body as Blob', () => {
    expectTypeOf<InferResponse<(typeof blobContract)['download']>>().toEqualTypeOf<{
      status: 200;
      body: Blob;
    }>();
  });
});
