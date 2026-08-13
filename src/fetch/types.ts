import type { StandardSchemaV1 } from '#src/fetch/standard-schema';

/** The HTTP methods a route can declare. */
export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

/** The request parts a `RouteDef` can declare a standard-schema for. */
export type RequestField = 'pathParams' | 'query' | 'headers' | 'body';

/**
 * Non-enumerable marker key used by `defineContract` to attach an optional global headers schema
 * onto the routes object it returns, without changing the object's identity or shape.
 */
export const contractHeadersSymbol: unique symbol = Symbol('network-util.contractHeaders');

/**
 * Tags a route (or a whole contract) with the optional global headers schema `G` it was defined
 * with, so `InferRequestGlobalHeaders`/`InferRequestHeaders` can find it from the route type alone
 * — e.g. `InferRequest<(typeof contract)['someRoute']>` — without needing a reference to the contract.
 */
export interface ContractHeaders<G extends StandardSchemaV1 | undefined = undefined> {
  readonly [contractHeadersSymbol]?: G;
}

/**
 * Declares a single route: its HTTP method, path (with optional `:token` placeholders), and the
 * standard-schema for each request part it accepts, plus the schemas expected for each response
 * status code.
 */
export interface RouteDef<
  TPathParams extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  TQuery extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  THeaders extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  TBody extends StandardSchemaV1 | undefined = StandardSchemaV1 | undefined,
  TResponses extends Record<number, StandardSchemaV1> = Record<number, StandardSchemaV1>,
> {
  method: Method;
  /** The route path. `:token` segments are substituted from `pathParams` when building the request URL. */
  path: string;
  /** Schema for the `:token` values declared in `path`. Required if `path` declares any tokens. */
  pathParams?: TPathParams;
  /** Schema for the route's query string params. */
  query?: TQuery;
  /** Schema for this route's own headers, merged with any contract-level global headers schema. */
  headers?: THeaders;
  /** Schema for the JSON request body. Not used for `GET`/`HEAD` methods. */
  body?: TBody;
  /** Schema for the response body expected for each declared status code. */
  responses: TResponses;
}

/** Infers the input type of a route's `pathParams` schema, or `undefined` if it has none. */
export type InferRequestPathParams<T extends RouteDef> = T['pathParams'] extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T['pathParams']>
  : undefined;

/** Infers the input type of a route's `query` schema, or `undefined` if it has none. */
export type InferRequestQuery<T extends RouteDef> = T['query'] extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T['query']>
  : undefined;

/** Extracts the global headers schema a route was tagged with by `defineContract`, if any. */
export type RouteGlobalHeaders<T> = T extends ContractHeaders<infer G> ? G : undefined;

/** Infers the input type of the contract-level global headers schema a route was tagged with, or `undefined` if there is none. */
export type InferRequestGlobalHeaders<T extends RouteDef> =
  RouteGlobalHeaders<T> extends StandardSchemaV1 ? StandardSchemaV1.InferInput<RouteGlobalHeaders<T>> : undefined;

/** Infers the input type of a route's own `headers` schema alone (excluding any global headers schema), or `undefined` if it has none. */
export type InferRequestLocalHeaders<T extends RouteDef> = T['headers'] extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T['headers']>
  : undefined;

type Simplify<T> = { [K in keyof T]: T[K] } & {};

/**
 * Infers the combined input type of a route's headers: the contract-level global headers schema
 * merged with the route's own `headers` schema. Resolves to just one side's type when only one is
 * present, and to `undefined` when neither is present.
 */
export type InferRequestHeaders<T extends RouteDef> =
  RouteGlobalHeaders<T> extends StandardSchemaV1
    ? T['headers'] extends StandardSchemaV1
      ? Simplify<InferRequestGlobalHeaders<T> & InferRequestLocalHeaders<T>>
      : InferRequestGlobalHeaders<T>
    : T['headers'] extends StandardSchemaV1
      ? InferRequestLocalHeaders<T>
      : undefined;

/** Infers the input type of a route's `body` schema, or `undefined` if it has none. */
export type InferRequestBody<T extends RouteDef> = T['body'] extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T['body']>
  : undefined;

/**
 * Builds the argument object a route's client function accepts: one key per request part the
 * route actually declares a schema for (`pathParams`, `query`, `headers`, `body`), each inferred
 * from that part's schema. Parts with no schema (and no applicable global headers) are omitted
 * entirely, rather than being present with an `undefined` type.
 */
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

/**
 * Infers a route's response as a discriminated union over its declared status codes — each member
 * is `{ status; body }`, with `body` inferred from that status's schema. Pass `S` to narrow to a
 * single status's shape instead of the full union.
 */
export type InferResponse<
  T extends RouteDef,
  S extends keyof T['responses'] & number = keyof T['responses'] & number,
> = {
  [K in S]: {
    status: K;
    body: StandardSchemaV1.InferOutput<T['responses'][K]>;
  };
}[S];

/**
 * Constrains an object to a flat map of route names to `RouteDef`s, filtering out any non-string
 * (e.g. symbol) keys — used as a self-referential constraint (`T extends RouteDefMap<T>`) so
 * generic type parameters can validate their shape while still inferring literal route types.
 */
export type RouteDefMap<T> = { [K in keyof T as K extends string ? K : never]: RouteDef };

/**
 * The type returned by `defineContract`. Centralizing this here — rather than an inline literal
 * in `contract.ts` — means adding future contract-level options only requires extending this one type.
 */
export type Contract<T extends RouteDefMap<T>, G extends StandardSchemaV1 | undefined = undefined> = {
  [K in keyof T]: T[K] & ContractHeaders<G>;
} & ContractHeaders<G>;
