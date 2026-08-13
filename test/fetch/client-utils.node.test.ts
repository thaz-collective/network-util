import { describe, test, expect } from 'vite-plus/test';

import * as v from 'valibot';

import { validateAgainstStandardSchema, buildUrl } from '#src/fetch/client';

describe('validateAgainstStandardSchema', () => {
  test('returns success with the parsed value for valid input', async () => {
    const result = await validateAgainstStandardSchema(
      v.pipe(
        v.string(),
        v.transform((s) => s.toUpperCase()),
      ),
      'hi',
    );
    expect(result).toStrictEqual({ success: true, value: 'HI' });
  });

  test('returns failure with issues for invalid input', async () => {
    const result = await validateAgainstStandardSchema(v.string(), 123);
    expect(result.success).toBeFalsy();
    expect(result).toHaveProperty('issues');
  });
});

describe('buildUrl', () => {
  test('substitutes a single path token', () => {
    expect(buildUrl('https://api.example.com', '/posts/:id', { id: 1 }, undefined)).toBe(
      'https://api.example.com/posts/1',
    );
  });

  test('substitutes multiple path tokens', () => {
    expect(
      buildUrl('https://api.example.com', '/posts/:postId/comments/:commentId', { postId: 1, commentId: 2 }, undefined),
    ).toBe('https://api.example.com/posts/1/comments/2');
  });

  test('leaves a path with no tokens unchanged', () => {
    expect(buildUrl('https://api.example.com', '/posts', undefined, undefined)).toBe('https://api.example.com/posts');
  });

  test('throws when a required token has no matching pathParams key', () => {
    expect(() => buildUrl('https://api.example.com', '/posts/:id', undefined, undefined)).toThrow(
      'Missing path param "id" for path "/posts/:id"',
    );
    expect(() => buildUrl('https://api.example.com', '/posts/:id', {}, undefined)).toThrow(
      'Missing path param "id" for path "/posts/:id"',
    );
  });

  test('encodes special characters in a path param value', () => {
    expect(buildUrl('https://api.example.com', '/search/:term', { term: 'a/b c' }, undefined)).toBe(
      'https://api.example.com/search/a%2Fb%20c',
    );
  });

  test('appends flat query params', () => {
    expect(buildUrl('https://api.example.com', '/posts', undefined, { a: 1, b: 2 })).toBe(
      'https://api.example.com/posts?a=1&b=2',
    );
  });

  test('appends array query values as repeated keys', () => {
    expect(buildUrl('https://api.example.com', '/posts', undefined, { tag: ['a', 'b'] })).toBe(
      'https://api.example.com/posts?tag=a&tag=b',
    );
  });

  test('omits undefined query values entirely', () => {
    expect(buildUrl('https://api.example.com', '/posts', undefined, { a: 1, b: undefined })).toBe(
      'https://api.example.com/posts?a=1',
    );
  });

  test('produces no "?" when no query object is given', () => {
    expect(buildUrl('https://api.example.com', '/posts', undefined, undefined)).not.toContain('?');
  });
});
