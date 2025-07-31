import { container, registerService } from './core/container';
import { UserRepository } from './repositories/user.repository';
import { AuthRepository } from './repositories/auth.repository';
import { ProductRepository } from './repositories/product.repository';
import { VendorRepository } from './repositories/vendor.repository';
import { OrderRepository } from './repositories/order.repository';
import { UserService } from './services/user.service';
import { AuthService } from './services/auth.service';
import { ProductService } from './services/product.service';
import { VendorService } from './services/vendor.service';
import { OrderService } from './services/order.service';
import { UserController } from './controllers/user.controller';
import { AuthController } from './controllers/auth.controller';

// Setup dependency injection container
export function setupContainer(): void {
  // Register repositories
  registerService('UserRepository', UserRepository, [], true);
  registerService('AuthRepository', AuthRepository, [], true);
  registerService('ProductRepository', ProductRepository, [], true);
  registerService('VendorRepository', VendorRepository, [], true);
  registerService('OrderRepository', OrderRepository, [], true);

  // Register services
  registerService('UserService', UserService, ['UserRepository'], true);
  registerService('AuthService', AuthService, ['AuthRepository', 'UserService'], true);
  registerService('VendorService', VendorService, ['VendorRepository', 'UserService'], true);
  registerService('ProductService', ProductService, ['ProductRepository', 'VendorService'], true);
  registerService('OrderService', OrderService, ['OrderRepository', 'ProductService', 'VendorService'], true);

  // Register controllers
  registerService('UserController', UserController, ['UserService'], false);
  registerService('AuthController', AuthController, ['AuthService'], false);

  console.log('[CONTAINER] Dependency injection setup complete');
  console.log('[CONTAINER] Registered services:', container.getRegisteredServices());
}

// Initialize container on module load
setupContainer();