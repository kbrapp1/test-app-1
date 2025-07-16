import { Generation } from '../../domain/entities/Generation';
import { GenerationStatusDomainService } from '../../domain/services/GenerationStatusDomainService';
import { success, error, Result } from '../common/Result';
import { ProviderStatusCache } from './services/ProviderStatusCache';
import { ProviderConfigManager, ProviderConfig } from './services/ProviderConfigManager';
import { ProviderStatusFetcher } from './services/ProviderStatusFetcher';
import { ProviderBatchProcessor } from './services/ProviderBatchProcessor';
import { ProviderStatusUpdater } from './services/ProviderStatusUpdater';

/**
 * Infrastructure Layer - ExternalProviderStatusService orchestrates provider status operations
 * Single Responsibility: Coordinate caching, config management, and provider API clients
 * Golden Rule DDD: Delegate focused concerns to dedicated services (config, cache, API clients)
 */
export class ExternalProviderStatusService {
  
  private readonly configManager: ProviderConfigManager;
  private readonly cache: ProviderStatusCache;
  private readonly fetcher: ProviderStatusFetcher;
  private readonly batchProcessor: ProviderBatchProcessor;
  private readonly updater: ProviderStatusUpdater;

  constructor(
    providers: ProviderConfig[] = []
  ) {
    this.configManager = new ProviderConfigManager(providers);
    this.cache = new ProviderStatusCache();
    this.fetcher = new ProviderStatusFetcher();
    this.batchProcessor = new ProviderBatchProcessor();
    this.updater = new ProviderStatusUpdater();
  }

  /**
   * Infrastructure Layer - Orchestrator for single-generation status checks
   * Delegates caching and API calls to focused services
   * Implements provider polling contract by integrating cache, config, and client
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
    const providerConfig = this.configManager.getProviderConfig(providerName);
    
    if (!providerConfig) {
      return error(`Unsupported provider: ${providerName}`);
    }

    try {
      // Check cache first
      const cachedResponse = this.cache.getCachedResponse(providerId);
      if (cachedResponse) {
        return this.updater.applyResponse(generation, cachedResponse);
      }

      // Make external API call with retry logic
      const statusResult = await this.fetcher.fetchWithRetry(
        providerConfig,
        providerId
      );

      if (!statusResult.isSuccess()) {
        return error(statusResult.getError());
      }

      const response = statusResult.getValue();
      
      // Cache and apply the response
      this.cache.cacheResponse(providerId, response);
      return this.updater.applyResponse(generation, response);

    } catch (err) {
      return error(`Provider status check failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  /**
   * Infrastructure Layer - Orchestrator for batch status checks
   * Groups by provider, delegates to client service, and aggregates results
   * Single Responsibility: Efficient batch processing with error handling
   */
  async checkMultipleGenerationStatus(
    generations: Generation[]
  ): Promise<Result<Generation[], string>> {
    if (generations.length === 0) {
      return success([]);
    }

    try {
      // Group generations by provider for efficient batching
      const generationsByProvider = this.batchProcessor.groupByProvider(generations);
      const updatedGenerations: Generation[] = [];
      const errors: string[] = [];

      // Process each provider group
      for (const [providerName, providerGenerations] of generationsByProvider.entries()) {
        const providerConfig = this.configManager.getProviderConfig(providerName);
        
        if (!providerConfig) {
          errors.push(`Unsupported provider: ${providerName}`);
          // Add unchanged generations to results
          updatedGenerations.push(...providerGenerations);
          continue;
        }

        // Process generations for this provider
        const batchResult = await this.batchProcessor.processBatchForProvider(
          providerGenerations,
          this.checkGenerationStatus.bind(this)
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
} 