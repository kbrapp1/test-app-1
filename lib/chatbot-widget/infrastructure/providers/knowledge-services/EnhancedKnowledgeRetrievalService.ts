import { KnowledgeItem } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { IKnowledgeItemRepository } from '../../../domain/repositories/IKnowledgeItemRepository';
import { OpenAIEmbeddingService } from '../openai/services/OpenAIEmbeddingService';
import { BusinessRuleViolationError } from '../../../domain/errors/BusinessRuleViolationError';

/**
 * Enhanced Knowledge Retrieval Service (2025 RAG Best Practice)
 * 
 * AI INSTRUCTIONS:
 * - Uses persistent chatbot_knowledge_items table for content storage
 * - Provides hybrid vector search with full content retrieval
 * - Complements existing IKnowledgeRetrievalService with persistent storage
 * - Supports efficient semantic search with complete content context
 * - Follows @golden-rule patterns with single responsibility
 */
export class EnhancedKnowledgeRetrievalService {
  constructor(
    private knowledgeItemRepository: IKnowledgeItemRepository,
    private embeddingService: OpenAIEmbeddingService
  ) {}

  /**
   * Search knowledge base using semantic vector similarity
   * 
   * AI INSTRUCTIONS:
   * - Generates embedding for user query
   * - Performs vector similarity search in database
   * - Returns complete knowledge items with original content
   * - Enables accurate question answering with full context
   */
  async searchKnowledge(
    organizationId: string,
    chatbotConfigId: string,
    query: string,
    options: {
      threshold?: number;
      limit?: number;
      categoryFilter?: string;
      sourceTypeFilter?: string;
      intentFilter?: string;
    } = {}
  ): Promise<Array<{ item: KnowledgeItem; similarity: number; }>> {
    try {
      // Generate embedding for user query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Search using vector similarity
      const searchResults = await this.knowledgeItemRepository.searchKnowledgeItems(
        organizationId,
        chatbotConfigId,
        queryEmbedding,
        {
          threshold: options.threshold || 0.7,
          limit: options.limit || 3,
          categoryFilter: options.categoryFilter,
          sourceTypeFilter: options.sourceTypeFilter,
          intentFilter: options.intentFilter
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
   * Get all knowledge items for a chatbot configuration
   * 
   * AI INSTRUCTIONS:
   * - Retrieves complete knowledge base with original content
   * - Used for knowledge base management and overview
   * - Returns items sorted by creation date (newest first)
   */
  async getAllKnowledgeItems(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<KnowledgeItem[]> {
    try {
      return await this.knowledgeItemRepository.getAllKnowledgeItems(
        organizationId,
        chatbotConfigId
      );
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to retrieve all knowledge items: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId }
      );
    }
  }

  /**
   * Get specific knowledge item by ID
   * 
   * AI INSTRUCTIONS:
   * - Retrieves single knowledge item with complete content
   * - Used for detailed content display and editing
   * - Returns null if item doesn't exist
   */
  async getKnowledgeItem(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string
  ): Promise<KnowledgeItem | null> {
    try {
      return await this.knowledgeItemRepository.getKnowledgeItem(
        organizationId,
        chatbotConfigId,
        knowledgeItemId
      );
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to retrieve knowledge item: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, knowledgeItemId }
      );
    }
  }

  /**
   * Get multiple knowledge items by IDs
   * 
   * AI INSTRUCTIONS:
   * - Batch retrieval for efficiency
   * - Used for multi-item operations and display
   * - Returns only existing items (partial results possible)
   */
  async getKnowledgeItemsByIds(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemIds: string[]
  ): Promise<KnowledgeItem[]> {
    try {
      return await this.knowledgeItemRepository.getKnowledgeItemsByIds(
        organizationId,
        chatbotConfigId,
        knowledgeItemIds
      );
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to retrieve knowledge items by IDs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, knowledgeItemIds }
      );
    }
  }

  /**
   * Delete knowledge items by source type
   * 
   * AI INSTRUCTIONS:
   * - Bulk cleanup when content sources are removed
   * - Used for website source deletion and refresh
   * - Returns count of deleted items for confirmation
   */
  async deleteKnowledgeItemsBySource(
    organizationId: string,
    chatbotConfigId: string,
    sourceType: string,
    sourceUrl?: string
  ): Promise<number> {
    try {
      return await this.knowledgeItemRepository.deleteKnowledgeItemsBySource(
        organizationId,
        chatbotConfigId,
        sourceType,
        sourceUrl
      );
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to delete knowledge items by source: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId, sourceType, sourceUrl }
      );
    }
  }

  /**
   * Get knowledge base statistics
   * 
   * AI INSTRUCTIONS:
   * - Provides overview of knowledge base contents
   * - Used for monitoring and optimization
   * - Returns categorized counts and metadata
   */
  async getKnowledgeBaseStats(
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
      return await this.knowledgeItemRepository.getKnowledgeItemStats(
        organizationId,
        chatbotConfigId
      );
    } catch (error) {
      throw new BusinessRuleViolationError(
        `Failed to get knowledge base statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { organizationId, chatbotConfigId }
      );
    }
  }

  /**
   * Check if knowledge item exists with current content hash
   * 
   * AI INSTRUCTIONS:
   * - Efficient cache validation without full content retrieval
   * - Used for change detection and optimization
   * - Prevents unnecessary re-processing of unchanged content
   */
  async knowledgeItemExists(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string,
    contentHash: string
  ): Promise<boolean> {
    try {
      return await this.knowledgeItemRepository.knowledgeItemExists(
        organizationId,
        chatbotConfigId,
        knowledgeItemId,
        contentHash
      );
    } catch (error) {
      // Return false on any error to allow re-processing
      return false;
    }
  }
} 