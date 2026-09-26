import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import type { Request, Response, NextFunction } from 'express';
import { login, logout, me } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Rate limiter for login: 5 attempts per 15 minutes, keyed on IP + email
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req: Request) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const email = (req.body?.email as string) || '';
    return `${ip}:${email.toLowerCase()}`;
  },
  handler: (_req: Request, res: Response) => {
    res.status(429).json({ message: 'Too many login attempts. Please try again later.' });
  },
});

// Input validation middleware
const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
  (req: Request, res: Response, next: NextFunction): void => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ message: errors.array()[0].msg });
      return;
    }
    next();
  },
];

router.post('/login', loginLimiter, validateLogin, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
