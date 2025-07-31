import { container, registerService } from './core/container';
import { UserRepository } from './repositories/user.repository';
import { AuthRepository } from './repositories/auth.repository';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { UserController } from './controllers/user.controller';
import { AuthController } from './controllers/auth.controller';

// Setup dependency injection container
export function setupContainer(): void {
  // Register repositories
  registerService('UserRepository', UserRepository, [], true);
  registerService('AuthRepository', AuthRepository, [], true);

  // Register services
  registerService('UserService', UserService, ['UserRepository'], true);
  registerService('AuthService', AuthService, ['AuthRepository', 'UserService'], true);

  // Register controllers
  registerService('UserController', UserController, ['UserService'], false);
  registerService('AuthController', AuthController, ['AuthService'], false);

  console.log('[CONTAINER] Dependency injection setup complete');
  console.log('[CONTAINER] Registered services:', container.getRegisteredServices());
}

// Initialize container on module load
setupContainer();