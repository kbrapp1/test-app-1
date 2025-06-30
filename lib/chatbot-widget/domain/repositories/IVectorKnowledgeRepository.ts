import { KnowledgeItem } from '../services/interfaces/IKnowledgeRetrievalService';

/**
 * Vector Knowledge Repository Interface
 * 
 * AI INSTRUCTIONS:
 * - Single-table approach using chatbot_knowledge_vectors
 * - Stores both vector embeddings AND content in one table
 * - Optimized for semantic search with complete context retrieval
 * - Follows DDD repository pattern - interface only in domain
 */
export interface IVectorKnowledgeRepository {
  /**
   * Store knowledge items with both content and embeddings
   * 
   * AI INSTRUCTIONS:
   * - Stores content, metadata, and vector embeddings in single table
   * - Upserts based on knowledge_item_id to handle updates
   * - Enables both semantic search and content injection
   */
  storeKnowledgeItems(
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
    }>
  ): Promise<void>;

  /**
   * Search knowledge using vector similarity
   * 
   * AI INSTRUCTIONS:
   * - Performs semantic search using stored embeddings
   * - Returns complete content for injection into completions
   * - Single table query for optimal performance
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
    }
  ): Promise<Array<{
    item: KnowledgeItem;
    similarity: number;
  }>>;

  /**
   * Get all knowledge vectors for cache initialization
   * 
   * AI INSTRUCTIONS:
   * - Retrieves all knowledge items with their actual vector embeddings
   * - Used for initializing in-memory vector cache during session start
   * - Returns both content and embeddings for fast similarity search
   */
  getAllKnowledgeVectors(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<Array<{
    item: KnowledgeItem;
    vector: number[];
  }>>;

  /**
   * Delete knowledge items by source
   * 
   * AI INSTRUCTIONS:
   * - Bulk cleanup when content sources are removed
   * - Deletes both content and vectors in single operation
   * - Used for website source deletion and refresh
   */
  deleteKnowledgeItemsBySource(
    organizationId: string,
    chatbotConfigId: string,
    sourceType: string,
    sourceUrl?: string
  ): Promise<number>; // Returns count of deleted items

  /**
   * Get knowledge item storage statistics
   * 
   * AI INSTRUCTIONS:
   * - Provides storage performance metrics from single table
   * - Supports monitoring and optimization
   */
  getKnowledgeItemStats(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    totalItems: number;
    itemsBySourceType: Record<string, number>;
    itemsByCategory: Record<string, number>;
    lastUpdated: Date | null;
    storageSize: number;
  }>;
} 