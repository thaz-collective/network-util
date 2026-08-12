# 014 — fetch URL building utils

See `011-fetch-overview.md` for full context.

## Purpose

Isolated, dependency-free path/query URL-building logic, reused by the client (task 017).

## Files to create

### `src/fetch/url.ts`

```ts
export function buildUrl(
  baseUrl: string,
  path: string,
  pathParams: Record<string, unknown> | undefined,
  query: Record<string, unknown> | undefined,
): string {
  const substitutedPath = path.replace(/:([^/?]+)/g, (match, token: string) => {
    if (!pathParams || !(token in pathParams)) {
      throw new Error(`Missing path param "${token}" for path "${path}"`);
    }
    return encodeURIComponent(String(pathParams[token]));
  });

  const url = new URL(substitutedPath, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue;
      if (Array.isArray(value)) {
        for (const item of value) url.searchParams.append(key, String(item));
      } else {
        url.searchParams.append(key, String(value));
      }
    }
  }

  return url.toString();
}
```

No dual jsonQuery/bracket-notation modes — flat key/value, arrays via repeated `append`,
`undefined` values omitted entirely.

### `test/fetch/url.node.test.ts`

Using `describe`/`test`/`expect` from `vite-plus/test`:

- Substitutes a single `:token`, multiple tokens, and a path with no tokens.
- Throws when a required token has no matching `pathParams` key.
- Encodes special characters in a path param value (e.g. `/`, spaces).
- Appends flat query params correctly (`?a=1&b=2`).
- Appends array query values as repeated keys (`?tag=a&tag=b`).
- Omits `undefined` query values entirely (key doesn't appear in the resulting URL).
- No query object at all → no `?` in the resulting URL.

## Verification

- `vp run test --browser.headless` — new node test passes.
- `vp check --fix` — clean.
