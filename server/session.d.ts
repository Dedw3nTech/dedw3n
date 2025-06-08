import 'express-session';

declare module 'express-session' {
  interface SessionData {
    passport?: {
      user?: number;
    };
    userId?: number;
    isAuthenticated?: boolean;
  }
}