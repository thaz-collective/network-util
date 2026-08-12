import { describe, test, expectTypeOf } from 'vite-plus/test';

import type { InferOutput } from 'valibot';
import * as v from 'valibot';

import { array } from '#src/valibot/schema/array';

describe('array', () => {
  test('infers T[] output for the wrapped schema', () => {
    const schema = array(v.string());
    expectTypeOf<InferOutput<typeof schema>>().toEqualTypeOf<string[]>();
  });

  test('preserves the wrapped schema type parameter', () => {
    const schema = array(v.number());
    expectTypeOf<InferOutput<typeof schema>>().toEqualTypeOf<number[]>();
  });
});
