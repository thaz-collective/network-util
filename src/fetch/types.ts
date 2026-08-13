import type { StandardSchemaV1 } from '#src/fetch/standard-schema';

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export type RequestField = 'pathParams' | 'query' | 'headers' | 'body';

/**
 * Non-enumerable marker key used by `defineContract` to attach an optional global headers schema
 * onto the routes object it returns, without changing the object's identity or shape.
 */
export const contractHeadersSymbol: unique symbol = Symbol('network-util.contractHeaders');

export interface ContractHeaders<G extends StandardSchemaV1 | undefined = undefined> {
  readonly [contractHeadersSymbol]?: G;
}

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

export type InferRequestPathParams<T extends RouteDef> = T['pathParams'] extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T['pathParams']>
  : undefined;

export type InferRequestQuery<T extends RouteDef> = T['query'] extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T['query']>
  : undefined;

type Simplify<T> = { [K in keyof T]: T[K] } & {};

/** Extracts the global headers schema a route was tagged with by `defineContract`, if any. */
export type RouteGlobalHeaders<T> = T extends ContractHeaders<infer G> ? G : undefined;

export type InferRequestGlobalHeaders<T extends RouteDef> =
  RouteGlobalHeaders<T> extends StandardSchemaV1 ? StandardSchemaV1.InferInput<RouteGlobalHeaders<T>> : undefined;

export type InferRequestLocalHeaders<T extends RouteDef> = T['headers'] extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T['headers']>
  : undefined;

export type InferRequestHeaders<T extends RouteDef> =
  RouteGlobalHeaders<T> extends StandardSchemaV1
    ? T['headers'] extends StandardSchemaV1
      ? Simplify<InferRequestGlobalHeaders<T> & InferRequestLocalHeaders<T>>
      : InferRequestGlobalHeaders<T>
    : T['headers'] extends StandardSchemaV1
      ? InferRequestLocalHeaders<T>
      : undefined;

export type InferRequestBody<T extends RouteDef> = T['body'] extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T['body']>
  : undefined;

export type InferRequest<T extends RouteDef> = {
  [K in 'pathParams' | 'query' | 'headers' | 'body' as K extends 'headers'
    ? T['headers'] extends StandardSchemaV1
      ? K
      : RouteGlobalHeaders<T> extends StandardSchemaV1
        ? K
        : never
    : T[K] extends StandardSchemaV1
      ? K
      : never]: K extends 'pathParams'
    ? InferRequestPathParams<T>
    : K extends 'query'
      ? InferRequestQuery<T>
      : K extends 'headers'
        ? InferRequestHeaders<T>
        : InferRequestBody<T>;
};

export type InferResponse<
  T extends RouteDef,
  S extends keyof T['responses'] & number = keyof T['responses'] & number,
> = {
  [K in S]: {
    status: K;
    body: StandardSchemaV1.InferOutput<T['responses'][K]>;
  };
}[S];

export type RouteDefMap<T> = { [K in keyof T as K extends string ? K : never]: RouteDef };

/**
 * The type returned by `defineContract`: the route map, with each route (and the map itself) tagged
 * with the optional global headers schema `G`. Centralizing this here — rather than an inline literal
 * in `contract.ts` — means adding future contract-level options only requires extending this one type.
 */
export type Contract<T extends RouteDefMap<T>, G extends StandardSchemaV1 | undefined = undefined> = {
  [K in keyof T]: T[K] & ContractHeaders<G>;
} & ContractHeaders<G>;
