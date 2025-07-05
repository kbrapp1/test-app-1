/**
 * OpenAI Embedding Service - DDD Refactored
 * 
 * AI INSTRUCTIONS:
 * - Clean facade using new DDD architecture
 * - Delegates to EmbeddingServiceFacade for all operations
 * - Maintains interface compatibility
 * - Follow @golden-rule patterns exactly
 * - Under 250 lines by delegating to specialized services
 */

import { EmbeddingServiceFacade } from '../../../../application/services/EmbeddingServiceFacade';
import { IEmbeddingService } from '../../../../domain/services/interfaces/IEmbeddingService';
import {
  EmbeddingResult,
  SimilarityMatch,
  EmbeddingLogContext,
  KnowledgeItem,
  PDFChunk,
  CacheStats
} from '../../../../domain/services/interfaces/EmbeddingTypes';

export class OpenAIEmbeddingService implements IEmbeddingService {
  private facade: EmbeddingServiceFacade;

  constructor(
    apiKey: string, 
    logContext?: EmbeddingLogContext, 
    maxUserQueryCacheSize: number = 1000,
    maxPdfCacheSize: number = 5000
  ) {
    this.facade = new EmbeddingServiceFacade(
      apiKey,
      logContext,
      maxUserQueryCacheSize,
      maxPdfCacheSize
    );
  }

  /**
   * Generate embedding for a single text (interface implementation)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    return await this.facade.generateEmbedding(text);
  }

  /**
   * Generate embeddings for multiple texts in batch (interface implementation)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return await this.facade.generateEmbeddings(texts);
  }

  /**
   * Generate embedding result with metadata for a single text
   */
  async generateEmbeddingWithMetadata(text: string): Promise<EmbeddingResult> {
    return await this.facade.generateEmbeddingWithMetadata(text);
  }

  /**
   * Generate embeddings for multiple texts with comprehensive logging
   */
  async generateEmbeddingsWithMetadata(texts: string[]): Promise<EmbeddingResult[]> {
    return await this.facade.generateEmbeddingsWithMetadata(texts);
  }

  /**
   * Find most similar texts using cosine similarity
   */
  async findSimilarTexts(
    queryText: string,
    candidateTexts: string[],
    topK: number = 5,
    minSimilarity: number = 0.3
  ): Promise<SimilarityMatch[]> {
    return await this.facade.findSimilarTexts(queryText, candidateTexts, topK, minSimilarity);
  }

  /**
   * Precompute embeddings for knowledge base
   */
  async precomputeKnowledgeBaseEmbeddings(knowledgeItems: Array<{ id: string; content: string }>): Promise<void> {
    const items: KnowledgeItem[] = knowledgeItems.map(item => ({
      id: item.id,
      content: item.content
    }));
    
    await this.facade.precomputeKnowledgeBaseEmbeddings(items);
  }

  /**
   * Precompute embeddings for PDF document chunks with optimized caching
   */
  async precomputePDFEmbeddings(
    pdfChunks: Array<{ id: string; content: string }>,
    progressCallback?: (processed: number, total: number) => void
  ): Promise<void> {
    const chunks: PDFChunk[] = pdfChunks.map(chunk => ({
      id: chunk.id,
      content: chunk.content
    }));
    
    await this.facade.precomputePDFEmbeddings(chunks, progressCallback);
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.facade.clearCache();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; utilizationPercent: number; keys: string[] } {
    return this.facade.getCacheStats();
  }

  /**
   * Set logging context for API call logging
   */
  setLogContext(logContext: EmbeddingLogContext): void {
    this.facade.setLogContext(logContext);
  }

  /**
   * Calculate cosine similarity between two embeddings (static method)
   */
  static calculateCosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
    return EmbeddingServiceFacade.calculateCosineSimilarity(embeddingA, embeddingB);
  }

  /**
   * Find duplicate embeddings with high similarity (static method)
   */
  static findDuplicateEmbeddings(
    embeddings: EmbeddingResult[],
    duplicateThreshold: number = 0.95
  ): Array<{ indexA: number; indexB: number; similarity: number; textA: string; textB: string }> {
    return EmbeddingServiceFacade.findDuplicateEmbeddings(embeddings, duplicateThreshold);
  }

  /**
   * Validate embedding vector format (static method)
   */
  static validateEmbedding(embedding: number[]): boolean {
    return EmbeddingServiceFacade.validateEmbedding(embedding);
  }
}

// Export types for backward compatibility
export type { EmbeddingResult, SimilarityMatch, EmbeddingLogContext }; 