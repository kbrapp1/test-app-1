// Embedding Service Facade
//
// AI INSTRUCTIONS:
// - Clean unified interface for embedding operations
// - Single responsibility: unified embedding interface

import { EmbeddingCacheDomainService } from '../../domain/services/embedding/EmbeddingCacheDomainService';
import { EmbeddingSimilarityDomainService } from '../../domain/services/embedding/EmbeddingSimilarityDomainService';
import { OpenAIEmbeddingProviderService } from '../../infrastructure/providers/openai/services/OpenAIEmbeddingProviderService';
import { EmbeddingApplicationService } from './EmbeddingApplicationService';
import { IEmbeddingService } from '../../domain/services/interfaces/IEmbeddingService';
import {
  EmbeddingResult,
  SimilarityMatch,
  BatchProcessingOptions,
  KnowledgeItem,
  PDFChunk,
  CacheStats,
  CacheType,
  EmbeddingLogContext,
  EMBEDDING_CONSTANTS
} from '../../domain/services/interfaces/EmbeddingTypes';

export class EmbeddingServiceFacade implements IEmbeddingService {
  private applicationService: EmbeddingApplicationService;
  private cacheService: EmbeddingCacheDomainService;
  private providerService: OpenAIEmbeddingProviderService;

  constructor(
    apiKey: string,
    logContext?: EmbeddingLogContext
  ) {
    // Initialize services with dependency injection
    this.cacheService = new EmbeddingCacheDomainService();
    
    this.providerService = new OpenAIEmbeddingProviderService(apiKey, logContext);
    
    this.applicationService = new EmbeddingApplicationService(
      this.cacheService,
      this.providerService,
      logContext
    );
  }

  /** Generate embedding for a single text (interface implementation)
 */
  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.applicationService.generateEmbedding(text);
    return result.embedding;
  }

  /** Generate embeddings for multiple texts in batch (interface implementation)
 */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const results = await this.applicationService.generateEmbeddings(texts);
    return results.map(result => result.embedding);
  }

  /** Generate embedding with metadata
 */
  async generateEmbeddingWithMetadata(text: string): Promise<EmbeddingResult> {
    return await this.applicationService.generateEmbedding(text);
  }

  /** Generate embeddings with metadata for multiple texts
 */
  async generateEmbeddingsWithMetadata(texts: string[]): Promise<EmbeddingResult[]> {
    return await this.applicationService.generateEmbeddings(texts);
  }

  /** Find most similar texts using cosine similarity
 */
  async findSimilarTexts(
    queryText: string,
    candidateTexts: string[],
    topK: number = EMBEDDING_CONSTANTS.DEFAULT_TOP_K,
    minSimilarity: number = EMBEDDING_CONSTANTS.DEFAULT_MIN_SIMILARITY
  ): Promise<SimilarityMatch[]> {
    return await this.applicationService.performSimilaritySearch({
      queryText,
      candidateTexts,
      options: { topK, minSimilarity }
    });
  }

  /** Precompute embeddings for knowledge base
 */
  async precomputeKnowledgeBaseEmbeddings(knowledgeItems: KnowledgeItem[]): Promise<void> {
    await this.applicationService.precomputeKnowledgeBaseEmbeddings(knowledgeItems);
  }

  /** Precompute embeddings for PDF document chunks
 */
  async precomputePDFEmbeddings(
    pdfChunks: PDFChunk[],
    progressCallback?: (processed: number, total: number) => void
  ): Promise<void> {
    const options: BatchProcessingOptions = {
      batchSize: EMBEDDING_CONSTANTS.DEFAULT_PDF_BATCH_SIZE,
      progressCallback
    };
    
    await this.applicationService.precomputePDFEmbeddings(pdfChunks, options);
  }

  /** Calculate cosine similarity between two embeddings
 */
  static calculateCosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
    return EmbeddingSimilarityDomainService.calculateCosineSimilarity(embeddingA, embeddingB);
  }

  /** Find duplicate embeddings with high similarity
 */
  static findDuplicateEmbeddings(
    embeddings: EmbeddingResult[],
    duplicateThreshold: number = 0.95
  ): Array<{ indexA: number; indexB: number; similarity: number; textA: string; textB: string }> {
    return EmbeddingSimilarityDomainService.findDuplicates(embeddings, duplicateThreshold);
  }

  /** Validate embedding vector format
 */
  static validateEmbedding(embedding: number[]): boolean {
    return EmbeddingSimilarityDomainService.validateEmbedding(embedding);
  }

  /** Get cache statistics
 */
  getCacheStats(): CacheStats {
    return this.applicationService.getCacheStats();
  }

  // Get detailed cache breakdown by type
  getDetailedCacheStats(): Record<CacheType, { size: number; maxSize: number | null; keys: string[] }> {
    return this.applicationService.getDetailedCacheStats();
  }

  // Clear embedding cache
  clearCache(): void {
    this.applicationService.clearCache();
  }

  /** Clear specific cache type
 */
  clearCacheType(cacheType: CacheType): void {
    this.applicationService.clearCacheType(cacheType);
  }

  /**
   * Set logging context for all services
   * 
   * AI INSTRUCTIONS:
   * - Update logging across all layers
   * - Enable/disable logging dynamically
   * - Propagate to all services
   */
  setLogContext(logContext: EmbeddingLogContext): void {
    this.applicationService.setLogContext(logContext);
  }
} 