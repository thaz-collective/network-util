import { expect, test, describe } from 'vite-plus/test';
import { renderHook } from 'vitest-browser-react';

import { useSuspenseQueryDeferred } from '#src/react-query/use-suspense-query-deferred';

import { QueryClientHookTestUtils } from './query-client-wrapper-util';

describe('useSuspenseQueryDeferred', () => {
  test('returns query data once the suspense query resolves', async () => {
    const { wrapper } = QueryClientHookTestUtils.createWrapperComponent();

    const { result } = await renderHook(
      () =>
        useSuspenseQueryDeferred({
          queryKey: ['test'],
          queryFn: () => 'hello',
        }),
      { wrapper },
    );

    await expect.poll(() => result.current.query.data).toBe('hello');

    expect(result.current.isSuspending).toBeFalsy();
  });
});
