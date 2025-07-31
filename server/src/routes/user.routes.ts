import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { requireAuth, optionalAuth } from '../middleware/auth.middleware';
import { validateBody, validateParams, validateQuery, idParamSchema, paginationSchema } from '../middleware/validation.middleware';
import { readOnlyRateLimit, apiRateLimit } from '../middleware/security.middleware';
import { container } from '../core/container';

const router = Router();

// Get user controller from container
const getUserController = () => container.resolve<UserController>('UserController');

// Public routes (with optional authentication)
router.get('/search', 
  readOnlyRateLimit,
  optionalAuth,
  (req, res, next) => getUserController().searchUsers(req, res, next)
);

router.get('/:id',
  readOnlyRateLimit,
  optionalAuth,
  validateParams(idParamSchema),
  (req, res, next) => getUserController().getUserById(req, res, next)
);

// Protected routes (require authentication)
router.get('/',
  readOnlyRateLimit,
  requireAuth,
  (req, res, next) => getUserController().getCurrentUser(req, res, next)
);

router.post('/',
  apiRateLimit,
  (req, res, next) => getUserController().createUser(req, res, next)
);

router.put('/:id',
  apiRateLimit,
  requireAuth,
  validateParams(idParamSchema),
  (req, res, next) => getUserController().updateUser(req, res, next)
);

router.delete('/:id',
  apiRateLimit,
  requireAuth,
  validateParams(idParamSchema),
  (req, res, next) => getUserController().deleteUser(req, res, next)
);

router.get('/messaging/users',
  readOnlyRateLimit,
  requireAuth,
  (req, res, next) => getUserController().getUsersForMessaging(req, res, next)
);

export { router as userRoutes };