/**
 * Simple Knowledge Retrieval Service with Vector Caching
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Retrieve and rank knowledge items using cached vector search
 * - Uses pre-computed vector embeddings for fast semantic search
 * - Requires OpenAI API to be available and functional
 * - Leverages vector management service for cached embeddings
 * - Follow @golden-rule patterns exactly
 * - PERFORMANCE: Uses cached vectors instead of real-time embedding generation
 * - CACHE EFFICIENT: Work with vector management service caching strategy
 * - LOGGING: Comprehensive vector search pipeline logging
 */

import { IKnowledgeRetrievalService, KnowledgeItem, KnowledgeSearchResult, KnowledgeRetrievalContext } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { KnowledgeItemService } from './knowledge-services/KnowledgeItemService';
import { ChatbotWidgetCompositionRoot } from '../composition/ChatbotWidgetCompositionRoot';
import { VectorManagementService } from '../../application/services/VectorManagementService';
import { OpenAIEmbeddingService } from './openai/services/OpenAIEmbeddingService';

export class SimpleKnowledgeRetrievalService implements IKnowledgeRetrievalService {
  private knowledgeItemService: KnowledgeItemService;
  private vectorManagementService: VectorManagementService;
  private embeddingService: OpenAIEmbeddingService;
  private isSemanticSearchReady: boolean = false;
  private isInitializing: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private initializationTimestamp: Date | null = null;
  private vectorCount: number = 0;
  private logEntry: (message: string) => void = () => {};

  constructor(private chatbotConfig: ChatbotConfig) {
    this.knowledgeItemService = new KnowledgeItemService(chatbotConfig);
    
    // Initialize logging first
    this.setupLogging();
    
    // Get vector services from composition root
    this.vectorManagementService = ChatbotWidgetCompositionRoot.getVectorManagementService();
    this.embeddingService = ChatbotWidgetCompositionRoot.getEmbeddingService();
  }

  /**
   * Get organization ID from chatbot config
   */
  private getOrganizationId(): string {
    return this.chatbotConfig.organizationId;
  }

  /**
   * Setup logging for vector embeddings pipeline
   */
  private setupLogging(): void {
    const fileLoggingEnabled = process.env.CHATBOT_FILE_LOGGING !== 'false';
    
    if (!fileLoggingEnabled) {
      this.logEntry = () => {}; // No-op function
      return;
    }
    
    // Setup active logging
    const fs = require('fs');
    const path = require('path');
    const timestamp = new Date().toISOString();
    const logDir = path.join(process.cwd(), 'logs');
    
    // Use current date for log file name if no shared log available
    const logFileName = `chatbot-${timestamp.replace(/[:.]/g, '-').split('.')[0]}.log`;
    const logFile = path.join(logDir, logFileName);
    
    // Ensure logs directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    this.logEntry = (logMessage: string) => {
      const logLine = `[${timestamp}] ${logMessage}\n`;
      try {
        fs.appendFileSync(logFile, logLine);
      } catch (error) {
        // Silently fail to avoid breaking the application
      }
    };
  }

  /**
   * Update logging context when shared log file is available
   */
  private updateLoggingContext(sharedLogFile?: string): void {
    if (!sharedLogFile) return;
    
    const fileLoggingEnabled = process.env.CHATBOT_FILE_LOGGING !== 'false';
    if (!fileLoggingEnabled) {
      this.logEntry = () => {}; // No-op function
      return;
    }
    
    const fs = require('fs');
    const path = require('path');
    const timestamp = new Date().toISOString();
    const logDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logDir, sharedLogFile);
    
    this.logEntry = (logMessage: string) => {
      const logLine = `[${timestamp}] ${logMessage}\n`;
      try {
        fs.appendFileSync(logFile, logLine);
      } catch (error) {
        // Silently fail to avoid breaking the application
      }
    };
    
    // Vector management service handles its own logging
  }

  /**
   * Search for relevant knowledge using semantic search only
   * AI INSTRUCTIONS: Pure semantic search - no fallbacks
   */
  async searchKnowledge(context: KnowledgeRetrievalContext): Promise<KnowledgeSearchResult> {
    const startTime = Date.now();
    const { userQuery, intentResult, maxResults = 5, minRelevanceScore = 0.3, sharedLogFile } = context;
    
    // Update logging context if shared log file provided
    this.updateLoggingContext(sharedLogFile);
    
    this.logEntry('\n🔍 =====================================');
    this.logEntry('🔍 CACHED VECTOR SEARCH - KNOWLEDGE RETRIEVAL');
    this.logEntry('🔍 =====================================');
    this.logEntry(`📋 User Query: "${userQuery}"`);
    this.logEntry(`📋 Intent: ${intentResult?.intent || 'unknown'} (confidence: ${intentResult?.confidence || 0})`);
    this.logEntry(`📋 Max Results: ${maxResults}`);
    this.logEntry(`📋 Min Relevance Score: ${minRelevanceScore}`);
    
    // Ensure semantic search is initialized (lazy loading)
    await this.ensureInitialized();
    
    // Get all knowledge items
    const allItems = await this.knowledgeItemService.getAllKnowledgeItems();
    
    this.logEntry(`📋 Total Knowledge Items: ${allItems.length}`);
    
    if (allItems.length === 0) {
      this.logEntry('⚠️  No knowledge items found - returning empty results');
      this.logEntry('🔍 =====================================\n');
      return {
        items: [],
        totalFound: 0,
        searchQuery: userQuery,
        searchTimeMs: Date.now() - startTime
      };
    }

    this.logEntry('\n🧠 CACHED VECTOR SEARCH:');
    this.logEntry(`📋 Searching against ${this.vectorCount} pre-computed vectors`);
    this.logEntry(`📋 Vector cache status: ${this.isSemanticSearchReady ? 'READY' : 'NOT_READY'}`);
    this.logEntry(`📋 Cache age: ${this.getCacheAge()}`);
    
    try {
      // Perform semantic search using cached vectors
      const searchStartTime = Date.now();
      
      // Generate embedding for user query
      const queryVector = await this.embeddingService.generateEmbedding(userQuery);
      
      // Find similar vectors using cached embeddings
      const similarVectors = await this.vectorManagementService.findSimilarVectors(
        this.getOrganizationId(),
        this.chatbotConfig.id,
        queryVector,
        1.0 - minRelevanceScore, // Convert relevance score to similarity threshold
        maxResults
      );
      
      // Convert vector results back to knowledge items with relevance scores
      const relevantItems = similarVectors.map(result => {
        // Find the corresponding knowledge item
        const knowledgeItem = allItems.find(item => item.id === result.vector.knowledgeItemId);
        if (!knowledgeItem) return null;
        
        // Return with updated relevance score from vector similarity
        return {
          ...knowledgeItem,
          relevanceScore: result.similarity
        };
      }).filter(item => item !== null) as KnowledgeItem[];
      
      const searchDuration = Date.now() - searchStartTime;
      
      this.logEntry(`⚡ Vector similarity search completed in ${searchDuration}ms`);
      this.logEntry(`📊 Results found: ${relevantItems.length}`);
      
      // Log detailed results
      if (relevantItems.length > 0) {
        this.logEntry('\n📊 SEARCH RESULTS RANKING:');
                 relevantItems.forEach((item: KnowledgeItem, index: number) => {
           this.logEntry(`📋 ${index + 1}. "${item.title}" (score: ${item.relevanceScore?.toFixed(3) || 'N/A'})`);
           this.logEntry(`    Category: ${item.category}, Source: ${item.source}`);
           this.logEntry(`    Content preview: ${item.content.substring(0, 100)}...`);
         });
      } else {
        this.logEntry('📋 No results met the minimum relevance threshold');
      }
      
      const totalDuration = Date.now() - startTime;
      this.logEntry(`\n⏱️  Total retrieval time: ${totalDuration}ms`);
      this.logEntry('✅ CACHED VECTOR SEARCH COMPLETED SUCCESSFULLY');
      this.logEntry('🔍 =====================================\n');

      return {
        items: relevantItems,
        totalFound: relevantItems.length,
        searchQuery: userQuery,
        searchTimeMs: totalDuration
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logEntry(`❌ CACHED VECTOR SEARCH FAILED: ${errorMessage}`);
      this.logEntry('🔍 =====================================\n');
      
      // Pure vector search - no fallbacks
      throw new Error(`Vector search failed: ${errorMessage}. Vector cache and OpenAI API required for knowledge retrieval.`);
    }
  }

  /**
   * Ensure semantic search is initialized with comprehensive logging
   */
  private async ensureInitialized(): Promise<void> {
    if (this.isSemanticSearchReady) {
      this.logEntry('✅ Vector embeddings cache: HIT (already initialized)');
      return;
    }

    if (this.isInitializing && this.initializationPromise) {
      this.logEntry('⏳ Vector embeddings cache: PENDING (waiting for initialization)');
      await this.initializationPromise;
      return;
    }

    this.logEntry('❌ Vector embeddings cache: MISS (initializing now)');
    this.isInitializing = true;
    
    this.initializationPromise = this.initializeSemanticSearch();
    await this.initializationPromise;
    
    this.isInitializing = false;
    this.isSemanticSearchReady = true;
    this.initializationTimestamp = new Date();
  }

  /**
   * Initialize semantic search with detailed vector embedding logging
   */
  private async initializeSemanticSearch(): Promise<void> {
    this.logEntry('\n🚀 =====================================');
    this.logEntry('🚀 VECTOR CACHE INITIALIZATION');
    this.logEntry('🚀 =====================================');
    
    const initStartTime = Date.now();
    
    try {
      // Get all knowledge items
      const allItems = await this.knowledgeItemService.getAllKnowledgeItems();
      this.logEntry(`📋 Knowledge base size: ${allItems.length} items`);
      
      if (allItems.length === 0) {
        this.logEntry('⚠️  Empty knowledge base - no vectors to cache');
        this.logEntry('🚀 =====================================\n');
        return;
      }
      
      this.logEntry('\n🔄 VECTOR CACHE VALIDATION:');
      this.logEntry('📋 Storage: pgvector (Supabase)');
      this.logEntry('📋 Embedding model: text-embedding-3-small');
      this.logEntry(`📋 Cache strategy: Smart caching with content hash validation`);
      
      // Initialize vector cache with logging
      const embeddingStartTime = Date.now();
      await this.vectorManagementService.ensureVectorsUpToDate(
        this.getOrganizationId(),
        this.chatbotConfig.id,
        allItems
      );
      const embeddingDuration = Date.now() - embeddingStartTime;
      
      this.vectorCount = allItems.length;
      
      this.logEntry(`✅ Vector cache validation completed in ${embeddingDuration}ms`);
      this.logEntry(`📊 Vectors cached: ${this.vectorCount}`);
      this.logEntry(`📊 Average cache time per item: ${(embeddingDuration / this.vectorCount).toFixed(2)}ms`);
      this.logEntry('✅ Vector cache system operational');
      
      const totalInitTime = Date.now() - initStartTime;
      this.logEntry(`\n⏱️  Total initialization time: ${totalInitTime}ms`);
      this.logEntry('✅ VECTOR CACHE INITIALIZATION COMPLETED');
      this.logEntry('🚀 =====================================\n');
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logEntry(`❌ VECTOR CACHE INITIALIZATION FAILED: ${errorMessage}`);
      this.logEntry('🚀 =====================================\n');
      throw new Error(`Vector cache initialization failed: ${errorMessage}`);
    }
  }

  /**
   * Get cache age for logging
   */
  private getCacheAge(): string {
    if (!this.initializationTimestamp) return 'Not initialized';
    
    const now = new Date();
    const ageMs = now.getTime() - this.initializationTimestamp.getTime();
    const ageMinutes = Math.floor(ageMs / (1000 * 60));
    const ageSeconds = Math.floor(ageMs / 1000);
    
    if (ageMinutes > 0) {
      return `${ageMinutes}m ${ageSeconds % 60}s`;
    } else {
      return `${ageSeconds}s`;
    }
  }

  /**
   * Get knowledge items by category with semantic ranking
   */
  async getKnowledgeByCategory(
    category: KnowledgeItem['category'],
    limit: number = 10
  ): Promise<KnowledgeItem[]> {
    const allItems = await this.knowledgeItemService.getAllKnowledgeItems();
    
    // Filter by category
    const categoryItems = allItems
      .filter(item => item.category === category)
      .slice(0, limit);
    
    return categoryItems;
  }

  /**
   * Get frequently asked questions with semantic relevance
   */
  async getFrequentlyAskedQuestions(limit: number = 10): Promise<KnowledgeItem[]> {
    return await this.knowledgeItemService.getFrequentlyAskedQuestions(limit);
  }

  /**
   * Search for similar questions/content using semantic similarity
   */
  async findSimilarContent(
    query: string,
    excludeIds: string[] = [],
    limit: number = 5
  ): Promise<KnowledgeItem[]> {
    // Ensure initialization before proceeding
    await this.ensureInitialized();
    
    if (!this.isSemanticSearchReady) {
      throw new Error('Semantic search not initialized. OpenAI API required for similarity search.');
    }

    const allItems = await this.knowledgeItemService.getAllKnowledgeItems();
    
    // Filter out excluded items
    const candidateItems = allItems.filter(item => !excludeIds.includes(item.id));
    
    // Use cached vector search for similar content
    const queryVector = await this.embeddingService.generateEmbedding(query);
    const similarVectors = await this.vectorManagementService.findSimilarVectors(
      this.getOrganizationId(),
      this.chatbotConfig.id,
      queryVector,
      0.8, // Convert 0.2 relevance threshold to 0.8 similarity threshold
      limit
    );
    
    // Convert vector results back to knowledge items
    return similarVectors.map(result => {
      const knowledgeItem = candidateItems.find(item => item.id === result.vector.knowledgeItemId);
      if (!knowledgeItem) return null;
      
      return {
        ...knowledgeItem,
        relevanceScore: result.similarity
      };
    }).filter(item => item !== null) as KnowledgeItem[];
  }

  /**
   * Get knowledge items by tags
   */
  async getKnowledgeByTags(
    tags: string[],
    limit: number = 10
  ): Promise<KnowledgeItem[]> {
    const allItems = await this.knowledgeItemService.getAllKnowledgeItems();
    
    const taggedItems = allItems
      .filter(item => 
        tags.some(tag => 
          item.tags.some(itemTag => 
            itemTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      )
      .slice(0, limit);
    
    return taggedItems;
  }

  /**
   * Add or update knowledge item (delegated to item service)
   */
  async upsertKnowledgeItem(item: Omit<KnowledgeItem, 'id' | 'lastUpdated'>): Promise<KnowledgeItem> {
    // Delegate to item service and invalidate cache via composition root
    const result = await this.knowledgeItemService.upsertKnowledgeItem(item);
    // Note: Cache invalidation handled by composition root when knowledge base changes
    return result;
  }

  /**
   * Health check - ensures semantic search is operational
   */
  async healthCheck(): Promise<boolean> {
    return this.isSemanticSearchReady;
  }

  /**
   * Calculate similarity between query and content using semantic embeddings only
   */
  async calculateSimilarity(query: string, content: string): Promise<number> {
    // Ensure initialization before proceeding
    await this.ensureInitialized();
    
    if (!this.isSemanticSearchReady) {
      throw new Error('Semantic search not initialized. OpenAI API required for similarity calculation.');
    }
    
    // Calculate similarity using vector embeddings
    const queryVector = await this.embeddingService.generateEmbedding(query);
    const contentVector = await this.embeddingService.generateEmbedding(content);
    
    // Calculate cosine similarity
    const dotProduct = queryVector.reduce((sum, a, i) => sum + a * contentVector[i], 0);
    const magnitudeA = Math.sqrt(queryVector.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(contentVector.reduce((sum, b) => sum + b * b, 0));
    
    return dotProduct / (magnitudeA * magnitudeB);
  }

  /**
   * Check if semantic search is ready
   */
  isReady(): boolean {
    return this.isSemanticSearchReady;
  }

  /**
   * Invalidate cache (called by composition root when knowledge base changes)
   * 
   * AI INSTRUCTIONS:
   * - Simple cache invalidation for composition root pattern
   * - Don't reinitialize automatically - lazy initialization handles it
   */
  invalidateCache(): void {
    this.logEntry('\n🔄 =====================================');
    this.logEntry('🔄 VECTOR CACHE INVALIDATION');
    this.logEntry('🔄 =====================================');
    this.logEntry(`📋 Previous cache state: ${this.isSemanticSearchReady ? 'READY' : 'NOT_READY'}`);
    this.logEntry(`📋 Previous vector count: ${this.vectorCount}`);
    this.logEntry(`📋 Previous cache age: ${this.getCacheAge()}`);
    
    this.isSemanticSearchReady = false;
    this.isInitializing = false;
    this.initializationPromise = null;
    this.initializationTimestamp = null;
    this.vectorCount = 0;
    
    this.logEntry('✅ Cache invalidated - will reinitialize on next request');
    this.logEntry('🔄 =====================================\n');
  }

  /**
   * Get search capabilities info
   */
  getCapabilities(): {
    semanticSearch: boolean;
    textSearch: boolean;
    categorySearch: boolean;
    faqSearch: boolean;
  } {
    return {
      semanticSearch: this.isSemanticSearchReady,
      textSearch: false, // No text search fallbacks
      categorySearch: true,
      faqSearch: true
    };
  }
} 