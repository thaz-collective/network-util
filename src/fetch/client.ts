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

/** Client-wide options for `createFetchClient`. */
export interface CreateFetchClientOptions {
  /** Prefixed onto every route's `path` when building the request URL. */
  baseUrl: string;

  /**
   * The initial set of headers applied to every call made through the client. Overridden by any
   * headers derived from the contract's global/route schemas, which are in turn overridden by a
   * per-call `FetchClientRequestOptions.headers`.
   */
  headers?: HeadersInit;
}

/** Per-call options accepted as the second argument to every route function on a `FetchClient`. */
export interface FetchClientRequestOptions {
  /** Forwarded to the underlying `fetch` call, allowing the request to be canceled. */
  signal?: AbortSignal;
  /** Merged in last, overriding any headers derived from the contract's schemas or default client headers. */
  headers?: HeadersInit;
}

/**
 * The client object returned by `createFetchClient`: one async function per route in the contract,
 * typed from that route's schemas via `InferRequest`/`InferResponse`.
 */
export type FetchClient<T extends RouteDefMap<T>> = {
  [K in keyof T]: (
    args: InferRequest<T[K]>,
    requestOptions?: FetchClientRequestOptions,
  ) => Promise<InferResponse<T[K]>>;
};

/**
 * Builds a typed `FetchClient` from a contract returned by `defineContract`. Each route becomes an
 * async function that validates its request parts, sends the request, and validates the response
 * body against the schema declared for the returned status code — throwing `RequestValidationError`,
 * `ResponseValidationError`, or `UnexpectedStatusError` as appropriate.
 *
 * @param contract The contract (from `defineContract`) to build a client for.
 * @param options Client-wide settings: `baseUrl` and default headers.
 * @returns A `FetchClient` with one method per route in `contract`.
 */
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
        if (result.success) {
          return { status: res.status, body: result.value };
        }

        throw new ResponseValidationError({
          issues: result.issues,
          method: route.method,
          path: route.path,
          status: res.status,
        });
      }

      throw new UnexpectedStatusError({
        method: route.method,
        path: route.path,
        status: res.status,
      });
    };
  }
}

export function assertIsRecordObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function assertRequestFieldIsRecordObjectOrUndefined(
  value: unknown,
  route: RouteDef,
  field: RequestField,
): asserts value is Record<string, unknown> | undefined {
  if (value !== undefined && !assertIsRecordObject(value)) {
    throw new InvalidRequestFieldTypeError({ method: route.method, path: route.path, requestField: field });
  }
}

/**
 * Validates `data` against a standard-schema and returns a discriminated result instead of
 * throwing, so callers can decide how to handle failure.
 *
 * @param schema The standard-schema to validate against.
 * @param data The value to validate.
 * @returns `{ success: true; value }` on success, or `{ success: false; issues }` on failure.
 */
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

/**
 * Validates `value` against `schema` if given, throwing `RequestValidationError` on failure.
 * Returns `undefined` immediately, without validating, if `schema` is `undefined`.
 *
 * @param schema The standard-schema to validate against, or `undefined` to skip validation.
 * @param value The value to validate.
 * @param route The route the value belongs to — used for the thrown error's context.
 * @param field Which request part `value` is — used for the thrown error's context.
 * @returns The validated value, or `undefined` if `schema` was `undefined`.
 */
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

/**
 * Convenience wrapper over `validateOptionalSchema` that looks up the schema for `field` from
 * `route` itself, rather than requiring the caller to pass it separately.
 *
 * @param route The route whose `field` schema should be used.
 * @param field Which of the route's request parts to validate.
 * @param value The value to validate.
 * @returns The validated value, or `undefined` if the route declares no schema for `field`.
 */
export async function validateOptionalRequestField(route: RouteDef, field: RequestField, value: unknown) {
  return await validateOptionalSchema(route[field], value, route, field);
}

/**
 * Builds the final request URL: substitutes `:token` placeholders in `path` from `pathParams`
 * (URI-encoding each value, and throwing `MissingPathParamError` for any token with no matching
 * key or an `undefined` value), then appends `query` as query string params. `null`/`undefined`
 * query values — and `null`/`undefined` items within an array query value — are omitted entirely
 * rather than serialized.
 *
 * @param baseUrl Prefixed onto the substituted path.
 * @param path The route path, with optional `:token` placeholders.
 * @param pathParams Values for each `:token` placeholder in `path`.
 * @param query Query string params. Array values are appended as repeated keys.
 * @returns The final request URL as a string.
 */
export function buildUrl(
  baseUrl: string,
  path: string,
  pathParams: Record<string, unknown> | undefined,
  query: Record<string, unknown> | undefined,
): string {
  const substitutedPath = path.replaceAll(/:(?<token>[^/?]+)/g, (_match, token: string) => {
    if (!pathParams || pathParams[token] === undefined) {
      throw new MissingPathParamError({ path, token });
    }

    // oxlint-disable-next-line typescript/no-base-to-string -- pathParams values are validated by the route's schema; arbitrary objects are the caller's responsibility
    return encodeURIComponent(String(pathParams[token]));
  });

  const url = new URL(substitutedPath, baseUrl);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) {
        continue;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          if (item === undefined || item === null) {
            continue;
          }

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
