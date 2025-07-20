/**
 * Vector Knowledge Command Repository Interface
 * 
 * AI INSTRUCTIONS:
 * - Defines contract for write operations on vector knowledge
 * - Follows CQRS pattern for command responsibility
 * - Support multi-tenant isolation by organization
 * - Maintains clean domain boundaries
 * - Focus on data mutation and storage operations
 */
export interface IVectorKnowledgeCommandRepository {
  /**
   * Store knowledge items with vectors
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
      metadata?: Record<string, unknown>;
    }>
  ): Promise<void>;

  /**
   * Delete knowledge items by source pattern
   */
  deleteKnowledgeItemsBySource(
    organizationId: string,
    chatbotConfigId: string,
    sourceType: string,
    sourceUrl?: string
  ): Promise<number>;
}