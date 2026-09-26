import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../utils/AppError';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if ('statusCode' in err && typeof (err as { statusCode?: number }).statusCode === 'number') {
    // Handle express-rate-limit and other errors with statusCode property
    const code = (err as { statusCode: number }).statusCode;
    if (code >= 400 && code < 600) {
      statusCode = code;
      message = err.message || message;
    }
  }

  console.error(`[ERROR] ${statusCode} — ${message}`);

  res.status(statusCode).json({
    success: false,
    error: { message },
  });
}
