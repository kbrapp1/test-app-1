import { KnowledgeItem } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { IVectorKnowledgeRepository } from '../../domain/repositories/IVectorKnowledgeRepository';
import { OpenAIEmbeddingService } from '../../infrastructure/providers/openai/services/OpenAIEmbeddingService';
import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';

/**
 * Vector Knowledge Application Service
 * 
 * AI INSTRUCTIONS:
 * - Uses single chatbot_knowledge_vectors table for all operations
 * - Coordinates knowledge storage, search, and cleanup operations
 * - Provides unified interface for content + vector management
 * - Follows @golden-rule patterns with single responsibility
 * - Optimized for RAG pipeline with semantic search + content injection
 */
export class VectorKnowledgeApplicationService {
  constructor(
    private vectorKnowledgeRepository: IVectorKnowledgeRepository,
    private embeddingService: OpenAIEmbeddingService
  ) {}

  /** Search knowledge base using semantic vector similarity */
  async searchKnowledge(
    organizationId: string,
    chatbotConfigId: string,
    query: string,
    options: {
      threshold?: number;
      limit?: number;
      categoryFilter?: string;
      sourceTypeFilter?: string;
    } = {}
  ): Promise<Array<{ item: KnowledgeItem; similarity: number; }>> {
    try {
      // Generate embedding for user query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Search using vector similarity in unified table
      const searchResults = await this.vectorKnowledgeRepository.searchKnowledgeItems(
        organizationId,
        chatbotConfigId,
        queryEmbedding,
        {
          threshold: options.threshold || 0.7,
          limit: options.limit || 3,
          categoryFilter: options.categoryFilter,
          sourceTypeFilter: options.sourceTypeFilter
        }
      );

      return searchResults;

    } catch (error) {
      throw new BusinessRuleViolationError(
        `Knowledge search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { 
          organizationId, 
          chatbotConfigId, 
          query: query.substring(0, 100),
          options 
        }
      );
    }
  }

  /**
   * Store knowledge items with embeddings
   * 
   * AI INSTRUCTIONS:
   * - Generates embeddings for content using OpenAI
   * - Stores both content and vectors in single table operation
   * - Handles content hashing for change detection
   * - Supports batch processing for efficiency
   */
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
      contentHash: string;
    }>
  ): Promise<void> {
    try {
      if (items.length === 0) {
        return;
      }

      // Use batch embedding generation for efficiency (1 API call instead of N calls)
      const contentTexts = items.map(item => item.content);
      
      // Generate embeddings in batch (1 OpenAI API call for all FAQs)
      const batchEmbeddings = await this.embeddingService.generateEmbeddings(contentTexts);
      
      // Map batch results back to items with embeddings
      const itemsWithEmbeddings = items.map((item, index) => ({
        ...item,
        embedding: batchEmbeddings[index] || []
      }));

      // Store in unified vector table
      await this.vectorKnowledgeRepository.storeKnowledgeItems(
        organizationId,
        chatbotConfigId,
        itemsWithEmbeddings
      );

    } catch (error) {
      throw new BusinessRuleViolationError(
        `Knowledge storage failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, itemCount: items.length }
      );
    }
  }

  /** Delete knowledge items by source (unified cleanup) */
  async deleteKnowledgeItemsBySource(
    organizationId: string,
    chatbotConfigId: string,
    sourceType: string,
    sourceUrl?: string
  ): Promise<number> {
    try {
      const deletedCount = await this.vectorKnowledgeRepository.deleteKnowledgeItemsBySource(
        organizationId,
        chatbotConfigId,
        sourceType,
        sourceUrl
      );

      return deletedCount;
    } catch (error) {
      console.error('💥 VectorKnowledgeApplicationService: Knowledge cleanup failed:', {
        error: error instanceof Error ? error.message : String(error),
        organizationId,
        chatbotConfigId,
        sourceType,
        sourceUrl
      });
      throw new BusinessRuleViolationError(
        `Failed to delete knowledge items by source: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, sourceType, sourceUrl }
      );
    }
  }

  /** Get knowledge base statistics */
  async getKnowledgeStats(
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
      return await this.vectorKnowledgeRepository.getKnowledgeItemStats(
        organizationId,
        chatbotConfigId
      );
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to get knowledge statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId }
      );
    }
  }
} 