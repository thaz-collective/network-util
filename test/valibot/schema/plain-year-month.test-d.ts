import { describe, test, expectTypeOf } from 'vite-plus/test';

import type { InferOutput } from 'valibot';

import { plainYearMonth } from '#src/valibot/schema/plain-year-month';

describe('plainYearMonth', () => {
  test('infers a Temporal.PlainYearMonth output', () => {
    expectTypeOf<InferOutput<typeof plainYearMonth>>().toEqualTypeOf<Temporal.PlainYearMonth>();
  });
});
