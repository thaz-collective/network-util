import type * as v from 'valibot';

import type { response } from '#src/valibot/response-message/response';

/** Constructor options for `NetworkError`. */
export interface NetworkErrorProps {
  readonly statusCode: number;
}

/**
 * Thrown when a network response status code does not match the expected success code.
 *
 * Provides typed convenience getters for the most common HTTP status ranges and codes
 * so call sites can branch on status semantics without comparing raw numbers.
 */
export class NetworkError extends Error {
  readonly statusCode: NetworkErrorProps['statusCode'];

  constructor(data: Readonly<NetworkErrorProps>) {
    super();
    this.name = 'NetworkError';
    this.statusCode = data.statusCode;
  }

  /**
   * Returns `true` if `error` is a `NetworkError` instance.
   *
   * @param error The value to test.
   * @returns A type predicate narrowing `error` to `NetworkError`.
   */
  public static isNetworkError(error: unknown): error is NetworkError {
    return error instanceof NetworkError;
  }

  /** `true` when the status code is in the 1xx informational range. */
  get isInformationCode() {
    return this.statusCode >= 100 && this.statusCode < 200;
  }

  /** `true` when the status code is in the 2xx success range. */
  get isSuccessCode() {
    return this.statusCode >= 200 && this.statusCode < 300;
  }

  /** `true` when the status code is in the 3xx redirect range. */
  get isRedirectCode() {
    return this.statusCode >= 300 && this.statusCode < 400;
  }

  /** `true` when the status code is in the 4xx client-error range. */
  get isClientCode() {
    return this.statusCode >= 400 && this.statusCode < 500;
  }

  /** `true` when the status code is in the 5xx server-error range. */
  get isServerCode() {
    return this.statusCode >= 500 && this.statusCode < 600;
  }

  /** `true` when the status code is `200 OK`. */
  get isOk() {
    return this.statusCode === 200;
  }

  /** `true` when the status code is `201 Created`. */
  get isCreated() {
    return this.statusCode === 201;
  }

  /** `true` when the status code is `204 No Content`. */
  get isNoContent() {
    return this.statusCode === 204;
  }

  /** `true` when the status code is `400 Bad Request`. */
  get isBadRequest() {
    return this.statusCode === 400;
  }

  /** `true` when the status code is `401 Unauthorized`. */
  get isUnauthorized() {
    return this.statusCode === 401;
  }

  /** `true` when the status code is `403 Forbidden`. */
  get isForbidden() {
    return this.statusCode === 403;
  }

  /** `true` when the status code is `404 Not Found`. */
  get isNotFound() {
    return this.statusCode === 404;
  }

  /** `true` when the status code is `500 Internal Server Error`. */
  get isInternalServiceError() {
    return this.statusCode === 500;
  }

  /** `true` when the status code is `501 Not Implemented`. */
  get isNotImplemented() {
    return this.statusCode === 501;
  }

  /** `true` when the status code is `502 Bad Gateway`. */
  get isBadGateway() {
    return this.statusCode === 502;
  }

  /** `true` when the status code is `503 Service Unavailable`. */
  get isServiceUnavailable() {
    return this.statusCode === 503;
  }

  /** `true` when the status code is `504 Gateway Timeout`. */
  get isGatewayTimeout() {
    return this.statusCode === 504;
  }
}

/** Constructor options for `NetworkWithMessageListError`. */
export interface NetworkWithMessageListErrorProps {
  readonly messageList: v.InferOutput<typeof response>['message_list'];
}

/**
 * Extends `NetworkError` with the parsed `message_list` from the response body.
 *
 * Thrown instead of the base `NetworkError` when the response includes a valid
 * JSON envelope that can be parsed against the `response` schema, allowing call
 * sites to surface server-provided error messages to the user.
 */
export class NetworkWithMessageListError extends NetworkError implements NetworkWithMessageListErrorProps {
  readonly messageList: NetworkWithMessageListErrorProps['messageList'];

  constructor(data: Readonly<NetworkErrorProps> & Readonly<NetworkWithMessageListErrorProps>) {
    super(data);
    this.name = 'NetworkWithMessageListError';
    this.messageList = data.messageList;
  }

  /**
   * Returns `true` if `error` is a `NetworkWithMessageListError` instance.
   *
   * @param error The value to test.
   * @returns A type predicate narrowing `error` to `NetworkWithMessageListError`.
   */
  public static isNetworkWithMessageListError(error: unknown): error is NetworkWithMessageListError {
    return error instanceof NetworkWithMessageListError;
  }
}
