import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { apiRateLimit, authRateLimit } from '../middleware/security.middleware';
import { container } from '../core/container';

const router = Router();

// Get auth controller from container
const getAuthController = () => container.resolve<AuthController>('AuthController');

// Public authentication routes (with rate limiting)
router.post('/login',
  authRateLimit, // Stricter rate limiting for auth endpoints
  (req, res, next) => getAuthController().login(req, res, next)
);

router.post('/register',
  authRateLimit,
  (req, res, next) => getAuthController().register(req, res, next)
);

router.post('/logout',
  apiRateLimit,
  (req, res, next) => getAuthController().logout(req, res, next)
);

router.post('/password-reset/request',
  authRateLimit,
  (req, res, next) => getAuthController().requestPasswordReset(req, res, next)
);

router.post('/password-reset/confirm',
  authRateLimit,
  (req, res, next) => getAuthController().resetPassword(req, res, next)
);

// Session validation (public, used by frontend to check auth state)
router.get('/validate',
  apiRateLimit,
  (req, res, next) => getAuthController().validateSession(req, res, next)
);

// Protected routes (require authentication)
router.get('/me',
  apiRateLimit,
  requireAuth,
  (req, res, next) => getAuthController().me(req, res, next)
);

router.post('/logout-all',
  apiRateLimit,
  requireAuth,
  (req, res, next) => getAuthController().logoutAll(req, res, next)
);

router.post('/password-change',
  authRateLimit,
  requireAuth,
  (req, res, next) => getAuthController().changePassword(req, res, next)
);

// Admin/maintenance routes (TODO: add admin middleware when role system is implemented)
router.post('/cleanup',
  apiRateLimit,
  requireAuth, // TODO: Replace with admin middleware
  (req, res, next) => getAuthController().cleanup(req, res, next)
);

export { router as authRoutes };