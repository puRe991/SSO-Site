import type { ApiResponse } from '@/types';

const JSON_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  // Public content may be cached briefly at the edge; errors never are.
  'cache-control': 'public, max-age=30, s-maxage=60',
};

export function ok<T>(data: T, init: ResponseInit = {}): Response {
  const body: ApiResponse<T> = { ok: true, data };
  return new Response(JSON.stringify(body), {
    status: 200,
    ...init,
    headers: { ...JSON_HEADERS, ...(init.headers ?? {}) },
  });
}

export function fail(
  code: string,
  message: string,
  status = 400,
  fields?: Record<string, string>,
): Response {
  const body: ApiResponse<never> = { ok: false, error: { code, message, fields } };
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...JSON_HEADERS, 'cache-control': 'no-store' },
  });
}

export const notFound = () => fail('not_found', 'Resource not found.', 404);
export const methodNotAllowed = () => fail('method_not_allowed', 'Method not allowed.', 405);
export const unauthorized = () => fail('unauthorized', 'Authentication required.', 401);
export const forbidden = () => fail('forbidden', 'Insufficient permissions.', 403);
export const serverError = () => fail('server_error', 'Unexpected error.', 500);

/** Wraps a handler so an unexpected throw never leaks a stack trace. */
export async function guard(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    console.error('[api]', error);
    return serverError();
  }
}
