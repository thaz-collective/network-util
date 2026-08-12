import * as t from '@thaz/temporal-util/valibot';

import * as v from 'valibot';

/**
 * Valibot schema that accepts a `Temporal.PlainDate` instance or an ISO-8601 date string and
 * outputs a `Temporal.PlainDate`.
 */
export const plainDate = v.union([t.plainDate(), v.pipe(v.string(), t.toPlainDate(), t.plainDate())]);
