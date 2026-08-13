import { test as baseTest } from 'vite-plus/test';

import { worker } from '#mock/browser';

let workerStarted = false;

export const test = baseTest
  // oxlint-disable-next-line eslint/no-empty-pattern -- Test can't run if we do an underscore variable and there is nothing in context that we need
  .extend('worker', { auto: true }, async ({}, { onCleanup }) => {
    if (!workerStarted) {
      await worker.start({ quiet: true, onUnhandledRequest: 'error' });
      workerStarted = true;
    }

    onCleanup(() => {
      worker.resetHandlers();
    });

    return worker;
  });
