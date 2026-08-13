import { http, HttpResponse } from 'msw';

export const getPostHandler = {
  success: http.get('https://api.example.com/posts/:id', ({ params }) =>
    HttpResponse.json({ id: Number(params['id']), title: 'Hello world' }),
  ),
  invalidBody: http.get('https://api.example.com/posts/:id', () =>
    HttpResponse.json({ id: 'not-a-number', title: 42 }),
  ),
  unexpectedStatus: http.get('https://api.example.com/posts/:id', () =>
    HttpResponse.json({ message: 'teapot' }, { status: 418 }),
  ),
};

export const createPostHandler = {
  success: http.post('https://api.example.com/posts', () =>
    HttpResponse.json({ id: 1, title: 'created' }, { status: 201 }),
  ),
};

export const echoHeadersHandler = {
  success: http.get('https://api.example.com/echo-headers', ({ request }) =>
    HttpResponse.json({ headers: Object.fromEntries(request.headers.entries()) }),
  ),
};

export const downloadHandler = {
  success: http.get('https://api.example.com/download', () =>
    HttpResponse.arrayBuffer(new TextEncoder().encode('binary-content').buffer, {
      headers: { 'content-type': 'application/octet-stream' },
    }),
  ),
  invalidBody: http.get('https://api.example.com/download', () => HttpResponse.json({ notA: 'blob' })),
  noContentType: http.get(
    'https://api.example.com/download',
    () => new HttpResponse(new TextEncoder().encode('binary-content').buffer),
  ),
};

export const textHandler = {
  success: http.get('https://api.example.com/text', () => HttpResponse.text('plain-text-content')),
};

export const echoQueryHandler = {
  success: http.get('https://api.example.com/echo-query', ({ request }) => {
    const url = new URL(request.url);
    return HttpResponse.json({ search: url.search });
  }),
};

export const createItemHandler = {
  success: http.post('https://api.example.com/items', () =>
    HttpResponse.json({ id: 1, name: 'widget' }, { status: 200 }),
  ),
  businessError: http.post('https://api.example.com/items', () =>
    HttpResponse.json({ code: 'DUPLICATE_ITEM', message: 'An item with this name already exists.' }, { status: 400 }),
  ),
};

export const handlers = [
  getPostHandler.success,
  createPostHandler.success,
  echoHeadersHandler.success,
  downloadHandler.success,
  textHandler.success,
  echoQueryHandler.success,
  createItemHandler.success,
];
