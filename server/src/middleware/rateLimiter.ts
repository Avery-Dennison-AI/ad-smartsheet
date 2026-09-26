import rateLimit from 'express-rate-limit';

/**
 * Creates a rate limiter middleware with the given configuration.
 * Reusable across auth and invitation routes.
 */
export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message?: string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      error: { message: options.message || 'Too many requests. Please try again later.' },
    },
  });
}
