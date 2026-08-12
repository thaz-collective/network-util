import { describe, test, expectTypeOf } from 'vite-plus/test';

import type { InferOutput } from 'valibot';

import { boolean } from '#src/valibot/schema/boolean';

describe('boolean', () => {
  test('infers a boolean output', () => {
    const schema = boolean(true);
    expectTypeOf<InferOutput<typeof schema>>().toEqualTypeOf<boolean>();
  });
});
