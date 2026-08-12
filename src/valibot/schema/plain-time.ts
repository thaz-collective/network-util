import * as t from '@thaz/temporal-util/valibot';

import * as v from 'valibot';

/**
 * Valibot schema that accepts a `Temporal.PlainTime` instance or an ISO-8601 time string and
 * outputs a `Temporal.PlainTime`.
 */
export const plainTime = v.union([t.plainTime(), v.pipe(v.string(), t.toPlainTime(), t.plainTime())]);
