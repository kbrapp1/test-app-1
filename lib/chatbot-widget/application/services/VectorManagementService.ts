import { IVectorRepository } from '../../domain/repositories/IVectorRepository';
import { KnowledgeVector } from '../../domain/entities/KnowledgeVector';
import { KnowledgeItem } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { IEmbeddingService } from '../../domain/services/interfaces/IEmbeddingService';
import { createHash } from 'crypto';

/**
 * Vector Management Service
 * 
 * AI INSTRUCTIONS:
 * - Orchestrates vector caching and cache invalidation
 * - Handles content change detection through hashing
 * - Optimizes API calls by reusing cached vectors
 * - Provides comprehensive logging for cache performance
 */
export class VectorManagementService {
  constructor(
    private vectorRepository: IVectorRepository,
    private embeddingService: IEmbeddingService
  ) {}

  /**
   * Ensure all vectors are up-to-date with smart caching
   * 
   * AI INSTRUCTIONS:
   * - Checks content hash for each knowledge item
   * - Only recalculates vectors when content has changed
   * - Provides detailed logging for cache hits/misses
   * - Returns complete vector set for similarity search
   */
  async ensureVectorsUpToDate(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItems: KnowledgeItem[]
  ): Promise<KnowledgeVector[]> {
    const vectors: KnowledgeVector[] = [];
    let cacheHits = 0;
    let cacheMisses = 0;
    let recalculated = 0;

    for (const item of knowledgeItems) {
      try {
        const contentHash = this.calculateContentHash(item);
        const existingVector = await this.vectorRepository.getVector(
          organizationId,
          chatbotConfigId,
          item.id
        );

        if (existingVector && !existingVector.hasContentChanged(contentHash)) {
          // Cache hit - use existing vector
          vectors.push(existingVector);
          cacheHits++;
        } else {
          // Cache miss or content changed - recalculate vector
          const embeddingContent = this.buildEmbeddingContent(item);
          const newVector = await this.embeddingService.generateEmbedding(embeddingContent);
          
          const storedVector = await this.vectorRepository.storeVector(
            organizationId,
            chatbotConfigId,
            item.id,
            newVector,
            contentHash,
            {
              title: item.title,
              category: item.category,
              source: item.source,
              tags: item.tags
            }
          );

          vectors.push(storedVector);
          cacheMisses++;
          if (existingVector) recalculated++;
        }
      } catch (error) {
        throw error;
      }
    }

    return vectors;
  }

  /**
   * Find similar vectors using cached embeddings
   * 
   * AI INSTRUCTIONS:
   * - Uses pgvector for efficient similarity search
   * - Leverages cached vectors to avoid API calls
   * - Returns results with similarity scores
   * - Supports threshold filtering and result limiting
   */
  async findSimilarVectors(
    organizationId: string,
    chatbotConfigId: string,
    queryVector: number[],
    threshold: number = 0.1,
    limit: number = 7
  ): Promise<Array<{ vector: KnowledgeVector; similarity: number; }>> {
    const results = await this.vectorRepository.findSimilarVectors(
      organizationId,
      chatbotConfigId,
      queryVector,
      threshold,
      limit
    );

    return results;
  }

  /**
   * Get vector cache statistics
   * 
   * AI INSTRUCTIONS:
   * - Provides cache performance metrics
   * - Supports monitoring and optimization decisions
   * - Returns comprehensive storage information
   */
  async getVectorStats(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<{
    totalVectors: number;
    lastUpdated: Date | null;
    avgVectorAge: number;
    storageSize: number;
  }> {
    return await this.vectorRepository.getVectorStats(organizationId, chatbotConfigId);
  }

  /**
   * Get all vectors for a chatbot configuration
   * 
   * AI INSTRUCTIONS:
   * - Retrieves complete vector cache for chatbot
   * - Used for cleanup operations and bulk processing
   * - Includes organization-level isolation
   * - Returns all cached vectors for the configuration
   */
  async getAllVectors(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<KnowledgeVector[]> {
    return await this.vectorRepository.getAllVectors(organizationId, chatbotConfigId);
  }

  /**
   * Delete single vector by knowledge item ID
   * 
   * AI INSTRUCTIONS:
   * - Removes cached vector when knowledge item is deleted
   * - Used for cleanup of deleted pages/content
   * - Maintains data consistency in vector cache
   * - Returns success status
   */
  async deleteVector(
    organizationId: string,
    chatbotConfigId: string,
    knowledgeItemId: string
  ): Promise<boolean> {
    return await this.vectorRepository.deleteVector(
      organizationId,
      chatbotConfigId,
      knowledgeItemId
    );
  }

  /**
   * Clear vector cache for chatbot configuration
   * 
   * AI INSTRUCTIONS:
   * - Removes all cached vectors for complete refresh
   * - Used when knowledge base structure changes significantly
   * - Returns count of deleted vectors
   */
  async clearVectorCache(
    organizationId: string,
    chatbotConfigId: string
  ): Promise<number> {
    const deletedCount = await this.vectorRepository.deleteAllVectors(
      organizationId,
      chatbotConfigId
    );

    return deletedCount;
  }

  /**
   * Calculate content hash for change detection
   * 
   * AI INSTRUCTIONS:
   * - Creates SHA-256 hash of knowledge item content
   * - Includes title, content, tags, and category for completeness
   * - Used for efficient cache invalidation
   * - Ensures vectors are recalculated only when content changes
   */
  private calculateContentHash(item: KnowledgeItem): string {
    const content = JSON.stringify({
      title: item.title,
      content: item.content,
      category: item.category,
      tags: item.tags.sort(), // Sort for consistent hashing
      source: item.source
    });

    return createHash('sha256').update(content, 'utf8').digest('hex');
  }

  /**
   * Build embedding content with tags and metadata
   * 
   * AI INSTRUCTIONS:
   * - Combines title, content, and tags for comprehensive vectorization
   * - Matches the format used in KnowledgeRelevanceService
   * - Ensures consistent embedding generation
   * - Optimizes for semantic search accuracy
   */
  private buildEmbeddingContent(item: KnowledgeItem): string {
    let embeddingText = `${item.title}\n\n${item.content}`;
    
    // Add tags as semantic anchors
    if (item.tags && item.tags.length > 0) {
      embeddingText += `\n\nRelevant topics: ${item.tags.join(', ')}`;
    }
    
    // Add category for additional context
    embeddingText += `\n\nCategory: ${item.category}`;
    
    return embeddingText;
  }
} 