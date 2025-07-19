/**
 * Knowledge Search Strategy Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure domain service for search strategy business logic
 * - Contains business rules for search optimization
 * - No external dependencies beyond domain interfaces
 * - Encapsulates search strategy business logic
 */

import { KnowledgeItem } from '../interfaces/IKnowledgeRetrievalService';

export interface SearchOptions {
  threshold?: number;
  limit?: number;
  categoryFilter?: string;
}

export interface SearchContext {
  organizationId: string;
  chatbotConfigId: string;
  sharedLogFile?: string;
}

export class KnowledgeSearchStrategy {
  /**
   * Business rule: Create dummy embedding for category-based searches
   */
  public createDummyEmbedding(dimensions: number = 1536): number[] {
    // Business rule: Use zero embedding for category/tag filtering
    // This allows us to use the search infrastructure without semantic matching
    return new Array(dimensions).fill(0);
  }

  /**
   * Business rule: Get search options for category filtering
   */
  public getCategorySearchOptions(category: string): SearchOptions {
    return {
      threshold: -1, // Business rule: Accept all matches when filtering by category
      limit: 1000,   // Business rule: Large limit for category searches
      categoryFilter: category
    };
  }

  /**
   * Business rule: Get search options for tag filtering
   */
  public getTagSearchOptions(): SearchOptions {
    return {
      threshold: -1, // Business rule: Accept all matches for manual tag filtering
      limit: 10000   // Business rule: Large limit for tag filtering
    };
  }

  /**
   * Business rule: Get search options for semantic search
   */
  public getSemanticSearchOptions(limit?: number): SearchOptions {
    return {
      threshold: 0.7, // Business rule: Minimum similarity threshold for semantic search
      limit: limit || 50 // Business rule: Reasonable limit for semantic results
    };
  }

  /**
   * Business rule: Determine optimal search strategy
   */
  public determineSearchStrategy(query: {
    hasEmbedding: boolean;
    hasCategory: boolean;
    hasTags: boolean;
    expectedResultCount: number;
  }): 'semantic' | 'category' | 'tag' | 'full_scan' {
    // Business rule: Prefer semantic search when embedding is available
    if (query.hasEmbedding) {
      return 'semantic';
    }

    // Business rule: Use category search for category filtering
    if (query.hasCategory) {
      return 'category';
    }

    // Business rule: Use tag search for tag filtering
    if (query.hasTags) {
      return 'tag';
    }

    // Business rule: Full scan for statistics and health checks
    return 'full_scan';
  }

  /**
   * Business rule: Calculate optimal batch size for large operations
   */
  public calculateOptimalBatchSize(totalItems: number, operation: 'read' | 'filter' | 'delete'): number {
    // Business rule: Batch sizes based on operation type
    const baseBatchSize = {
      read: 1000,
      filter: 5000,
      delete: 100
    }[operation];

    // Business rule: Adjust batch size based on total items
    if (totalItems < baseBatchSize) {
      return totalItems;
    }

    // Business rule: Use smaller batches for very large datasets
    if (totalItems > 50000) {
      return Math.floor(baseBatchSize / 2);
    }

    return baseBatchSize;
  }

  /**
   * Business rule: Validate search parameters
   */
  public validateSearchParameters(
    organizationId: string,
    chatbotConfigId: string,
    options: SearchOptions
  ): void {
    if (!organizationId?.trim()) {
      throw new Error('Organization ID is required for search operations');
    }

    if (!chatbotConfigId?.trim()) {
      throw new Error('Chatbot config ID is required for search operations');
    }

    if (options.threshold !== undefined) {
      if (options.threshold < -1 || options.threshold > 1) {
        throw new Error('Search threshold must be between -1 and 1');
      }
    }

    if (options.limit !== undefined) {
      if (options.limit <= 0 || options.limit > 50000) {
        throw new Error('Search limit must be between 1 and 50000');
      }
    }

    if (options.categoryFilter !== undefined) {
      if (!options.categoryFilter.trim()) {
        throw new Error('Category filter cannot be empty if provided');
      }
    }
  }

  /**
   * Business rule: Optimize search results for performance
   */
  public optimizeSearchResults(results: KnowledgeItem[], maxResults: number): KnowledgeItem[] {
    // Business rule: Limit results to prevent performance issues
    if (results.length <= maxResults) {
      return results;
    }

    // Business rule: Prioritize by last update date when truncating results
    const sortedResults = [...results].sort((a, b) => {
      if (a.lastUpdated && b.lastUpdated) {
        return b.lastUpdated.getTime() - a.lastUpdated.getTime();
      }
      if (a.lastUpdated && !b.lastUpdated) return -1;
      if (!a.lastUpdated && b.lastUpdated) return 1;
      
      // Fallback to relevance score
      if (a.relevanceScore && b.relevanceScore) {
        return b.relevanceScore - a.relevanceScore;
      }
      
      return 0;
    });

    return sortedResults.slice(0, maxResults);
  }

  /**
   * Business rule: Check if search operation is cacheable
   */
  public isSearchCacheable(
    strategy: ReturnType<typeof this.determineSearchStrategy>,
    options: SearchOptions
  ): boolean {
    // Business rule: Cache simple operations
    if (strategy === 'category' && options.limit && options.limit <= 1000) {
      return true;
    }

    // Business rule: Don't cache complex or large operations
    if (strategy === 'tag' || strategy === 'full_scan') {
      return false;
    }

    // Business rule: Cache semantic searches with standard limits
    if (strategy === 'semantic' && options.limit && options.limit <= 100) {
      return true;
    }

    return false;
  }

  /**
   * Business rule: Generate cache key for search operations
   */
  public generateCacheKey(
    organizationId: string,
    chatbotConfigId: string,
    strategy: string,
    options: SearchOptions
  ): string {
    const keyParts = [
      'knowledge_search',
      organizationId,
      chatbotConfigId,
      strategy,
      options.threshold?.toString() || 'default',
      options.limit?.toString() || 'default',
      options.categoryFilter || 'none'
    ];

    return keyParts.join(':');
  }

  /**
   * Business rule: Estimate search operation cost
   */
  public estimateSearchCost(
    totalItems: number,
    strategy: ReturnType<typeof this.determineSearchStrategy>,
    options: SearchOptions
  ): 'low' | 'medium' | 'high' {
    // Business rule: Cost estimation based on strategy and data size
    if (strategy === 'semantic') {
      if (totalItems > 10000) return 'high';
      if (totalItems > 1000) return 'medium';
      return 'low';
    }

    if (strategy === 'category') {
      if (totalItems > 50000) return 'high';
      return 'low';
    }

    if (strategy === 'tag' || strategy === 'full_scan') {
      if (totalItems > 20000) return 'high';
      if (totalItems > 5000) return 'medium';
      return 'low';
    }

    return 'medium';
  }
}