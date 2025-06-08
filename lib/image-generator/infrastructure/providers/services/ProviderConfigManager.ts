/**
 * Provider Configuration Manager
 * Single Responsibility: Manage provider configurations and validation
 * Infrastructure Layer - Provider configuration management
 */

export interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

export class ProviderConfigManager {
  private readonly providers: Map<string, ProviderConfig>;

  constructor(providers: ProviderConfig[] = []) {
    this.providers = new Map();
    
    // Add provided configurations
    providers.forEach(provider => {
      this.validateConfig(provider);
      this.providers.set(provider.name, provider);
    });

    // Set default Replicate configuration if not provided
    this.ensureDefaultConfigurations();
  }

  /**
   * Get provider configuration by name
   */
  getProviderConfig(providerName: string): ProviderConfig | null {
    return this.providers.get(providerName.toLowerCase()) || null;
  }

  /**
   * Check if provider is supported
   */
  isProviderSupported(providerName: string): boolean {
    return this.providers.has(providerName.toLowerCase());
  }

  /**
   * Get all supported provider names
   */
  getSupportedProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  /**
   * Add or update provider configuration
   */
  setProviderConfig(config: ProviderConfig): void {
    this.validateConfig(config);
    this.providers.set(config.name.toLowerCase(), config);
  }

  /**
   * Validate provider configuration
   */
  private validateConfig(config: ProviderConfig): void {
    if (!config.name || typeof config.name !== 'string') {
      throw new Error('Provider name is required and must be a string');
    }
    
    if (!config.baseUrl || typeof config.baseUrl !== 'string') {
      throw new Error(`Provider ${config.name} requires a valid base URL`);
    }
    
    if (!config.apiKey || typeof config.apiKey !== 'string') {
      throw new Error(`Provider ${config.name} requires a valid API key`);
    }
    
    if (config.timeout && (typeof config.timeout !== 'number' || config.timeout <= 0)) {
      throw new Error(`Provider ${config.name} timeout must be a positive number`);
    }
    
    if (config.retryAttempts && (typeof config.retryAttempts !== 'number' || config.retryAttempts < 0)) {
      throw new Error(`Provider ${config.name} retry attempts must be a non-negative number`);
    }
  }

  /**
   * Ensure default configurations are available
   */
  private ensureDefaultConfigurations(): void {
    // Set default Replicate configuration if not provided
    if (!this.providers.has('replicate')) {
      const replicateApiKey = process.env.REPLICATE_API_TOKEN;
      
      if (replicateApiKey) {
        this.providers.set('replicate', {
          name: 'replicate',
          baseUrl: 'https://api.replicate.com/v1',
          apiKey: replicateApiKey,
          timeout: 10000,
          retryAttempts: 3,
          retryDelay: 1000
        });
      }
    }
  }
} 