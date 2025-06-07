import { Generation } from '../../domain/entities/Generation';
import { GenerationStatusDomainService } from '../../domain/services/GenerationStatusDomainService';
import { success, error, Result } from '../common/Result';

/**
 * External Provider Status Response
 * Standardized response format from all external providers
 */
interface ProviderStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  imageUrl?: string;
  errorMessage?: string;
  progress?: number;
  metadata?: Record<string, any>;
}

/**
 * Provider Configuration
 * Provider-specific settings for status checking
 */
interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * External Provider Status Service
 * Single Responsibility: Coordinate status checking with external AI providers
 * Infrastructure Layer - Handles external API integrations with retry logic
 */
export class ExternalProviderStatusService {
  
  private readonly providers: Map<string, ProviderConfig>;
  private readonly requestCache = new Map<string, {
    response: ProviderStatusResponse;
    timestamp: number;
    ttl: number;
  }>();

  private readonly CACHE_TTL_MS = 10000; // 10 seconds cache for provider responses

  constructor(
    providers: ProviderConfig[] = []
  ) {
    this.providers = new Map();
    providers.forEach(provider => {
      this.providers.set(provider.name, provider);
    });

    // Set default Replicate configuration if not provided
    if (!this.providers.has('replicate')) {
      this.providers.set('replicate', {
        name: 'replicate',
        baseUrl: 'https://api.replicate.com/v1',
        apiKey: process.env.REPLICATE_API_TOKEN || '',
        timeout: 10000,
        retryAttempts: 3,
        retryDelay: 1000
      });
    }
  }

  /**
   * Check status for a single generation with external provider
   * Main entry point for individual status checking
   */
  async checkGenerationStatus(
    generation: Generation
  ): Promise<Result<Generation, string>> {
    // Check if generation requires external provider polling using domain service
    if (!GenerationStatusDomainService.requiresPolling(generation)) {
      return success(generation); // No polling needed
    }

    const providerId = generation.externalProviderId;
    if (!providerId) {
      return error('Generation missing external provider ID');
    }

    const providerName = generation.providerName.toLowerCase();
    const providerConfig = this.providers.get(providerName);
    
    if (!providerConfig) {
      return error(`Unsupported provider: ${providerName}`);
    }

    try {
      // Check cache first
      const cachedResponse = this.getCachedResponse(providerId);
      if (cachedResponse) {
        return this.updateGenerationFromResponse(generation, cachedResponse);
      }

      // Make external API call with retry logic
      const statusResult = await this.fetchProviderStatusWithRetry(
        providerConfig,
        providerId
      );

      if (!statusResult.isSuccess()) {
        return error(statusResult.getError());
      }

      const response = statusResult.getValue();
      
      // Cache the response
      this.cacheResponse(providerId, response);

      // Update generation with response data
      return this.updateGenerationFromResponse(generation, response);

    } catch (err) {
      return error(`Provider status check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Check status for multiple generations efficiently
   * Batch processing with provider-specific optimizations
   */
  async checkMultipleGenerationStatus(
    generations: Generation[]
  ): Promise<Result<Generation[], string>> {
    if (generations.length === 0) {
      return success([]);
    }

    try {
      // Group generations by provider for efficient batching
      const generationsByProvider = this.groupGenerationsByProvider(generations);
      const updatedGenerations: Generation[] = [];
      const errors: string[] = [];

      // Process each provider group
      for (const [providerName, providerGenerations] of generationsByProvider.entries()) {
        const providerConfig = this.providers.get(providerName);
        
        if (!providerConfig) {
          errors.push(`Unsupported provider: ${providerName}`);
          // Add unchanged generations to results
          updatedGenerations.push(...providerGenerations);
          continue;
        }

        // Process generations for this provider
        const batchResult = await this.processBatchForProvider(
          providerConfig,
          providerGenerations
        );

        if (batchResult.isSuccess()) {
          updatedGenerations.push(...batchResult.getValue());
        } else {
          errors.push(batchResult.getError());
          // Add unchanged generations to results
          updatedGenerations.push(...providerGenerations);
        }
      }

      if (errors.length > 0 && updatedGenerations.length === 0) {
        return error(`All provider checks failed: ${errors.join(', ')}`);
      }

      return success(updatedGenerations);

    } catch (err) {
      return error(`Batch status check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch status from external provider with retry logic
   * Provider-agnostic status fetching with proper error handling
   */
  private async fetchProviderStatusWithRetry(
    config: ProviderConfig,
    externalId: string
  ): Promise<Result<ProviderStatusResponse, string>> {
    let lastError: string = '';

    for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
      try {
        const result = await this.fetchProviderStatus(config, externalId);
        
        if (result.isSuccess()) {
          return result;
        }

        lastError = result.getError();
        
        // Don't retry on client errors (4xx)
        if (lastError.includes('404') || lastError.includes('400')) {
          break;
        }

        // Wait before retry (except on last attempt)
        if (attempt < config.retryAttempts) {
          await this.delay(config.retryDelay * attempt);
        }

      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Unknown error';
      }
    }

    return error(`Provider check failed after ${config.retryAttempts} attempts: ${lastError}`);
  }

  /**
   * Fetch status from specific provider
   * Provider-specific implementation for status API calls
   */
  private async fetchProviderStatus(
    config: ProviderConfig,
    externalId: string
  ): Promise<Result<ProviderStatusResponse, string>> {
    try {
      // Provider-specific logic based on provider name
      switch (config.name) {
        case 'replicate':
          return this.fetchReplicateStatus(config, externalId);
        default:
          return error(`Provider ${config.name} not implemented`);
      }
    } catch (err) {
      return error(`Provider API error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Fetch status from Replicate API
   * Replicate-specific status checking implementation
   */
  private async fetchReplicateStatus(
    config: ProviderConfig,
    predictionId: string
  ): Promise<Result<ProviderStatusResponse, string>> {
    try {
      const response = await fetch(`${config.baseUrl}/predictions/${predictionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        signal: AbortSignal.timeout(config.timeout)
      });

      if (!response.ok) {
        return error(`Replicate API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Transform Replicate response to standardized format
      const status = this.mapReplicateStatus(data.status);
      const imageUrl = data.output && Array.isArray(data.output) ? data.output[0] : data.output;

      return success({
        status,
        imageUrl,
        errorMessage: data.error || undefined,
        progress: data.progress || undefined,
        metadata: {
          provider: 'replicate',
          predictionId,
          replicateData: data
        }
      });

    } catch (err) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        return error('Replicate API timeout');
      }
      return error(`Replicate API error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Map Replicate status to standardized status
   */
  private mapReplicateStatus(replicateStatus: string): ProviderStatusResponse['status'] {
    switch (replicateStatus) {
      case 'starting':
      case 'processing':
        return 'processing';
      case 'succeeded':
        return 'completed';
      case 'failed':
        return 'failed';
      case 'canceled':
        return 'cancelled';
      default:
        return 'pending';
    }
  }

  /**
   * Update generation entity from provider response
   * Domain entity update coordination
   */
  private updateGenerationFromResponse(
    generation: Generation,
    response: ProviderStatusResponse
  ): Result<Generation, string> {
    try {
      // Update generation based on response status
      switch (response.status) {
        case 'completed':
          if (response.imageUrl) {
            generation.markAsCompleted(response.imageUrl, 25); // Default generation time
          } else {
            generation.markAsFailed('Completed but no image URL provided');
          }
          break;
        
        case 'failed':
          generation.markAsFailed(response.errorMessage || 'Generation failed');
          break;
        
        case 'processing':
          generation.markAsProcessing();
          break;
        
        case 'cancelled':
          generation.markAsFailed('Generation was cancelled');
          break;
        
        // 'pending' status - no update needed
      }

      return success(generation);

    } catch (err) {
      return error(`Failed to update generation: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Group generations by provider for batch processing
   */
  private groupGenerationsByProvider(
    generations: Generation[]
  ): Map<string, Generation[]> {
    const grouped = new Map<string, Generation[]>();

    generations.forEach(generation => {
      const providerName = generation.providerName.toLowerCase();
      
      if (!grouped.has(providerName)) {
        grouped.set(providerName, []);
      }
      
      grouped.get(providerName)!.push(generation);
    });

    return grouped;
  }

  /**
   * Process batch of generations for specific provider
   */
  private async processBatchForProvider(
    config: ProviderConfig,
    generations: Generation[]
  ): Promise<Result<Generation[], string>> {
    // For now, process individually
    // This can be optimized with provider-specific batch APIs
    const results = await Promise.all(
      generations.map(generation => this.checkGenerationStatus(generation))
    );

    const updatedGenerations: Generation[] = [];
    const errors: string[] = [];

    results.forEach(result => {
      if (result.isSuccess()) {
        updatedGenerations.push(result.getValue());
      } else {
        errors.push(result.getError());
      }
    });

    if (errors.length > 0 && updatedGenerations.length === 0) {
      return error(`Batch provider check failed: ${errors.join(', ')}`);
    }

    return success(updatedGenerations);
  }

  /**
   * Cache provider response
   */
  private cacheResponse(externalId: string, response: ProviderStatusResponse): void {
    this.requestCache.set(externalId, {
      response,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL_MS
    });

    // Clean up old cache entries
    if (this.requestCache.size > 200) {
      this.cleanupExpiredCache();
    }
  }

  /**
   * Get cached provider response
   */
  private getCachedResponse(externalId: string): ProviderStatusResponse | null {
    const cached = this.requestCache.get(externalId);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.requestCache.delete(externalId);
      return null;
    }

    return cached.response;
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupExpiredCache(): void {
    const now = Date.now();
    
    for (const [key, cached] of this.requestCache.entries()) {
      if (now - cached.timestamp > cached.ttl) {
        this.requestCache.delete(key);
      }
    }
  }

  /**
   * Utility delay function for retry logic
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 