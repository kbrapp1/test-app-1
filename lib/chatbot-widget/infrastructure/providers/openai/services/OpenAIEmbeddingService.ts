/**
 * OpenAI Embedding Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Generate and compare embeddings for semantic search
 * - Use OpenAI Embeddings API for high-quality vector representations
 * - Implement in-memory embedding cache for performance
 * - Follow @golden-rule patterns: clean interfaces, error handling
 * - No vector database required - perfect for small knowledge bases
 * - LOGGING: Comprehensive API call logging for embeddings requests/responses
 */

import OpenAI from 'openai';
import { IEmbeddingService } from '../../../../domain/services/interfaces/IEmbeddingService';

export interface EmbeddingResult {
  embedding: number[];
  text: string;
  tokenCount: number;
}

export interface SimilarityMatch {
  text: string;
  similarity: number;
  index: number;
}

export interface EmbeddingLogContext {
  logEntry: (message: string) => void;
}

export class OpenAIEmbeddingService implements IEmbeddingService {
  private client: OpenAI;
  private knowledgeBaseCache = new Map<string, EmbeddingResult>(); // Never evicted
  private userQueryCache = new Map<string, EmbeddingResult>();     // LRU evicted
  private pdfDocumentCache = new Map<string, EmbeddingResult>();   // PDF-specific cache with larger limits
  private logContext?: EmbeddingLogContext;
  private readonly maxUserQueryCacheSize: number;
  private readonly maxPdfCacheSize: number;
  
  constructor(
    apiKey: string, 
    logContext?: EmbeddingLogContext, 
    maxUserQueryCacheSize: number = 1000,
    maxPdfCacheSize: number = 5000  // Larger limit for PDF chunks
  ) {
    this.client = new OpenAI({
      apiKey,
      timeout: 30000
    });
    this.logContext = logContext;
    this.maxUserQueryCacheSize = maxUserQueryCacheSize;
    this.maxPdfCacheSize = maxPdfCacheSize;
  }

  /**
   * Set logging context for API call logging
   */
  setLogContext(logContext: EmbeddingLogContext): void {
    this.logContext = logContext;
  }

  /**
   * Log entry with fallback to no-op if no context
   */
  private log(message: string): void {
    if (this.logContext) {
      this.logContext.logEntry(message);
    }
  }

  /**
   * Generate embedding for a single text (interface implementation)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    const result = await this.generateEmbeddingWithMetadata(text);
    return result.embedding;
  }

  /**
   * Generate embeddings for multiple texts in batch (interface implementation)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const results = await this.generateEmbeddingsWithMetadata(texts);
    return results.map(result => result.embedding);
  }

  /**
   * Generate embedding result with metadata for a single text
   */
  async generateEmbeddingWithMetadata(text: string): Promise<EmbeddingResult> {
    const cacheKey = this.getCacheKey(text);
    
    // Check cache first with LRU update
    const cached = this.getCacheWithLRU(cacheKey);
    if (cached) {
      this.log('✅ User query found in cache (no API call needed)');
      return cached;
    }

    this.log('🔄 User query not cached - API call required');
    this.log('\n🔗 =====================================');
    this.log('🔗 OPENAI EMBEDDINGS API CALL - SINGLE');
    this.log('🔗 =====================================');

    try {
      const apiRequest = {
        model: 'text-embedding-3-small',
        input: text.trim(),
        encoding_format: 'float' as const
      };

      // Log the complete API request
      this.log('📤 COMPLETE API REQUEST:');
      this.log('🔗 Endpoint: https://api.openai.com/v1/embeddings');
      this.log('📋 Request Headers:');
      this.log(JSON.stringify({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer [REDACTED]',
        'User-Agent': 'Chatbot-Widget-Embeddings/1.0'
      }, null, 2));
      this.log('📋 Request Body:');
      this.log(JSON.stringify(apiRequest, null, 2));
      this.log(`📋 Input Text Length: ${text.length} characters`);
      this.log(`📋 Input Text Preview: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);

      const startTime = Date.now();
      this.log(`⏱️  API Call Started: ${new Date().toISOString()}`);

      const response = await this.client.embeddings.create(apiRequest);

      const endTime = Date.now();
      const duration = endTime - startTime;
      this.log(`✅ API Call Completed: ${new Date().toISOString()}`);
      this.log(`⏱️  Duration: ${duration}ms`);

      // Log complete API response
      this.log('📥 COMPLETE API RESPONSE:');
      this.log('📋 Response Headers:');
      this.log(JSON.stringify({
        'content-type': 'application/json',
        'openai-model': response.model || 'N/A',
        'openai-version': 'N/A'
      }, null, 2));
      this.log('📋 Response Summary:');
      this.log(JSON.stringify({
        model: response.model,
        usage: response.usage,
        data_count: response.data.length,
        embedding_dimensions: response.data[0]?.embedding?.length || 0
      }, null, 2));

      const result: EmbeddingResult = {
        embedding: response.data[0].embedding,
        text: text.trim(),
        tokenCount: response.usage.total_tokens
      };

      // Log embedding result details
      this.log('🔧 EMBEDDING RESULT:');
      this.log(`📊 Vector Dimensions: ${result.embedding.length}`);
      this.log(`📊 Token Count: ${result.tokenCount}`);
      this.log(`📊 Text Length: ${result.text.length} characters`);
      this.log('🔗 =====================================\n');

      // Cache the result
      this.setCacheWithEviction(cacheKey, result);
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`❌ EMBEDDINGS API CALL FAILED: ${errorMessage}`);
      this.log('🔗 =====================================\n');
      throw new Error(`Failed to generate embedding: ${errorMessage}`);
    }
  }

  /**
   * Generate embeddings for multiple texts with comprehensive logging
   */
  async generateEmbeddingsWithMetadata(texts: string[]): Promise<EmbeddingResult[]> {
    const filteredTexts = texts.filter(t => t.trim().length > 0);
    const uniqueTexts = Array.from(new Set(filteredTexts));
    const results: EmbeddingResult[] = [];
    
    // Check cache for existing embeddings
    const uncachedTexts: string[] = [];
    const cachedResults: EmbeddingResult[] = [];
    
    for (const text of uniqueTexts) {
      const cacheKey = this.getCacheKey(text);
      const cached = this.getCacheWithLRU(cacheKey);
      
      if (cached) {
        cachedResults.push(cached);
      } else {
        uncachedTexts.push(text);
      }
    }

    this.log(`📊 Cache Analysis: ${cachedResults.length} items cached, ${uncachedTexts.length} items need vectorization`);

    // Generate embeddings for uncached texts
    if (uncachedTexts.length > 0) {
      this.log('\n🔗 =====================================');
      this.log('🔗 OPENAI EMBEDDINGS API CALL - BATCH');
      this.log('🔗 =====================================');

      try {
        const apiRequest = {
          model: 'text-embedding-3-small',
          input: uncachedTexts,
          encoding_format: 'float' as const
        };

        // Log the complete API request
        this.log('📤 COMPLETE API REQUEST:');
        this.log('🔗 Endpoint: https://api.openai.com/v1/embeddings');
        this.log('📋 Request Headers:');
        this.log(JSON.stringify({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer [REDACTED]',
          'User-Agent': 'Chatbot-Widget-Embeddings/1.0'
        }, null, 2));
        this.log('📋 Complete Request Body:');
        this.log(JSON.stringify(apiRequest, null, 2));
        this.log('📋 Knowledge Base Items Being Vectorized:');
        uncachedTexts.forEach((text, index) => {
          this.log(`📄 Item ${index + 1}:`);
          this.log(`   Text: "${text}"`);
          this.log(`   Length: ${text.length} characters`);
          this.log('');
        });

        const startTime = Date.now();
        this.log(`⏱️  API Call Started: ${new Date().toISOString()}`);

        const response = await this.client.embeddings.create(apiRequest);

        const endTime = Date.now();
        const duration = endTime - startTime;
        this.log(`✅ API Call Completed: ${new Date().toISOString()}`);
        this.log(`⏱️  Duration: ${duration}ms`);

        // Log complete API response
        this.log('📥 COMPLETE API RESPONSE:');
        this.log('📋 Response Headers:');
        this.log(JSON.stringify({
          'content-type': 'application/json',
          'openai-model': response.model || 'N/A',
          'openai-version': 'N/A'
        }, null, 2));
        this.log('📋 Response Summary:');
        this.log(JSON.stringify({
          model: response.model,
          usage: response.usage,
          data_count: response.data.length,
          embedding_dimensions: response.data[0]?.embedding?.length || 0,
          total_tokens: response.usage.total_tokens,
          average_tokens_per_text: Math.round(response.usage.total_tokens / uncachedTexts.length)
        }, null, 2));

        const newResults = response.data.map((item, index) => {
          const result: EmbeddingResult = {
            embedding: item.embedding,
            text: uncachedTexts[index].trim(),
            tokenCount: response.usage.total_tokens / uncachedTexts.length // Approximate
          };

          // Cache the result
          const cacheKey = this.getCacheKey(uncachedTexts[index]);
          this.setCacheWithEviction(cacheKey, result);
          
          return result;
        });

        // Log batch embedding results
        this.log('🔧 BATCH EMBEDDING RESULTS:');
        this.log(`📊 Embeddings Generated: ${newResults.length}`);
        if (newResults.length > 0) {
          this.log(`📊 Average Vector Dimensions: ${newResults[0].embedding.length}`);
        }
        this.log(`📊 Total Tokens Used: ${response.usage.total_tokens}`);
        this.log(`📊 Average Tokens per Text: ${Math.round(response.usage.total_tokens / uncachedTexts.length)}`);
        this.log(`📊 Cache Updated: ${newResults.length} new entries`);
        this.log('🔗 =====================================\n');

        results.push(...newResults);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.log(`❌ BATCH EMBEDDINGS API CALL FAILED: ${errorMessage}`);
        this.log('🔗 =====================================\n');
        throw new Error(`Failed to generate batch embeddings: ${errorMessage}`);
      }
    } else {
      this.log('✅ Knowledge base vectors retrieved from cache (no API call for knowledge base)');
      this.log(`📋 Cache hit: ${cachedResults.length} knowledge base items already vectorized`);
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
   * Find most similar texts using cosine similarity
   */
  async findSimilarTexts(
    queryText: string,
    candidateTexts: string[],
    topK: number = 5,
    minSimilarity: number = 0.3
  ): Promise<SimilarityMatch[]> {
    if (candidateTexts.length === 0) {
      return [];
    }

    this.log('\n🔍 =====================================');
    this.log('🔍 SEMANTIC SIMILARITY SEARCH');
    this.log('🔍 =====================================');
    this.log(`📋 User Query: "${queryText}"`);
    this.log(`📋 Searching against: ${candidateTexts.length} knowledge base items`);
    this.log(`📋 API calls needed: 1 (user query vectorization only)`);

    // Generate embeddings
    const [queryEmbedding, candidateEmbeddings] = await Promise.all([
      this.generateEmbeddingWithMetadata(queryText),        // Always 1 API call
      this.generateEmbeddingsWithMetadata(candidateTexts)   // Always cached after initialization
    ]);

    this.log('✅ Query vectorized, knowledge base vectors retrieved from cache');

    // Calculate similarities
    const similarities: SimilarityMatch[] = candidateEmbeddings
      .map((candidate, index) => ({
        text: candidate.text,
        similarity: this.cosineSimilarity(queryEmbedding.embedding, candidate.embedding),
        index
      }))
      .filter(match => match.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    this.log(`📊 Similarity calculation completed: ${similarities.length} matches found`);
    this.log('🔍 =====================================\n');

    return similarities;
  }

  /**
   * Calculate cosine similarity between two embeddings
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Embedding vectors must have the same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    return denominator === 0 ? 0 : dotProduct / denominator;
  }

  /**
   * Generate cache key for text
   */
  private getCacheKey(text: string): string {
    return Buffer.from(text.trim().toLowerCase()).toString('base64');
  }

  /**
   * Clear embedding cache
   */
  clearCache(): void {
    this.knowledgeBaseCache.clear();
    this.userQueryCache.clear();
    this.pdfDocumentCache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; utilizationPercent: number; keys: string[] } {
    return {
      size: this.knowledgeBaseCache.size + this.userQueryCache.size + this.pdfDocumentCache.size,
      maxSize: this.maxUserQueryCacheSize + this.maxPdfCacheSize,
      utilizationPercent: Math.round(((this.knowledgeBaseCache.size + this.userQueryCache.size + this.pdfDocumentCache.size) / (this.maxUserQueryCacheSize + this.maxPdfCacheSize)) * 100),
      keys: Array.from(this.knowledgeBaseCache.keys()).concat(Array.from(this.userQueryCache.keys())).concat(Array.from(this.pdfDocumentCache.keys()))
    };
  }

  /**
   * Precompute embeddings for knowledge base
   */
  async precomputeKnowledgeBaseEmbeddings(knowledgeItems: Array<{ id: string; content: string }>): Promise<void> {
    const texts = knowledgeItems.map(item => item.content);
    await this.generateEmbeddingsWithMetadata(texts);
  }

  /**
   * Precompute embeddings for PDF document chunks with optimized caching
   * 
   * AI INSTRUCTIONS:
   * - Uses separate PDF cache with larger limits
   * - Implements batch processing for efficiency
   * - Provides progress tracking for large documents
   * - Optimizes memory usage for document processing
   */
  async precomputePDFEmbeddings(
    pdfChunks: Array<{ id: string; content: string }>,
    progressCallback?: (processed: number, total: number) => void
  ): Promise<void> {
    const batchSize = 10; // Process in smaller batches for PDFs
    const total = pdfChunks.length;
    let processed = 0;

    this.log(`🔄 Processing ${total} PDF chunks in batches of ${batchSize}`);

    for (let i = 0; i < pdfChunks.length; i += batchSize) {
      const batch = pdfChunks.slice(i, i + batchSize);
      const batchTexts = batch.map(chunk => chunk.content);
      
      try {
        const results = await this.generateEmbeddings(batchTexts);
        
                 // Cache results in PDF-specific cache
         batch.forEach((chunk, index) => {
           const cacheKey = this.getCacheKey(chunk.content);
           const embeddingResult: EmbeddingResult = {
             embedding: results[index],
             text: chunk.content,
             tokenCount: Math.ceil(chunk.content.length / 4) // Rough token estimate
           };
           this.setPdfCacheWithEviction(cacheKey, embeddingResult);
         });
        
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
   * Cache PDF embeddings with specialized eviction strategy
   */
  private setPdfCacheWithEviction(cacheKey: string, result: EmbeddingResult): void {
    // If at max capacity, remove oldest PDF entries
    if (this.pdfDocumentCache.size >= this.maxPdfCacheSize) {
      const firstKey = this.pdfDocumentCache.keys().next().value;
      if (firstKey) {
        this.pdfDocumentCache.delete(firstKey);
        this.log(`🔄 PDF cache eviction: Removed oldest entry (cache size: ${this.pdfDocumentCache.size})`);
      }
    }
    
    this.pdfDocumentCache.set(cacheKey, result);
  }

  /**
   * Get PDF embedding with LRU access pattern
   */
  private getPdfCacheWithLRU(cacheKey: string): EmbeddingResult | undefined {
    const cached = this.pdfDocumentCache.get(cacheKey);
    if (cached) {
      // Move to end (mark as recently used)
      this.pdfDocumentCache.delete(cacheKey);
      this.pdfDocumentCache.set(cacheKey, cached);
    }
    return cached;
  }

  /**
   * Cache the result with appropriate cache based on content type
   */
  private setCacheWithEviction(cacheKey: string, result: EmbeddingResult): void {
    // Determine if this is knowledge base content or user query
    // Knowledge base content is typically longer and more structured
    const isKnowledgeBase = this.isKnowledgeBaseContent(result.text);
    
    if (isKnowledgeBase) {
      // Store in knowledge base cache (never evicted)
      this.knowledgeBaseCache.set(cacheKey, result);
      this.log(`💾 Knowledge base cache updated: ${this.knowledgeBaseCache.size} entries (permanent)`);
    } else {
      // Store in user query cache with LRU eviction
      if (this.userQueryCache.size >= this.maxUserQueryCacheSize) {
        const firstKey = this.userQueryCache.keys().next().value;
        if (firstKey) {
          this.userQueryCache.delete(firstKey);
          this.log(`🗑️  User query cache eviction: Removed oldest entry`);
        }
      }
      
      this.userQueryCache.set(cacheKey, result);
      this.log(`💾 User query cache updated: ${this.userQueryCache.size}/${this.maxUserQueryCacheSize} entries`);
    }
  }

  /**
   * Get from appropriate cache with LRU update for user queries
   */
  private getCacheWithLRU(cacheKey: string): EmbeddingResult | undefined {
    // Check knowledge base cache first (no LRU needed - permanent)
    const knowledgeBaseCached = this.knowledgeBaseCache.get(cacheKey);
    if (knowledgeBaseCached) {
      return knowledgeBaseCached;
    }
    
    // Check user query cache with LRU update
    const userQueryCached = this.userQueryCache.get(cacheKey);
    if (userQueryCached) {
      // Move to end (most recently used)
      this.userQueryCache.delete(cacheKey);
      this.userQueryCache.set(cacheKey, userQueryCached);
    }
    return userQueryCached;
  }

  /**
   * Determine if content is knowledge base content or user query
   */
  private isKnowledgeBaseContent(text: string): boolean {
    // Heuristics to identify knowledge base content:
    // 1. Length: Knowledge base content is typically longer
    // 2. Structure: Contains structured information
    // 3. Keywords: Contains business/product terminology
    
    const length = text.length;
    const hasStructuredContent = /(?:FAQ|Product|Policy|Company|About|Service|Feature|Plan|Price)/i.test(text);
    const isLongContent = length > 100; // Knowledge base items are typically longer
    
    // If it's long content OR has structured keywords, treat as knowledge base
    return isLongContent || hasStructuredContent;
  }
} 