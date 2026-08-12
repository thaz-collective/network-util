import { describe, test, expectTypeOf } from 'vite-plus/test';

import type { InferOutput } from 'valibot';

import { plainMonthDay } from '#src/valibot/schema/plain-month-day';

describe('plainMonthDay', () => {
  test('infers a Temporal.PlainMonthDay output', () => {
    expectTypeOf<InferOutput<typeof plainMonthDay>>().toEqualTypeOf<Temporal.PlainMonthDay>();
  });
});
