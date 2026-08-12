import type { StandardSchemaV1 } from '#src/standard-schema';

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export interface RouteDef<
  TPathParams extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  TQuery extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  THeaders extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  TBody extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  TResponses extends Record<number, StandardSchemaV1> = Record<number, StandardSchemaV1>,
> {
  method: Method;
  path: string;
  pathParams?: TPathParams;
  query?: TQuery;
  headers?: THeaders;
  body?: TBody;
  responses: TResponses;
}

/**
 * Anchors type inference over a flat map of routes. Also performs a runtime, authoring-time
 * sanity check that any `:token` in a route's `path` has a corresponding `pathParams` schema
 * declared — this is a best-effort guard, not a type-level guarantee.
 */
export function defineContract<T extends Record<string, RouteDef>>(routes: T): T {
  for (const route of Object.values(routes)) {
    assertPathParamsMatchPathTokens(route);
  }
  return routes;
}

function assertPathParamsMatchPathTokens(route: RouteDef): void {
  const tokens = route.path.match(/:(?<token>[^/?]+)/g);
  if (tokens && tokens.length > 0 && !route.pathParams) {
    throw new Error(
      `Route "${route.method} ${route.path}" declares path token(s) ${tokens.join(', ')} but has no "pathParams" schema.`,
    );
  }
}
