import { describe, test, expectTypeOf } from 'vite-plus/test';

import type { InferOutput } from 'valibot';

import { plainDateTime } from '#src/valibot/schema/plain-date-time';

describe('plainDateTime', () => {
  test('infers a Temporal.PlainDateTime output', () => {
    expectTypeOf<InferOutput<typeof plainDateTime>>().toEqualTypeOf<Temporal.PlainDateTime>();
  });
});
