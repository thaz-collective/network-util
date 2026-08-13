import { describe, test, expectTypeOf } from 'vite-plus/test';

import * as v from 'valibot';

import type { FetchClientRequestOptions } from '#src/fetch/client';
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

describe('fetchClientRequestOptions', () => {
  test('each route function accepts an optional FetchClientRequestOptions as its second parameter', () => {
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    expectTypeOf(client.getPost).parameter(1).toEqualTypeOf<FetchClientRequestOptions | undefined>();
    expectTypeOf(client.createPost).parameter(1).toEqualTypeOf<FetchClientRequestOptions | undefined>();
  });

  test('has the expected signal and headers field types', () => {
    expectTypeOf<FetchClientRequestOptions>().toHaveProperty('signal').toEqualTypeOf<AbortSignal | undefined>();
    expectTypeOf<FetchClientRequestOptions>().toHaveProperty('headers').toEqualTypeOf<HeadersInit | undefined>();
  });
});

describe('createFetchClient', () => {
  test('threads the global headers schema through to each route', () => {
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

    const client = createFetchClient(contractWithGlobalHeaders, { baseUrl: 'https://api.example.com' });

    expectTypeOf(client.withOwnHeaders)
      .parameter(0)
      .toEqualTypeOf<{ headers: { 'x-tenant': string; 'x-route': string } }>();
    expectTypeOf(client.withoutOwnHeaders).parameter(0).toEqualTypeOf<{ headers: { 'x-tenant': string } }>();
  });
});
