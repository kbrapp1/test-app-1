import { ProviderRegistry } from '../../domain/services/ProviderRegistryService';
import { ReplicateProvider } from './replicate/ReplicateProvider';
import { LazyProviderLoader } from './LazyProviderLoader';

export class ProviderFactory {
  /**
   * Create provider registry with on-demand model loading
   */
  static createProviderRegistry(apiToken?: string): ProviderRegistry {
    const registry = new ProviderRegistry();

    // Register Replicate provider - models load on-demand via lazy loading
    const replicateProvider = new ReplicateProvider(apiToken);
    registry.registerProvider(replicateProvider);

    // Start loading full configurations in background
    LazyProviderLoader.preloadConfigurations();

    return registry;
  }

  static getDefaultProviderConfig() {
    return {
      providerId: 'replicate' as const,
      modelId: 'flux-schnell' as const,
    };
  }

  static getCheapestProviderConfig() {
    return {
      providerId: 'replicate' as const,
      modelId: 'flux-schnell' as const,
    };
  }

  /**
   * Get bundle optimization stats for monitoring
   */
  static getBundleStats() {
    return {
      lazyLoader: LazyProviderLoader.getCacheStats(),
      timestamp: new Date().toISOString()
    };
  }
} 