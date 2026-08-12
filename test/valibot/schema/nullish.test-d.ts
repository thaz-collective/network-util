import { describe, test, expectTypeOf } from 'vite-plus/test';

import type { InferOutput } from 'valibot';
import * as v from 'valibot';

import { nullish } from '#src/valibot/schema/nullish';

describe('nullish', () => {
  test('infers T | null output for the wrapped schema', () => {
    const schema = nullish(v.string());
    expectTypeOf<InferOutput<typeof schema>>().toEqualTypeOf<string | null>();
  });

  test('preserves the wrapped schema type parameter', () => {
    const schema = nullish(v.number());
    expectTypeOf<InferOutput<typeof schema>>().toEqualTypeOf<number | null>();
  });
});
