import { KnowledgeItem } from '../services/interfaces/IKnowledgeRetrievalService';

/**
 * Vector Knowledge Query Repository Interface
 * 
 * AI INSTRUCTIONS:
 * - Defines contract for read operations on vector knowledge
 * - Follows CQRS pattern for query responsibility
 * - Support multi-tenant isolation by organization
 * - Maintains clean domain boundaries
 * - Focus on data retrieval and search operations
 */
export interface IVectorKnowledgeQueryRepository {
  /**
   * Search knowledge items using vector similarity
   */
  searchKnowledgeItems(
    organizationId: string,
    chatbotConfigId: string,
    queryEmbedding: number[],
    options?: {
      threshold?: number;
      limit?: number;
      categoryFilter?: string;
      sourceTypeFilter?: string;
    }
  ): Promise<Array<{ item: KnowledgeItem; similarity: number; }>>;

  /**
   * Get all knowledge vectors for cache initialization
   */
  getAllKnowledgeVectors(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<Array<{ item: KnowledgeItem; vector: number[]; }>>;

  /**
   * Get crawled pages with metadata
   */
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