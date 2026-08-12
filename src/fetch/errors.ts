import type { StandardSchemaV1 } from '#src/standard-schema';
import { NetworkStandardSchemaValidationError } from '#src/error/network-standard-schema-validation-error';

import type { Method } from './dsl';

/**
 * Thrown when a request's path params, query, headers, or body fail standard-schema validation
 * before the request is sent.
 */
export class RequestValidationError extends NetworkStandardSchemaValidationError {
  readonly method: Method;
  readonly path: string;
  readonly field: 'pathParams' | 'query' | 'headers' | 'body';

  constructor(
    issues: readonly StandardSchemaV1.Issue[],
    context: { method: Method; path: string; field: 'pathParams' | 'query' | 'headers' | 'body' },
  ) {
    super(issues);
    this.name = 'RequestValidationError';
    this.method = context.method;
    this.path = context.path;
    this.field = context.field;
  }
}

/**
 * Thrown when a response body fails standard-schema validation against the schema declared for
 * its status code.
 */
export class ResponseValidationError extends NetworkStandardSchemaValidationError {
  readonly method: Method;
  readonly path: string;
  readonly status: number;

  constructor(issues: readonly StandardSchemaV1.Issue[], context: { method: Method; path: string; status: number }) {
    super(issues);
    this.name = 'ResponseValidationError';
    this.method = context.method;
    this.path = context.path;
    this.status = context.status;
  }
}

/**
 * Thrown when a response's status code has no matching entry in the contract's `responses` map.
 */
export class UnexpectedStatusError extends Error {
  readonly method: Method;
  readonly path: string;
  readonly status: number;
  readonly body: unknown;

  constructor(context: { method: Method; path: string; status: number; body: unknown }) {
    super(`Unexpected status ${context.status} for ${context.method} ${context.path}`);
    this.name = 'UnexpectedStatusError';
    this.method = context.method;
    this.path = context.path;
    this.status = context.status;
    this.body = context.body;
  }
}
