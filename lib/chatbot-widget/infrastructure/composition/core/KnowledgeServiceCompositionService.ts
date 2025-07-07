// Domain service interfaces
import { IKnowledgeRetrievalService } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';

// Infrastructure service implementations
import { VectorKnowledgeRetrievalService } from '../../../domain/services/VectorKnowledgeRetrievalService';

// Dependencies injected to avoid circular imports - following @golden-rule patterns

// Domain errors
import { BusinessRuleViolationError } from '../../../domain/errors/base/DomainErrorBase';

/**
 * Knowledge Service Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Centralized factory for knowledge retrieval services with smart caching
 * - Implement intelligent caching with TTL and LRU eviction per @golden-rule
 * - Validate chatbot configuration before service creation
 * - Use domain errors for validation failures
 * - Cache per organization and configuration for performance
 * - Automatic cache cleanup to prevent memory leaks
 * - Single responsibility: Knowledge service caching and retrieval
 * - Keep under 250 lines - focused on knowledge service concerns only
 * - Follow @golden-rule cache efficient, API efficient, memory efficient patterns
 */
export class KnowledgeServiceCompositionService {
  // ===== CACHE INFRASTRUCTURE =====
  
  // Smart cache for knowledge retrieval services per chatbot configuration
  private static knowledgeRetrievalServiceCache = new Map<string, IKnowledgeRetrievalService>();
  private static readonly MAX_CACHE_SIZE = 20;
  private static readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
  
  // Cache metadata for TTL and eviction policies
  private static cacheMetadata = new Map<string, { created: number; lastAccessed: number }>();

  // ===== KNOWLEDGE SERVICE FACTORY =====

  /**
   * Get Knowledge Retrieval Service with Smart Caching and TTL
   * 
   * AI INSTRUCTIONS:
   * - Implement intelligent caching with TTL and LRU eviction per @golden-rule
   * - Validate chatbot configuration before service creation
   * - Use domain errors for validation failures
   * - Cache per organization and configuration for performance
   * - Automatic cache cleanup to prevent memory leaks
   * - Single responsibility: Provide cached knowledge retrieval services
   * - Dependencies injected to avoid circular imports
   */
  static getKnowledgeRetrievalService(
    chatbotConfig?: any, 
    vectorRepository?: any, 
    embeddingService?: any
  ): IKnowledgeRetrievalService {
    if (!chatbotConfig) {
      throw new BusinessRuleViolationError(
        'Chatbot configuration is required for knowledge retrieval service',
        { service: 'KnowledgeRetrievalService' }
      );
    }

    // Validate required configuration fields
    const configId = chatbotConfig.id;
    const organizationId = chatbotConfig.organizationId;
    
    if (!configId || !organizationId) {
      throw new BusinessRuleViolationError(
        'Chatbot configuration must include id and organizationId',
        { 
          service: 'KnowledgeRetrievalService',
          providedConfig: { id: configId, organizationId },
          missing: { id: !configId, organizationId: !organizationId }
        }
      );
    }

    // Create cache key with version for invalidation
    const lastUpdated = chatbotConfig.lastUpdated?.getTime() || Date.now();
    const configKey = `${organizationId}_${configId}_${lastUpdated}`;
    
    // Check cache with TTL validation
    const cached = this.knowledgeRetrievalServiceCache.get(configKey);
    const metadata = this.cacheMetadata.get(configKey);
    
    if (cached && metadata) {
      const now = Date.now();
      const isExpired = (now - metadata.created) > this.CACHE_TTL_MS;
      
      if (!isExpired) {
        // Update last accessed time for LRU
        metadata.lastAccessed = now;
        return cached;
      } else {
        // Remove expired entry
        this.knowledgeRetrievalServiceCache.delete(configKey);
        this.cacheMetadata.delete(configKey);
      }
    }
    
    // Create new service instance
    try {
      if (!vectorRepository) {
        throw new BusinessRuleViolationError(
          'Vector repository is required for knowledge retrieval service',
          { service: 'KnowledgeRetrievalService', dependency: 'vectorRepository' }
        );
      }
      
      if (!embeddingService) {
        throw new BusinessRuleViolationError(
          'Embedding service is required for knowledge retrieval service', 
          { service: 'KnowledgeRetrievalService', dependency: 'embeddingService' }
        );
      }
      
      const service = new VectorKnowledgeRetrievalService(
        vectorRepository,
        embeddingService,
        organizationId,
        configId
      );
      
      // Cache the new service with metadata
      this.knowledgeRetrievalServiceCache.set(configKey, service);
      this.cacheMetadata.set(configKey, {
        created: Date.now(),
        lastAccessed: Date.now()
      });
      
      // Cleanup cache if it exceeds max size
      this.cleanupCache();
      
      return service;
    } catch (error) {
      throw new BusinessRuleViolationError(
        'Failed to create knowledge retrieval service',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId,
          configId
        }
      );
    }
  }

  // ===== PRIVATE CACHE MANAGEMENT METHODS =====
  
  /**
   * Cleanup cache using LRU eviction policy
   * 
   * AI INSTRUCTIONS:
   * - Follow @golden-rule memory efficient patterns
   * - LRU eviction to maintain performance
   * - Prevent memory leaks with size limits
   */
  private static cleanupCache(): void {
    if (this.knowledgeRetrievalServiceCache.size <= this.MAX_CACHE_SIZE) {
      return;
    }
    
    // Find least recently used entries
    const entries = Array.from(this.cacheMetadata.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed);
    
    // Remove oldest entries until we're under the limit
    const toRemove = entries.slice(0, this.knowledgeRetrievalServiceCache.size - this.MAX_CACHE_SIZE);
    
    for (const [key] of toRemove) {
      this.knowledgeRetrievalServiceCache.delete(key);
      this.cacheMetadata.delete(key);
    }
  }

  // ===== PUBLIC CACHE MANAGEMENT METHODS =====
  
  /**
   * Clear Knowledge Cache for Specific Chatbot
   * 
   * AI INSTRUCTIONS:
   * - Clear cache when knowledge base is updated
   * - Follow @golden-rule cache invalidation patterns
   * - Prevent memory leaks and stale data
   * - Support both specific and global cache clearing
   */
  static clearKnowledgeCache(chatbotConfigId?: string): void {
    if (!chatbotConfigId) {
      // Clear all cache if no specific ID provided
      this.knowledgeRetrievalServiceCache.clear();
      this.cacheMetadata.clear();
      return;
    }
     
    // Remove only affected caches to maintain other chatbot caches
    const keysToRemove: string[] = [];
    
    for (const key of this.knowledgeRetrievalServiceCache.keys()) {
      // Match organization_config pattern
      if (key.includes(`_${chatbotConfigId}_`)) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      this.knowledgeRetrievalServiceCache.delete(key);
      this.cacheMetadata.delete(key);
    }
  }

  /**
   * Warm Knowledge Cache for Better Performance
   * 
   * AI INSTRUCTIONS:
   * - Follow @golden-rule performance optimization patterns
   * - Proactively initialize embeddings for better UX
   * - Single responsibility: Preload commonly used services
   * - Use for application startup or background processing
   * - Validate configurations before warming cache
   * - Dependencies injected to avoid circular imports
   */
  static async warmKnowledgeCache(
    chatbotConfigs: any[], 
    vectorRepository?: any, 
    embeddingService?: any
  ): Promise<void> {
    if (!Array.isArray(chatbotConfigs)) {
      throw new BusinessRuleViolationError(
        'Chatbot configurations must be provided as an array for cache warming',
        { service: 'KnowledgeServiceCompositionService', method: 'warmKnowledgeCache' }
      );
    }
    
    // Filter out invalid configurations
    const validConfigs = chatbotConfigs.filter(config => 
      config && config.id && config.organizationId
    );
    
    if (validConfigs.length === 0) {
      return; // No valid configurations to warm
    }
    
    // Preload knowledge retrieval services for valid configurations
    const warmupPromises = validConfigs.map(async (config) => {
      try {
        const service = this.getKnowledgeRetrievalService(config, vectorRepository, embeddingService);
        // Trigger initialization by calling healthCheck if available
        if (typeof service.healthCheck === 'function') {
          await service.healthCheck();
        }
      } catch (error) {
        // Silent fail for warmup - service will initialize when actually needed
        // This is expected behavior during warmup phase
      }
    });

    await Promise.allSettled(warmupPromises);
  }

  /**
   * Get Cache Statistics
   * 
   * AI INSTRUCTIONS:
   * - Follow @golden-rule monitoring and observability patterns
   * - Provide comprehensive insights into cache performance
   * - Help with debugging and optimization
   * - Include TTL and metadata information
   */
  static getCacheStatistics(): {
    knowledgeCacheSize: number;
    maxCacheSize: number;
    cacheKeys: string[];
    memoryUsage: string;
    cacheTtlMs: number;
    oldestEntry?: { key: string; ageMs: number };
    newestEntry?: { key: string; ageMs: number };
  } {
    const cacheKeys = Array.from(this.knowledgeRetrievalServiceCache.keys());
    const now = Date.now();
    
    // Find oldest and newest entries
    let oldestEntry: { key: string; ageMs: number } | undefined;
    let newestEntry: { key: string; ageMs: number } | undefined;
    
    for (const [key, metadata] of this.cacheMetadata.entries()) {
      const ageMs = now - metadata.created;
      
      if (!oldestEntry || ageMs > oldestEntry.ageMs) {
        oldestEntry = { key, ageMs };
      }
      
      if (!newestEntry || ageMs < newestEntry.ageMs) {
        newestEntry = { key, ageMs };
      }
    }
    
    return {
      knowledgeCacheSize: this.knowledgeRetrievalServiceCache.size,
      maxCacheSize: this.MAX_CACHE_SIZE,
      cacheKeys,
      memoryUsage: `~${(this.knowledgeRetrievalServiceCache.size * 0.5).toFixed(1)}MB estimated`,
      cacheTtlMs: this.CACHE_TTL_MS,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Clear all cached instances (for testing or cleanup)
   * 
   * AI INSTRUCTIONS:
   * - Complete cache reset for testing scenarios
   * - Follow @golden-rule testing support patterns
   * - Reset all caches and metadata
   */
  static clearCache(): void {
    this.knowledgeRetrievalServiceCache.clear();
    this.cacheMetadata.clear();
  }
}