import type { StandardSchemaV1 } from './standard-schema';
import type { RouteDef, Contract } from './types';
import { ContractPathParamsError, ContractResponseStatusError } from './errors';
import { contractHeadersSymbol } from './types';

/** Contract-level options for `defineContract`. */
export interface DefineContractOptions<G extends StandardSchemaV1 | undefined = undefined> {
  /**
   * A typesafe schema applied to every route's headers, merged with each route's own `headers`
   * schema. Prefer non-strict object schemas (e.g. `v.object`, not `v.strictObject`) here and on
   * each route's `headers` — since the merged input is validated against each schema separately,
   * a strict schema will reject keys that only the other schema recognizes.
   */
  headers?: G;
}

/**
 * Anchors type inference over a flat map of routes. Also performs runtime, authoring-time sanity
 * checks — that any `:token` in a route's `path` has a corresponding `pathParams` schema declared,
 * and that every key in a route's `responses` map is a numeric status code — since TypeScript's
 * `number` index signature can't reject non-numeric string keys like `'200a'` at the type level.
 *
 * An optional `headers` schema in `options` is merged into every route's inferred and validated
 * headers, without changing the shape or identity of the returned routes object.
 */
export function defineContract<T extends Record<string, RouteDef>, G extends StandardSchemaV1 | undefined = undefined>(
  routes: T,
  options?: DefineContractOptions<G>,
): Contract<T, G> {
  for (const route of Object.values(routes)) {
    const tokens = route.path.match(/:(?<token>[^/?]+)/g);
    if (tokens && tokens.length > 0 && !route.pathParams) {
      throw new ContractPathParamsError({
        method: route.method,
        path: route.path,
        tokens: tokens.map((token) => token.slice(1)),
      });
    }

    for (const status of Object.keys(route.responses)) {
      if (!/^\d+$/.test(status)) {
        throw new ContractResponseStatusError({ method: route.method, path: route.path, status });
      }
    }
  }

  Object.defineProperty(routes, contractHeadersSymbol, {
    value: options?.headers,
    enumerable: false,
  });

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- tags the same object reference with the global headers type
  return routes;
}
