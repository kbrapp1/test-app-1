import { KnowledgeItem } from '../services/interfaces/IKnowledgeRetrievalService';

/**
 * Knowledge Item Repository Interface
 * 
 * AI INSTRUCTIONS:
 * - Contract for persistent knowledge item storage with content
 * - Supports both content storage and vector search capabilities
 * - Enables efficient content retrieval for RAG pipeline
 * - Follows DDD repository pattern - interface only in domain
 */
export interface IKnowledgeItemRepository {
  /**
   * Store knowledge items with content and embeddings
   * 
   * AI INSTRUCTIONS:
   * - Stores original content alongside vector embeddings
   * - Upserts based on knowledge_item_id to handle updates
   * - Includes metadata for search filtering and categorization
   */
  storeKnowledgeItems(
    organizationId: string,
    chatbotConfigId: string,
    items: Array<{
      knowledgeItemId: string;
      title: string;
      content: string;
      category: string;
      tags: string[];
      sourceType: 'faq' | 'company_info' | 'product_catalog' | 'support_docs' | 'website_crawled';
      sourceUrl?: string;
      sourceMetadata?: Record<string, any>;
      intentRelevance?: string[];
      relevanceScore?: number;
      embedding: number[];
      contentHash: string;
    }>
  ): Promise<void>;

  /**
   * Get knowledge item by ID with full content
   * 
   * AI INSTRUCTIONS:
   * - Retrieves complete knowledge item including original content
   * - Used for answering user questions with full context
   * - Returns null if item doesn't exist
   */
  getKnowledgeItem(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string
  ): Promise<KnowledgeItem | null>;

  /**
   * Get multiple knowledge items by IDs
   * 
   * AI INSTRUCTIONS:
   * - Batch retrieval for efficiency
   * - Returns only existing items (partial results possible)
   * - Used for RAG content injection
   */
  getKnowledgeItemsByIds(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemIds: string[]
  ): Promise<KnowledgeItem[]>;

  /**
   * Get all knowledge items for a chatbot configuration
   * 
   * AI INSTRUCTIONS:
   * - Retrieves complete knowledge base with content
   * - Used for comprehensive knowledge base operations
   * - Includes organization-level isolation
   */
  getAllKnowledgeItems(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<KnowledgeItem[]>;

  /**
   * Search knowledge items using vector similarity
   * 
   * AI INSTRUCTIONS:
   * - Performs semantic search using stored embeddings
   * - Returns items with similarity scores for ranking
   * - Supports filtering by category, source type, and intent
   */
  searchKnowledgeItems(
    organizationId: string,
    chatbotConfigId: string,
    queryEmbedding: number[],
    options: {
      threshold?: number;
      limit?: number;
      categoryFilter?: string;
      sourceTypeFilter?: string;
      intentFilter?: string;
    }
  ): Promise<Array<{
    item: KnowledgeItem;
    similarity: number;
  }>>;

  /**
   * Delete knowledge items by source type
   * 
   * AI INSTRUCTIONS:
   * - Bulk cleanup when content sources are removed
   * - Used for website source deletion and refresh
   * - Maintains data consistency
   */
  deleteKnowledgeItemsBySource(
    organizationId: string,
    chatbotConfigId: string,
    sourceType: string,
    sourceUrl?: string
  ): Promise<number>; // Returns count of deleted items

  /**
   * Delete specific knowledge item
   * 
   * AI INSTRUCTIONS:
   * - Removes single knowledge item
   * - Used for individual content updates
   * - Returns success status
   */
  deleteKnowledgeItem(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string
  ): Promise<boolean>;

  /**
   * Check if knowledge item exists with current content hash
   * 
   * AI INSTRUCTIONS:
   * - Efficient cache validation without full content retrieval
   * - Compares content hash for change detection
   * - Optimizes re-processing decisions
   */
  knowledgeItemExists(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string,
    contentHash: string
  ): Promise<boolean>;

  /**
   * Get knowledge item storage statistics
   * 
   * AI INSTRUCTIONS:
   * - Provides storage performance metrics
   * - Supports monitoring and optimization
   * - Returns counts and categorization information
   */
  getKnowledgeItemStats(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    totalItems: number;
    itemsBySourceType: Record<string, number>;
    itemsByCategory: Record<string, number>;
    lastUpdated: Date | null;
    storageSize: number; // in bytes
  }>;
} 