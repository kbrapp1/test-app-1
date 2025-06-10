import { ProviderRegistry } from './ProviderRegistry';
import { ProviderType, ProviderRegistryEntry } from './types';
import { ReplicateProvider, ReplicateConfig } from '../replicate/ReplicateProvider';

/**
 * Factory for creating and registering providers
 * Handles initialization from environment variables and configuration
 */
export class ProviderFactory {
  private static registry = ProviderRegistry.getInstance();

  /**
   * Initialize all providers from environment variables
   */
  static async initializeProviders(): Promise<void> {
    // Initialize Replicate if API key is available
    if (process.env.REPLICATE_API_TOKEN) {
      await this.createReplicateProvider({
        apiKey: process.env.REPLICATE_API_TOKEN,
        retryAttempts: 3,
        retryDelay: 1000,
      });
    }

    // TODO: Add other providers as they're implemented
    // if (process.env.OPENAI_API_KEY) {
    //   await this.createOpenAIProvider({ ... });
    // }
    // if (process.env.ANTHROPIC_API_KEY) {
    //   await this.createAnthropicProvider({ ... });
    // }
  }

  /**
   * Create and register Replicate provider
   */
  static async createReplicateProvider(config: ReplicateConfig): Promise<void> {
    const provider = new ReplicateProvider(config);
    
    try {
      await provider.connect();
      
      const entry: ProviderRegistryEntry = {
        type: ProviderType.REPLICATE,
        config,
        metadata: {
          name: 'Replicate',
          version: '1.0.0',
          capabilities: {
            imageGeneration: true,
            audioGeneration: true,
            videoGeneration: true,
            textGeneration: true,
          },
          supportedModels: [
            'black-forest-labs/flux-kontext-max',
            'black-forest-labs/flux-1.1-pro',
            'meta/llama-2-70b-chat',
            // Add more models as needed
          ],
          rateLimits: {
            requestsPerMinute: 60,
            requestsPerHour: 1000,
          },
        },
        provider,
        isEnabled: true,
        priority: 1, // High priority for Replicate
      };

      this.registry.register(entry);
    } catch (error) {
      console.error('Failed to initialize Replicate provider:', error);
      // Still register it but mark as disabled
      const entry: ProviderRegistryEntry = {
        type: ProviderType.REPLICATE,
        config,
        metadata: {
          name: 'Replicate',
          version: '1.0.0',
          capabilities: {
            imageGeneration: true,
            audioGeneration: true,
            videoGeneration: true,
            textGeneration: true,
          },
          supportedModels: [],
        },
        provider,
        isEnabled: false,
        priority: 1,
      };

      this.registry.register(entry);
    }
  }

  /**
   * Get the provider registry instance
   */
  static getRegistry(): ProviderRegistry {
    return this.registry;
  }

  /**
   * Health check all providers
   */
  static async healthCheckAll(): Promise<Map<ProviderType, boolean>> {
    return await this.registry.healthCheckAll();
  }
} 