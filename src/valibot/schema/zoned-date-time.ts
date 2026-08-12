import * as t from '@thaz/temporal-util/valibot';

import * as v from 'valibot';

/**
 * Valibot schema that accepts a `Temporal.ZonedDateTime` instance or an ISO-8601 zoned date-time string and
 * outputs a `Temporal.ZonedDateTime`.
 */
export const zonedDateTime = v.union([t.zonedDateTime(), v.pipe(v.string(), t.toZonedDateTime(), t.zonedDateTime())]);
