/**
 * Knowledge Search Execution Service (Refactored)
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Provide backward-compatible interface for search execution
 * - Delegates to specialized DDD services for actual implementation
 * - Maintains existing API for seamless integration
 * - Never exceed 250 lines per @golden-rule
 */

import { IEmbeddingService } from '../interfaces/IEmbeddingService';
import { ISessionLogger } from '../interfaces/IChatbotLoggingService';
import { VectorKnowledgeCache } from '../VectorKnowledgeCache';
import { 
  KnowledgeRetrievalContext, 
  KnowledgeSearchResult
} from '../interfaces/IKnowledgeRetrievalService';
import { SearchExecutionCoordinatorService } from './SearchExecutionCoordinatorService';
import { SearchExecutionMetrics } from './SearchPerformanceTrackingService';

/**
 * Backward-compatible facade for knowledge search operations
 * 
 * AI INSTRUCTIONS:
 * - Maintains existing API for seamless integration
 * - Delegates to SearchExecutionCoordinatorService for actual implementation
 * - Preserves all security context (organizationId, chatbotConfigId)
 * - Provides clean interface for search execution without cache management
 */
export class KnowledgeSearchExecutionService {
  private readonly coordinatorService: SearchExecutionCoordinatorService;

  constructor(
    private readonly embeddingService: IEmbeddingService,
    private readonly vectorCache: VectorKnowledgeCache,
    private readonly organizationId: string,
    private readonly chatbotConfigId: string
  ) {
    // Initialize the coordinator service with all dependencies
    this.coordinatorService = new SearchExecutionCoordinatorService(
      embeddingService,
      vectorCache,
      organizationId,
      chatbotConfigId
    );
  }

  /**
   * Execute semantic search with full performance tracking
   * 
   * AI INSTRUCTIONS:
   * - Maintains backward compatibility with existing API
   * - Delegates to coordinator service for actual implementation
   * - Preserves all existing functionality and error handling
   * - Returns same interface as original implementation
   */
  async executeSearch(
    context: KnowledgeRetrievalContext,
    logger: ISessionLogger
  ): Promise<{ result: KnowledgeSearchResult; metrics: SearchExecutionMetrics }> {
    return this.coordinatorService.executeSearch(context, logger);
  }
}

// Re-export types for backward compatibility - using export type for isolatedModules
export type { SearchExecutionMetrics } from './SearchPerformanceTrackingService';