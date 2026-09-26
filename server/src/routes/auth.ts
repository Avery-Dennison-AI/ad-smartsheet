import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import type { Request } from 'express';
import { body } from 'express-validator';
import { login, logout, me } from '../controllers/authController';
import { requireAuth } from '../middleware/authMiddleware';
import { validate } from '../utils/validate';

const router = Router();

// Rate limiter for login: 5 attempts per 15 minutes, keyed on IP + email
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req: Request) => {
    const ip = req.ip || 'unknown';
    const email = String(req.body?.email ?? '').trim().toLowerCase();
    return `${ip}_${email}`;
  },
  message: { success: false, error: { message: 'Too many login attempts. Please try again later.' } },
});

// Input validation rules for login
const loginValidation = validate([
  body('email').isEmail().withMessage('Please provide a valid email address'),
  body('password').notEmpty().withMessage('Password is required'),
]);

router.post('/login', loginLimiter, loginValidation, login);
router.post('/logout', logout);
router.get('/me', requireAuth, me);

export default router;
