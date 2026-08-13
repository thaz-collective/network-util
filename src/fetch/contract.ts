import type { RouteDef } from './types';
import { ContractPathParamsError } from './errors';

/**
 * Anchors type inference over a flat map of routes. Also performs a runtime, authoring-time
 * sanity check that any `:token` in a route's `path` has a corresponding `pathParams` schema
 * declared — this is a best-effort guard, not a type-level guarantee.
 */
export function defineContract<T extends Record<string, RouteDef>>(routes: T): T {
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
  return routes;
}
