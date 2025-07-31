import { BusinessError, ValidationError } from './errors';

export abstract class BaseService {
  protected validateRequired<T>(value: T | null | undefined, fieldName: string): T {
    if (value === null || value === undefined) {
      throw new ValidationError(`${fieldName} is required`, fieldName);
    }
    return value;
  }

  protected validatePositiveNumber(value: number, fieldName: string): number {
    if (value <= 0) {
      throw new ValidationError(`${fieldName} must be a positive number`, fieldName);
    }
    return value;
  }

  protected validateEmail(email: string, fieldName: string = 'email'): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ValidationError(`Invalid ${fieldName} format`, fieldName);
    }
    return email;
  }

  protected validateStringLength(
    value: string,
    minLength: number,
    maxLength: number,
    fieldName: string
  ): string {
    if (value.length < minLength || value.length > maxLength) {
      throw new ValidationError(
        `${fieldName} must be between ${minLength} and ${maxLength} characters`,
        fieldName
      );
    }
    return value;
  }

  protected async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          break;
        }
        
        await this.sleep(delay * attempt);
      }
    }
    
    throw new BusinessError(
      `Operation failed after ${maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
      'OPERATION_FAILED'
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected logError(context: string, error: Error, metadata?: Record<string, any>): void {
    console.error(`[${context}] Error:`, {
      message: error.message,
      stack: error.stack,
      metadata
    });
  }

  protected logInfo(context: string, message: string, metadata?: Record<string, any>): void {
    console.log(`[${context}] ${message}`, metadata || '');
  }
}