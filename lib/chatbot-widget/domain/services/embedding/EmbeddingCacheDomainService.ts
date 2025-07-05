/**
 * Embedding Cache Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain logic for embedding cache management and eviction strategies
 * - No external dependencies, only domain logic
 * - Keep under 250 lines by focusing on core cache operations
 * - Follow @golden-rule patterns exactly
 * - Single responsibility: cache management with LRU eviction
 */

import {
  EmbeddingResult,
  CacheStats,
  CacheConfiguration,
  CacheType,
  EMBEDDING_CONSTANTS
} from '../interfaces/EmbeddingTypes';

export class EmbeddingCacheDomainService {
  private knowledgeBaseCache = new Map<string, EmbeddingResult>();
  private userQueryCache = new Map<string, EmbeddingResult>();
  private pdfDocumentCache = new Map<string, EmbeddingResult>();
  private config: CacheConfiguration;

  constructor(config?: Partial<CacheConfiguration>) {
    this.config = {
      maxUserQueryCacheSize: config?.maxUserQueryCacheSize ?? EMBEDDING_CONSTANTS.DEFAULT_USER_QUERY_CACHE_SIZE,
      maxPdfCacheSize: config?.maxPdfCacheSize ?? EMBEDDING_CONSTANTS.DEFAULT_PDF_CACHE_SIZE,
      maxKnowledgeBaseCacheSize: config?.maxKnowledgeBaseCacheSize
    };
  }

  /**
   * Generate cache key for text
   * 
   * AI INSTRUCTIONS:
   * - Pure function for cache key generation
   * - Consistent hashing for same text content
   * - Case-insensitive and whitespace-normalized
   */
  generateCacheKey(text: string): string {
    return Buffer.from(text.trim().toLowerCase()).toString('base64');
  }

  /**
   * Get embedding from appropriate cache
   * 
   * AI INSTRUCTIONS:
   * - Check all cache types in priority order
   * - Update LRU for user query cache only
   * - Knowledge base cache is permanent (no LRU)
   */
  getEmbedding(cacheKey: string): EmbeddingResult | undefined {
    // Check knowledge base cache first (permanent, no LRU)
    const knowledgeBaseCached = this.knowledgeBaseCache.get(cacheKey);
    if (knowledgeBaseCached) {
      return knowledgeBaseCached;
    }

    // Check PDF cache with LRU update
    const pdfCached = this.pdfDocumentCache.get(cacheKey);
    if (pdfCached) {
      // Move to end (most recently used)
      this.pdfDocumentCache.delete(cacheKey);
      this.pdfDocumentCache.set(cacheKey, pdfCached);
      return pdfCached;
    }

    // Check user query cache with LRU update
    const userQueryCached = this.userQueryCache.get(cacheKey);
    if (userQueryCached) {
      // Move to end (most recently used)
      this.userQueryCache.delete(cacheKey);
      this.userQueryCache.set(cacheKey, userQueryCached);
    }
    
    return userQueryCached;
  }

  /**
   * Store embedding in appropriate cache
   * 
   * AI INSTRUCTIONS:
   * - Determine cache type based on content analysis
   * - Apply appropriate eviction strategy
   * - Return cache type used for logging
   */
  storeEmbedding(cacheKey: string, result: EmbeddingResult): CacheType {
    const cacheType = this.determineCacheType(result.text);
    
    switch (cacheType) {
      case CacheType.KNOWLEDGE_BASE:
        this.storeInKnowledgeBaseCache(cacheKey, result);
        break;
      case CacheType.PDF_DOCUMENT:
        this.storeInPdfCache(cacheKey, result);
        break;
      case CacheType.USER_QUERY:
        this.storeInUserQueryCache(cacheKey, result);
        break;
    }
    
    return cacheType;
  }

  /**
   * Store in knowledge base cache (permanent)
   * 
   * AI INSTRUCTIONS:
   * - No eviction for knowledge base cache
   * - Permanent storage for business knowledge
   * - No size limits for core business data
   */
  private storeInKnowledgeBaseCache(cacheKey: string, result: EmbeddingResult): void {
    this.knowledgeBaseCache.set(cacheKey, result);
  }

  /**
   * Store in PDF cache with LRU eviction
   * 
   * AI INSTRUCTIONS:
   * - LRU eviction when at capacity
   * - Larger cache size for document processing
   * - Remove oldest entries first
   */
  private storeInPdfCache(cacheKey: string, result: EmbeddingResult): void {
    if (this.pdfDocumentCache.size >= this.config.maxPdfCacheSize) {
      const firstKey = this.pdfDocumentCache.keys().next().value;
      if (firstKey) {
        this.pdfDocumentCache.delete(firstKey);
      }
    }
    
    this.pdfDocumentCache.set(cacheKey, result);
  }

  /**
   * Store in user query cache with LRU eviction
   * 
   * AI INSTRUCTIONS:
   * - LRU eviction for user queries
   * - Smaller cache size for temporary data
   * - Remove oldest queries first
   */
  private storeInUserQueryCache(cacheKey: string, result: EmbeddingResult): void {
    if (this.userQueryCache.size >= this.config.maxUserQueryCacheSize) {
      const firstKey = this.userQueryCache.keys().next().value;
      if (firstKey) {
        this.userQueryCache.delete(firstKey);
      }
    }
    
    this.userQueryCache.set(cacheKey, result);
  }

  /**
   * Determine appropriate cache type for content
   * 
   * AI INSTRUCTIONS:
   * - Business logic for cache type classification
   * - Use content length and structure heuristics
   * - Default to user query for unknown content
   */
  private determineCacheType(text: string): CacheType {
    const length = text.length;
    const hasStructuredContent = /(?:FAQ|Product|Policy|Company|About|Service|Feature|Plan|Price)/i.test(text);
    const isLongContent = length > EMBEDDING_CONSTANTS.KNOWLEDGE_BASE_MIN_LENGTH;
    const isPdfContent = this.isPdfContent(text);
    
    if (isPdfContent) {
      return CacheType.PDF_DOCUMENT;
    }
    
    if (isLongContent || hasStructuredContent) {
      return CacheType.KNOWLEDGE_BASE;
    }
    
    return CacheType.USER_QUERY;
  }

  /**
   * Detect PDF content characteristics
   * 
   * AI INSTRUCTIONS:
   * - Heuristics for PDF document content
   * - Look for document structure patterns
   * - Consider content length and formatting
   */
  private isPdfContent(text: string): boolean {
    const hasDocumentMarkers = /(?:Page \d+|Chapter \d+|Section \d+|\.pdf|document)/i.test(text);
    const hasLongParagraphs = text.split('\n').some(line => line.length > 200);
    const isVeryLong = text.length > 500;
    
    return hasDocumentMarkers || (hasLongParagraphs && isVeryLong);
  }

  /**
   * Get comprehensive cache statistics
   * 
   * AI INSTRUCTIONS:
   * - Calculate statistics across all cache types
   * - Include utilization percentages
   * - Return detailed breakdown for monitoring
   */
  getCacheStats(): CacheStats {
    const totalSize = this.knowledgeBaseCache.size + this.userQueryCache.size + this.pdfDocumentCache.size;
    const totalMaxSize = this.config.maxUserQueryCacheSize + this.config.maxPdfCacheSize;
    
    return {
      size: totalSize,
      maxSize: totalMaxSize,
      utilizationPercent: Math.round((totalSize / totalMaxSize) * 100),
      keys: [
        ...Array.from(this.knowledgeBaseCache.keys()),
        ...Array.from(this.userQueryCache.keys()),
        ...Array.from(this.pdfDocumentCache.keys())
      ]
    };
  }

  /**
   * Get detailed cache breakdown by type
   * 
   * AI INSTRUCTIONS:
   * - Separate statistics for each cache type
   * - Include type-specific metrics
   * - Useful for cache optimization analysis
   */
  getDetailedCacheStats(): Record<CacheType, { size: number; maxSize: number | null; keys: string[] }> {
    return {
      [CacheType.KNOWLEDGE_BASE]: {
        size: this.knowledgeBaseCache.size,
        maxSize: null, // No limit for knowledge base
        keys: Array.from(this.knowledgeBaseCache.keys())
      },
      [CacheType.USER_QUERY]: {
        size: this.userQueryCache.size,
        maxSize: this.config.maxUserQueryCacheSize,
        keys: Array.from(this.userQueryCache.keys())
      },
      [CacheType.PDF_DOCUMENT]: {
        size: this.pdfDocumentCache.size,
        maxSize: this.config.maxPdfCacheSize,
        keys: Array.from(this.pdfDocumentCache.keys())
      }
    };
  }

  /**
   * Clear all caches
   * 
   * AI INSTRUCTIONS:
   * - Complete cache reset
   * - Use for testing or memory management
   * - Clear all cache types
   */
  clearAllCaches(): void {
    this.knowledgeBaseCache.clear();
    this.userQueryCache.clear();
    this.pdfDocumentCache.clear();
  }

  /**
   * Clear specific cache type
   * 
   * AI INSTRUCTIONS:
   * - Selective cache clearing
   * - Preserve other cache types
   * - Useful for targeted cache management
   */
  clearCache(cacheType: CacheType): void {
    switch (cacheType) {
      case CacheType.KNOWLEDGE_BASE:
        this.knowledgeBaseCache.clear();
        break;
      case CacheType.USER_QUERY:
        this.userQueryCache.clear();
        break;
      case CacheType.PDF_DOCUMENT:
        this.pdfDocumentCache.clear();
        break;
    }
  }

  /**
   * Check if cache has embedding for key
   * 
   * AI INSTRUCTIONS:
   * - Fast existence check without retrieval
   * - Check all cache types
   * - No LRU updates on existence check
   */
  hasEmbedding(cacheKey: string): boolean {
    return this.knowledgeBaseCache.has(cacheKey) ||
           this.userQueryCache.has(cacheKey) ||
           this.pdfDocumentCache.has(cacheKey);
  }
} 