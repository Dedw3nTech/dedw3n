import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { BusinessError, ValidationError } from './errors';

export abstract class BaseController {
  protected async handleRequest<T>(
    req: Request,
    res: Response,
    next: NextFunction,
    handler: () => Promise<T>
  ): Promise<void> {
    try {
      const result = await handler();
      
      if (result === null || result === undefined) {
        res.status(404).json({
          success: false,
          error: 'Resource not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  protected async handleCreation<T>(
    req: Request,
    res: Response,
    next: NextFunction,
    handler: () => Promise<T>
  ): Promise<void> {
    try {
      const result = await handler();
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  protected validateBody<T>(schema: z.ZodSchema<T>, body: unknown): T {
    try {
      return schema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new ValidationError(
          `Validation failed: ${firstError.message}`,
          firstError.path.join('.')
        );
      }
      throw error;
    }
  }

  protected validateQuery<T>(schema: z.ZodSchema<T>, query: unknown): T {
    try {
      return schema.parse(query);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new ValidationError(
          `Query validation failed: ${firstError.message}`,
          firstError.path.join('.')
        );
      }
      throw error;
    }
  }

  protected validateParams<T>(schema: z.ZodSchema<T>, params: unknown): T {
    try {
      return schema.parse(params);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        throw new ValidationError(
          `Parameter validation failed: ${firstError.message}`,
          firstError.path.join('.')
        );
      }
      throw error;
    }
  }

  protected getUserId(req: Request): number {
    const userId = req.headers['x-client-user-id'];
    if (!userId || typeof userId !== 'string') {
      throw new BusinessError('User authentication required', 'AUTH_REQUIRED');
    }
    
    const parsedUserId = parseInt(userId);
    if (isNaN(parsedUserId)) {
      throw new BusinessError('Invalid user ID', 'INVALID_USER_ID');
    }
    
    return parsedUserId;
  }

  protected getPaginationParams(req: Request): { limit: number; offset: number } {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const offset = (page - 1) * limit;
    
    return { limit, offset };
  }
}