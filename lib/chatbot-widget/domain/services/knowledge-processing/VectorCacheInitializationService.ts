/**
 * Vector Cache Initialization Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle vector cache initialization and readiness management
 * - Domain service focused on cache lifecycle and session preparation
 * - Keep business logic pure, minimal external dependencies
 * - Never exceed 250 lines per @golden-rule
 * - Handle cache initialization with proper error handling and logging
 * - Provide methods for cache readiness checking and session preparation
 */

import { IVectorKnowledgeRepository } from '../../repositories/IVectorKnowledgeRepository';
import { IChatbotLoggingService, ISessionLogger } from '../interfaces/IChatbotLoggingService';
import { VectorKnowledgeCache } from '../VectorKnowledgeCache';
import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';
import { KnowledgeItem } from '../interfaces/IKnowledgeRetrievalService';

export interface CacheInitializationResult {
  vectorsLoaded: number;
  memoryUsageKB: number;
  initializationTimeMs: number;
}

/**
 * Specialized service for vector cache initialization and management
 * 
 * AI INSTRUCTIONS:
 * - Handles cache initialization workflow during session startup
 * - Provides cache readiness checking and status management
 * - Manages proper error handling and logging for initialization
 * - Supports both session-based and on-demand initialization
 */
export class VectorCacheInitializationService {
  
  constructor(
    private readonly vectorRepository: IVectorKnowledgeRepository,
    private readonly vectorCache: VectorKnowledgeCache,
    private readonly loggingService: IChatbotLoggingService,
    private readonly organizationId: string,
    private readonly chatbotConfigId: string
  ) {}

  /**
   * Initialize vector cache for session startup
   * 
   * AI INSTRUCTIONS:
   * - Public method for session-based cache initialization
   * - Avoids redundant initialization if cache is already ready
   * - Creates proper session logger with context
   * - Delegates to internal initialization logic
   */
  async initializeForSession(sharedLogFile: string): Promise<CacheInitializationResult> {
    if (this.vectorCache.isReady()) {
      return this.getCacheStatusResult();
    }

    const logger = this.loggingService.createSessionLogger(
      'vector-cache-init',
      sharedLogFile,
      {
        operation: 'initializeVectorCacheForSession',
        organizationId: this.organizationId
      }
    );

    return this.performInitialization(sharedLogFile, logger);
  }

  /**
   * Initialize vector cache with provided logger context
   * 
   * AI INSTRUCTIONS:
   * - Internal method for cache initialization with existing logger
   * - Used during search operations when cache is not ready
   * - Provides detailed logging throughout initialization process
   * - Handles error scenarios with proper domain error types
   */
  async initializeWithLogger(sharedLogFile: string, logger: ISessionLogger): Promise<CacheInitializationResult> {
    if (this.vectorCache.isReady()) {
      return this.getCacheStatusResult();
    }

    logger.logMessage('⚠️ Vector cache not ready - initializing during user interaction (this may cause delay)');
    return this.performInitialization(sharedLogFile, logger);
  }

  /**
   * Check if vector cache is ready for search operations
   */
  isReady(): boolean {
    return this.vectorCache.isReady();
  }

  /**
   * Get current cache statistics without initialization
   */
  getCacheStats() {
    return this.vectorCache.getCacheStats();
  }

  /**
   * Perform the actual cache initialization with comprehensive logging
   * 
   * AI INSTRUCTIONS:
   * - Core initialization logic with proper error handling
   * - Loads vectors from repository and initializes cache
   * - Provides detailed logging for monitoring and debugging
   * - Tracks initialization performance metrics
   * - Handles database and cache errors appropriately
   */
  private async performInitialization(
    sharedLogFile: string,
    logger: ISessionLogger
  ): Promise<CacheInitializationResult> {
    const startTime = Date.now();
    
    try {
      logger.logStep('Vector Cache Initialization');
      logger.logMessage('Loading knowledge vectors into memory cache...');

      // Load all knowledge vectors with actual embeddings from database
      const allVectors = await this.loadVectorsFromRepository(logger);

      // Initialize cache with actual vectors (no transformation needed)
      const initResult = await this.initializeVectorCache(allVectors, sharedLogFile, logger);

      const initializationTimeMs = Date.now() - startTime;

      const result: CacheInitializationResult = {
        vectorsLoaded: initResult.vectorsLoaded,
        memoryUsageKB: initResult.memoryUsageKB,
        initializationTimeMs
      };

      this.logInitializationSuccess(logger, result);
      
      return result;
      
    } catch (error) {
      logger.logError(error instanceof Error ? error : new Error('Vector cache initialization failed'));
      throw new BusinessRuleViolationError(
        'Failed to initialize vector cache',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }
  }

  /**
   * Load vectors from repository with error handling
   */
  private async loadVectorsFromRepository(logger: ISessionLogger) {
    try {
      const allVectors = await this.vectorRepository.getAllKnowledgeVectors(
        this.organizationId,
        this.chatbotConfigId
      );

      logger.logMessage(`Found ${allVectors.length} knowledge vectors in database`);
      
      if (allVectors.length === 0) {
        logger.logMessage('⚠️ No knowledge vectors found - cache will be empty');
      }

      return allVectors;
    } catch (error) {
      throw new BusinessRuleViolationError(
        'Failed to load knowledge vectors from repository',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }
  }

  /**
   * Initialize vector cache with loaded vectors
   */
  private async initializeVectorCache(
    vectors: Array<{ item: KnowledgeItem; vector: number[] }>,
    sharedLogFile: string,
    logger: ISessionLogger
  ) {
    try {
      const initResult = await this.vectorCache.initialize(vectors, sharedLogFile);
      
      if (initResult.vectorsLoaded !== vectors.length) {
        logger.logMessage(`⚠️ Warning: Only ${initResult.vectorsLoaded} of ${vectors.length} vectors were loaded`);
      }

      return initResult;
    } catch (error) {
      throw new BusinessRuleViolationError(
        'Failed to initialize vector cache with loaded vectors',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          vectorCount: vectors.length,
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId
        }
      );
    }
  }

  /**
   * Get cache status for already-ready cache
   */
  private getCacheStatusResult(): CacheInitializationResult {
    const stats = this.vectorCache.getCacheStats();
    return {
      vectorsLoaded: stats.totalVectors,
      memoryUsageKB: stats.memoryUsageKB,
      initializationTimeMs: 0 // Already initialized
    };
  }

  /**
   * Log successful initialization with performance metrics
   */
  private logInitializationSuccess(logger: ISessionLogger, result: CacheInitializationResult): void {
    logger.logMessage(`✅ Vector cache initialized: ${result.vectorsLoaded} vectors loaded`);
    logger.logMessage(`📊 Memory usage: ${result.memoryUsageKB} KB`);
    logger.logMessage(`⏱️ Initialization time: ${result.initializationTimeMs}ms`);
  }
}