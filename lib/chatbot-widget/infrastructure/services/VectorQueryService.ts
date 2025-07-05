/**
 * Vector Query Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle vector search and retrieval operations
 * - Infrastructure service focused on Supabase vector queries
 * - Keep business logic pure, handle database-specific concerns
 * - Never exceed 250 lines per @golden-rule
 * - Support semantic search with filtering and validation
 * - Handle vector dimension validation and error recovery
 * - Provide efficient query optimization and caching
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { KnowledgeItem } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import {
  VectorSearchOptions,
  VectorSearchResult,
  VectorWithItem,
  VectorQueryContext,
  SupabaseVectorRow,
  VectorSimilarityRow,
  VectorValidationResult,
  VectorSearchConfig
} from '../types/VectorRepositoryTypes';

export class VectorQueryService {
  
  private static readonly DEFAULT_SEARCH_CONFIG: VectorSearchConfig = {
    defaultThreshold: 0.7,
    defaultLimit: 3,
    maxLimit: 50,
    enableFiltering: true
  };

  private static readonly EXPECTED_VECTOR_DIMENSIONS = 1536;

  constructor(private supabase: SupabaseClient) {}

  async searchKnowledgeItems(
    context: VectorQueryContext,
    queryEmbedding: number[],
    options: VectorSearchOptions = {}
  ): Promise<VectorSearchResult[]> {
    try {
      // Validate search parameters
      this.validateSearchParameters(queryEmbedding, options);

      const searchConfig = { ...VectorQueryService.DEFAULT_SEARCH_CONFIG, ...options };
      
      const { data, error } = await this.supabase.rpc('find_similar_vectors', {
        query_organization_id: context.organizationId,
        query_chatbot_config_id: context.chatbotConfigId,
        query_vector: queryEmbedding,
        similarity_threshold: searchConfig.threshold || searchConfig.defaultThreshold,
        match_count: Math.min(searchConfig.limit || searchConfig.defaultLimit, searchConfig.maxLimit)
      });

      if (error) {
        throw new Error(`Failed to search knowledge vectors: ${error.message}`);
      }

      return this.processSearchResults(data, options);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Knowledge vector search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { ...context, options }
      );
    }
  }

  async getAllKnowledgeVectors(context: VectorQueryContext): Promise<VectorWithItem[]> {
    try {
      const { data, error } = await this.supabase
        .from('chatbot_knowledge_vectors')
        .select('knowledge_item_id, title, content, category, source_type, source_url, vector, updated_at, created_at')
        .eq('organization_id', context.organizationId)
        .eq('chatbot_config_id', context.chatbotConfigId);

      if (error) {
        throw new Error(`Failed to get all knowledge vectors: ${error.message}`);
      }

      return this.processVectorResults(data);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to retrieve all knowledge vectors: ${error instanceof Error ? error.message : 'Unknown error'}`,
        context
      );
    }
  }

  async getCrawledPages(
    context: VectorQueryContext,
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
      let query = this.supabase
        .from('chatbot_knowledge_vectors')
        .select('source_url, title, content, metadata, created_at')
        .eq('organization_id', context.organizationId)
        .eq('chatbot_config_id', context.chatbotConfigId)
        .eq('source_type', 'website_crawled')
        .order('created_at', { ascending: false });

      // Filter by source URL if provided
      if (sourceUrl) {
        query = query.like('source_url', `${sourceUrl}%`);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Failed to get crawled pages: ${error.message}`);
      }

      return this.processCrawledPageResults(data);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to retrieve crawled pages: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { ...context, sourceUrl }
      );
    }
  }

  private processSearchResults(
    data: VectorSimilarityRow[],
    options: VectorSearchOptions
  ): VectorSearchResult[] {
    return data
      .filter((row: VectorSimilarityRow) => {
        // Apply category filter if specified
        if (options.categoryFilter && row.category !== options.categoryFilter) {
          return false;
        }
        // Apply source type filter if specified
        if (options.sourceTypeFilter && row.source_type !== options.sourceTypeFilter) {
          return false;
        }
        return true;
      })
      .map((row: VectorSimilarityRow) => ({
        item: this.convertRowToKnowledgeItem(row),
        similarity: row.similarity
      }));
  }

  private processVectorResults(data: SupabaseVectorRow[]): VectorWithItem[] {
    return data.map((row: SupabaseVectorRow) => {
      const processedVector = this.validateAndProcessVector(row.vector, row.knowledge_item_id);
      
      return {
        item: this.convertRowToKnowledgeItem(row),
        vector: processedVector
      };
    });
  }
  private processCrawledPageResults(data: any[]): Array<{
    url: string;
    title: string;
    content: string;
    status: 'success' | 'failed' | 'skipped';
    statusCode?: number;
    responseTime?: number;
    depth: number;
    crawledAt: Date;
    errorMessage?: string;
  }> {
    return data.map((row: any) => {
      const crawlMetadata = row.metadata?.crawl || {};
      
      return {
        url: row.source_url,
        title: row.title,
        content: row.content,
        status: crawlMetadata.status || 'success',
        statusCode: crawlMetadata.statusCode,
        responseTime: crawlMetadata.responseTime,
        depth: crawlMetadata.depth || 0,
        crawledAt: crawlMetadata.crawledAt ? new Date(crawlMetadata.crawledAt) : new Date(row.created_at),
        errorMessage: crawlMetadata.errorMessage
      };
    });
  }

  private convertRowToKnowledgeItem(row: SupabaseVectorRow): KnowledgeItem {
    return {
      id: row.knowledge_item_id,
      title: row.title,
      content: row.content,
      category: this.mapDatabaseCategoryToDomain(row.category),
      tags: [],
      relevanceScore: (row as VectorSimilarityRow).similarity || 1.0,
      source: row.source_url || 'stored',
      lastUpdated: new Date(row.updated_at)
    };
  }

  private mapDatabaseCategoryToDomain(dbCategory: string): KnowledgeItem['category'] {
    // Map database categories to domain categories
    const categoryMap: Record<string, KnowledgeItem['category']> = {
      'faq': 'faq',
      'product_info': 'product_info',
      'company_info': 'general',
      'product_catalog': 'product_info',
      'support_docs': 'support',
      'website_crawled': 'general',
      'pricing': 'pricing',
      'support': 'support',
      'general': 'general'
    };

    return categoryMap[dbCategory] || 'general';
  }

  private validateAndProcessVector(vectorData: any, itemId: string): number[] {
    let processedVector: number[];
    
    if (Array.isArray(vectorData)) {
      processedVector = vectorData as number[];
    } else if (typeof vectorData === 'string') {
      // Handle case where Supabase returns vector as string
      try {
        processedVector = JSON.parse(vectorData) as number[];
      } catch (e) {
        throw new Error(`Invalid vector format for ${itemId}`);
      }
    } else {
      throw new Error(`Unexpected vector type for ${itemId}: ${typeof vectorData}`);
    }
    
    // Validate vector dimensions (critical for preventing dimension mismatch errors)
    if (processedVector.length !== VectorQueryService.EXPECTED_VECTOR_DIMENSIONS) {
      throw new Error(
        `Vector dimension mismatch for ${itemId}: ${processedVector.length} dimensions (expected ${VectorQueryService.EXPECTED_VECTOR_DIMENSIONS})`
      );
    }

    return processedVector;
  }

  private validateSearchParameters(queryEmbedding: number[], options: VectorSearchOptions): void {
    if (!Array.isArray(queryEmbedding)) {
      throw new Error('Query embedding must be an array');
    }

    if (queryEmbedding.length !== VectorQueryService.EXPECTED_VECTOR_DIMENSIONS) {
      throw new Error(
        `Query vector dimension mismatch: ${queryEmbedding.length} dimensions (expected ${VectorQueryService.EXPECTED_VECTOR_DIMENSIONS})`
      );
    }

    if (options.threshold !== undefined && (options.threshold < 0 || options.threshold > 1)) {
      throw new Error('Similarity threshold must be between 0 and 1');
    }

    if (options.limit !== undefined && options.limit <= 0) {
      throw new Error('Search limit must be positive');
    }
  }
} 