import { describe, test, expect, beforeAll, afterEach, afterAll, vi } from 'vite-plus/test';

import * as v from 'valibot';

import { defineContract, createFetchClient } from '#src/fetch';
import { RequestValidationError, ResponseValidationError, UnexpectedStatusError } from '#src/fetch/errors';

import { getPostHandler, createPostHandler, echoHeadersHandler, echoQueryHandler } from './msw-handlers';
import { server } from './msw-server.node';

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

describe('createFetchClient', () => {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });
  afterEach(() => {
    server.resetHandlers();
  });
  afterAll(() => {
    server.close();
  });

  test('success path returns status, parsed body, and headers', async () => {
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    const result = await client.getPost({ pathParams: { id: '1' } });

    expect(result.status).toBe(200);
    expect(result.body).toStrictEqual({ id: 1, title: 'Hello world' });
    expect(result.headers).toBeInstanceOf(Headers);
  });

  test('substitutes path params into the request URL', async () => {
    let capturedUrl: string | undefined;
    server.use(getPostHandler.success);
    server.events.on('request:start', ({ request }) => {
      capturedUrl = request.url;
    });

    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });
    await client.getPost({ pathParams: { id: '42' } });

    expect(capturedUrl).toBe('https://api.example.com/posts/42');
  });

  test('serializes query params onto the request URL', async () => {
    server.use(echoQueryHandler.success);
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    const result = await client.echoQuery({ query: { tag: ['a', 'b'] } });

    expect(result.body.search).toBe('?tag=a&tag=b');
  });

  test('merges client-level and route-level headers', async () => {
    server.use(echoHeadersHandler.success);
    const client = createFetchClient(contract, {
      baseUrl: 'https://api.example.com',
      headers: { 'x-client-header': 'client-value' },
    });

    const result = await client.echoHeaders({ headers: { 'x-route-header': 'route-value' } });

    expect(result.body.headers['x-client-header']).toBe('client-value');
    expect(result.body.headers['x-route-header']).toBe('route-value');
  });

  test('throws RequestValidationError and never calls fetch for invalid request data', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- deliberately violating the contract's type to exercise the validation-failure path
    const invalidArgs = { pathParams: { id: {} } } as unknown as Parameters<typeof client.getPost>[0];
    await expect(client.getPost(invalidArgs)).rejects.toBeInstanceOf(RequestValidationError);
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  test('throws ResponseValidationError when the response body fails schema validation', async () => {
    server.use(getPostHandler.invalidBody);
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    await expect(client.getPost({ pathParams: { id: '1' } })).rejects.toBeInstanceOf(ResponseValidationError);
  });

  test('throws UnexpectedStatusError when the response status has no matching contract entry', async () => {
    server.use(getPostHandler.unexpectedStatus);
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    await expect(client.getPost({ pathParams: { id: '1' } })).rejects.toBeInstanceOf(UnexpectedStatusError);
  });

  test('sends a JSON body for POST requests', async () => {
    server.use(createPostHandler.success);
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    const result = await client.createPost({ body: { title: 'new post' } });

    expect(result.status).toBe(201);
    expect(result.body).toStrictEqual({ id: 1, title: 'created' });
  });
});
