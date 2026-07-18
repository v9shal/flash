import 'express';

// Augment Express's Request type so `req.user` is known everywhere after the
// authenticate middleware runs. Without this, TypeScript would error on req.user.
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

export {};
