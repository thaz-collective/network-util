import * as t from '@thaz/temporal-util/valibot';

import * as v from 'valibot';

/**
 * Valibot schema that accepts a `Temporal.PlainDateTime` instance or an ISO-8601 date-time string and
 * outputs a `Temporal.PlainDateTime`.
 */
export const plainDateTime = v.union([t.plainDateTime(), v.pipe(v.string(), t.toPlainDateTime(), t.plainDateTime())]);
