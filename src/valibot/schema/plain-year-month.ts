import * as t from '@thaz/temporal-util/valibot';

import * as v from 'valibot';

/**
 * Valibot schema that accepts a `Temporal.PlainYearMonth` instance or an ISO-8601 year-month string and
 * outputs a `Temporal.PlainYearMonth`.
 */
export const plainYearMonth = v.union([
  t.plainYearMonth(),
  v.pipe(v.string(), t.toPlainYearMonth(), t.plainYearMonth()),
]);
