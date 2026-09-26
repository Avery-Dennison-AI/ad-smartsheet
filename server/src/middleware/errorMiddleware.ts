import type { NextFunction, Request, Response } from 'express';

export interface HttpError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode && err.statusCode >= 400 ? err.statusCode : 500;
  console.error(`[ERROR] ${statusCode} — ${err.message}`);
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    statusCode,
  });
}
