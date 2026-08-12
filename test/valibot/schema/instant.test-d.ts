import { describe, test, expectTypeOf } from 'vite-plus/test';

import type { InferOutput } from 'valibot';

import { instant } from '#src/valibot/schema/instant';

describe('instant', () => {
  test('infers a Temporal.Instant output', () => {
    expectTypeOf<InferOutput<typeof instant>>().toEqualTypeOf<Temporal.Instant>();
  });
});
