import type { StandardSchemaV1 } from './standard-schema';
import type { InferRequest, InferResponse, RouteDef, RequestField, ContractHeaders } from './types';
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
  headers?: HeadersInit | (() => HeadersInit);
}

type RouteDefMap<T> = { [K in keyof T as K extends string ? K : never]: RouteDef };

export type FetchClient<T extends RouteDefMap<T>> = {
  [K in keyof T]: (args: InferRequest<T[K]>) => Promise<InferResponse<T[K]>>;
};

export function createFetchClient<T extends RouteDefMap<T>>(
  contract: T,
  options: CreateFetchClientOptions,
): FetchClient<T> {
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- built up incrementally below
  const client = {} as unknown as FetchClient<T>;
  const globalHeadersSchema = (contract as ContractHeaders)[contractHeadersSymbol];

  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- generic-to-concrete boundary
  for (const [key, route] of Object.entries(contract) as [keyof T, RouteDef][]) {
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- generic-to-concrete boundary
    client[key] = createRouteFn(route);
  }

  return client;

  function createRouteFn(route: RouteDef) {
    return async (args: Partial<Record<RequestField, unknown>>) => {
      const request: RequestInit = { method: route.method };
      const requestHeaders = initializeHeaders(options.headers);

      const pathParams = await validateOptionalRequestField(route, 'pathParams', args.pathParams);
      assertRequestFieldIsRecord(pathParams, route, 'pathParams');
      const query = await validateOptionalRequestField(route, 'query', args.query);
      assertRequestFieldIsRecord(query, route, 'query');
      const globalHeaders = await validateOptionalSchema(globalHeadersSchema, args.headers, route, 'headers');
      assertRequestFieldIsRecord(globalHeaders, route, 'headers');
      const routeHeaders = await validateOptionalRequestField(route, 'headers', args.headers);
      assertRequestFieldIsRecord(routeHeaders, route, 'headers');
      let headers: Record<string, unknown> | undefined;
      if (globalHeaders || routeHeaders) {
        headers = { ...globalHeaders, ...routeHeaders };
      }
      const body = await validateOptionalRequestField(route, 'body', args.body);

      const url = buildUrl(options.baseUrl, route.path, pathParams, query);

      if (headers) {
        for (const [headerKey, value] of Object.entries(headers)) {
          requestHeaders.set(headerKey, String(value));
        }
      }

      if (body !== undefined && route.method !== 'GET' && route.method !== 'HEAD') {
        requestHeaders.set('content-type', 'application/json');
        request.body = JSON.stringify(body);
      }

      request.headers = requestHeaders;

      const res = await fetch(url, request);

      const contentType = res.headers.get('content-type') ?? '';
      const parsedBody = await parseResponseBody(res, contentType);

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

// TODO: Check if this is correct
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function assertRequestFieldIsRecord(
  value: unknown,
  route: RouteDef,
  field: RequestField,
): asserts value is Record<string, unknown> | undefined {
  if (value !== undefined && !isPlainObject(value)) {
    throw new InvalidRequestFieldTypeError({ method: route.method, path: route.path, requestField: field });
  }
}

function initializeHeaders(optionsHeaders: CreateFetchClientOptions['headers']) {
  if (typeof optionsHeaders === 'function') {
    return new Headers(optionsHeaders());
  }

  return new Headers(optionsHeaders);
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

export async function validateOptionalRequestField(route: RouteDef, field: RequestField, value: unknown) {
  return await validateOptionalSchema(route[field], value, route, field);
}

async function validateOptionalSchema(
  schema: StandardSchemaV1 | undefined,
  value: unknown,
  route: RouteDef,
  field: RequestField,
) {
  if (!schema) {
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

async function parseResponseBody(res: Response, contentType: string): Promise<unknown> {
  if (contentType.includes('application/') && contentType.includes('json')) {
    return await res.json();
  } else if (contentType.includes('text/')) {
    return await res.text();
  }

  return await res.blob();
}
