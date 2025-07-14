import { IContextDiscoveryService } from '../../domain/services/interfaces/IContextDiscoveryService';
import { IRuntimeDetectionService } from '../../domain/services/interfaces/IRuntimeDetectionService';
import { DomainDiscoveryService } from '../../infrastructure/discovery/DomainDiscoveryService';
import { RuntimeDetectionService } from '../../infrastructure/services/RuntimeDetectionService';
import { BrowserNetworkRepository } from '../../infrastructure/repositories/BrowserNetworkRepository';
import { BrowserPerformanceRepository } from '../../infrastructure/repositories/BrowserPerformanceRepository';
import { NetworkMonitoringRepository, PerformanceDataRepository } from '../../domain/repositories';
import { DynamicContextUpdateService } from '../../domain/services/context-analysis/DynamicContextUpdateService';
import { CauseAnalysisService } from '../../domain/services/business-impact/CauseAnalysisService';
import { PageContextRepository } from '../../domain/repositories/PageContextRepository';

interface ServiceRegistration {
  factory: () => unknown;
  instance: unknown;
  lifetime: 'singleton' | 'transient';
}

/**
 * Service container implementing dependency injection pattern
 * Manages service lifetimes and dependency resolution
 */
export class MonitoringServiceContainer {
  private static instance: MonitoringServiceContainer;
  private services = new Map<string, ServiceRegistration>();

  private constructor() {
    this.registerDependencies();
  }

  static getInstance(): MonitoringServiceContainer {
    if (!MonitoringServiceContainer.instance) {
      MonitoringServiceContainer.instance = new MonitoringServiceContainer();
    }
    return MonitoringServiceContainer.instance;
  }

  private registerDependencies(): void {
    // Infrastructure repositories (singleton)
    this.registerSingleton<NetworkMonitoringRepository>(
      'NetworkMonitoringRepository',
      () => new BrowserNetworkRepository()
    );

    this.registerSingleton<PerformanceDataRepository>(
      'PerformanceDataRepository', 
      () => new BrowserPerformanceRepository()
    );

    // Infrastructure services (singleton)
    this.registerSingleton<IContextDiscoveryService>(
      'IContextDiscoveryService',
      () => new DomainDiscoveryService()
    );

    this.registerSingleton<IRuntimeDetectionService>(
      'IRuntimeDetectionService',
      () => new RuntimeDetectionService()
    );

    // Domain services (transient - created fresh each time)
    this.registerTransient<DynamicContextUpdateService>(
      'DynamicContextUpdateService',
      () => new DynamicContextUpdateService(
        this.get<PageContextRepository>('PageContextRepository'),
        this.get<IContextDiscoveryService>('IContextDiscoveryService')
      )
    );

    this.registerTransient<CauseAnalysisService>(
      'CauseAnalysisService',
      () => new CauseAnalysisService(
        this.get<IRuntimeDetectionService>('IRuntimeDetectionService')
      )
    );
  }

  private registerSingleton<T>(key: string, factory: () => T): void {
    this.services.set(key, { factory: factory as () => unknown, instance: null, lifetime: 'singleton' });
  }

  private registerTransient<T>(key: string, factory: () => T): void {
    this.services.set(key, { factory: factory as () => unknown, instance: null, lifetime: 'transient' });
  }

  get<T>(key: string): T {
    const service = this.services.get(key);
    if (!service) {
      throw new Error(`Service '${key}' not registered`);
    }

    if (service.lifetime === 'singleton') {
      if (!service.instance) {
        service.instance = service.factory();
      }
      return service.instance as T;
    }

    // Transient - always create new instance
    return service.factory() as T;
  }

  /**
   * Clear all singleton instances (useful for testing)
   */
  reset(): void {
    this.services.forEach(service => {
      if (service.lifetime === 'singleton') {
        service.instance = null;
      }
    });
  }

  /**
   * Get list of registered service keys
   */
  getRegisteredServices(): string[] {
    return Array.from(this.services.keys());
  }
} 