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
  /** Store knowledge items with both content and embeddings */
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
      metadata?: Record<string, any>;
    }>
  ): Promise<void>;

  /** Search knowledge using vector similarity */
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

  /** Get all knowledge vectors for cache initialization */
  getAllKnowledgeVectors(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<Array<{
    item: KnowledgeItem;
    vector: number[];
  }>>;

  /** Delete knowledge items by source */
  deleteKnowledgeItemsBySource(
    organizationId: string,
    chatbotConfigId: string,
    sourceType: string,
    sourceUrl?: string
  ): Promise<number>; // Returns count of deleted items

  /** Get knowledge item storage statistics */
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

  /** Get crawled pages data for UI display */
  getCrawledPages(
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
  }>>;
} 