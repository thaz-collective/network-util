import * as t from '@thaz/temporal-util/valibot';

import * as v from 'valibot';

/**
 * Valibot schema that accepts a `Temporal.Instant` instance or an ISO-8601 string and
 * outputs a `Temporal.Instant`.
 */
export const instant = v.union([t.instant(), v.pipe(v.string(), t.toInstant(), t.instant())]);
