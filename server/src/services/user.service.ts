import { UserRepository } from '../repositories/user.repository';
import { BaseService } from '../core/base.service';
import { BusinessError, ValidationError, ConflictError } from '../core/errors';
import type { User, InsertUser } from '../../../shared/schema';
import { PaginationOptions, PaginationResult } from '../core/base.repository';
import bcrypt from 'bcryptjs';

export class UserService extends BaseService {
  constructor(private userRepository: UserRepository) {
    super();
  }

  async getUserById(id: number): Promise<User | null> {
    this.validatePositiveNumber(id, 'User ID');
    
    try {
      return await this.userRepository.findById(id);
    } catch (error) {
      this.logError('getUserById', error as Error, { id });
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    this.validateRequired(email, 'Email');
    this.validateEmail(email);
    
    try {
      return await this.userRepository.findByEmail(email);
    } catch (error) {
      this.logError('getUserByEmail', error as Error, { email });
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    this.validateRequired(username, 'Username');
    this.validateStringLength(username, 3, 50, 'Username');
    
    try {
      return await this.userRepository.findByUsername(username);
    } catch (error) {
      this.logError('getUserByUsername', error as Error, { username });
      throw error;
    }
  }

  async createUser(userData: InsertUser): Promise<User> {
    // Validate required fields
    this.validateRequired(userData.email, 'Email');
    this.validateRequired(userData.username, 'Username');
    this.validateRequired(userData.password, 'Password');
    this.validateRequired(userData.name, 'Name');

    // Validate formats
    this.validateEmail(userData.email);
    this.validateStringLength(userData.username, 3, 50, 'Username');
    this.validateStringLength(userData.password, 6, 128, 'Password');
    this.validateStringLength(userData.name, 1, 100, 'Name');

    try {
      // Check for existing user
      const existingUserByEmail = await this.userRepository.findByEmail(userData.email);
      if (existingUserByEmail) {
        throw new ConflictError('A user with this email already exists');
      }

      const existingUserByUsername = await this.userRepository.findByUsername(userData.username);
      if (existingUserByUsername) {
        throw new ConflictError('A user with this username already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(userData.password);

      // Create user
      const newUser = await this.userRepository.create({
        ...userData,
        password: hashedPassword
      });

      this.logInfo('createUser', 'User created successfully', { 
        userId: newUser.id, 
        username: newUser.username 
      });

      return newUser;
    } catch (error) {
      this.logError('createUser', error as Error, { username: userData.username, email: userData.email });
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User> {
    this.validatePositiveNumber(id, 'User ID');

    // Validate fields if they are being updated
    if (userData.email) {
      this.validateEmail(userData.email);
    }
    if (userData.username) {
      this.validateStringLength(userData.username, 3, 50, 'Username');
    }
    if (userData.name) {
      this.validateStringLength(userData.name, 1, 100, 'Name');
    }
    if (userData.password) {
      this.validateStringLength(userData.password, 6, 128, 'Password');
      userData.password = await this.hashPassword(userData.password);
    }

    try {
      // Check if user exists
      const existingUser = await this.userRepository.findById(id);
      if (!existingUser) {
        throw new BusinessError('User not found', 'USER_NOT_FOUND');
      }

      // Check for conflicts with email/username if they're being changed
      if (userData.email && userData.email !== existingUser.email) {
        const userWithEmail = await this.userRepository.findByEmail(userData.email);
        if (userWithEmail) {
          throw new ConflictError('A user with this email already exists');
        }
      }

      if (userData.username && userData.username !== existingUser.username) {
        const userWithUsername = await this.userRepository.findByUsername(userData.username);
        if (userWithUsername) {
          throw new ConflictError('A user with this username already exists');
        }
      }

      const updatedUser = await this.userRepository.update(id, userData);
      if (!updatedUser) {
        throw new BusinessError('Failed to update user', 'UPDATE_FAILED');
      }

      this.logInfo('updateUser', 'User updated successfully', { userId: id });

      return updatedUser;
    } catch (error) {
      this.logError('updateUser', error as Error, { id, userData });
      throw error;
    }
  }

  async deleteUser(id: number): Promise<boolean> {
    this.validatePositiveNumber(id, 'User ID');

    try {
      const userExists = await this.userRepository.exists(id);
      if (!userExists) {
        throw new BusinessError('User not found', 'USER_NOT_FOUND');
      }

      const deleted = await this.userRepository.delete(id);
      
      if (deleted) {
        this.logInfo('deleteUser', 'User deleted successfully', { userId: id });
      }

      return deleted;
    } catch (error) {
      this.logError('deleteUser', error as Error, { id });
      throw error;
    }
  }

  async searchUsers(query: string, pagination?: PaginationOptions): Promise<PaginationResult<User>> {
    this.validateRequired(query, 'Search query');
    this.validateStringLength(query, 1, 100, 'Search query');

    try {
      return await this.userRepository.searchUsers(query, pagination);
    } catch (error) {
      this.logError('searchUsers', error as Error, { query, pagination });
      throw error;
    }
  }

  async getUsersForMessaging(currentUserId: number): Promise<Array<{
    id: number;
    username: string;
    name: string;
    avatar: string | null;
  }>> {
    this.validatePositiveNumber(currentUserId, 'Current User ID');

    try {
      return await this.userRepository.findUsersForMessaging(currentUserId);
    } catch (error) {
      this.logError('getUsersForMessaging', error as Error, { currentUserId });
      throw error;
    }
  }

  async validateUserExists(id: number): Promise<void> {
    const exists = await this.userRepository.exists(id);
    if (!exists) {
      throw new BusinessError('User not found', 'USER_NOT_FOUND');
    }
  }

  private async hashPassword(password: string): Promise<string> {
    try {
      const saltRounds = 12;
      return await bcrypt.hash(password, saltRounds);
    } catch (error) {
      this.logError('hashPassword', error as Error);
      throw new BusinessError('Failed to hash password', 'HASH_FAILED');
    }
  }

  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      this.logError('verifyPassword', error as Error);
      throw new BusinessError('Failed to verify password', 'VERIFY_FAILED');
    }
  }
}