import * as v from 'valibot';

import { response } from '#src/valibot/response-message/response';

import { NetworkWithMessageListError } from './errors';

/**
 * Guards against server-returned ERROR messages embedded in an otherwise successful response.
 *
 * Parses the response body against the `response` schema when the `Content-Type` is JSON. If any
 * message in `message_list` has type `ERROR`, throws a `NetworkWithMessageListError` so the caller
 * can surface the server-provided error details. Call this after `refineNetworkError`.
 *
 * @param body The parsed response body.
 * @param statusCode The HTTP status code of the response.
 * @param headers The response `Headers` object — used to check `Content-Type`.
 */
export function checkResponseMessageForError(body: unknown, statusCode: number, headers: Headers) {
  const contentTypeHeader = headers.get('content-type');

  if (contentTypeHeader?.includes('application/') && contentTypeHeader?.includes('json')) {
    const messageList = v.safeParse(response, body);

    if (messageList.success) {
      for (const message of messageList.output.message_list) {
        if (message.type === 'ERROR') {
          throw new NetworkWithMessageListError({
            statusCode,
            messageList: messageList.output.message_list,
          });
        }
      }
    }
  }
}
