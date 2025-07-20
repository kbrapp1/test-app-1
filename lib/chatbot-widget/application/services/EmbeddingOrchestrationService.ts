/**
 * Embedding Orchestration Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Embedding generation and progress tracking
 * - Application layer service - orchestrate embedding workflow
 * - Never exceed 250 lines per @golden-rule
 * - Handle embedding generation with progress reporting
 * - Support graceful error handling for individual items
 */

import { createHash } from 'crypto';
import { IEmbeddingService } from '../../domain/services/interfaces/IEmbeddingService';
import { PreparedKnowledgeItem } from './KnowledgeItemPreparationService';

/** Domain model for embedding progress */
export interface EmbeddingProgress {
  readonly vectorizedItems: number;
  readonly totalItems: number;
  readonly currentItem: string;
}

/** Domain model for embedding callback */
export type EmbeddingProgressCallback = (
  status: 'vectorizing',
  progress: EmbeddingProgress
) => Promise<void>;

/** Domain model for embedded knowledge item */
export interface EmbeddedKnowledgeItem {
  readonly knowledgeItemId: string;
  readonly title: string;
  readonly content: string;
  readonly category: string;
  readonly sourceType: 'faq' | 'company_info' | 'product_catalog' | 'support_docs' | 'website_crawled';
  readonly sourceUrl?: string;
  readonly embedding: number[];
  readonly contentHash: string;
  readonly metadata?: Record<string, unknown>;
}

/** Domain model for embedding orchestration result */
export interface EmbeddingOrchestrationResult {
  readonly embeddedItems: EmbeddedKnowledgeItem[];
  readonly successfulEmbeddings: number;
  readonly failedEmbeddings: number;
  readonly totalItems: number;
}

/**
 * Specialized Service for Embedding Generation and Progress Tracking
 * 
 * AI INSTRUCTIONS:
 * - Handle embedding generation workflow with progress reporting
 * - Coordinate embedding service calls with error handling
 * - Support content hash generation for change detection
 * - Enable graceful handling of embedding failures
 * - Provide clear metrics for embedding results
 */
export class EmbeddingOrchestrationService {

  constructor(private readonly embeddingService: IEmbeddingService) {}

  /** Generate embeddings for prepared knowledge items with progress tracking */
  async generateEmbeddings(
    preparedItems: PreparedKnowledgeItem[],
    statusUpdateCallback?: EmbeddingProgressCallback
  ): Promise<EmbeddingOrchestrationResult> {
    if (preparedItems.length === 0) {
      return {
        embeddedItems: [],
        successfulEmbeddings: 0,
        failedEmbeddings: 0,
        totalItems: 0
      };
    }

    // Report vectorization start
    if (statusUpdateCallback) {
      await statusUpdateCallback('vectorizing', {
        vectorizedItems: 0,
        totalItems: preparedItems.length,
        currentItem: 'Starting batch vectorization...'
      });
    }

    // Use batch embedding generation for efficiency (1 API call instead of N calls)
    const contentTexts = preparedItems.map(item => item.content);
    
    // Report progress during batch processing
    if (statusUpdateCallback) {
      await statusUpdateCallback('vectorizing', {
        vectorizedItems: 0,
        totalItems: preparedItems.length,
        currentItem: `Generating embeddings for ${preparedItems.length} items in batch...`
      });
    }

    // Generate embeddings in batch (1 OpenAI API call for all pages)
    const batchEmbeddings = await this.embeddingService.generateEmbeddings(contentTexts);
    
    // Map batch results back to embedded items
    const embeddedItems: EmbeddedKnowledgeItem[] = preparedItems.map((item, index) => ({
      knowledgeItemId: item.knowledgeItemId,
      title: item.title,
      content: item.content,
      category: item.category,
      sourceType: item.sourceType,
      sourceUrl: item.sourceUrl,
      embedding: batchEmbeddings[index] || [],
      contentHash: this.generateContentHash(item.content),
      metadata: item.metadata
    })).filter(item => item.embedding.length > 0); // Filter out failed embeddings

    // Report vectorization completion
    if (statusUpdateCallback) {
      await statusUpdateCallback('vectorizing', {
        vectorizedItems: embeddedItems.length,
        totalItems: preparedItems.length,
        currentItem: 'Batch vectorization completed'
      });
    }

    return {
      embeddedItems,
      successfulEmbeddings: embeddedItems.length,
      failedEmbeddings: preparedItems.length - embeddedItems.length,
      totalItems: preparedItems.length
    };
  }


  /** Generate content hash for change detection */
  private generateContentHash(content: string): string {
    return createHash('sha256')
      .update(content)
      .digest('hex');
  }

  /** Get embedding statistics for monitoring */
  getEmbeddingStatistics(result: EmbeddingOrchestrationResult): {
    successRate: number;
    failureRate: number;
    totalProcessed: number;
  } {
    const successRate = result.totalItems > 0 
      ? (result.successfulEmbeddings / result.totalItems) * 100 
      : 0;
    
    const failureRate = result.totalItems > 0 
      ? (result.failedEmbeddings / result.totalItems) * 100 
      : 0;

    return {
      successRate: Math.round(successRate * 100) / 100,
      failureRate: Math.round(failureRate * 100) / 100,
      totalProcessed: result.totalItems
    };
  }
}