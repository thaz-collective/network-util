import { describe, test, expect, beforeAll, afterEach, afterAll } from 'vite-plus/test';

import * as v from 'valibot';

import { defineContract, createFetchClient } from '#src/fetch';
import { RequestValidationError, ResponseValidationError, UnexpectedStatusError } from '#src/fetch/errors';

import { getPostHandler, createPostHandler, echoHeadersHandler, echoQueryHandler } from './msw-handlers';
import { worker } from './msw-server.browser';

const postSchema = v.object({ id: v.number(), title: v.string() });

const contract = defineContract({
  getPost: {
    method: 'GET',
    path: '/posts/:id',
    pathParams: v.object({ id: v.pipe(v.string(), v.transform(Number)) }),
    responses: { 200: postSchema },
  },
  createPost: {
    method: 'POST',
    path: '/posts',
    body: v.object({ title: v.string() }),
    responses: { 201: postSchema },
  },
  echoHeaders: {
    method: 'GET',
    path: '/echo-headers',
    headers: v.object({ 'x-route-header': v.string() }),
    responses: { 200: v.object({ headers: v.record(v.string(), v.string()) }) },
  },
  echoQuery: {
    method: 'GET',
    path: '/echo-query',
    query: v.object({ tag: v.array(v.string()) }),
    responses: { 200: v.object({ search: v.string() }) },
  },
});

describe('createFetchClient (browser)', () => {
  beforeAll(async () => await worker.start({ quiet: true, onUnhandledRequest: 'error' }));
  afterEach(() => {
    worker.resetHandlers();
  });
  afterAll(() => {
    worker.stop();
  });

  test('success path returns status and parsed body', async () => {
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    const result = await client.getPost({ pathParams: { id: '1' } });

    expect(result.status).toBe(200);
    expect(result.body).toStrictEqual({ id: 1, title: 'Hello world' });
  });

  test('serializes query params onto the request URL', async () => {
    worker.use(echoQueryHandler.success);
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    const result = await client.echoQuery({ query: { tag: ['a', 'b'] } });

    expect(result.body.search).toBe('?tag=a&tag=b');
  });

  test('merges client-level and route-level headers', async () => {
    worker.use(echoHeadersHandler.success);
    const client = createFetchClient(contract, {
      baseUrl: 'https://api.example.com',
      headers: { 'x-client-header': 'client-value' },
    });

    const result = await client.echoHeaders({ headers: { 'x-route-header': 'route-value' } });

    expect(result.body.headers['x-client-header']).toBe('client-value');
    expect(result.body.headers['x-route-header']).toBe('route-value');
  });

  test('throws RequestValidationError for invalid request data', async () => {
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- deliberately violating the contract's type to exercise the validation-failure path
    const invalidArgs = { pathParams: { id: {} } } as unknown as Parameters<typeof client.getPost>[0];
    await expect(client.getPost(invalidArgs)).rejects.toBeInstanceOf(RequestValidationError);
  });

  test('throws ResponseValidationError when the response body fails schema validation', async () => {
    worker.use(getPostHandler.invalidBody);
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    await expect(client.getPost({ pathParams: { id: '1' } })).rejects.toBeInstanceOf(ResponseValidationError);
  });

  test('throws UnexpectedStatusError when the response status has no matching contract entry', async () => {
    worker.use(getPostHandler.unexpectedStatus);
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    await expect(client.getPost({ pathParams: { id: '1' } })).rejects.toBeInstanceOf(UnexpectedStatusError);
  });

  test('sends a JSON body for POST requests', async () => {
    worker.use(createPostHandler.success);
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    const result = await client.createPost({ body: { title: 'new post' } });

    expect(result.status).toBe(201);
    expect(result.body).toStrictEqual({ id: 1, title: 'created' });
  });
});
