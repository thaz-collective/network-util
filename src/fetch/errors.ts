import type { StandardSchemaV1 } from './standard-schema';
import type { Method, RequestField } from './types';

/** Constructor options for `StandardSchemaValidationError`. */
export interface StandardSchemaValidationErrorProps {
  readonly issues: readonly StandardSchemaV1.Issue[];
}

/**
 * Thrown when data fails standard-schema validation.
 */
export class StandardSchemaValidationError extends Error implements StandardSchemaValidationErrorProps {
  readonly issues: readonly StandardSchemaV1.Issue[];

  constructor(data: Readonly<StandardSchemaValidationErrorProps>) {
    super();
    this.name = 'StandardSchemaValidationError';
    this.issues = data.issues;
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

/** Shared route-context fields common to this module's error constructor options. */
export interface BaseValidationErrorProps {
  readonly method: Method;
  readonly path: string;
}

/** Constructor options for `RequestValidationError`. */
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

  constructor(data: Readonly<RequestValidationErrorProps> & Readonly<StandardSchemaValidationErrorProps>) {
    super(data);
    this.name = 'RequestValidationError';
    this.method = data.method;
    this.path = data.path;
    this.requestField = data.requestField;
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

/** Constructor options for `ResponseValidationError`. */
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

  constructor(data: Readonly<ResponseValidationErrorProps> & Readonly<StandardSchemaValidationErrorProps>) {
    super(data);
    this.name = 'ResponseValidationError';
    this.method = data.method;
    this.path = data.path;
    this.status = data.status;
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

/** Constructor options for `ContractPathParamsError`. */
export interface ContractPathParamsErrorProps extends BaseValidationErrorProps {
  readonly tokens: readonly string[];
}

/**
 * Thrown by `defineContract` when a route's `path` declares one or more `:token`s but the route
 * has no `pathParams` schema to validate them against.
 */
export class ContractPathParamsError extends Error implements ContractPathParamsErrorProps {
  readonly method: Method;
  readonly path: string;
  readonly tokens: readonly string[];

  constructor(data: Readonly<ContractPathParamsErrorProps>) {
    super(
      `Route "${data.method} ${data.path}" declares path token(s) ${data.tokens.join(', ')} but has no "pathParams" schema.`,
    );
    this.name = 'ContractPathParamsError';
    this.method = data.method;
    this.path = data.path;
    this.tokens = data.tokens;
  }

  /**
   * Returns `true` if `error` is a `ContractPathParamsError` instance.
   *
   * @param error The value to test.
   * @returns A type predicate narrowing `error` to `ContractPathParamsError`.
   */
  public static isContractPathParamsError(error: unknown): error is ContractPathParamsError {
    return error instanceof ContractPathParamsError;
  }
}

/** Constructor options for `ContractResponseStatusError`. */
export interface ContractResponseStatusErrorProps extends BaseValidationErrorProps {
  readonly status: string;
}

/**
 * Thrown by `defineContract` when a route's `responses` map has a key that isn't a valid numeric
 * status code (e.g. `'200'` written as a non-numeric-looking string, or containing whitespace).
 */
export class ContractResponseStatusError extends Error implements ContractResponseStatusErrorProps {
  readonly method: Method;
  readonly path: string;
  readonly status: string;

  constructor(data: Readonly<ContractResponseStatusErrorProps>) {
    super(`Route "${data.method} ${data.path}" declares a non-numeric response status "${data.status}".`);
    this.name = 'ContractResponseStatusError';
    this.method = data.method;
    this.path = data.path;
    this.status = data.status;
  }

  /**
   * Returns `true` if `error` is a `ContractResponseStatusError` instance.
   *
   * @param error The value to test.
   * @returns A type predicate narrowing `error` to `ContractResponseStatusError`.
   */
  public static isContractResponseStatusError(error: unknown): error is ContractResponseStatusError {
    return error instanceof ContractResponseStatusError;
  }
}

/** Constructor options for `MissingPathParamError`. */
export interface MissingPathParamErrorProps {
  readonly path: string;
  readonly token: string;
}

/**
 * Thrown when building a request URL and a `:token` in the route's `path` has no corresponding
 * key in the validated `pathParams` object.
 */
export class MissingPathParamError extends Error implements MissingPathParamErrorProps {
  readonly path: string;
  readonly token: string;

  constructor(data: Readonly<MissingPathParamErrorProps>) {
    super(`Missing path param "${data.token}" for path "${data.path}"`);
    this.name = 'MissingPathParamError';
    this.path = data.path;
    this.token = data.token;
  }

  /**
   * Returns `true` if `error` is a `MissingPathParamError` instance.
   *
   * @param error The value to test.
   * @returns A type predicate narrowing `error` to `MissingPathParamError`.
   */
  public static isMissingPathParamError(error: unknown): error is MissingPathParamError {
    return error instanceof MissingPathParamError;
  }
}

/** Constructor options for `InvalidRequestFieldTypeError`. */
export interface InvalidRequestFieldTypeErrorProps extends BaseValidationErrorProps {
  readonly requestField: RequestField;
}

/**
 * Thrown when a route's `pathParams`, `query`, or `headers` schema validates successfully but
 * produces a value that isn't a plain object, so it cannot be used to build the request.
 */
export class InvalidRequestFieldTypeError extends Error implements InvalidRequestFieldTypeErrorProps {
  readonly method: Method;
  readonly path: string;
  readonly requestField: RequestField;

  constructor(data: Readonly<InvalidRequestFieldTypeErrorProps>) {
    super(
      `Validated "${data.requestField}" for route "${data.method} ${data.path}" must be a plain object or undefined.`,
    );
    this.name = 'InvalidRequestFieldTypeError';
    this.method = data.method;
    this.path = data.path;
    this.requestField = data.requestField;
  }

  /**
   * Returns `true` if `error` is a `InvalidRequestFieldTypeError` instance.
   *
   * @param error The value to test.
   * @returns A type predicate narrowing `error` to `InvalidRequestFieldTypeError`.
   */
  public static isInvalidRequestFieldTypeError(error: unknown): error is InvalidRequestFieldTypeError {
    return error instanceof InvalidRequestFieldTypeError;
  }
}

/** Constructor options for `UnexpectedStatusError`. */
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

  constructor(data: Readonly<UnexpectedStatusErrorProps>) {
    super();
    this.name = 'UnexpectedStatusError';
    this.method = data.method;
    this.path = data.path;
    this.status = data.status;
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
