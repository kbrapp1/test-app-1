/**
 * Embedding Application Service
 * 
 * AI INSTRUCTIONS:
 * - Application service for orchestrating embedding operations and batch processing
 * - Coordinates domain services without business logic
 * - Keep under 250 lines by focusing on coordination
 * - Follow @golden-rule patterns exactly
 * - Single responsibility: embedding workflow orchestration
 */

import { EmbeddingCacheDomainService } from '../../domain/services/embedding/EmbeddingCacheDomainService';
import { EmbeddingSimilarityDomainService } from '../../domain/services/embedding/EmbeddingSimilarityDomainService';
import { OpenAIEmbeddingProviderService } from '../../infrastructure/providers/openai/services/OpenAIEmbeddingProviderService';
import {
  EmbeddingResult,
  SimilarityMatch,
  SimilaritySearchRequest,
  BatchProcessingOptions,
  KnowledgeItem,
  PDFChunk,
  CacheStats,
  CacheType,
  EmbeddingLogContext,
  EMBEDDING_CONSTANTS
} from '../../domain/services/interfaces/EmbeddingTypes';

export class EmbeddingApplicationService {
  constructor(
    private cacheService: EmbeddingCacheDomainService,
    private providerService: OpenAIEmbeddingProviderService,
    private logContext?: EmbeddingLogContext
  ) {}

  /**
   * Generate embedding with intelligent caching
   * 
   * AI INSTRUCTIONS:
   * - Check cache first, then API if needed
   * - Log cache hits/misses for optimization
   * - Store result in appropriate cache
   */
  async generateEmbedding(text: string): Promise<EmbeddingResult> {
    const cacheKey = this.cacheService.generateCacheKey(text);
    
    // Check cache first
    const cached = this.cacheService.getEmbedding(cacheKey);
    if (cached) {
      this.log('✅ Embedding found in cache (no API call needed)');
      return cached;
    }

    // Generate via API
    this.log('🔄 Embedding not cached - API call required');
    const result = await this.providerService.generateSingleEmbedding(text);
    
    // Store in cache
    const cacheType = this.cacheService.storeEmbedding(cacheKey, result);
    this.log(`💾 Embedding cached as ${cacheType}: ${this.cacheService.getCacheStats().size} total entries`);
    
    return result;
  }

  /**
   * Generate embeddings for multiple texts with batch optimization
   * 
   * AI INSTRUCTIONS:
   * - Separate cached from uncached texts
   * - Batch API calls for efficiency
   * - Combine results in original order
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResult[]> {
    const uniqueTexts = Array.from(new Set(texts.filter(t => t.trim().length > 0)));
    const results: EmbeddingResult[] = [];
    
    // Separate cached from uncached
    const uncachedTexts: string[] = [];
    const cachedResults: EmbeddingResult[] = [];
    
    for (const text of uniqueTexts) {
      const cacheKey = this.cacheService.generateCacheKey(text);
      const cached = this.cacheService.getEmbedding(cacheKey);
      
      if (cached) {
        cachedResults.push(cached);
      } else {
        uncachedTexts.push(text);
      }
    }

    this.log(`📊 Cache analysis: ${cachedResults.length} cached, ${uncachedTexts.length} need vectorization`);

    // Generate embeddings for uncached texts
    if (uncachedTexts.length > 0) {
      const newResults = await this.providerService.generateBatchEmbeddings(uncachedTexts);
      
      // Cache new results
      newResults.forEach(result => {
        const cacheKey = this.cacheService.generateCacheKey(result.text);
        this.cacheService.storeEmbedding(cacheKey, result);
      });
      
      results.push(...newResults);
      this.log(`💾 Cached ${newResults.length} new embeddings`);
    }

    // Combine cached and new results
    results.push(...cachedResults);
    
    // Return in original order
    return texts.map(originalText => {
      return results.find(r => r.text === originalText.trim()) || {
        embedding: [],
        text: originalText,
        tokenCount: 0
      };
    });
  }

  /**
   * Perform semantic similarity search
   * 
   * AI INSTRUCTIONS:
   * - Generate query embedding (cached if possible)
   * - Use domain service for similarity calculations
   * - Return ranked results with scores
   */
  async performSimilaritySearch(request: SimilaritySearchRequest): Promise<SimilarityMatch[]> {
    if (request.candidateTexts.length === 0) {
      return [];
    }

    this.log('\n🔍 =====================================');
    this.log('🔍 SEMANTIC SIMILARITY SEARCH');
    this.log('🔍 =====================================');
    this.log(`📋 Query: "${request.queryText}"`);
    this.log(`📋 Searching against: ${request.candidateTexts.length} candidates`);

    // Generate embeddings
    const [queryResult, candidateResults] = await Promise.all([
      this.generateEmbedding(request.queryText),
      this.generateEmbeddings(request.candidateTexts)
    ]);

    // Calculate similarities using domain service
    const similarities = EmbeddingSimilarityDomainService.findMostSimilar(
      queryResult.embedding,
      candidateResults,
      request.options
    );

    this.log(`📊 Found ${similarities.length} matches above threshold`);
    this.log('🔍 =====================================\n');

    return similarities;
  }

  /**
   * Precompute embeddings for knowledge base
   * 
   * AI INSTRUCTIONS:
   * - Batch process knowledge base items
   * - Store in permanent cache
   * - Provide progress feedback
   */
  async precomputeKnowledgeBaseEmbeddings(items: KnowledgeItem[]): Promise<void> {
    const texts = items.map(item => item.content);
    this.log(`🔄 Precomputing embeddings for ${texts.length} knowledge base items`);
    
    await this.generateEmbeddings(texts);
    
    this.log(`✅ Knowledge base precomputation completed: ${texts.length} items`);
  }

  /**
   * Precompute embeddings for PDF chunks with progress tracking
   * 
   * AI INSTRUCTIONS:
   * - Process in smaller batches for large documents
   * - Provide progress callbacks for UI updates
   * - Handle PDF-specific caching strategy
   */
  async precomputePDFEmbeddings(
    chunks: PDFChunk[],
    options: BatchProcessingOptions = {
      batchSize: EMBEDDING_CONSTANTS.DEFAULT_PDF_BATCH_SIZE
    }
  ): Promise<void> {
    const { batchSize, progressCallback } = options;
    const total = chunks.length;
    let processed = 0;

    this.log(`🔄 Processing ${total} PDF chunks in batches of ${batchSize}`);

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const batchTexts = batch.map(chunk => chunk.content);
      
      try {
        await this.generateEmbeddings(batchTexts);
        
        processed += batch.length;
        
        if (progressCallback) {
          progressCallback(processed, total);
        }
        
        this.log(`✅ Processed batch ${Math.ceil((i + batchSize) / batchSize)} of ${Math.ceil(total / batchSize)}`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.log(`❌ PDF batch processing failed: ${errorMessage}`);
        throw error;
      }
    }

    this.log(`✅ PDF embedding processing completed: ${processed}/${total} chunks`);
  }

  /**
   * Get comprehensive cache statistics
   * 
   * AI INSTRUCTIONS:
   * - Delegate to cache domain service
   * - Return detailed cache breakdown
   * - Include utilization metrics
   */
  getCacheStats(): CacheStats {
    return this.cacheService.getCacheStats();
  }

  /**
   * Get detailed cache breakdown by type
   * 
   * AI INSTRUCTIONS:
   * - Provide cache statistics per type
   * - Useful for cache optimization analysis
   * - Include type-specific metrics
   */
  getDetailedCacheStats(): Record<CacheType, { size: number; maxSize: number | null; keys: string[] }> {
    return this.cacheService.getDetailedCacheStats();
  }

  /**
   * Clear all caches
   * 
   * AI INSTRUCTIONS:
   * - Complete cache reset for testing/maintenance
   * - Delegate to cache domain service
   * - Log cache clearing operation
   */
  clearCache(): void {
    this.cacheService.clearAllCaches();
    this.log('🗑️  All embedding caches cleared');
  }

  /**
   * Clear specific cache type
   * 
   * AI INSTRUCTIONS:
   * - Selective cache clearing
   * - Preserve other cache types
   * - Log specific cache clearing
   */
  clearCacheType(cacheType: CacheType): void {
    this.cacheService.clearCache(cacheType);
    this.log(`🗑️  ${cacheType} cache cleared`);
  }

  /**
   * Set logging context
   * 
   * AI INSTRUCTIONS:
   * - Update logging context for all services
   * - Enable/disable logging dynamically
   * - Propagate to provider service
   */
  setLogContext(logContext: EmbeddingLogContext): void {
    this.logContext = logContext;
    this.providerService.setLogContext(logContext);
  }

  /**
   * Log entry with fallback to no-op if no context
   * 
   * AI INSTRUCTIONS:
   * - Safe logging that handles missing context
   * - Consistent interface for all logging
   * - No-op when logging context unavailable
   */
  private log(message: string): void {
    if (this.logContext) {
      this.logContext.logEntry(message);
    }
  }
} 