# 018 — msw integration tests for the fetch client

See `011-fetch-overview.md` for full context. Depends on `017-fetch-client.md`.

## Purpose

End-to-end tests of `createFetchClient` against real `fetch()` calls, intercepted by `msw` so the
same mocking strategy works identically in both the node and Playwright-browser vitest projects.

## Dependency changes

Add `msw` to `devDependencies` in `package.json` (catalog entry if this monorepo's catalog
convention applies — check `pnpm-workspace.yaml` for an existing `msw` catalog entry first; add
one if absent, matching how other devDependencies like `@vitest/browser-playwright` are
catalog-pinned).

## Files to create

### `test/fetch/msw-server.ts` (shared test helper)

A small helper setting up an `msw` request-handler server usable from both node
(`msw/node`'s `setupServer`) and browser (`msw/browser`'s `setupWorker`) test projects. Check
whether `msw/node` vs `msw/browser` needs separate setup files given the two vitest projects run
in genuinely different environments — if so, split into
`test/fetch/msw-server.node.ts` and `test/fetch/msw-server.browser.ts` with a shared
`test/fetch/msw-handlers.ts` defining the `http.get`/`http.post` handlers reused by both.

### `test/fetch/client.node.test.ts`

Using `describe`/`test`/`expect` from `vite-plus/test`, `defineContract` + `createFetchClient`
from `#src/fetch`, and valibot schemas:

- **Success path**: msw handler returns a 200 matching the declared response schema; assert the
  client returns `{ status: 200, body, headers }` with `body` matching the expected parsed shape.
- **Path-param substitution**: route `/posts/:id`, assert the request msw intercepts has the
  substituted URL.
- **Query serialization**: route with query params, assert the intercepted request URL has the
  expected query string.
- **Header merging**: client-level `headers` option + route-level `headers` field, assert both end
  up on the intercepted request, with route-level winning on key conflicts.
- **Request validation failure**: call with an invalid `body`/`query`/`pathParams`; assert
  `RequestValidationError` is thrown and (via `vi.spyOn(globalThis, 'fetch')` or an msw
  call-count assertion) that no actual request was sent.
- **Response validation failure**: msw returns a 200 body that doesn't match the declared response
  schema for `200`; assert `ResponseValidationError` is thrown.
- **Unexpected status**: msw returns a status with no entry in `responses`; assert
  `UnexpectedStatusError` is thrown.

### `test/fetch/client.browser.test.ts`

Same coverage as the node test, using `msw/browser`'s `setupWorker` per the browser-mode
conventions established in `test/react-query/use-suspense-query-deferred.browser.test.ts`
(explicit `vite-plus/test` imports, no `@testing-library/react`/globals).

## Verification

- `vp run test --browser.headless` — all new tests pass across node, browser-chromium, and
  browser-firefox.
- `vp check --fix` — clean.
- Coverage: `src/fetch/client.ts` (and the rest of `src/fetch/**`) meets the 80%
  branches/functions/lines/statements thresholds.
