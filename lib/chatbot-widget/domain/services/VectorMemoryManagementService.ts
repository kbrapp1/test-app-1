import { BusinessRuleViolationError } from '../errors/ChatbotWidgetDomainErrors';
import { ISessionLogger } from './interfaces/IChatbotLoggingService';
import { 
  CachedKnowledgeVector, 
  VectorCacheConfig, 
  MemoryEvictionResult, 
  MemoryEvictionReason,
  VectorCacheEntry
} from '../types/VectorCacheTypes';

/** Vector Memory Management Service
 */
export class VectorMemoryManagementService {

  /** Default memory management configuration
 */
  static readonly DEFAULT_CONFIG: Required<VectorCacheConfig> = {
    maxMemoryKB: 50 * 1024, // 50MB default
    maxVectors: 10000,
    // AI: Removed LRU eviction - let serverless platform handle memory management
    evictionBatchSize: 100
  };

  /** Create normalized configuration with defaults
 */
  static createConfig(config: VectorCacheConfig = {}): Required<VectorCacheConfig> {
    const normalizedConfig = {
      maxMemoryKB: config.maxMemoryKB || this.DEFAULT_CONFIG.maxMemoryKB,
      maxVectors: config.maxVectors || this.DEFAULT_CONFIG.maxVectors,
      // AI: Removed LRU eviction - let serverless platform handle memory management
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
    // AI: Removed LRU eviction - let serverless platform handle memory management
    return {
      evictedCount: 0,
      reason: 'memory',
      memoryUsageKB: this.calculateMemoryUsage(vectorCache),
      vectorCount: vectorCache.size
    };

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

  /** Evict least recently used vectors
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

  /** Calculate approximate memory usage in KB
 */
  static calculateMemoryUsage(vectorCache: Map<string, CachedKnowledgeVector>): number {
    const vectorCount = vectorCache.size;
    if (vectorCount === 0) return 0;

    // Estimate: ~7KB per vector (1536 dimensions * 4 bytes + metadata + tracking)
    return Math.round(vectorCount * 7);
  }

  /** Get memory utilization percentage
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
    // AI: Removed LRU eviction - let serverless platform handle memory management
    return false;
  }

  /** Update vector access tracking for LRU
 */
  static updateVectorAccess(
    cachedVector: CachedKnowledgeVector,
    accessTime: Date = new Date()
  ): void {
    cachedVector.lastAccessed = accessTime;
    cachedVector.accessCount++;
  }

  /** Validate memory management configuration
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