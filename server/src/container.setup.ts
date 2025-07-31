import { container, registerService } from './core/container';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './services/user.service';
import { UserController } from './controllers/user.controller';

// Setup dependency injection container
export function setupContainer(): void {
  // Register repositories
  registerService('UserRepository', UserRepository, [], true);

  // Register services
  registerService('UserService', UserService, ['UserRepository'], true);

  // Register controllers
  registerService('UserController', UserController, ['UserService'], false);

  console.log('[CONTAINER] Dependency injection setup complete');
  console.log('[CONTAINER] Registered services:', container.getRegisteredServices());
}

// Initialize container on module load
setupContainer();