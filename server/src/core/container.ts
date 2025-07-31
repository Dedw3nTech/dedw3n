type ServiceFactory<T = any> = () => T;
type ServiceInstance<T = any> = T;

class Container {
  private services = new Map<string, ServiceFactory>();
  private instances = new Map<string, ServiceInstance>();
  private singletons = new Set<string>();

  register<T>(name: string, factory: ServiceFactory<T>): void {
    this.services.set(name, factory);
  }

  registerSingleton<T>(name: string, factory: ServiceFactory<T>): void {
    this.services.set(name, factory);
    this.singletons.add(name);
  }

  resolve<T>(name: string): T {
    // Return cached singleton instance if exists
    if (this.singletons.has(name) && this.instances.has(name)) {
      return this.instances.get(name) as T;
    }

    const factory = this.services.get(name);
    if (!factory) {
      throw new Error(`Service '${name}' not found. Available services: ${Array.from(this.services.keys()).join(', ')}`);
    }

    const instance = factory();

    // Cache singleton instances
    if (this.singletons.has(name)) {
      this.instances.set(name, instance);
    }

    return instance as T;
  }

  has(name: string): boolean {
    return this.services.has(name);
  }

  clear(): void {
    this.services.clear();
    this.instances.clear();
    this.singletons.clear();
  }

  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }
}

export const container = new Container();

// Decorator for automatic dependency injection
export function injectable<T extends new (...args: any[]) => {}>(constructor: T) {
  return class extends constructor {
    constructor(...args: any[]) {
      super(...args);
    }
  };
}

// Helper function to create service factories with dependency injection
export function createServiceFactory<T>(
  ServiceClass: new (...deps: any[]) => T,
  dependencies: string[] = []
): ServiceFactory<T> {
  return () => {
    const resolvedDependencies = dependencies.map(dep => container.resolve(dep));
    return new ServiceClass(...resolvedDependencies);
  };
}

// Service registration helper
export function registerService<T>(
  name: string,
  ServiceClass: new (...deps: any[]) => T,
  dependencies: string[] = [],
  singleton: boolean = true
): void {
  const factory = createServiceFactory(ServiceClass, dependencies);
  
  if (singleton) {
    container.registerSingleton(name, factory);
  } else {
    container.register(name, factory);
  }
}