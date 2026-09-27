import type { Response } from 'express';
import { env } from './env';

/** The name used for the auth cookie across all routes. */
export const COOKIE_NAME = 'token';

/** Base options shared by login and logout cookies. */
export const cookieBaseOptions = {
  path: '/',
  httpOnly: true as const,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
};

/** Cookie options for setting the auth token on login (1-day TTL). */
export const cookieLoginOptions = {
  ...cookieBaseOptions,
  maxAge: 24 * 60 * 60 * 1000,
};

/** Cookie options for clearing the auth token on logout (no maxAge → removes cookie). */
export const cookieLogoutOptions = {
  ...cookieBaseOptions,
};

/** Sets the session cookie on the response with the given JWT token. */
export function setSessionCookie(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, cookieLoginOptions);
}
