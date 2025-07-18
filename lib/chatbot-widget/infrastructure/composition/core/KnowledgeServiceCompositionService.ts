// Domain service interfaces
import { IKnowledgeRetrievalService } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { IVectorKnowledgeRepository } from '../../../domain/repositories/IVectorKnowledgeRepository';
import { IEmbeddingService } from '../../../domain/services/interfaces/IEmbeddingService';

// Infrastructure service implementations
import { VectorKnowledgeRetrievalService } from '../../../domain/services/VectorKnowledgeRetrievalService';

// Dependencies injected to avoid circular imports - following @golden-rule patterns

// Domain errors
import { BusinessRuleViolationError } from '../../../domain/errors/base/DomainErrorBase';

/** Knowledge Service Composition Service
 */
export class KnowledgeServiceCompositionService {
  // ===== SIMPLE CACHE INFRASTRUCTURE =====
  
  // Simple cache for knowledge retrieval services per chatbot configuration
  // AI: Removed complex cache management - serverless handles cleanup automatically
  private static knowledgeRetrievalServiceCache = new Map<string, IKnowledgeRetrievalService>();

  // ===== KNOWLEDGE SERVICE FACTORY =====

  /**
   * Get Knowledge Retrieval Service with Simple Caching
   * 
   * AI INSTRUCTIONS:
   * - Simple cache without TTL/LRU - serverless handles cleanup automatically
   * - Validate chatbot configuration before service creation
   * - Use domain errors for validation failures
   * - Cache per organization and configuration for performance
   * - Single responsibility: Provide cached knowledge retrieval services
   * - Dependencies injected to avoid circular imports
   */
  static getKnowledgeRetrievalService(
    chatbotConfig?: { id: string; organizationId: string; lastUpdated?: Date }, 
    vectorRepository?: Record<string, unknown>, 
    embeddingService?: Record<string, unknown>
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

    // Create simple cache key
    const configKey = `${organizationId}_${configId}`;
    
    // Check simple cache
    const cached = this.knowledgeRetrievalServiceCache.get(configKey);
    if (cached) {
      return cached;
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
        vectorRepository as unknown as IVectorKnowledgeRepository,
        embeddingService as unknown as IEmbeddingService,
        organizationId,
        configId
      );
      
      // Cache the new service
      this.knowledgeRetrievalServiceCache.set(configKey, service);
      
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

  // ===== SIMPLE CACHE MANAGEMENT =====
  
  /** Clear Knowledge Cache for Specific Chatbot (simplified)
   * 
   * AI INSTRUCTIONS:
   * - Simplified cache clearing without complex metadata
   * - Serverless handles automatic cleanup
   * - Keep only for testing/debugging purposes
   */
  static clearKnowledgeCache(chatbotConfigId?: string): void {
    if (!chatbotConfigId) {
      // Clear all cache if no specific ID provided
      this.knowledgeRetrievalServiceCache.clear();
      return;
    }
     
    // Remove only affected caches to maintain other chatbot caches
    const keysToRemove: string[] = [];
    
    for (const key of Array.from(this.knowledgeRetrievalServiceCache.keys())) {
      // Match organization_config pattern
      if (key.includes(`_${chatbotConfigId}`)) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      this.knowledgeRetrievalServiceCache.delete(key);
    }
  }

  /** Warm Knowledge Cache for Better Performance
 */
  static async warmKnowledgeCache(
    chatbotConfigs: Array<{ id: string; organizationId: string; lastUpdated?: Date }>, 
    vectorRepository?: Record<string, unknown>, 
    embeddingService?: Record<string, unknown>
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
      } catch {
        // Silent fail for warmup - service will initialize when actually needed
        // This is expected behavior during warmup phase
      }
    });

    await Promise.allSettled(warmupPromises);
  }

  /**
   * Get Simple Cache Statistics
   * 
   * AI INSTRUCTIONS:
   * - Simplified cache statistics without complex metadata
   * - Follow @golden-rule monitoring patterns
   * - Provide basic insights for debugging
   */
  static getCacheStatistics(): {
    knowledgeCacheSize: number;
    cacheKeys: string[];
    memoryUsage: string;
  } {
    return {
      knowledgeCacheSize: this.knowledgeRetrievalServiceCache.size,
      cacheKeys: Array.from(this.knowledgeRetrievalServiceCache.keys()),
      memoryUsage: `~${(this.knowledgeRetrievalServiceCache.size * 0.5).toFixed(1)}MB estimated`
    };
  }

  /**
   * Clear all cached instances (for testing or cleanup)
   * 
   * AI INSTRUCTIONS:
   * - Simple cache reset for testing scenarios
   * - Follow @golden-rule testing support patterns
   * - Serverless handles automatic cleanup
   */
  static clearCache(): void {
    this.knowledgeRetrievalServiceCache.clear();
  }
}