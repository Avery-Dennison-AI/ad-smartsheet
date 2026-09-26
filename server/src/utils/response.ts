import type { Response } from 'express';

/**
 * Sends a standardised success response.
 */
export function sendSuccess(res: Response, data: unknown, statusCode = 200): void {
  res.status(statusCode).json({ success: true, data });
}

/**
 * Standard error shape used by the global error handler.
 * { success: false, error: { message: string } }
 */
export interface ErrorResponse {
  success: false;
  error: { message: string };
}
