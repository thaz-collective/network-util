import { test as baseTest } from 'vite-plus/test';

import { server } from '#mock/node';

let serverStarted = false;

export const test = baseTest
  // oxlint-disable-next-line eslint/no-empty-pattern -- Test can't run if we do an underscore variable and there is nothing in context that we need
  .extend('server', { auto: true }, ({}, { onCleanup }) => {
    if (!serverStarted) {
      server.listen({ onUnhandledRequest: 'error' });
      serverStarted = true;
    }

    onCleanup(() => {
      server.resetHandlers();
    });

    return server;
  });
