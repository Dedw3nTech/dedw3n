import { eq, and, or, desc, asc, sql, count, like, ilike } from 'drizzle-orm';
import { db } from '../config/database.config';
import { BusinessError } from './errors';

export interface PaginationOptions {
  limit: number;
  offset: number;
}

export interface PaginationResult<T> {
  data: T[];
  total: number;
  hasMore: boolean;
  page: number;
  totalPages: number;
}

export abstract class BaseRepository {
  protected get db() {
    return db;
  }

  protected handleDatabaseError(operation: string, error: Error, context?: Record<string, any>): void {
    console.error(`[${this.constructor.name}] Database error in ${operation}:`, {
      message: error.message,
      context,
      stack: error.stack
    });
  }

  protected buildSearchCondition(column: any, searchTerm: string, caseSensitive: boolean = false) {
    const searchFunction = caseSensitive ? like : ilike;
    return searchFunction(column, `%${searchTerm}%`);
  }

  protected buildDateRangeCondition(column: any, startDate?: Date, endDate?: Date) {
    const conditions = [];
    
    if (startDate) {
      conditions.push(sql`${column} >= ${startDate}`);
    }
    
    if (endDate) {
      conditions.push(sql`${column} <= ${endDate}`);
    }
    
    return conditions.length > 0 ? and(...conditions) : undefined;
  }
}