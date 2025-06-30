/**
 * Vector Knowledge Cache Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: In-memory vector storage and similarity search with memory management
 * - Domain service focused on vector mathematics and caching
 * - Keep business logic pure, no external dependencies
 * - Never exceed 250 lines per @golden-rule
 * - Use structured logging for cache operations
 * - Handle domain errors with specific error types
 * - Cache vectors per chatbot configuration for performance
 * - Implement memory limits and LRU eviction for production safety
 */

import { KnowledgeItem } from './interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError } from '../../../errors/base';
import { IChatbotLoggingService, ISessionLogger } from './interfaces/IChatbotLoggingService';

export interface CachedKnowledgeVector {
  item: KnowledgeItem;
  vector: number[];
  similarity?: number;
  lastAccessed: Date;
  accessCount: number;
}

export interface VectorCacheStats {
  totalVectors: number;
  memoryUsageKB: number;
  memoryLimitKB: number;
  memoryUtilization: number;
  cacheHitRate: number;
  searchesPerformed: number;
  cacheHits: number;
  evictionsPerformed: number;
  lastUpdated: Date;
}

export interface VectorSearchOptions {
  threshold?: number;
  limit?: number;
  categoryFilter?: string;
  sourceTypeFilter?: string;
}

export interface VectorCacheConfig {
  maxMemoryKB?: number; // Default: 50MB
  maxVectors?: number; // Default: 10000
  enableLRUEviction?: boolean; // Default: true
  evictionBatchSize?: number; // Default: 100
}

/**
 * In-Memory Vector Knowledge Cache Service with Memory Management
 * 
 * AI INSTRUCTIONS:
 * - Loads all knowledge vectors into memory during initialization
 * - Performs cosine similarity search in-memory for maximum performance
 * - Implements LRU eviction when memory limits are exceeded
 * - Tracks cache hit/miss statistics for monitoring
 * - Provides logging for cache operations and search performance
 * - Single responsibility: vector caching, similarity mathematics, and memory management
 */
export class VectorKnowledgeCache {
  private cachedVectors: Map<string, CachedKnowledgeVector> = new Map();
  private isInitialized: boolean = false;
  private initializationTime: Date | null = null;
  private searchCount: number = 0;
  private cacheHits: number = 0;
  private evictionsPerformed: number = 0;
  private readonly loggingService: IChatbotLoggingService;
  private readonly config: Required<VectorCacheConfig>;

  constructor(
    private readonly organizationId: string,
    private readonly chatbotConfigId: string,
    loggingService: IChatbotLoggingService,
    config: VectorCacheConfig = {}
  ) {
    this.loggingService = loggingService;
    
    // Set default configuration with memory limits
    this.config = {
      maxMemoryKB: config.maxMemoryKB || 50 * 1024, // 50MB default
      maxVectors: config.maxVectors || 10000,
      enableLRUEviction: config.enableLRUEviction ?? true,
      evictionBatchSize: config.evictionBatchSize || 100
    };
  }

  /**
   * Initialize cache with knowledge vectors
   * 
   * AI INSTRUCTIONS:
   * - Load vectors into memory map for fast access
   * - Apply memory limits and evict if necessary
   * - Log cache initialization performance metrics
   * - Handle initialization errors gracefully
   * - Track memory usage and vector count
   */
  async initialize(
    vectors: Array<{ item: KnowledgeItem; vector: number[] }>,
    sharedLogFile: string
  ): Promise<{ success: boolean; vectorsLoaded: number; vectorsEvicted: number; memoryUsageKB: number; timeMs: number }> {
    const startTime = Date.now();

    try {
      const logger = this.loggingService.createSessionLogger(
        'vector-cache',
        sharedLogFile,
        {
          operation: 'cache-initialization',
          organizationId: this.organizationId
        }
      );

      logger.logStep('Vector Cache Initialization with Memory Management');
      logger.logMessage(`Loading ${vectors.length} knowledge vectors into memory`);
      logger.logMessage(`📊 Memory limit: ${this.config.maxMemoryKB} KB, Vector limit: ${this.config.maxVectors}`);

      // Clear existing cache
      this.cachedVectors.clear();
      this.searchCount = 0;
      this.cacheHits = 0;
      this.evictionsPerformed = 0;

      // Load vectors into memory with access tracking
      const now = new Date();
      vectors.forEach(({ item, vector }) => {
        const cacheKey = this.generateCacheKey(item.id);
        this.cachedVectors.set(cacheKey, {
          item,
          vector: [...vector], // Create copy to prevent external mutations
          lastAccessed: now,
          accessCount: 0
        });
      });

      // Check memory limits and evict if necessary
      const vectorsEvicted = await this.enforceMemoryLimits(logger);

      // Calculate final memory usage
      const memoryUsageKB = this.calculateMemoryUsage();
      const timeMs = Date.now() - startTime;

      this.isInitialized = true;
      this.initializationTime = new Date();

      logger.logMessage(`✅ Cache initialized successfully`);
      logger.logMessage(`📊 Vectors loaded: ${this.cachedVectors.size}`);
      logger.logMessage(`📊 Vectors evicted: ${vectorsEvicted}`);
      logger.logMessage(`📊 Memory usage: ${memoryUsageKB} KB (${((memoryUsageKB / this.config.maxMemoryKB) * 100).toFixed(1)}% of limit)`);
      logger.logMessage(`📊 Data Source: In-memory vector cache (no database queries)`);
      
      logger.logMetrics('vector-cache-init', {
        duration: timeMs,
        customMetrics: {
          vectorsLoaded: this.cachedVectors.size,
          vectorsEvicted,
          memoryUsageKB,
          memoryUtilization: (memoryUsageKB / this.config.maxMemoryKB) * 100,
          averageVectorSize: vectors.length > 0 ? vectors[0].vector.length : 0
        }
      });

      return {
        success: true,
        vectorsLoaded: this.cachedVectors.size,
        vectorsEvicted,
        memoryUsageKB,
        timeMs
      };

    } catch (error) {
      const timeMs = Date.now() - startTime;
      
      throw new BusinessRuleViolationError(
        'Vector cache initialization failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId,
          vectorCount: vectors.length,
          timeMs
        }
      );
    }
  }

  /**
   * Search cached vectors using cosine similarity
   * 
   * AI INSTRUCTIONS:
   * - Perform in-memory cosine similarity calculations
   * - Update access tracking for LRU eviction
   * - Log cache hit statistics and performance metrics
   * - Return results sorted by similarity score
   * - Track search statistics for monitoring
   */
  async searchVectors(
    queryEmbedding: number[],
    options: VectorSearchOptions = {},
    sharedLogFile: string
  ): Promise<Array<{ item: KnowledgeItem; similarity: number }>> {
    const startTime = Date.now();

    if (!this.isInitialized) {
      throw new BusinessRuleViolationError(
        'Vector cache not initialized - call initialize() first',
        {
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId,
          operation: 'searchVectors'
        }
      );
    }

    try {
      const logger = this.loggingService.createSessionLogger(
        'vector-search',
        sharedLogFile,
        {
          operation: 'cached-vector-search',
          organizationId: this.organizationId
        }
      );

      this.searchCount++;
      this.cacheHits++; // All searches are cache hits since we search in-memory

      const threshold = options.threshold || 0.15; // Restored normal threshold
      const limit = options.limit || 5;

      logger.logMessage(`🔍 Searching ${this.cachedVectors.size} cached vectors`);
      logger.logMessage(`📊 Data Source: In-memory vector cache (cache hit)`);
      logger.logMessage(`Search threshold: ${threshold}, limit: ${limit}`);
      logger.logMessage(`🔍 Query embedding dimensions: ${queryEmbedding.length}`);

      const searchResults: Array<{ item: KnowledgeItem; similarity: number }> = [];
      const allSimilarities: Array<{ id: string; similarity: number }> = [];
      const now = new Date();

      // Perform cosine similarity search in memory with access tracking
      for (const [key, cachedVector] of this.cachedVectors.entries()) {
        // Update access tracking for LRU
        cachedVector.lastAccessed = now;
        cachedVector.accessCount++;

        // Apply filters
        if (options.categoryFilter && cachedVector.item.category !== options.categoryFilter) {
          continue;
        }
        if (options.sourceTypeFilter && cachedVector.item.source !== options.sourceTypeFilter) {
          continue;
        }

        // Calculate cosine similarity
        const similarity = this.calculateCosineSimilarity(queryEmbedding, cachedVector.vector);

        // Track all similarities for debugging
        allSimilarities.push({
          id: cachedVector.item.id,
          similarity
        });

        // Add to results if above threshold
        if (similarity >= threshold) {
          searchResults.push({
            item: cachedVector.item,
            similarity
          });
        }
      }

      // Log summary statistics
      logger.logMessage(`🔍 Total similarities calculated: ${allSimilarities.length}`);
      
      if (allSimilarities.length > 0) {
        allSimilarities
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, 5)
          .forEach((item, index) => {
            const passedThreshold = item.similarity >= threshold ? '✅' : '❌';
            logger.logMessage(`  ${index + 1}. ${item.id}: ${(item.similarity * 100).toFixed(1)}% ${passedThreshold}`);
          });
      }

      // Sort by similarity (highest first) and limit results
      searchResults.sort((a, b) => b.similarity - a.similarity);
      const limitedResults = searchResults.slice(0, limit);

      const timeMs = Date.now() - startTime;
      const stats = this.getCacheStats();

      logger.logMessage(`✅ Search completed in ${timeMs}ms`);
      logger.logMessage(`Found ${limitedResults.length} relevant items`);
      logger.logMessage(`📊 Cache Hit Rate: ${(stats.cacheHitRate * 100).toFixed(1)}%`);
      logger.logMessage(`📊 Memory Usage: ${stats.memoryUsageKB} KB (${stats.memoryUtilization.toFixed(1)}% of limit)`);

      if (limitedResults.length > 0) {
        logger.logMessage(`Best match similarity: ${limitedResults[0].similarity.toFixed(3)}`);
        logger.logMessage(`Worst match similarity: ${limitedResults[limitedResults.length - 1].similarity.toFixed(3)}`);
      }

      logger.logMetrics('cached-vector-search', {
        duration: timeMs,
        customMetrics: {
          vectorsSearched: this.cachedVectors.size,
          resultsFound: limitedResults.length,
          cacheHitRate: stats.cacheHitRate,
          memoryUtilization: stats.memoryUtilization,
          searchThreshold: threshold
        }
      });

      return limitedResults;

    } catch (error) {
      const timeMs = Date.now() - startTime;
      
      throw new BusinessRuleViolationError(
        'Cached vector search failed',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId,
          searchTimeMs: timeMs,
          cacheSize: this.cachedVectors.size
        }
      );
    }
  }

  /**
   * Enforce memory limits using LRU eviction
   * 
   * AI INSTRUCTIONS:
   * - Check if memory usage exceeds configured limits
   * - Evict least recently used vectors in batches
   * - Log eviction operations for monitoring
   * - Return count of evicted vectors
   */
  private async enforceMemoryLimits(logger: ISessionLogger): Promise<number> {
    if (!this.config.enableLRUEviction) {
      return 0;
    }

    const currentMemoryKB = this.calculateMemoryUsage();
    const currentVectorCount = this.cachedVectors.size;
    let evictedCount = 0;

    // Check memory limit
    if (currentMemoryKB > this.config.maxMemoryKB) {
      logger.logMessage(`⚠️ Memory limit exceeded: ${currentMemoryKB} KB > ${this.config.maxMemoryKB} KB`);
      evictedCount = this.evictLRUVectors(logger, 'memory');
    }
    // Check vector count limit
    else if (currentVectorCount > this.config.maxVectors) {
      logger.logMessage(`⚠️ Vector count limit exceeded: ${currentVectorCount} > ${this.config.maxVectors}`);
      evictedCount = this.evictLRUVectors(logger, 'count');
    }

    return evictedCount;
  }

  /**
   * Evict least recently used vectors
   */
  private evictLRUVectors(logger: ISessionLogger, reason: 'memory' | 'count'): number {
    // Sort vectors by last accessed time (oldest first)
    const sortedEntries = Array.from(this.cachedVectors.entries())
      .sort(([, a], [, b]) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    const toEvict = Math.min(this.config.evictionBatchSize, sortedEntries.length);
    let evicted = 0;

    for (let i = 0; i < toEvict; i++) {
      const [key] = sortedEntries[i];
      this.cachedVectors.delete(key);
      evicted++;
    }

    this.evictionsPerformed += evicted;
    
    logger.logMessage(`🗑️ Evicted ${evicted} vectors (reason: ${reason} limit exceeded)`);
    logger.logMessage(`📊 Cache size after eviction: ${this.cachedVectors.size} vectors`);

    return evicted;
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): VectorCacheStats {
    const memoryUsageKB = this.calculateMemoryUsage();
    return {
      totalVectors: this.cachedVectors.size,
      memoryUsageKB,
      memoryLimitKB: this.config.maxMemoryKB,
      memoryUtilization: (memoryUsageKB / this.config.maxMemoryKB) * 100,
      cacheHitRate: this.getCacheHitRate(),
      searchesPerformed: this.searchCount,
      cacheHits: this.cacheHits,
      evictionsPerformed: this.evictionsPerformed,
      lastUpdated: this.initializationTime || new Date()
    };
  }

  /**
   * Check if cache is initialized and ready for searches
   */
  isReady(): boolean {
    return this.isInitialized && this.cachedVectors.size > 0;
  }

  /**
   * Clear cache and reset statistics
   */
  clear(): void {
    this.cachedVectors.clear();
    this.isInitialized = false;
    this.initializationTime = null;
    this.searchCount = 0;
    this.cacheHits = 0;
    this.evictionsPerformed = 0;
  }

  /**
   * Calculate cosine similarity between two vectors
   * 
   * AI INSTRUCTIONS:
   * - Pure mathematical function for vector similarity
   * - Handle edge cases (zero vectors, different dimensions)
   * - Optimize for performance with minimal allocations
   */
  private calculateCosineSimilarity(vectorA: number[], vectorB: number[]): number {
    if (vectorA.length !== vectorB.length) {
      throw new BusinessRuleViolationError(
        'Vector dimensions must match for similarity calculation',
        { dimA: vectorA.length, dimB: vectorB.length }
      );
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0; // Handle zero vectors
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Generate cache key for knowledge item
   */
  private generateCacheKey(itemId: string): string {
    return `${this.organizationId}_${this.chatbotConfigId}_${itemId}`;
  }

  /**
   * Calculate approximate memory usage in KB
   */
  private calculateMemoryUsage(): number {
    const vectorCount = this.cachedVectors.size;
    if (vectorCount === 0) return 0;

    // Estimate: ~7KB per vector (1536 dimensions * 4 bytes + metadata + tracking)
    return Math.round(vectorCount * 7);
  }

  /**
   * Calculate cache hit rate percentage
   */
  private getCacheHitRate(): number {
    return this.searchCount > 0 ? this.cacheHits / this.searchCount : 1.0;
  }
} 