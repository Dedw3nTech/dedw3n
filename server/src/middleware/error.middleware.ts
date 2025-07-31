import { Request, Response, NextFunction } from 'express';
import { 
  BusinessError, 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError, 
  ConflictError, 
  DatabaseError, 
  ExternalServiceError 
} from '../core/errors';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error for debugging
  console.error(`[ErrorHandler] ${error.name}:`, {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
  });

  if (error instanceof BusinessError) {
    res.status(error.statusCode).json({
      success: false,
      error: 'Business Logic Error',
      message: error.message,
      code: error.code
    });
    return;
  }

  if (error instanceof ValidationError) {
    res.status(error.statusCode).json({
      success: false,
      error: 'Validation Error',
      message: error.message,
      field: error.field
    });
    return;
  }

  if (error instanceof AuthenticationError) {
    res.status(error.statusCode).json({
      success: false,
      error: 'Authentication Error',
      message: error.message
    });
    return;
  }

  if (error instanceof AuthorizationError) {
    res.status(error.statusCode).json({
      success: false,
      error: 'Authorization Error',
      message: error.message
    });
    return;
  }

  if (error instanceof NotFoundError) {
    res.status(error.statusCode).json({
      success: false,
      error: 'Not Found',
      message: error.message
    });
    return;
  }

  if (error instanceof ConflictError) {
    res.status(error.statusCode).json({
      success: false,
      error: 'Conflict',
      message: error.message
    });
    return;
  }

  if (error instanceof DatabaseError) {
    res.status(error.statusCode).json({
      success: false,
      error: 'Database Error',
      message: 'A database error occurred'
    });
    return;
  }

  if (error instanceof ExternalServiceError) {
    res.status(error.statusCode).json({
      success: false,
      error: 'External Service Error',
      message: `${error.service} service is temporarily unavailable`
    });
    return;
  }

  // Generic error handling
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred'
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
};