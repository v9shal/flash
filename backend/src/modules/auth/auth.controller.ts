// The controller is the HTTP translator: it reads data out of the request,
// calls ONE service function, and shapes the response. No business logic, no SQL.
import type { CookieOptions } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { UnauthorizedError } from '../../utils/AppError.js';
import { env } from '../../config/env.js';
import { authService } from './auth.service.js';

const REFRESH_COOKIE = 'refreshToken';

// Secure cookie flags:
// - httpOnly: JS can't read it → protects against XSS token theft
// - secure: only sent over HTTPS (enabled in production)
// - sameSite 'strict': not sent on cross-site requests → CSRF protection
// - path: only sent to the refresh endpoint, limiting exposure
const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days, mirrors JWT_REFRESH_TTL
};

export class AuthController {
  register = asyncHandler(async (req, res) => {
    const user = await authService.register(req.body);
    res.status(201).json({ success: true, data: user });
  });

  login = asyncHandler(async (req, res) => {
    const { user, tokens } = await authService.login(req.body);
    // Refresh token lives in an httpOnly cookie; access token goes in the body
    // for the client to hold in memory and send as `Authorization: Bearer`.
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions);
    res.status(200).json({
      success: true,
      data: { user, accessToken: tokens.accessToken },
    });
  });

  refresh = asyncHandler(async (req, res) => {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedError('Missing refresh token');

    const tokens = authService.refresh(token);
    res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions);
    res.status(200).json({
      success: true,
      data: { accessToken: tokens.accessToken },
    });
  });

  logout = asyncHandler(async (_req, res) => {
    res.clearCookie(REFRESH_COOKIE, refreshCookieOptions);
    res.status(200).json({ success: true, message: 'Logged out' });
  });
}

export const authController = new AuthController();