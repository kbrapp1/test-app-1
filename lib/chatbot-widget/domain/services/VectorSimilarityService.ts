import { BusinessRuleViolationError } from '../errors/ChatbotWidgetDomainErrors';
import { 
  CachedKnowledgeVector,
  VectorSearchOptions,
  VectorSearchResult,
  SimilarityCalculationOptions,
  VectorDimensions,
  SimilarityDebugInfo
} from '../types/VectorCacheTypes';
import { VectorMemoryManagementService } from './VectorMemoryManagementService';

/**
 * Vector Similarity Service
 * 
 * AI INSTRUCTIONS:
 * - Handle all vector similarity calculations and mathematics
 * - Implement cosine similarity with optimized performance
 * - Use domain-specific error types for calculation failures
 * - Keep similarity logic pure and testable
 * - Support filtering and threshold-based search
 * - Provide detailed similarity analysis and debugging
 */
export class VectorSimilarityService {

  /**
   * Default similarity search configuration
   * 
   * AI INSTRUCTIONS:
   * - Define reasonable default values for similarity search
   * - Balance precision with performance
   * - Support common use cases
   */
  static readonly DEFAULT_THRESHOLD = 0.15;
  static readonly DEFAULT_LIMIT = 5;
  static readonly MIN_THRESHOLD = 0.0;
  static readonly MAX_THRESHOLD = 1.0;

  /**
   * Search cached vectors using cosine similarity
   * 
   * AI INSTRUCTIONS:
   * - Perform in-memory cosine similarity calculations
   * - Update access tracking for LRU eviction
   * - Apply filtering and threshold-based search
   * - Return results sorted by similarity score
   */
  static searchVectors(
    queryEmbedding: number[],
    vectorCache: Map<string, CachedKnowledgeVector>,
    options: VectorSearchOptions = {}
  ): { results: VectorSearchResult[]; debugInfo: SimilarityDebugInfo[] } {
    this.validateSearchParameters(queryEmbedding, options);

    const threshold = options.threshold || this.DEFAULT_THRESHOLD;
    const limit = options.limit || this.DEFAULT_LIMIT;
    const now = new Date();

    const searchResults: VectorSearchResult[] = [];
    const debugInfo: SimilarityDebugInfo[] = [];

    // Perform cosine similarity search in memory with access tracking
    for (const [key, cachedVector] of vectorCache.entries()) {
      // Update access tracking for LRU
      VectorMemoryManagementService.updateVectorAccess(cachedVector, now);

      // Apply filters
      if (!this.passesFilters(cachedVector, options)) {
        continue;
      }

      // Calculate cosine similarity
      const similarity = this.calculateCosineSimilarity(queryEmbedding, cachedVector.vector);

      // Track all similarities for debugging
      debugInfo.push({
        id: cachedVector.item.id,
        similarity,
        passedThreshold: similarity >= threshold
      });

      // Add to results if above threshold
      if (similarity >= threshold) {
        searchResults.push({
          item: cachedVector.item,
          similarity
        });
      }
    }

    // Sort by similarity (highest first) and limit results
    searchResults.sort((a, b) => b.similarity - a.similarity);
    const limitedResults = searchResults.slice(0, limit);

    // Sort debug info by similarity for analysis
    debugInfo.sort((a, b) => b.similarity - a.similarity);

    return {
      results: limitedResults,
      debugInfo
    };
  }

  /**
   * Calculate cosine similarity between two vectors
   * 
   * AI INSTRUCTIONS:
   * - Pure mathematical function for vector similarity
   * - Handle edge cases (zero vectors, different dimensions)
   * - Optimize for performance with minimal allocations
   * - Return value between -1 and 1 (typically 0 to 1 for embeddings)
   */
  static calculateCosineSimilarity(
    vectorA: number[],
    vectorB: number[],
    options: SimilarityCalculationOptions = {}
  ): number {
    const shouldValidateDimensions = options.validateDimensions ?? true;
    const shouldHandleZeroVectors = options.handleZeroVectors ?? true;

    if (shouldValidateDimensions && vectorA.length !== vectorB.length) {
      throw new BusinessRuleViolationError(
        'Vector dimensions must match for similarity calculation',
        { dimA: vectorA.length, dimB: vectorB.length }
      );
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    // Calculate dot product and norms in single pass
    for (let i = 0; i < vectorA.length; i++) {
      const aVal = vectorA[i];
      const bVal = vectorB[i];
      
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }

    // Handle zero vectors
    if (shouldHandleZeroVectors && (normA === 0 || normB === 0)) {
      return 0;
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Batch calculate similarities for multiple vectors
   * 
   * AI INSTRUCTIONS:
   * - Efficiently calculate similarities for multiple vectors
   * - Maintain consistent calculation logic
   * - Support parallel processing optimizations
   */
  static batchCalculateSimilarities(
    queryEmbedding: number[],
    vectors: Array<{ id: string; vector: number[] }>,
    options: SimilarityCalculationOptions = {}
  ): Array<{ id: string; similarity: number }> {
    return vectors.map(({ id, vector }) => ({
      id,
      similarity: this.calculateCosineSimilarity(queryEmbedding, vector, options)
    }));
  }

  /**
   * Get vector dimensions information
   * 
   * AI INSTRUCTIONS:
   * - Analyze vector dimensions for compatibility
   * - Provide diagnostic information
   * - Help with dimension mismatch debugging
   */
  static getVectorDimensions(
    queryVector: number[],
    cachedVector: number[]
  ): VectorDimensions {
    return {
      queryVector: queryVector.length,
      cachedVector: cachedVector.length,
      match: queryVector.length === cachedVector.length
    };
  }

  /**
   * Validate similarity threshold
   * 
   * AI INSTRUCTIONS:
   * - Ensure threshold is within valid range
   * - Use domain-specific error types
   * - Provide reasonable bounds checking
   */
  static validateThreshold(threshold: number): void {
    if (threshold < this.MIN_THRESHOLD || threshold > this.MAX_THRESHOLD) {
      throw new BusinessRuleViolationError(
        `Similarity threshold must be between ${this.MIN_THRESHOLD} and ${this.MAX_THRESHOLD}`,
        { threshold, minThreshold: this.MIN_THRESHOLD, maxThreshold: this.MAX_THRESHOLD }
      );
    }
  }

  /**
   * Check if vector passes search filters
   * 
   * AI INSTRUCTIONS:
   * - Apply category and source type filters
   * - Handle undefined filter values gracefully
   * - Return boolean indicating filter pass/fail
   */
  private static passesFilters(
    cachedVector: CachedKnowledgeVector,
    options: VectorSearchOptions
  ): boolean {
    // Apply category filter
    if (options.categoryFilter && cachedVector.item.category !== options.categoryFilter) {
      return false;
    }

    // Apply source type filter
    if (options.sourceTypeFilter && cachedVector.item.source !== options.sourceTypeFilter) {
      return false;
    }

    return true;
  }

  /**
   * Validate search parameters
   * 
   * AI INSTRUCTIONS:
   * - Validate query embedding and search options
   * - Use domain-specific error types
   * - Check for reasonable parameter values
   */
  private static validateSearchParameters(
    queryEmbedding: number[],
    options: VectorSearchOptions
  ): void {
    if (!Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
      throw new BusinessRuleViolationError(
        'Query embedding must be a non-empty array',
        { embeddingLength: queryEmbedding?.length || 0 }
      );
    }

    if (options.threshold !== undefined) {
      this.validateThreshold(options.threshold);
    }

    if (options.limit !== undefined && (options.limit <= 0 || options.limit > 1000)) {
      throw new BusinessRuleViolationError(
        'Search limit must be between 1 and 1000',
        { limit: options.limit }
      );
    }
  }
} 