import { describe, test, expectTypeOf } from 'vite-plus/test';

import type { InferOutput } from 'valibot';

import { plainTime } from '#src/valibot/schema/plain-time';

describe('plainTime', () => {
  test('infers a Temporal.PlainTime output', () => {
    expectTypeOf<InferOutput<typeof plainTime>>().toEqualTypeOf<Temporal.PlainTime>();
  });
});
