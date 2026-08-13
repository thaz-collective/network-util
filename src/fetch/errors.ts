import type { StandardSchemaV1 } from './standard-schema';
import type { Method, RequestField } from './types';

export interface StandardSchemaValidationErrorProps {
  readonly issues: readonly StandardSchemaV1.Issue[];
}

/**
 * Thrown when data fails standard-schema validation.
 */
export class StandardSchemaValidationError extends Error implements StandardSchemaValidationErrorProps {
  readonly issues: readonly StandardSchemaV1.Issue[];

  constructor(props: StandardSchemaValidationErrorProps) {
    super();
    this.name = 'StandardSchemaValidationError';
    this.issues = props.issues;
  }

  /**
   * Returns `true` if `error` is a `StandardSchemaValidationError` instance.
   *
   * @param error The value to test.
   * @returns A type predicate narrowing `error` to `StandardSchemaValidationError`.
   */
  public static isStandardSchemaValidationError(error: unknown): error is StandardSchemaValidationError {
    return error instanceof StandardSchemaValidationError;
  }
}

export interface BaseValidationErrorProps {
  readonly method: Method;
  readonly path: string;
}

export interface RequestValidationErrorProps extends BaseValidationErrorProps {
  readonly requestField: RequestField;
}

/**
 * Thrown when a request's path params, query params, headers, or request body
 * fails standard-schema validation before the request is sent.
 */
export class RequestValidationError extends StandardSchemaValidationError implements BaseValidationErrorProps {
  readonly method: Method;
  readonly path: string;
  readonly requestField: RequestField;

  constructor(props: RequestValidationErrorProps & StandardSchemaValidationErrorProps) {
    super(props);
    this.name = 'RequestValidationError';
    this.method = props.method;
    this.path = props.path;
    this.requestField = props.requestField;
  }

  /**
   * Returns `true` if `error` is a `RequestValidationError` instance.
   *
   * @param error The value to test.
   * @returns A type predicate narrowing `error` to `RequestValidationError`.
   */
  public static isRequestValidationError(error: unknown): error is RequestValidationError {
    return error instanceof RequestValidationError;
  }
}

export interface ResponseValidationErrorProps extends BaseValidationErrorProps {
  readonly status: number;
}

/**
 * Thrown when a response body fails standard-schema validation against the schema declared for
 * its status code.
 */
export class ResponseValidationError extends StandardSchemaValidationError implements ResponseValidationErrorProps {
  readonly method: Method;
  readonly path: string;
  readonly status: number;

  constructor(props: ResponseValidationErrorProps & StandardSchemaValidationErrorProps) {
    super(props);
    this.name = 'ResponseValidationError';
    this.method = props.method;
    this.path = props.path;
    this.status = props.status;
  }

  /**
   * Returns `true` if `error` is a `ResponseValidationError` instance.
   *
   * @param error The value to test.
   * @returns A type predicate narrowing `error` to `ResponseValidationError`.
   */
  public static isResponseValidationError(error: unknown): error is ResponseValidationError {
    return error instanceof ResponseValidationError;
  }
}

export interface UnexpectedStatusErrorProps extends BaseValidationErrorProps {
  readonly status: number;
}

/**
 * Thrown when a response's status code has no matching entry in the contract's `responses` map.
 */
export class UnexpectedStatusError extends Error implements UnexpectedStatusErrorProps {
  readonly method: Method;
  readonly path: string;
  readonly status: number;

  constructor(props: UnexpectedStatusErrorProps) {
    super();
    this.name = 'UnexpectedStatusError';
    this.method = props.method;
    this.path = props.path;
    this.status = props.status;
  }

  /**
   * Returns `true` if `error` is a `UnexpectedStatusError` instance.
   *
   * @param error The value to test.
   * @returns A type predicate narrowing `error` to `UnexpectedStatusError`.
   */
  public static isUnexpectedStatusError(error: unknown): error is UnexpectedStatusError {
    return error instanceof UnexpectedStatusError;
  }
}
