import { describe, test, expectTypeOf } from 'vite-plus/test';

import type { InferOutput } from 'valibot';

import { plainDate } from '#src/valibot/schema/plain-date';

describe('plainDate', () => {
  test('infers a Temporal.PlainDate output', () => {
    expectTypeOf<InferOutput<typeof plainDate>>().toEqualTypeOf<Temporal.PlainDate>();
  });
});
