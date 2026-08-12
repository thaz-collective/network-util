import type { RouteDef } from './dsl';
import type { InferRequest, InferResponse } from './infer-types';
import { RequestValidationError, ResponseValidationError, UnexpectedStatusError } from './errors';
import { validateAgainstStandardSchema } from './standard-schema-utils';
import { buildUrl } from './url';

export interface CreateFetchClientOptions {
  baseUrl: string;
  headers?: HeadersInit | (() => HeadersInit);
}

type RequestField = 'pathParams' | 'query' | 'headers' | 'body';

type FetchClient<T extends Record<string, RouteDef>> = {
  [K in keyof T]: (args: InferRequest<T[K]>) => Promise<InferResponse<T[K]>>;
};

export function createFetchClient<T extends Record<string, RouteDef>>(
  contract: T,
  options: CreateFetchClientOptions,
): FetchClient<T> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- built up incrementally below
  const client = {} as unknown as FetchClient<T>;

  for (const [key, route] of Object.entries(contract) as [keyof T, RouteDef][]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- generic-to-concrete boundary
    client[key] = createRouteFn(route);
  }

  return client;

  function createRouteFn(route: RouteDef) {
    return async (args: Partial<Record<RequestField, unknown>>) => {
      const pathParams = await validateOptionalField(route, 'pathParams', args.pathParams);
      const query = await validateOptionalField(route, 'query', args.query);
      const headers = await validateOptionalField(route, 'headers', args.headers);
      const body = await validateOptionalField(route, 'body', args.body);

      const url = buildUrl(
        options.baseUrl,
        route.path,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- validated by standard-schema above
        pathParams as Record<string, unknown> | undefined,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- validated by standard-schema above
        query as Record<string, unknown> | undefined,
      );

      const mergedHeaders = buildHeaders(options.headers);
      if (headers) {
        for (const [headerKey, value] of Object.entries(headers)) {
          mergedHeaders.set(headerKey, String(value));
        }
      }

      const init: RequestInit = { method: route.method, headers: mergedHeaders };
      if (body !== undefined && route.method !== 'GET' && route.method !== 'HEAD') {
        mergedHeaders.set('content-type', 'application/json');
        init.body = JSON.stringify(body);
      }

      const res = await fetch(url, init);

      const contentType = res.headers.get('content-type') ?? '';
      const parsedBody = await parseResponseBody(res, contentType);

      const responseSchema = route.responses[res.status];
      if (!responseSchema) {
        throw new UnexpectedStatusError({
          method: route.method,
          path: route.path,
          status: res.status,
          body: parsedBody,
        });
      }

      const result = await validateAgainstStandardSchema(responseSchema, parsedBody);
      if (!result.success) {
        throw new ResponseValidationError(result.issues, {
          method: route.method,
          path: route.path,
          status: res.status,
        });
      }

      return { status: res.status, body: result.value };
    };
  }
}

function buildHeaders(optionsHeaders: CreateFetchClientOptions['headers']): Headers {
  if (typeof optionsHeaders === 'function') {
    return new Headers(optionsHeaders());
  }
  return new Headers(optionsHeaders);
}

async function parseResponseBody(res: Response, contentType: string): Promise<unknown> {
  if (contentType.includes('json')) {
    return await res.json();
  }
  if (contentType.startsWith('text/')) {
    return await res.text();
  }
  return await res.blob();
}

async function validateOptionalField(route: RouteDef, field: RequestField, value: unknown) {
  const schema = route[field];
  if (!schema) {
    return undefined;
  }
  const result = await validateAgainstStandardSchema(schema, value);
  if (!result.success) {
    throw new RequestValidationError(result.issues, { method: route.method, path: route.path, field });
  }
  return result.value;
}
