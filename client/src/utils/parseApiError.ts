import axios from 'axios';

/**
 * Extracts a human-readable message and optional HTTP status from an unknown
 * caught error.  Handles three cases:
 *
 * 1. Axios error **with** a response → reads the server's `{ error: { message } }`
 *    shape, falling back to `data.message` then `err.message`.
 * 2. Axios error **without** a response (network failure) → generic network message.
 * 3. Anything else → generic unexpected-error message.
 *
 * The returned `message` is always a plain string — never an object.
 */
export function parseApiError(err: unknown): { message: string; status?: number } {
  if (axios.isAxiosError(err)) {
    if (err.response) {
      const status = err.response.status;
      const data = err.response.data as Record<string, unknown> | undefined;
      const nested = data?.error as Record<string, unknown> | undefined;
      const message =
        (typeof nested?.message === 'string' && nested.message) ||
        (typeof data?.message === 'string' && data.message) ||
        err.message ||
        'Request failed';
      return { message, status };
    }
    // Network failure — no response received
    return { message: 'Network error — check your connection and try again.' };
  }

  return { message: 'An unexpected error occurred.' };
}
