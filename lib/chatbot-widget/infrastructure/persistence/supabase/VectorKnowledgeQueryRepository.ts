import { SupabaseClient } from '@supabase/supabase-js';
import { IVectorKnowledgeQueryRepository } from '../../../domain/repositories/IVectorKnowledgeQueryRepository';
import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError } from '../../../domain/errors/ChatbotWidgetDomainErrors';
import { VectorQueryService } from '../../services/VectorQueryService';
import {
  VectorSearchOptions,
  VectorQueryContext
} from '../../types/VectorRepositoryTypes';

/**
 * Vector Knowledge Query Repository Implementation
 * 
 * AI INSTRUCTIONS:
 * - Handles all read operations for vector knowledge
 * - Delegates to VectorQueryService for implementation
 * - Maintains clean separation of concerns
 * - Follows CQRS pattern for query responsibility
 * - Support multi-tenant isolation by organization
 * - Keep under 150 lines per DDD splitting guidelines
 */
export class VectorKnowledgeQueryRepository implements IVectorKnowledgeQueryRepository {
  private readonly queryService: VectorQueryService;

  constructor(private supabase: SupabaseClient) {
    this.queryService = new VectorQueryService(supabase);
  }

  /**
   * Search knowledge items using vector similarity
   * 
   * AI INSTRUCTIONS:
   * - Delegate to VectorQueryService for implementation
   * - Transform results to match interface expectations
   * - Handle search options and filtering
   * - Support semantic search with scoring
   * - Provide comprehensive error handling
   */
  async searchKnowledgeItems(
    organizationId: string,
    chatbotConfigId: string,
    queryEmbedding: number[],
    options: {
      threshold?: number;
      limit?: number;
      categoryFilter?: string;
      sourceTypeFilter?: string;
    } = {}
  ): Promise<Array<{ item: KnowledgeItem; similarity: number; }>> {
    try {
      const context: VectorQueryContext = { organizationId, chatbotConfigId };
      const searchOptions: VectorSearchOptions = {
        threshold: options.threshold,
        limit: options.limit,
        categoryFilter: options.categoryFilter,
        sourceTypeFilter: options.sourceTypeFilter
      };

      return await this.queryService.searchKnowledgeItems(context, queryEmbedding, searchOptions);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Knowledge vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, options }
      );
    }
  }

  /** Get all knowledge vectors for cache initialization */
  async getAllKnowledgeVectors(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<Array<{ item: KnowledgeItem; vector: number[]; }>> {
    try {
      const context: VectorQueryContext = { organizationId, chatbotConfigId };
      return await this.queryService.getAllKnowledgeVectors(context);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to retrieve all knowledge vectors: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId }
      );
    }
  }

  /**
   * Get crawled pages with metadata
   * 
   * AI INSTRUCTIONS:
   * - Delegate to VectorQueryService for implementation
   * - Transform results to match interface expectations
   * - Handle crawl metadata and filtering
   * - Support website crawling analytics
   * - Provide comprehensive error handling
   */
  async getCrawledPages(
    organizationId: string,
    chatbotConfigId: string,
    sourceUrl?: string
  ): Promise<Array<{
    url: string;
    title: string;
    content: string;
    status: 'success' | 'failed' | 'skipped';
    statusCode?: number;
    responseTime?: number;
    depth: number;
    crawledAt: Date;
    errorMessage?: string;
  }>> {
    try {
      const context: VectorQueryContext = { organizationId, chatbotConfigId };
      return await this.queryService.getCrawledPages(context, sourceUrl);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to retrieve crawled pages: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, sourceUrl }
      );
    }
  }
}