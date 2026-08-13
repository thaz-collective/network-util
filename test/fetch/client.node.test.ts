import { describe, expect, vi } from 'vite-plus/test';

import * as v from 'valibot';

import {
  getPostHandler,
  createPostHandler,
  echoHeadersHandler,
  echoQueryHandler,
  downloadHandler,
  textHandler,
} from '#mock/handlers/fetch';
import { defineContract, createFetchClient } from '#src/fetch';
import { validateAgainstStandardSchema, buildUrl } from '#src/fetch/client';
import {
  RequestValidationError,
  ResponseValidationError,
  UnexpectedStatusError,
  InvalidRequestFieldTypeError,
  MissingPathParamError,
} from '#src/fetch/errors';
import { test } from '#test/node-util';

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
  nonObjectQuery: {
    method: 'GET',
    path: '/echo-query',
    query: v.pipe(
      v.object({ tag: v.string() }),
      v.transform((value) => [value.tag]),
    ),
    responses: { 200: v.object({ search: v.string() }) },
  },
});

describe('createFetchClient', () => {
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
  test('substitutes path params into the request URL', async ({ server }) => {
    let capturedUrl: string | undefined;
    server.use(getPostHandler.success);
    server.events.on('request:start', ({ request }) => {
      capturedUrl = request.url;
    });

    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });
    await client.getPost({ pathParams: { id: '42' } });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(capturedUrl).toBe('https://api.example.com/posts/42');
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('serializes query params onto the request URL', async ({ server }) => {
    server.use(echoQueryHandler.success);
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    const result = await client.echoQuery({ query: { tag: ['a', 'b'] } });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.body.search).toBe('?tag=a&tag=b');
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('merges client-level and route-level headers', async ({ server }) => {
    server.use(echoHeadersHandler.success);
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
  test('throws RequestValidationError and never calls fetch for invalid request data', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- deliberately violating the contract's type to exercise the validation-failure path
    const invalidArgs = { pathParams: { id: {} } } as unknown as Parameters<typeof client.getPost>[0];
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    await expect(client.getPost(invalidArgs)).rejects.toBeInstanceOf(RequestValidationError);
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(fetchSpy).not.toHaveBeenCalled();

    fetchSpy.mockRestore();
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('throws InvalidRequestFieldTypeError when a validated request field is not a plain object', async () => {
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    await expect(client.nonObjectQuery({ query: { tag: 'a' } })).rejects.toBeInstanceOf(InvalidRequestFieldTypeError);
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('throws ResponseValidationError when the response body fails schema validation', async ({ server }) => {
    server.use(getPostHandler.invalidBody);
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    await expect(client.getPost({ pathParams: { id: '1' } })).rejects.toBeInstanceOf(ResponseValidationError);
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('throws UnexpectedStatusError when the response status has no matching contract entry', async ({ server }) => {
    server.use(getPostHandler.unexpectedStatus);
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    await expect(client.getPost({ pathParams: { id: '1' } })).rejects.toBeInstanceOf(UnexpectedStatusError);
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('sends a JSON body for POST requests', async ({ server }) => {
    server.use(createPostHandler.success);
    const client = createFetchClient(contract, { baseUrl: 'https://api.example.com' });

    const result = await client.createPost({ body: { title: 'new post' } });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.status).toBe(201);
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.body).toStrictEqual({ id: 1, title: 'created' });
  });
});

describe('global headers', () => {
  const globalHeadersContract = defineContract(
    {
      echoHeadersWithRouteSchema: {
        method: 'GET',
        path: '/echo-headers',
        headers: v.object({ 'x-route-header': v.string() }),
        responses: { 200: v.object({ headers: v.record(v.string(), v.string()) }) },
      },
      echoHeadersNoRouteSchema: {
        method: 'GET',
        path: '/echo-headers',
        responses: { 200: v.object({ headers: v.record(v.string(), v.string()) }) },
      },
    },
    { headers: v.object({ 'x-tenant': v.string() }) },
  );

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('merges the global headers schema with a route that declares its own headers', async ({ server }) => {
    server.use(echoHeadersHandler.success);
    const client = createFetchClient(globalHeadersContract, { baseUrl: 'https://api.example.com' });

    const result = await client.echoHeadersWithRouteSchema({
      headers: { 'x-tenant': 'acme', 'x-route-header': 'route-value' },
    });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.body.headers['x-tenant']).toBe('acme');
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.body.headers['x-route-header']).toBe('route-value');
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('applies the global headers schema to a route with no headers schema of its own', async ({ server }) => {
    server.use(echoHeadersHandler.success);
    const client = createFetchClient(globalHeadersContract, { baseUrl: 'https://api.example.com' });

    const result = await client.echoHeadersNoRouteSchema({ headers: { 'x-tenant': 'acme' } });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.body.headers['x-tenant']).toBe('acme');
  });
});

describe('per-call requestOptions', () => {
  const contractWithHeaders = defineContract({
    echoHeaders: {
      method: 'GET',
      path: '/echo-headers',
      headers: v.object({ 'x-route-header': v.string() }),
      responses: { 200: v.object({ headers: v.record(v.string(), v.string()) }) },
    },
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('requestOptions.headers overrides client and route-derived headers', async ({ server }) => {
    server.use(echoHeadersHandler.success);
    const client = createFetchClient(contractWithHeaders, {
      baseUrl: 'https://api.example.com',
      headers: { 'x-route-header': 'client-value' },
    });

    const result = await client.echoHeaders(
      { headers: { 'x-route-header': 'route-value' } },
      { headers: { 'x-route-header': 'override-value' } },
    );

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.body.headers['x-route-header']).toBe('override-value');
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('requestOptions.signal is forwarded to fetch', async () => {
    const client = createFetchClient(contractWithHeaders, { baseUrl: 'https://api.example.com' });
    const controller = new AbortController();
    controller.abort();

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    await expect(
      client.echoHeaders({ headers: { 'x-route-header': 'route-value' } }, { signal: controller.signal }),
    ).rejects.toThrow(/abort/i);
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

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('returns the raw response body as a validated Blob', async ({ server }) => {
    server.use(downloadHandler.success);
    const client = createFetchClient(blobContract, { baseUrl: 'https://api.example.com' });

    const result = await client.download({});

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.status).toBe(200);
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.body).toBeInstanceOf(Blob);
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    await expect(result.body.text()).resolves.toBe('binary-content');
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('throws ResponseValidationError when the response body is not a Blob', async ({ server }) => {
    server.use(downloadHandler.invalidBody);
    const client = createFetchClient(blobContract, { baseUrl: 'https://api.example.com' });

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    await expect(client.download({})).rejects.toBeInstanceOf(ResponseValidationError);
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('falls back to Blob parsing when the response has no content-type header', async ({ server }) => {
    server.use(downloadHandler.noContentType);
    const client = createFetchClient(blobContract, { baseUrl: 'https://api.example.com' });

    const result = await client.download({});

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.body).toBeInstanceOf(Blob);
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    await expect(result.body.text()).resolves.toBe('binary-content');
  });
});

describe('text responses', () => {
  const textContract = defineContract({
    getText: {
      method: 'GET',
      path: '/text',
      responses: { 200: v.string() },
    },
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('parses a text/* response body as a string', async ({ server }) => {
    server.use(textHandler.success);
    const client = createFetchClient(textContract, { baseUrl: 'https://api.example.com' });

    const result = await client.getText({});

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.body).toBe('plain-text-content');
  });
});

describe('validateAgainstStandardSchema', () => {
  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('returns success with the parsed value for valid input', async () => {
    const result = await validateAgainstStandardSchema(
      v.pipe(
        v.string(),
        v.transform((s) => s.toUpperCase()),
      ),
      'hi',
    );
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result).toStrictEqual({ success: true, value: 'HI' });
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('returns failure with issues for invalid input', async () => {
    const result = await validateAgainstStandardSchema(v.string(), 123);
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result.success).toBeFalsy();
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(result).toHaveProperty('issues');
  });
});

describe('buildUrl', () => {
  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('substitutes a single path token', () => {
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(buildUrl('https://api.example.com', '/posts/:id', { id: 1 }, undefined)).toBe(
      'https://api.example.com/posts/1',
    );
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('substitutes multiple path tokens', () => {
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(
      buildUrl('https://api.example.com', '/posts/:postId/comments/:commentId', { postId: 1, commentId: 2 }, undefined),
    ).toBe('https://api.example.com/posts/1/comments/2');
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('substitutes a hyphenated path token', () => {
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(buildUrl('https://api.example.com', '/posts/:post-id', { 'post-id': 1 }, undefined)).toBe(
      'https://api.example.com/posts/1',
    );
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('leaves a path with no tokens unchanged', () => {
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(buildUrl('https://api.example.com', '/posts', undefined, undefined)).toBe('https://api.example.com/posts');
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('throws MissingPathParamError when a required token has no matching pathParams key', () => {
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(() => buildUrl('https://api.example.com', '/posts/:id', undefined, undefined)).toThrow(
      MissingPathParamError,
    );
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(() => buildUrl('https://api.example.com', '/posts/:id', {}, undefined)).toThrow(
      'Missing path param "id" for path "/posts/:id"',
    );
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('throws MissingPathParamError when a pathParams key is present but explicitly undefined', () => {
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(() => buildUrl('https://api.example.com', '/posts/:id', { id: undefined }, undefined)).toThrow(
      MissingPathParamError,
    );
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('missingPathParamError carries the path and token', () => {
    let caught: unknown;
    try {
      buildUrl('https://api.example.com', '/posts/:id', undefined, undefined);
    } catch (error: unknown) {
      caught = error;
    }

    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(caught).toBeInstanceOf(MissingPathParamError);
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(caught).toMatchObject({ path: '/posts/:id', token: 'id' });
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('encodes special characters in a path param value', () => {
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(buildUrl('https://api.example.com', '/search/:term', { term: 'a/b c' }, undefined)).toBe(
      'https://api.example.com/search/a%2Fb%20c',
    );
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('appends flat query params', () => {
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(buildUrl('https://api.example.com', '/posts', undefined, { a: 1, b: 2 })).toBe(
      'https://api.example.com/posts?a=1&b=2',
    );
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('appends array query values as repeated keys', () => {
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(buildUrl('https://api.example.com', '/posts', undefined, { tag: ['a', 'b'] })).toBe(
      'https://api.example.com/posts?tag=a&tag=b',
    );
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('omits undefined query values entirely', () => {
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(buildUrl('https://api.example.com', '/posts', undefined, { a: 1, b: undefined })).toBe(
      'https://api.example.com/posts?a=1',
    );
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('produces no "?" when no query object is given', () => {
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(buildUrl('https://api.example.com', '/posts', undefined, undefined)).not.toContain('?');
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('omits null query values entirely', () => {
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(buildUrl('https://api.example.com', '/posts', undefined, { a: 1, b: null })).toBe(
      'https://api.example.com/posts?a=1',
    );
  });

  // oxlint-disable-next-line vitest/prefer-importing-vitest-globals -- this is from a test fixture and therefore not a global
  test('omits null and undefined items within an array query value', () => {
    // oxlint-disable-next-line vitest/no-standalone-expect -- This fires because test is a fixture and not from `vitest`/`vite-plus/test`
    expect(buildUrl('https://api.example.com', '/posts', undefined, { tag: ['a', null, 'b', undefined] })).toBe(
      'https://api.example.com/posts?tag=a&tag=b',
    );
  });
});
