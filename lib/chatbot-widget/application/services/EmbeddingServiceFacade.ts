/**
 * Embedding Service Facade
 * 
 * AI INSTRUCTIONS:
 * - Clean unified interface for embedding operations
 * - Orchestrates all domain and application services
 * - Keep under 250 lines by focusing on coordination
 * - Follow @golden-rule patterns exactly
 * - Single responsibility: unified embedding interface
 */

import { EmbeddingCacheDomainService } from '../../domain/services/embedding/EmbeddingCacheDomainService';
import { EmbeddingSimilarityDomainService } from '../../domain/services/embedding/EmbeddingSimilarityDomainService';
import { OpenAIEmbeddingProviderService } from '../../infrastructure/providers/openai/services/OpenAIEmbeddingProviderService';
import { EmbeddingApplicationService } from './EmbeddingApplicationService';
import { IEmbeddingService } from '../../domain/services/interfaces/IEmbeddingService';
import {
  EmbeddingResult,
  SimilarityMatch,
  SimilaritySearchOptions,
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
    logContext?: EmbeddingLogContext,
    maxUserQueryCacheSize: number = EMBEDDING_CONSTANTS.DEFAULT_USER_QUERY_CACHE_SIZE,
    maxPdfCacheSize: number = EMBEDDING_CONSTANTS.DEFAULT_PDF_CACHE_SIZE
  ) {
    // Initialize services with dependency injection
    this.cacheService = new EmbeddingCacheDomainService({
      maxUserQueryCacheSize,
      maxPdfCacheSize
    });
    
    this.providerService = new OpenAIEmbeddingProviderService(apiKey, logContext);
    
    this.applicationService = new EmbeddingApplicationService(
      this.cacheService,
      this.providerService,
      logContext
    );
  }

  /**
   * Generate embedding for a single text (interface implementation)
   * 
   * AI INSTRUCTIONS:
   * - Delegate to application service
   * - Maintain interface compatibility
   * - Return only embedding vector
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.applicationService.generateEmbedding(text);
    return result.embedding;
  }

  /**
   * Generate embeddings for multiple texts in batch (interface implementation)
   * 
   * AI INSTRUCTIONS:
   * - Delegate to application service
   * - Maintain interface compatibility
   * - Return only embedding vectors
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const results = await this.applicationService.generateEmbeddings(texts);
    return results.map(result => result.embedding);
  }

  /**
   * Generate embedding with metadata
   * 
   * AI INSTRUCTIONS:
   * - Extended interface for full embedding data
   * - Include token count and text metadata
   * - Useful for analytics and optimization
   */
  async generateEmbeddingWithMetadata(text: string): Promise<EmbeddingResult> {
    return await this.applicationService.generateEmbedding(text);
  }

  /**
   * Generate embeddings with metadata for multiple texts
   * 
   * AI INSTRUCTIONS:
   * - Extended interface for full embedding data
   * - Batch processing with complete metadata
   * - Efficient for analytics workflows
   */
  async generateEmbeddingsWithMetadata(texts: string[]): Promise<EmbeddingResult[]> {
    return await this.applicationService.generateEmbeddings(texts);
  }

  /**
   * Find most similar texts using cosine similarity
   * 
   * AI INSTRUCTIONS:
   * - Semantic search with ranking
   * - Use application service for orchestration
   * - Return similarity scores and indices
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

  /**
   * Precompute embeddings for knowledge base
   * 
   * AI INSTRUCTIONS:
   * - Batch process knowledge base items
   * - Store in permanent cache
   * - Optimize for business knowledge
   */
  async precomputeKnowledgeBaseEmbeddings(knowledgeItems: KnowledgeItem[]): Promise<void> {
    await this.applicationService.precomputeKnowledgeBaseEmbeddings(knowledgeItems);
  }

  /**
   * Precompute embeddings for PDF document chunks
   * 
   * AI INSTRUCTIONS:
   * - Process large documents efficiently
   * - Provide progress tracking
   * - Optimize for document workflows
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

  /**
   * Calculate cosine similarity between two embeddings
   * 
   * AI INSTRUCTIONS:
   * - Direct access to similarity calculations
   * - Use domain service for pure math operations
   * - No caching or API calls needed
   */
  static calculateCosineSimilarity(embeddingA: number[], embeddingB: number[]): number {
    return EmbeddingSimilarityDomainService.calculateCosineSimilarity(embeddingA, embeddingB);
  }

  /**
   * Find duplicate embeddings with high similarity
   * 
   * AI INSTRUCTIONS:
   * - Content deduplication functionality
   * - Use domain service for calculations
   * - Return detailed duplicate information
   */
  static findDuplicateEmbeddings(
    embeddings: EmbeddingResult[],
    duplicateThreshold: number = 0.95
  ): Array<{ indexA: number; indexB: number; similarity: number; textA: string; textB: string }> {
    return EmbeddingSimilarityDomainService.findDuplicates(embeddings, duplicateThreshold);
  }

  /**
   * Validate embedding vector format
   * 
   * AI INSTRUCTIONS:
   * - Quality control for embeddings
   * - Use domain service for validation
   * - Check for common embedding issues
   */
  static validateEmbedding(embedding: number[]): boolean {
    return EmbeddingSimilarityDomainService.validateEmbedding(embedding);
  }

  /**
   * Get cache statistics
   * 
   * AI INSTRUCTIONS:
   * - Monitoring and optimization data
   * - Delegate to application service
   * - Include all cache types
   */
  getCacheStats(): CacheStats {
    return this.applicationService.getCacheStats();
  }

  /**
   * Get detailed cache breakdown by type
   * 
   * AI INSTRUCTIONS:
   * - Advanced cache analytics
   * - Type-specific statistics
   * - Useful for cache tuning
   */
  getDetailedCacheStats(): Record<CacheType, { size: number; maxSize: number | null; keys: string[] }> {
    return this.applicationService.getDetailedCacheStats();
  }

  /**
   * Clear embedding cache
   * 
   * AI INSTRUCTIONS:
   * - Complete cache reset
   * - Delegate to application service
   * - Use for testing and maintenance
   */
  clearCache(): void {
    this.applicationService.clearCache();
  }

  /**
   * Clear specific cache type
   * 
   * AI INSTRUCTIONS:
   * - Selective cache management
   * - Preserve other cache types
   * - Fine-grained control
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