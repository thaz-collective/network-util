import type * as v from 'valibot';

import type { response } from '#src/valibot/response-message/response';

import type { NetworkErrorProps } from './network-error';
import { NetworkError } from './network-error';

export interface NetworkWithMessageListErrorProps extends NetworkErrorProps {
  readonly messageList: v.InferOutput<typeof response>['message_list'];
}

/**
 * Extends `NetworkError` with the parsed `message_list` from the response body.
 *
 * Thrown instead of the base `NetworkError` when the response includes a valid
 * JSON envelope that can be parsed against the `response` schema, allowing call
 * sites to surface server-provided error messages to the user.
 */
export class NetworkWithMessageListError extends NetworkError {
  readonly messageList: NetworkWithMessageListErrorProps['messageList'];

  constructor(data: Readonly<NetworkWithMessageListErrorProps>) {
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
