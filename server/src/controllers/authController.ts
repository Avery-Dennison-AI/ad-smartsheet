import type { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const COOKIE_OPTIONS = {
  httpOnly: true as const,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 86400000, // 1 day in ms
};

/** POST /api/auth/login */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body;

    // Find user with passwordHash included (overrides select: false)
    const user = await User.findOne({ email: email?.trim().toLowerCase() }).select('+passwordHash');

    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const secret = process.env.JWT_SECRET!;
    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email, role: user.role },
      secret,
      { expiresIn: '1d' },
    );

    res.cookie('token', token, COOKIE_OPTIONS);

    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    res.json({
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
}

/** POST /api/auth/logout */
export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ message: 'Logged out' });
}

/** GET /api/auth/me */
export async function me(req: Request, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.user!.id);
    if (!user || !user.isActive) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    res.json({
      user: {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
}
