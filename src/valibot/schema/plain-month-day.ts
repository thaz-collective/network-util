import * as t from '@thaz/temporal-util/valibot';

import * as v from 'valibot';

/**
 * Valibot schema that accepts a `Temporal.PlainMonthDay` instance or an ISO-8601 month-day string and
 * outputs a `Temporal.PlainMonthDay`.
 */
export const plainMonthDay = v.union([t.plainMonthDay(), v.pipe(v.string(), t.toPlainMonthDay(), t.plainMonthDay())]);
