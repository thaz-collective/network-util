import { useDeferredValue } from 'react';

import type { DefaultError, QueryKey, UseSuspenseQueryOptions, UseSuspenseQueryResult } from '@tanstack/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';

import type { defaultOptions } from 'spin-delay';
import { useSpinDelay } from 'spin-delay';
import { useDeepCompareMemo } from 'use-deep-compare';

/**
 * Wraps `useSuspenseQuery` with a deferred query key so that stale data continues to render
 * while a new key's data is being fetched, instead of reverting to the Suspense fallback.
 *
 * The `isSuspending` flag is driven by `useSpinDelay`, which prevents flicker for fast
 * transitions by keeping the flag `true` for a minimum visible duration.
 *
 * @see https://www.teemutaskula.com/blog/exploring-query-suspense
 *
 * @param options Standard `useSuspenseQuery` options from `@tanstack/react-query`.
 * @param spinDelayOptions Optional configuration forwarded to `useSpinDelay` (min duration, delay).
 * @returns An object with the underlying `query` result and an `isSuspending` boolean.
 */
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
