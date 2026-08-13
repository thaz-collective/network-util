import { describe, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { getPostHandler, createItemHandler } from '#mock/handlers/fetch';
import { defineContract, createFetchClient } from '#src/fetch';
import { RequestValidationError, ResponseValidationError, UnexpectedStatusError } from '#src/fetch/errors';
import { test } from '#test/browser-util';

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
  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('success path returns status and parsed body', async () => {
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    const result = await client.getPost({ pathParams: { id: '1' } });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.status).toBe(200);
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.body).toStrictEqual({ id: 1, title: 'Hello world' });
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('serializes query params onto the request URL', async () => {
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    const result = await client.echoQuery({ query: { tag: ['a', 'b'] } });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.body.search).toBe('?tag=a&tag=b');
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('merges client-level and route-level headers', async () => {
    const client = createFetchClient(contract, {
      baseUrl: 'https://api.example.com',
      headers: { 'x-client-header': 'client-value' },
    });

    const result = await client.echoHeaders({ headers: { 'x-route-header': 'route-value' } });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.body.headers['x-client-header']).toBe('client-value');
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.body.headers['x-route-header']).toBe('route-value');
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('throws RequestValidationError for invalid request data', async () => {
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- deliberately violating the contract's type to exercise the validation-failure path
    const invalidArgs = { pathParams: { id: {} } } as unknown as Parameters<typeof client.getPost>[0];
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    await expect(client.getPost(invalidArgs)).rejects.toBeInstanceOf(RequestValidationError);
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('throws ResponseValidationError when the response body fails schema validation', async ({ worker }) => {
    worker.use(getPostHandler.invalidBody);
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    await expect(client.getPost({ pathParams: { id: '1' } })).rejects.toBeInstanceOf(ResponseValidationError);
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('throws UnexpectedStatusError when the response status has no matching contract entry', async ({ worker }) => {
    worker.use(getPostHandler.unexpectedStatus);
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    await expect(client.getPost({ pathParams: { id: '1' } })).rejects.toBeInstanceOf(UnexpectedStatusError);
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('sends a JSON body for POST requests', async () => {
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    const result = await client.createPost({ body: { title: 'new post' } });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.status).toBe(201);
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.body).toStrictEqual({ id: 1, title: 'created' });
  });
});

describe('multiple response statuses (browser)', () => {
  const itemContract = defineContract({
    createItem: {
      method: 'POST',
      path: '/items',
      body: v.object({ name: v.string() }),
      responses: {
        200: v.object({ id: v.number(), name: v.string() }),
        400: v.object({ code: v.string(), message: v.string() }),
      },
    },
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('validates the response against the schema for a 200 success status', async () => {
    const client = createFetchClient(itemContract, { baseUrl: 'https://api.example.com' });

    const result = await client.createItem({ body: { name: 'widget' } });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.status).toBe(200);
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.body).toStrictEqual({ id: 1, name: 'widget' });
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('validates the response against the schema for a 400 business-exception status', async ({ worker }) => {
    worker.use(createItemHandler.businessError);
    const client = createFetchClient(itemContract, { baseUrl: 'https://api.example.com' });

    const result = await client.createItem({ body: { name: 'widget' } });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.status).toBe(400);
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.body).toStrictEqual({ code: 'DUPLICATE_ITEM', message: 'An item with this name already exists.' });
  });
});
