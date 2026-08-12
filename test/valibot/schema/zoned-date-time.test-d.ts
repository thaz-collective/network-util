import { describe, test, expectTypeOf } from 'vite-plus/test';

import type { InferOutput } from 'valibot';

import { zonedDateTime } from '#src/valibot/schema/zoned-date-time';

describe('zonedDateTime', () => {
  test('infers a Temporal.ZonedDateTime output', () => {
    expectTypeOf<InferOutput<typeof zonedDateTime>>().toEqualTypeOf<Temporal.ZonedDateTime>();
  });
});
