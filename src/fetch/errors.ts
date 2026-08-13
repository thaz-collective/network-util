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

  constructor(props: ContractPathParamsErrorProps) {
    super(
      `Route "${props.method} ${props.path}" declares path token(s) ${props.tokens.join(', ')} but has no "pathParams" schema.`,
    );
    this.name = 'ContractPathParamsError';
    this.method = props.method;
    this.path = props.path;
    this.tokens = props.tokens;
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

  constructor(props: ContractResponseStatusErrorProps) {
    super(`Route "${props.method} ${props.path}" declares a non-numeric response status "${props.status}".`);
    this.name = 'ContractResponseStatusError';
    this.method = props.method;
    this.path = props.path;
    this.status = props.status;
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

  constructor(props: MissingPathParamErrorProps) {
    super(`Missing path param "${props.token}" for path "${props.path}"`);
    this.name = 'MissingPathParamError';
    this.path = props.path;
    this.token = props.token;
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

  constructor(props: InvalidRequestFieldTypeErrorProps) {
    super(
      `Validated "${props.requestField}" for route "${props.method} ${props.path}" must be a plain object or undefined.`,
    );
    this.name = 'InvalidRequestFieldTypeError';
    this.method = props.method;
    this.path = props.path;
    this.requestField = props.requestField;
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
