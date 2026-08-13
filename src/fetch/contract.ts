import type { StandardSchemaV1 } from './standard-schema';
import type { RouteDef, ContractHeaders } from './types';
import { ContractPathParamsError } from './errors';
import { contractHeadersSymbol } from './types';

export interface DefineContractOptions<G extends StandardSchemaV1 | undefined = undefined> {
  /** A typesafe schema applied to every route's headers, merged with each route's own `headers` schema. */
  headers?: G;
}

/**
 * Anchors type inference over a flat map of routes. Also performs a runtime, authoring-time
 * sanity check that any `:token` in a route's `path` has a corresponding `pathParams` schema
 * declared — this is a best-effort guard, not a type-level guarantee.
 *
 * An optional `headers` schema in `options` is merged into every route's inferred and validated
 * headers, without changing the shape or identity of the returned routes object.
 */
export function defineContract<T extends Record<string, RouteDef>, G extends StandardSchemaV1 | undefined = undefined>(
  routes: T,
  options?: DefineContractOptions<G>,
): T & ContractHeaders<G> {
  for (const route of Object.values(routes)) {
    const tokens = route.path.match(/:(?<token>[^/?]+)/g);
    if (tokens && tokens.length > 0 && !route.pathParams) {
      throw new ContractPathParamsError({
        method: route.method,
        path: route.path,
        tokens: tokens.map((token) => token.slice(1)),
      });
    }
  }

  Object.defineProperty(routes, contractHeadersSymbol, {
    value: options?.headers,
    enumerable: false,
  });

  return routes;
}
