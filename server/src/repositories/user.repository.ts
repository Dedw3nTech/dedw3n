import { eq, ilike, and, desc } from 'drizzle-orm';
import { users } from '../../../shared/schema';
import type { User, InsertUser } from '../../../shared/schema';
import { BaseRepository, PaginationOptions, PaginationResult } from '../core/base.repository';

export class UserRepository extends BaseRepository {
  async findById(id: number): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      this.handleDatabaseError('findById', error as Error, { id });
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      this.handleDatabaseError('findByEmail', error as Error, { email });
      throw error;
    }
  }

  async findByUsername(username: string): Promise<User | null> {
    try {
      const result = await this.db
        .select()
        .from(users)
        .where(eq(users.username, username))
        .limit(1);
      
      return result[0] || null;
    } catch (error) {
      this.handleDatabaseError('findByUsername', error as Error, { username });
      throw error;
    }
  }

  async create(userData: InsertUser): Promise<User> {
    try {
      const result = await this.db
        .insert(users)
        .values(userData)
        .returning();
      
      if (!result[0]) {
        throw new Error('Failed to create user');
      }
      
      return result[0];
    } catch (error) {
      this.handleDatabaseError('create', error as Error, { userData });
      throw error;
    }
  }

  async update(id: number, userData: Partial<InsertUser>): Promise<User | null> {
    try {
      const result = await this.db
        .update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      
      return result[0] || null;
    } catch (error) {
      this.handleDatabaseError('update', error as Error, { id, userData });
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      const result = await this.db
        .delete(users)
        .where(eq(users.id, id))
        .returning({ id: users.id });
      
      return result.length > 0;
    } catch (error) {
      this.handleDatabaseError('delete', error as Error, { id });
      throw error;
    }
  }

  async searchUsers(query: string, pagination?: PaginationOptions): Promise<PaginationResult<User>> {
    try {
      const limit = pagination?.limit || 20;
      const offset = pagination?.offset || 0;
      const page = Math.floor(offset / limit) + 1;

      const searchConditions = [
        ilike(users.username, `%${query}%`),
        ilike(users.name, `%${query}%`),
        ilike(users.email, `%${query}%`)
      ];

      // Get total count
      const countResult = await this.db
        .select({ count: users.id })
        .from(users)
        .where(and(...searchConditions.map(condition => condition)));
      
      const total = countResult.length;

      // Get data
      const data = await this.db
        .select()
        .from(users)
        .where(and(...searchConditions.map(condition => condition)))
        .orderBy(desc(users.createdAt))
        .limit(limit)
        .offset(offset);

      const totalPages = Math.ceil(total / limit);
      const hasMore = page < totalPages;

      return {
        data,
        total,
        hasMore,
        page,
        totalPages
      };
    } catch (error) {
      this.handleDatabaseError('searchUsers', error as Error, { query, pagination });
      throw error;
    }
  }

  async findUsersForMessaging(currentUserId: number): Promise<Array<{
    id: number;
    username: string;
    name: string;
    avatar: string | null;
  }>> {
    try {
      const result = await this.db
        .select({
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        })
        .from(users)
        .where(and(
          eq(users.id, currentUserId) // Only return users that are not the current user
        ))
        .orderBy(users.name)
        .limit(50);

      return result;
    } catch (error) {
      this.handleDatabaseError('findUsersForMessaging', error as Error, { currentUserId });
      throw error;
    }
  }

  async exists(id: number): Promise<boolean> {
    try {
      const result = await this.db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      
      return result.length > 0;
    } catch (error) {
      this.handleDatabaseError('exists', error as Error, { id });
      throw error;
    }
  }
}