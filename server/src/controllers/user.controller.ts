import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BaseController } from '../core/base.controller';
import { UserService } from '../services/user.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be at most 50 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128, 'Password must be at most 128 characters'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be at most 100 characters'),
  avatar: z.string().url().optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  location: z.string().max(100, 'Location must be at most 100 characters').optional(),
  website: z.string().url().optional().or(z.literal('')),
});

const updateUserSchema = createUserSchema.partial();

const searchUsersSchema = z.object({
  q: z.string().min(1, 'Search query is required').max(100, 'Search query must be at most 100 characters'),
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => Math.min(parseInt(val || '20'), 50))
});

const userIdParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'Invalid user ID').transform(val => parseInt(val))
});

export class UserController extends BaseController {
  constructor(private userService: UserService) {
    super();
  }

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleRequest(req, res, next, async () => {
      const params = this.validateParams(userIdParamSchema, req.params);
      
      const user = await this.userService.getUserById(params.id);
      if (!user) {
        return null; // This will trigger 404 response in base controller
      }

      // Remove sensitive data
      const { password, ...safeUser } = user;
      return safeUser;
    });
  };

  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleRequest(req, res, next, async () => {
      const userId = this.getUserId(req);
      const user = await this.userService.getUserById(userId);
      
      if (!user) {
        return null;
      }

      // Remove sensitive data
      const { password, ...safeUser } = user;
      return safeUser;
    });
  };

  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleCreation(req, res, next, async () => {
      const userData = this.validateBody(createUserSchema, req.body);
      
      const user = await this.userService.createUser(userData);
      
      // Remove sensitive data from response
      const { password, ...safeUser } = user;
      return safeUser;
    });
  };

  updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleRequest(req, res, next, async () => {
      const params = this.validateParams(userIdParamSchema, req.params);
      const userData = this.validateBody(updateUserSchema, req.body);
      const currentUserId = this.getUserId(req);

      // Users can only update their own profile (or admin can update any)
      if (params.id !== currentUserId) {
        // TODO: Add admin role check here when role system is implemented
        throw new Error('Unauthorized to update this user');
      }

      const user = await this.userService.updateUser(params.id, userData);
      
      // Remove sensitive data
      const { password, ...safeUser } = user;
      return safeUser;
    });
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleRequest(req, res, next, async () => {
      const params = this.validateParams(userIdParamSchema, req.params);
      const currentUserId = this.getUserId(req);

      // Users can only delete their own account (or admin can delete any)
      if (params.id !== currentUserId) {
        // TODO: Add admin role check here when role system is implemented
        throw new Error('Unauthorized to delete this user');
      }

      const deleted = await this.userService.deleteUser(params.id);
      return { deleted };
    });
  };

  searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleRequest(req, res, next, async () => {
      const query = this.validateQuery(searchUsersSchema, req.query);
      
      const pagination = this.getPaginationParams(req);
      const result = await this.userService.searchUsers(query.q, pagination);
      
      // Remove sensitive data from all users
      const safeUsers = result.data.map(user => {
        const { password, ...safeUser } = user;
        return safeUser;
      });

      return {
        ...result,
        data: safeUsers
      };
    });
  };

  getUsersForMessaging = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await this.handleRequest(req, res, next, async () => {
      const currentUserId = this.getUserId(req);
      
      return await this.userService.getUsersForMessaging(currentUserId);
    });
  };
}