import type { StandardSchemaV1 } from '#src/fetch/standard-schema';

export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';

export type RequestField = 'pathParams' | 'query' | 'headers' | 'body';

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

export type InferPathParams<T extends RouteDef> = T['pathParams'] extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T['pathParams']>
  : undefined;

export type InferQuery<T extends RouteDef> = T['query'] extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T['query']>
  : undefined;

export type InferHeaders<T extends RouteDef> = T['headers'] extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T['headers']>
  : undefined;

export type InferBody<T extends RouteDef> = T['body'] extends StandardSchemaV1
  ? StandardSchemaV1.InferInput<T['body']>
  : undefined;

export type InferRequest<T extends RouteDef> = {
  [K in 'pathParams' | 'query' | 'headers' | 'body' as T[K] extends StandardSchemaV1
    ? K
    : never]: K extends 'pathParams'
    ? InferPathParams<T>
    : K extends 'query'
      ? InferQuery<T>
      : K extends 'headers'
        ? InferHeaders<T>
        : InferBody<T>;
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
