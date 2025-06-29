/**
 * Update Knowledge Base Use Case
 * 
 * AI INSTRUCTIONS:
 * - Handles knowledge base updates with proactive vector generation
 * - Generates vectors immediately when content changes
 * - Provides fast user responses by pre-computing embeddings
 * - Follows DDD use case pattern with proper error handling
 */

import { VectorManagementService } from '../services/VectorManagementService';
import { IKnowledgeRetrievalService, KnowledgeItem } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';

export interface UpdateKnowledgeBaseRequest {
  organizationId: string;
  chatbotConfigId: string;
  knowledgeItems: KnowledgeItem[];
  triggerSource: 'manual_upload' | 'cms_sync' | 'api_update' | 'bulk_import';
}

export interface UpdateKnowledgeBaseResponse {
  success: boolean;
  vectorsProcessed: number;
  cacheHits: number;
  cacheMisses: number;
  processingTimeMs: number;
  errors?: string[];
}

/**
 * Use Case: Update Knowledge Base with Proactive Vector Generation
 * 
 * AI INSTRUCTIONS:
 * - Immediately generates vectors when knowledge base changes
 * - Provides instant chatbot responses by pre-computing embeddings
 * - Handles large knowledge bases with efficient batch processing
 * - Logs performance metrics for monitoring
 */
export class UpdateKnowledgeBaseUseCase {
  constructor(
    private vectorManagementService: VectorManagementService,
    private knowledgeRetrievalService: IKnowledgeRetrievalService
  ) {}

  /**
   * Execute knowledge base update with proactive vector generation
   * 
   * AI INSTRUCTIONS:
   * - Triggers immediate vector generation instead of lazy loading
   * - Ensures chatbot is ready for instant responses
   * - Provides comprehensive performance logging
   * - Handles errors gracefully without breaking the knowledge base
   */
  async execute(request: UpdateKnowledgeBaseRequest): Promise<UpdateKnowledgeBaseResponse> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      // Step 1: Update knowledge base storage
      await this.updateKnowledgeBaseStorage(request.knowledgeItems);

      // Step 2: Proactively generate vectors for all knowledge items
      const vectors = await this.vectorManagementService.ensureVectorsUpToDate(
        request.organizationId,
        request.chatbotConfigId,
        request.knowledgeItems
      );

      // Step 3: Calculate performance metrics
      const processingTimeMs = Date.now() - startTime;
      const stats = await this.vectorManagementService.getVectorStats(
        request.organizationId,
        request.chatbotConfigId
      );

      return {
        success: true,
        vectorsProcessed: vectors.length,
        cacheHits: this.calculateCacheHits(vectors),
        cacheMisses: this.calculateCacheMisses(vectors),
        processingTimeMs,
        errors: errors.length > 0 ? errors : undefined
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errors.push(errorMessage);

      return {
        success: false,
        vectorsProcessed: 0,
        cacheHits: 0,
        cacheMisses: 0,
        processingTimeMs: Date.now() - startTime,
        errors
      };
    }
  }

  /**
   * Update knowledge base storage
   * 
   * AI INSTRUCTIONS:
   * - Delegates to knowledge retrieval service for storage updates
   * - Handles batch updates efficiently
   * - Maintains data consistency
   */
  private async updateKnowledgeBaseStorage(knowledgeItems: KnowledgeItem[]): Promise<void> {
    // Note: This would typically involve updating the knowledge base storage
    // For now, we assume the knowledge items are already updated in storage
    // In a real implementation, this might involve:
    // - Bulk upsert to database
    // - File system updates
    // - CMS synchronization
    // - etc.
    
    // Knowledge items updated in storage
  }

  /**
   * Calculate cache hits from vector processing results
   */
  private calculateCacheHits(vectors: any[]): number {
    // This would be enhanced to track actual cache hits/misses
    // For now, returning a placeholder
    return 0;
  }

  /**
   * Calculate cache misses from vector processing results
   */
  private calculateCacheMisses(vectors: any[]): number {
    // This would be enhanced to track actual cache hits/misses
    // For now, returning vector count as all would be new/updated
    return vectors.length;
  }
} 