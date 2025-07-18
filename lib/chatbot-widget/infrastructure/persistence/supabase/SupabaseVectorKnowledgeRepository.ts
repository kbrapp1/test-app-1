import { SupabaseClient } from '@supabase/supabase-js';
import { IVectorKnowledgeRepository } from '../../../domain/repositories/IVectorKnowledgeRepository';
import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError } from '../../../domain/errors/ChatbotWidgetDomainErrors';
import { ChatbotWidgetCompositionRoot } from '../../composition/ChatbotWidgetCompositionRoot';
import { ErrorTrackingFacade } from '../../../application/services/ErrorTrackingFacade';
import { VectorQueryService } from '../../services/VectorQueryService';
import { VectorStorageService } from '../../services/VectorStorageService';
import { VectorStatisticsService } from '../../services/VectorStatisticsService';
import {
  VectorKnowledgeItem,
  VectorSearchOptions,
  // VectorSearchResult,
  // VectorWithItem,
  // VectorKnowledgeStats,
  // CrawledPageInfo,
  VectorQueryContext,
  VectorDeletionContext
} from '../../types/VectorRepositoryTypes';

/**
 * Supabase Vector Knowledge Repository Implementation
 * 
 * AI INSTRUCTIONS:
 * - Orchestrate specialized services for vector operations
 * - Maintain clean separation of concerns through delegation
 * - Keep under 250 lines per @golden-rule
 * - Focus on coordination rather than implementation
 * - Support multi-tenant isolation by organization
 * - Follow DDD patterns with service composition
 */
export class SupabaseVectorKnowledgeRepository implements IVectorKnowledgeRepository {
  private readonly errorTrackingService: ErrorTrackingFacade;
  private readonly queryService: VectorQueryService;
  private readonly storageService: VectorStorageService;
  private readonly statisticsService: VectorStatisticsService;

  constructor(private supabase: SupabaseClient) {
    this.errorTrackingService = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
    this.queryService = new VectorQueryService(supabase);
    this.storageService = new VectorStorageService(supabase, this.errorTrackingService);
    this.statisticsService = new VectorStatisticsService(supabase);
  }

  /** Store knowledge items with vectors */
  async storeKnowledgeItems(
    organizationId: string,
    chatbotConfigId: string,
    items: Array<{
      knowledgeItemId: string;
      title: string;
      content: string;
      category: string;
      sourceType: 'faq' | 'company_info' | 'product_catalog' | 'support_docs' | 'website_crawled';
      sourceUrl?: string;
      embedding: number[];
      contentHash: string;
      metadata?: Record<string, unknown>;
    }>
  ): Promise<void> {
    try {
      const context: VectorQueryContext = { organizationId, chatbotConfigId };
      const vectorItems: VectorKnowledgeItem[] = items.map(item => ({
        knowledgeItemId: item.knowledgeItemId,
        title: item.title,
        content: item.content,
        category: item.category,
        sourceType: item.sourceType,
        sourceUrl: item.sourceUrl,
        embedding: item.embedding,
        contentHash: item.contentHash,
        metadata: item.metadata
      }));

      await this.storageService.storeKnowledgeItems(context, vectorItems);
    } catch (error) {
      if (error instanceof BusinessRuleViolationError) {
        throw error;
      }
      throw new BusinessRuleViolationError(
        `Knowledge vector storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, itemCount: items.length }
      );
    }
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

  /** Delete knowledge items by source pattern */
  async deleteKnowledgeItemsBySource(
    organizationId: string,
    chatbotConfigId: string,
    sourceType: string,
    sourceUrl?: string
  ): Promise<number> {
    try {
      const deletionContext: VectorDeletionContext = {
        organizationId,
        chatbotConfigId,
        sourceType,
        sourceUrl
      };

      return await this.storageService.deleteKnowledgeItemsBySource(deletionContext);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to delete knowledge vectors by source: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, sourceType, sourceUrl }
      );
    }
  }

  /** Get knowledge item statistics and analytics */
  async getKnowledgeItemStats(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    totalItems: number;
    itemsBySourceType: Record<string, number>;
    itemsByCategory: Record<string, number>;
    lastUpdated: Date | null;
    storageSize: number;
  }> {
    try {
      const context: VectorQueryContext = { organizationId, chatbotConfigId };
      return await this.statisticsService.getKnowledgeItemStats(context);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to get knowledge vector statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
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

  /** Get storage optimization metrics */
  async getStorageOptimizationMetrics(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    averageVectorSize: number;
    totalVectorCount: number;
    duplicateContentCount: number;
    unusedVectorCount: number;
    storageEfficiency: number;
    recommendations: string[];
  }> {
    try {
      const context: VectorQueryContext = { organizationId, chatbotConfigId };
      return await this.statisticsService.getStorageOptimizationMetrics(context);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to get storage optimization metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId }
      );
    }
  }

  /**
   * Get knowledge base health metrics
   * 
   * AI INSTRUCTIONS:
   * - Delegate to VectorStatisticsService for health analysis
   * - Provide comprehensive health monitoring
   * - Support proactive maintenance strategies
   * - Handle content freshness tracking
   * - Enable operational insights
   */
  async getKnowledgeBaseHealthMetrics(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    healthScore: number;
    staleContentCount: number;
    recentUpdatesCount: number;
    contentFreshness: 'excellent' | 'good' | 'fair' | 'poor';
    maintenanceNeeded: boolean;
    recommendations: string[];
  }> {
    try {
      const context: VectorQueryContext = { organizationId, chatbotConfigId };
      return await this.statisticsService.getKnowledgeBaseHealthMetrics(context);
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to get knowledge base health metrics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId }
      );
    }
  }
} 