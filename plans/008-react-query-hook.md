# 008 — react-query hook + subpath export

Source only. Depends on: `001-project-scaffold.md`. No `test/` files (later plan).

## Goal

Port the `useSuspenseQueryDeferred` hook into `src/react-query/` and wire the `./react-query`
subpath.

## Files to create

### `src/react-query/use-suspense-query-deferred.ts`

Port verbatim from
`thaz-utils/packages/network-util/src/hooks/suspense-query-deferred.ts` — no import path changes
needed, all its dependencies (`react`, `@tanstack/react-query`, `spin-delay`, `use-deep-compare`)
are already declared in task 001:

```ts
import { useDeferredValue } from 'react';

import type { DefaultError, QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';

import type { defaultOptions } from 'spin-delay';
import { useSpinDelay } from 'spin-delay';
import { useDeepCompareMemo } from 'use-deep-compare';

export function useSuspenseQueryDeferred<
  TQueryFunctionData = unknown,
  TError = DefaultError,
  TData = TQueryFunctionData,
  TQueryKey extends QueryKey = QueryKey,
>(
  options: UseSuspenseQueryOptions<TQueryFunctionData, TError, TData, TQueryKey>,
  spinDelayOptions?: Partial<typeof defaultOptions>,
): {
  isSuspending: boolean;
  query: UseSuspenseQueryResult<TData, TError>;
} {
  const queryKey = useDeepCompareMemo(() => {
    return options.queryKey;
  }, [options.queryKey]);

  const deferredQueryKey = useDeferredValue(queryKey);

  const query = useSuspenseQuery({
    ...options,
    queryKey: deferredQueryKey,
  });

  const isSuspending = useSpinDelay(queryKey !== deferredQueryKey, spinDelayOptions);

  return {
    isSuspending,
    query,
  };
}
```

Keep the original JSDoc verbatim — it documents the flicker-avoidance rationale and links the blog
post the pattern is from.

### `src/react-query/index.ts`

```ts
export * from './use-suspense-query-deferred';
```

## package.json / vite.config.ts

Already declared in `001-project-scaffold.md` (the `"./react-query"` exports entry and the
`'react-query': './src/react-query/index.ts'` pack entry). Confirm both are present; add if task 001
was scoped down.

## Verification

- `import { useSuspenseQueryDeferred } from '@thaz/network-util/react-query'` type-checks in a
  React component.
- File requires the `@vitejs/plugin-react` + `jsdom` test environment additions from task 001 once
  tests are added later — no action needed now beyond confirming those are in place.
