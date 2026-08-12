import type { StandardSchemaV1 } from '#src/standard-schema';

import type { RouteDef } from './dsl';

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

export type InferResponse<T extends RouteDef> = {
  [S in keyof T['responses'] & number]: {
    status: S;
    body: StandardSchemaV1.InferOutput<T['responses'][S]>;
    headers: Headers;
  };
}[keyof T['responses'] & number];
