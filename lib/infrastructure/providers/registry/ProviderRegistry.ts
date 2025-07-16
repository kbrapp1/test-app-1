import { 
  ProviderType, 
  ProviderRegistryEntry, 
  ProviderSelectionCriteria,
  BaseProvider,
  ProviderCapabilities
} from './types';

/**
 * Central registry for managing all external service providers
 * Handles registration, discovery, and dynamic selection of providers
 */
export class ProviderRegistry {
  private static instance: ProviderRegistry;
  private providers = new Map<ProviderType, ProviderRegistryEntry>();

  private constructor() {}

  static getInstance(): ProviderRegistry {
    if (!ProviderRegistry.instance) {
      ProviderRegistry.instance = new ProviderRegistry();
    }
    return ProviderRegistry.instance;
  }

  /**
   * Register a provider in the registry
   */
  register(entry: ProviderRegistryEntry): void {
    this.providers.set(entry.type, entry);
  }

  /**
   * Unregister a provider
   */
  unregister(type: ProviderType): void {
    this.providers.delete(type);
  }

  /**
   * Get a specific provider by type
   */
  getProvider(type: ProviderType): BaseProvider | null {
    const entry = this.providers.get(type);
    return entry?.isEnabled ? entry.provider : null;
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): ProviderRegistryEntry[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get providers that match specific capabilities
   */
  getProvidersByCapability(capability: keyof ProviderCapabilities): ProviderRegistryEntry[] {
    return Array.from(this.providers.values()).filter(
      entry => entry.isEnabled && entry.metadata.capabilities[capability]
    );
  }

  /**
   * Select the best provider based on criteria
   * Implements fallback logic and priority-based selection
   */
  selectProvider(criteria: ProviderSelectionCriteria): BaseProvider | null {
    const candidates = this.getProvidersByCapability(criteria.capability)
      .filter(entry => {
        // Filter by model if specified
        if (criteria.model && entry.metadata.supportedModels) {
          return entry.metadata.supportedModels.includes(criteria.model);
        }
        return true;
      })
      .sort((a, b) => {
        // Sort by priority strategy
        switch (criteria.priority) {
          case 'cost':
            return a.priority - b.priority; // Lower priority number = lower cost
          case 'speed':
            return b.priority - a.priority; // Higher priority = faster
          case 'quality':
            return b.priority - a.priority; // Higher priority = better quality
          case 'reliability':
            return b.priority - a.priority; // Higher priority = more reliable
          default:
            return a.priority - b.priority;
        }
      });

    if (candidates.length === 0) {
      return null;
    }

    // Return the best candidate
    const selectedEntry = candidates[0];
    return selectedEntry.provider;
  }

  /**
   * Check health of all providers
   */
  async healthCheckAll(): Promise<Map<ProviderType, boolean>> {
    const results = new Map<ProviderType, boolean>();
    
    for (const [type, entry] of this.providers) {
      if (entry.isEnabled) {
        try {
          const isHealthy = await entry.provider.healthCheck();
          results.set(type, isHealthy);
        } catch {
          results.set(type, false);
        }
      } else {
        results.set(type, false);
      }
    }
    
    return results;
  }

  /**
   * Enable/disable a provider
   */
  setProviderEnabled(type: ProviderType, enabled: boolean): void {
    const entry = this.providers.get(type);
    if (entry) {
      entry.isEnabled = enabled;
    }
  }

  /**
   * Update provider priority
   */
  setProviderPriority(type: ProviderType, priority: number): void {
    const entry = this.providers.get(type);
    if (entry) {
      entry.priority = priority;
    }
  }
} 