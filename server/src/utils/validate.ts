import type { Request, Response, NextFunction } from 'express';
import { type ValidationChain, validationResult } from 'express-validator';
import { AppError } from './AppError';

/**
 * Middleware factory that runs express-validator rules and forwards
 * the first validation error to the global error handler as a 400 AppError.
 */
export function validate(rules: ValidationChain[]) {
  return [
    ...rules,
    (req: Request, _res: Response, next: NextFunction): void => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        const firstError = errors.array()[0];
        next(new AppError(firstError.msg, 400));
        return;
      }
      next();
    },
  ];
}
