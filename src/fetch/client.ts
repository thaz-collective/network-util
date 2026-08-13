import type { StandardSchemaV1 } from './standard-schema';
import type { InferRequest, InferResponse, RouteDef, RequestField, RouteDefMap, Contract } from './types';
import {
  RequestValidationError,
  ResponseValidationError,
  UnexpectedStatusError,
  InvalidRequestFieldTypeError,
  MissingPathParamError,
} from './errors';
import { contractHeadersSymbol } from './types';

export interface CreateFetchClientOptions {
  baseUrl: string;

  /** The initial set of headers passed in on every client call */
  headers?: HeadersInit;
}

export interface FetchClientRequestOptions {
  signal?: AbortSignal;
  /** Merged in last, overriding any headers derived from the contract's schemas or default client headers. */
  headers?: HeadersInit;
}

export type FetchClient<T extends RouteDefMap<T>> = {
  [K in keyof T]: (
    args: InferRequest<T[K]>,
    requestOptions?: FetchClientRequestOptions,
  ) => Promise<InferResponse<T[K]>>;
};

export function createFetchClient<T extends Contract<RouteDefMap<T>, StandardSchemaV1 | undefined>>(
  contract: T,
  options: CreateFetchClientOptions,
): FetchClient<T> {
  const globalHeadersSchema = contract[contractHeadersSymbol];

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- populating a mapped type via a dynamic-key loop is unprovable to TS ahead of time
  const client = {} as FetchClient<T>;

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- Object.keys widens to string[] for generic T; contract's own keys are known to be keyof T
  for (const key of Object.keys(contract) as (keyof T & string)[]) {
    client[key] = createRouteFn(contract[key]);
  }

  return client;

  function createRouteFn(route: RouteDef) {
    return async (args: Partial<Record<RequestField, unknown>>, requestOptions?: FetchClientRequestOptions) => {
      const request: RequestInit = { method: route.method };

      const requestHeaders = new Headers(options.headers);

      const globalHeaders = await validateOptionalSchema(globalHeadersSchema, args.headers, route, 'headers');
      assertRequestFieldIsRecordObjectOrUndefined(globalHeaders, route, 'headers');
      if (globalHeaders) {
        for (const [headerKey, value] of Object.entries(globalHeaders)) {
          requestHeaders.set(headerKey, String(value));
        }
      }

      const routeHeaders = await validateOptionalRequestField(route, 'headers', args.headers);
      assertRequestFieldIsRecordObjectOrUndefined(routeHeaders, route, 'headers');
      if (routeHeaders) {
        for (const [headerKey, value] of Object.entries(routeHeaders)) {
          requestHeaders.set(headerKey, String(value));
        }
      }

      if (requestOptions?.headers !== undefined) {
        for (const [headerKey, value] of new Headers(requestOptions.headers)) {
          requestHeaders.set(headerKey, value);
        }
      }

      request.headers = requestHeaders;
      if (requestOptions?.signal !== undefined) {
        request.signal = requestOptions.signal;
      }

      const body = await validateOptionalRequestField(route, 'body', args.body);
      if (body !== undefined) {
        requestHeaders.set('content-type', 'application/json');
        request.body = JSON.stringify(body);
      }

      const pathParams = await validateOptionalRequestField(route, 'pathParams', args.pathParams);
      assertRequestFieldIsRecordObjectOrUndefined(pathParams, route, 'pathParams');

      const query = await validateOptionalRequestField(route, 'query', args.query);
      assertRequestFieldIsRecordObjectOrUndefined(query, route, 'query');

      const url = buildUrl(options.baseUrl, route.path, pathParams, query);
      const res = await fetch(url, request);

      const parsedBody = await parseResponseBody(res);

      const responseSchema = route.responses[res.status];
      if (responseSchema) {
        const result = await validateAgainstStandardSchema(responseSchema, parsedBody);
        if (!result.success) {
          throw new ResponseValidationError({
            issues: result.issues,
            method: route.method,
            path: route.path,
            status: res.status,
          });
        }

        return { status: res.status, body: result.value };
      }

      throw new UnexpectedStatusError({
        method: route.method,
        path: route.path,
        status: res.status,
      });
    };
  }
}

function assertIsRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertRequestFieldIsRecordObjectOrUndefined(
  value: unknown,
  route: RouteDef,
  field: RequestField,
): asserts value is Record<string, unknown> | undefined {
  if (value !== undefined && !assertIsRecordObject(value)) {
    throw new InvalidRequestFieldTypeError({ method: route.method, path: route.path, requestField: field });
  }
}

export async function validateAgainstStandardSchema<T extends StandardSchemaV1>(
  schema: T,
  data: unknown,
): Promise<
  | { success: true; value: StandardSchemaV1.InferOutput<T> }
  | { success: false; issues: readonly StandardSchemaV1.Issue[] }
> {
  const result = await schema['~standard'].validate(data);
  if (result.issues) {
    return { success: false, issues: result.issues };
  }

  return { success: true, value: result.value };
}

export async function validateOptionalSchema(
  schema: StandardSchemaV1 | undefined,
  value: unknown,
  route: RouteDef,
  field: RequestField,
) {
  if (schema === undefined) {
    return undefined;
  }

  const result = await validateAgainstStandardSchema(schema, value);
  if (result.success) {
    return result.value;
  }

  throw new RequestValidationError({
    issues: result.issues,
    method: route.method,
    path: route.path,
    requestField: field,
  });
}

export async function validateOptionalRequestField(route: RouteDef, field: RequestField, value: unknown) {
  return await validateOptionalSchema(route[field], value, route, field);
}

export function buildUrl(
  baseUrl: string,
  path: string,
  pathParams: Record<string, unknown> | undefined,
  query: Record<string, unknown> | undefined,
): string {
  const substitutedPath = path.replaceAll(/:(?<token>[^/?]+)/g, (_match, token: string) => {
    if (!pathParams || !(token in pathParams)) {
      throw new MissingPathParamError({ path, token });
    }

    return encodeURIComponent(String(pathParams[token]));
  });

  const url = new URL(substitutedPath, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, stringifyQueryValue(item));
        }
      } else {
        url.searchParams.append(key, stringifyQueryValue(value));
      }
    }
  }

  return url.toString();
}

function stringifyQueryValue(value: unknown): string {
  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
}

async function parseResponseBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get('content-type');

  if (contentType?.includes('application/') && contentType?.includes('json')) {
    return await res.json();
  } else if (contentType?.includes('text/')) {
    return await res.text();
  }

  return await res.blob();
}
