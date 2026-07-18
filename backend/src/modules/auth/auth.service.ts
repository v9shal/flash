// The service holds the business logic. It is HTTP-free: it receives plain data
// (already validated by Zod in the route) and returns plain data. It never touches
// `req`/`res` and never runs SQL directly — it calls the repository for that.
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ConflictError, UnauthorizedError } from '../../utils/AppError.js';
import { env } from '../../config/env.js';
import { authRepository, type SafeUser } from './auth.repository.js';
import type { RegisterInput, LoginInput } from './auth.schema.js';

// bcrypt work factor. 12 is a good production default (slow enough to resist
// brute force, fast enough for a login request).
const BCRYPT_COST = 12;

// A precomputed hash of a throwaway password. When a login email doesn't exist,
// we still run bcrypt.compare against this so the response time is the same
// whether or not the email exists — this defeats user-enumeration timing attacks.
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing-safety', BCRYPT_COST);

interface TokenPayload {
  sub: string; // subject = user id (standard JWT claim)
  role: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  // ─── Register ──────────────────────────────────────────────────────────────
  register = async (input: RegisterInput): Promise<SafeUser> => {
    const existing = await authRepository.findByEmail(input.email);
    // Generic message — don't reveal which emails are registered.
    if (existing) throw new ConflictError('Email is already registered');

    const password_hash = await bcrypt.hash(input.password, BCRYPT_COST);

    return authRepository.create({
      full_name: input.full_name,
      email: input.email,
      phone: input.phone ?? null,
      password_hash,
    });
  };

  // ─── Login ───────────────────────────────────────────────────────────────
  login = async (
    input: LoginInput
  ): Promise<{ user: SafeUser; tokens: AuthTokens }> => {
    const user = await authRepository.findByEmail(input.email);

    // Always run a bcrypt compare (against a real or dummy hash) so timing is
    // constant. Use ONE generic error for both cases to prevent enumeration.
    const passwordOk = await bcrypt.compare(
      input.password,
      user?.password_hash ?? DUMMY_HASH
    );
    if (!user || !passwordOk) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const { password_hash, ...safeUser } = user;
    return { user: safeUser, tokens: this.issueTokens(user.id, user.role) };
  };

  // ─── Refresh ─────────────────────────────────────────────────────────────
  // Verifies a refresh token and issues a fresh pair (token rotation).
  refresh = (refreshToken: string): AuthTokens => {
    let payload: TokenPayload;
    try {
      payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET, {
        algorithms: ['HS256'], // pin the algorithm (prevents alg-confusion attacks)
      }) as TokenPayload;
    } catch {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
    return this.issueTokens(payload.sub, payload.role);
  };

  // ─── Token helpers ─────────────────────────────────────────────────────────
  private issueTokens(userId: string, role: string): AuthTokens {
    const payload: TokenPayload = { sub: userId, role };
    return {
      accessToken: jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        algorithm: 'HS256',
        expiresIn: env.JWT_ACCESS_TTL,
      } as jwt.SignOptions),
      refreshToken: jwt.sign(payload, env.JWT_REFRESH_SECRET, {
        algorithm: 'HS256',
        expiresIn: env.JWT_REFRESH_TTL,
      } as jwt.SignOptions),
    };
  }
}

export const authService = new AuthService();