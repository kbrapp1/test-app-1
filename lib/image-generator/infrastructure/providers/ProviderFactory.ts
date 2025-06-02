import { ProviderRegistry } from '../../domain/services/ProviderRegistryService';
import { ReplicateProvider } from './replicate/ReplicateProvider';

export class ProviderFactory {
  static createProviderRegistry(apiToken?: string): ProviderRegistry {
    const registry = new ProviderRegistry();

    // Register Replicate provider with multiple models
    const replicateProvider = new ReplicateProvider(apiToken);
    registry.registerProvider(replicateProvider);

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
} 