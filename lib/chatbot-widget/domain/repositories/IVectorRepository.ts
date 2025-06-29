import { KnowledgeVector } from '../entities/KnowledgeVector';

/**
 * Vector Repository Interface
 * 
 * AI INSTRUCTIONS:
 * - Contract for vector storage and retrieval operations
 * - Supports efficient vector caching and similarity search
 * - Enables change detection through content hashing
 * - Follows DDD repository pattern - interface only in domain
 */
export interface IVectorRepository {
  /**
   * Store a new vector or update existing one
   * 
   * AI INSTRUCTIONS:
   * - Upserts vector based on unique constraint (org + config + item)
   * - Updates content hash and timestamp on changes
   * - Handles vector dimension validation
   */
  storeVector(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string,
    vector: number[],
    contentHash: string,
    metadata?: Record<string, any>
  ): Promise<KnowledgeVector>;

  /**
   * Get vector by knowledge item ID
   * 
   * AI INSTRUCTIONS:
   * - Retrieves cached vector for specific knowledge item
   * - Returns null if vector doesn't exist
   * - Used for cache hit/miss detection
   */
  getVector(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string
  ): Promise<KnowledgeVector | null>;

  /**
   * Get multiple vectors by knowledge item IDs
   * 
   * AI INSTRUCTIONS:
   * - Batch retrieval for efficiency
   * - Returns only existing vectors (partial results possible)
   * - Used for bulk vector operations
   */
  getVectorsByIds(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemIds: string[]
  ): Promise<KnowledgeVector[]>;

  /**
   * Get all vectors for a chatbot configuration
   * 
   * AI INSTRUCTIONS:
   * - Retrieves complete vector cache for chatbot
   * - Used for similarity search operations
   * - Includes organization-level isolation
   */
  getAllVectors(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<KnowledgeVector[]>;

  /**
   * Delete vector by knowledge item ID
   * 
   * AI INSTRUCTIONS:
   * - Removes cached vector when knowledge item is deleted
   * - Handles cascade cleanup
   * - Returns success status
   */
  deleteVector(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string
  ): Promise<boolean>;

  /**
   * Delete all vectors for a chatbot configuration
   * 
   * AI INSTRUCTIONS:
   * - Bulk cleanup when chatbot config is deleted
   * - Efficient batch deletion
   * - Maintains data consistency
   */
  deleteAllVectors(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<number>; // Returns count of deleted vectors

  /**
   * Check if vector exists with current content hash
   * 
   * AI INSTRUCTIONS:
   * - Efficient cache validation without full vector retrieval
   * - Compares content hash for change detection
   * - Optimizes vector recalculation decisions
   */
  vectorExists(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string,
    contentHash: string
  ): Promise<boolean>;

  /**
   * Find similar vectors using similarity search
   * 
   * AI INSTRUCTIONS:
   * - Performs vector similarity search using pgvector
   * - Returns vectors ordered by similarity score
   * - Supports threshold filtering and result limiting
   */
  findSimilarVectors(
    organizationId: string,
    chatbotConfigId: string,
    queryVector: number[],
    threshold: number,
    limit: number
  ): Promise<Array<{
    vector: KnowledgeVector;
    similarity: number;
  }>>;

  /**
   * Get vector storage statistics
   * 
   * AI INSTRUCTIONS:
   * - Provides cache performance metrics
   * - Supports monitoring and optimization
   * - Returns counts and storage information
   */
  getVectorStats(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    totalVectors: number;
    lastUpdated: Date | null;
    avgVectorAge: number; // in days
    storageSize: number; // in bytes
  }>;
} 