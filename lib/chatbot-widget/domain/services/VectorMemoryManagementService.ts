import { BusinessRuleViolationError } from '../errors/ChatbotWidgetDomainErrors';
import { ISessionLogger } from './interfaces/IChatbotLoggingService';
import { 
  CachedKnowledgeVector, 
  VectorCacheConfig, 
  MemoryEvictionResult, 
  MemoryEvictionReason,
  VectorCacheEntry
} from '../types/VectorCacheTypes';

/**
 * Vector Memory Management Service
 * 
 * AI INSTRUCTIONS:
 * - Handle all memory management logic for vector cache
 * - Implement LRU eviction strategy with configurable limits
 * - Use domain-specific error types for memory violations
 * - Keep memory management logic pure and testable
 * - Support both memory size and vector count limits
 * - Provide detailed logging for memory operations
 */
export class VectorMemoryManagementService {

  /**
   * Default memory management configuration
   * 
   * AI INSTRUCTIONS:
   * - Define reasonable default values for production use
   * - Prevent excessive memory usage
   * - Support efficient vector storage
   */
  static readonly DEFAULT_CONFIG: Required<VectorCacheConfig> = {
    maxMemoryKB: 50 * 1024, // 50MB default
    maxVectors: 10000,
    enableLRUEviction: true,
    evictionBatchSize: 100
  };

  /**
   * Create normalized configuration with defaults
   * 
   * AI INSTRUCTIONS:
   * - Apply default values for undefined options
   * - Validate and sanitize configuration parameters
   * - Return complete configuration object
   */
  static createConfig(config: VectorCacheConfig = {}): Required<VectorCacheConfig> {
    const normalizedConfig = {
      maxMemoryKB: config.maxMemoryKB || this.DEFAULT_CONFIG.maxMemoryKB,
      maxVectors: config.maxVectors || this.DEFAULT_CONFIG.maxVectors,
      enableLRUEviction: config.enableLRUEviction ?? this.DEFAULT_CONFIG.enableLRUEviction,
      evictionBatchSize: config.evictionBatchSize || this.DEFAULT_CONFIG.evictionBatchSize
    };

    this.validateConfig(normalizedConfig);
    return normalizedConfig;
  }

  /**
   * Enforce memory limits using LRU eviction
   * 
   * AI INSTRUCTIONS:
   * - Check if memory usage exceeds configured limits
   * - Evict least recently used vectors in batches
   * - Log eviction operations for monitoring
   * - Return detailed eviction results
   */
  static enforceMemoryLimits(
    vectorCache: Map<string, CachedKnowledgeVector>,
    config: Required<VectorCacheConfig>,
    logger: ISessionLogger
  ): MemoryEvictionResult {
    if (!config.enableLRUEviction) {
      return {
        evictedCount: 0,
        reason: 'memory',
        memoryUsageKB: this.calculateMemoryUsage(vectorCache),
        vectorCount: vectorCache.size
      };
    }

    const currentMemoryKB = this.calculateMemoryUsage(vectorCache);
    const currentVectorCount = vectorCache.size;
    let evictedCount = 0;
    let evictionReason: MemoryEvictionReason = 'memory';

    // Check memory limit
    if (currentMemoryKB > config.maxMemoryKB) {
      logger.logMessage(`⚠️ Memory limit exceeded: ${currentMemoryKB} KB > ${config.maxMemoryKB} KB`);
      evictedCount = this.evictLRUVectors(vectorCache, config, logger, 'memory');
      evictionReason = 'memory';
    }
    // Check vector count limit
    else if (currentVectorCount > config.maxVectors) {
      logger.logMessage(`⚠️ Vector count limit exceeded: ${currentVectorCount} > ${config.maxVectors}`);
      evictedCount = this.evictLRUVectors(vectorCache, config, logger, 'count');
      evictionReason = 'count';
    }

    return {
      evictedCount,
      reason: evictionReason,
      memoryUsageKB: this.calculateMemoryUsage(vectorCache),
      vectorCount: vectorCache.size
    };
  }

  /**
   * Evict least recently used vectors
   * 
   * AI INSTRUCTIONS:
   * - Sort vectors by last accessed time (oldest first)
   * - Remove vectors in configured batch size
   * - Log eviction details for monitoring
   * - Return count of evicted vectors
   */
  static evictLRUVectors(
    vectorCache: Map<string, CachedKnowledgeVector>,
    config: Required<VectorCacheConfig>,
    logger: ISessionLogger,
    reason: MemoryEvictionReason
  ): number {
    // Sort vectors by last accessed time (oldest first)
    const sortedEntries = Array.from(vectorCache.entries())
      .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    const toEvict = Math.min(config.evictionBatchSize, sortedEntries.length);
    let evicted = 0;

    for (let i = 0; i < toEvict; i++) {
      const [key] = sortedEntries[i];
      vectorCache.delete(key);
      evicted++;
    }

    logger.logMessage(`🗑️ Evicted ${evicted} vectors (reason: ${reason} limit exceeded)`);
    logger.logMessage(`📊 Cache size after eviction: ${vectorCache.size} vectors`);

    return evicted;
  }

  /**
   * Calculate approximate memory usage in KB
   * 
   * AI INSTRUCTIONS:
   * - Estimate memory usage based on vector count and dimensions
   * - Account for vector data, metadata, and tracking overhead
   * - Return reasonable approximation for monitoring
   */
  static calculateMemoryUsage(vectorCache: Map<string, CachedKnowledgeVector>): number {
    const vectorCount = vectorCache.size;
    if (vectorCount === 0) return 0;

    // Estimate: ~7KB per vector (1536 dimensions * 4 bytes + metadata + tracking)
    return Math.round(vectorCount * 7);
  }

  /**
   * Get memory utilization percentage
   * 
   * AI INSTRUCTIONS:
   * - Calculate percentage of memory limit used
   * - Handle edge cases like zero limits
   * - Return value between 0 and 100
   */
  static getMemoryUtilization(
    vectorCache: Map<string, CachedKnowledgeVector>,
    config: Required<VectorCacheConfig>
  ): number {
    if (config.maxMemoryKB <= 0) return 0;
    
    const currentMemoryKB = this.calculateMemoryUsage(vectorCache);
    return (currentMemoryKB / config.maxMemoryKB) * 100;
  }

  /**
   * Check if memory limits are exceeded
   * 
   * AI INSTRUCTIONS:
   * - Check both memory and vector count limits
   * - Return boolean indicating if eviction is needed
   * - Handle disabled eviction configuration
   */
  static isMemoryLimitExceeded(
    vectorCache: Map<string, CachedKnowledgeVector>,
    config: Required<VectorCacheConfig>
  ): boolean {
    if (!config.enableLRUEviction) return false;

    const currentMemoryKB = this.calculateMemoryUsage(vectorCache);
    const currentVectorCount = vectorCache.size;

    return currentMemoryKB > config.maxMemoryKB || currentVectorCount > config.maxVectors;
  }

  /**
   * Update vector access tracking for LRU
   * 
   * AI INSTRUCTIONS:
   * - Update last accessed time and access count
   * - Handle bulk updates efficiently
   * - Maintain accurate LRU ordering
   */
  static updateVectorAccess(
    cachedVector: CachedKnowledgeVector,
    accessTime: Date = new Date()
  ): void {
    cachedVector.lastAccessed = accessTime;
    cachedVector.accessCount++;
  }

  /**
   * Validate memory management configuration
   * 
   * AI INSTRUCTIONS:
   * - Validate configuration parameters
   * - Use domain-specific error types
   * - Check for reasonable limits and values
   */
  private static validateConfig(config: Required<VectorCacheConfig>): void {
    if (config.maxMemoryKB <= 0) {
      throw new BusinessRuleViolationError(
        'Max memory KB must be positive',
        { maxMemoryKB: config.maxMemoryKB }
      );
    }

    if (config.maxVectors <= 0) {
      throw new BusinessRuleViolationError(
        'Max vectors must be positive',
        { maxVectors: config.maxVectors }
      );
    }

    if (config.evictionBatchSize <= 0) {
      throw new BusinessRuleViolationError(
        'Eviction batch size must be positive',
        { evictionBatchSize: config.evictionBatchSize }
      );
    }

    if (config.evictionBatchSize > config.maxVectors) {
      throw new BusinessRuleViolationError(
        'Eviction batch size cannot exceed max vectors',
        { evictionBatchSize: config.evictionBatchSize, maxVectors: config.maxVectors }
      );
    }
  }
} 