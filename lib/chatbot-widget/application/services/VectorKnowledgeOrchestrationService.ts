/**
 * Vector Knowledge Orchestration Service
 * 
 * APPLICATION LAYER - Session Management & Cross-Cutting Concerns
 * 
 * RESPONSIBILITIES:
 * - Session initialization and lifecycle management
 * - Comprehensive logging and metrics coordination
 * - Error handling and user feedback
 * - Performance tracking across operations
 * - Security context validation
 * 
 * DDD LAYER: Application (orchestration, no business logic)
 * FILE SIZE TARGET: 120-150 lines
 * 
 * AI INSTRUCTIONS:
 * - Handles cross-cutting concerns removed from domain service
 * - Coordinates session management and logging
 * - Delegates business logic to domain services
 * - Provides rich error context for debugging
 */

import { 
  KnowledgeSearchResult, 
  KnowledgeRetrievalContext 
} from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { IChatbotLoggingService, ISessionLogger } from '../../domain/services/interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { KnowledgeServiceCompositionService } from '../../infrastructure/composition/core/KnowledgeServiceCompositionService';
import { IKnowledgeRetrievalService } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { SearchMetricsLoggingService } from '../../domain/services/knowledge-processing/SearchMetricsLoggingService';

/**
 * Application orchestration service for Vector Knowledge operations
 * 
 * AI INSTRUCTIONS:
 * - Orchestrates session management for knowledge operations
 * - Handles comprehensive logging and performance tracking
 * - Provides rich error context and debugging information
 * - Maintains security context throughout operations
 * - Delegates all business logic to domain services
 */
export class VectorKnowledgeOrchestrationService {
  private readonly loggingService: IChatbotLoggingService;
  private readonly domainService: IKnowledgeRetrievalService;

  constructor(
    private readonly organizationId: string,
    private readonly chatbotConfigId: string
  ) {
    // Initialize application-level services
    this.loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
    
    // Get domain service from composition service
    const chatbotConfig = { id: this.chatbotConfigId, organizationId: this.organizationId };
    const vectorRepository = ChatbotWidgetCompositionRoot.getVectorKnowledgeRepository();
    const embeddingService = ChatbotWidgetCompositionRoot.getEmbeddingService();
    
    this.domainService = KnowledgeServiceCompositionService.getKnowledgeRetrievalService(
      chatbotConfig,
      vectorRepository as unknown as Record<string, unknown>,
      embeddingService as unknown as Record<string, unknown>
    );
  }

  /**
   * Orchestrate knowledge search with comprehensive session management
   * 
   * APPLICATION CONCERNS:
   * - Session initialization and cleanup
   * - Comprehensive logging and metrics
   * - Performance tracking and monitoring
   * - Error context enhancement
   * - Security validation
   */
  async searchKnowledgeWithSession(context: KnowledgeRetrievalContext): Promise<KnowledgeSearchResult> {
    const startTime = Date.now();
    
    // Application-level validation
    this.validateSessionContext(context);
    
    try {
      // Initialize session logging
      const sessionLogger = await this.initializeSessionLogging(context);
      
      // Log comprehensive search start metrics
      this.logSearchStart(sessionLogger, context);
      
      // Check cache readiness and log status
      const cacheReady = this.domainService.isVectorCacheReady();
      this.logCacheStatus(sessionLogger, cacheReady);
      
      // Initialize cache if needed with logging
      if (!cacheReady) {
        await this.initializeCacheWithLogging(context, sessionLogger);
      }
      
      // Execute search through domain service
      const result = await this.domainService.searchKnowledge(context);
      
      // Log comprehensive success metrics
      this.logSearchSuccess(sessionLogger, result, startTime);
      
      return result;
      
    } catch (error) {
      // Comprehensive application-level error handling
      return this.handleSearchError(error, context, startTime);
    }
  }

  /**
   * Initialize vector cache with comprehensive session logging
   */
  async initializeVectorCacheWithSession(sharedLogFile: string): Promise<void> {
    try {
      // Create initialization logger
      const logger = this.loggingService.createSessionLogger(
        'cache-init',
        sharedLogFile,
        { 
          operation: 'cache-initialization',
          organizationId: this.organizationId
        }
      );
      
      logger.logMessage('Starting vector cache initialization', {
        organizationId: this.organizationId,
        chatbotConfigId: this.chatbotConfigId
      });
      
      // Delegate to domain service
      await this.domainService.initializeVectorCacheForSession(sharedLogFile);
      
      logger.logMessage('Vector cache initialization completed successfully', {
        organizationId: this.organizationId,
        chatbotConfigId: this.chatbotConfigId
      });
      
    } catch (error) {
      // Enhanced error context for cache initialization
      throw new BusinessRuleViolationError(
        'Failed to initialize vector cache with session logging',
        {
          error: error instanceof Error ? error.message : 'Unknown error',
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId,
          operation: 'cache-initialization'
        }
      );
    }
  }

  /**
   * APPLICATION HELPER METHODS FOR SESSION MANAGEMENT
   */
  
  private validateSessionContext(context: KnowledgeRetrievalContext): void {
    if (!context.sharedLogFile) {
      throw new BusinessRuleViolationError(
        'Shared log file is required for session operations',
        { 
          organizationId: this.organizationId,
          operation: 'session-validation'
        }
      );
    }
  }

  private async initializeSessionLogging(context: KnowledgeRetrievalContext) {
    const sessionId = (context as { sessionId?: string }).sessionId || 'unknown-session';
    
    return this.loggingService.createSessionLogger(
      sessionId,
      context.sharedLogFile!,
      {
        sessionId,
        operation: 'knowledge-search-orchestration',
        organizationId: this.organizationId
      }
    );
  }

  private logSearchStart(logger: ISessionLogger, context: KnowledgeRetrievalContext): void {
    SearchMetricsLoggingService.logSearchStart(
      logger,
      {
        organizationId: this.organizationId,
        chatbotConfigId: this.chatbotConfigId,
        sessionId: (context as { sessionId?: string }).sessionId || 'unknown-session',
        userQuery: context.userQuery
      }
    );
  }

  private logCacheStatus(logger: ISessionLogger, isReady: boolean): void {
    logger.logMessage('Vector cache readiness status', {
      organizationId: this.organizationId,
      chatbotConfigId: this.chatbotConfigId,
      cacheReady: isReady
    });
  }

  private async initializeCacheWithLogging(context: KnowledgeRetrievalContext, logger: ISessionLogger): Promise<void> {
    logger.logMessage('Initializing vector cache for search operation', {
      organizationId: this.organizationId,
      chatbotConfigId: this.chatbotConfigId
    });
    
    await this.domainService.initializeVectorCacheForSession(context.sharedLogFile!);
    
    logger.logMessage('Vector cache initialization completed', {
      organizationId: this.organizationId,
      chatbotConfigId: this.chatbotConfigId
    });
  }

  private logSearchSuccess(logger: ISessionLogger, result: KnowledgeSearchResult, startTime: number): void {
    // Simple application-level success logging
    logger.logMessage('Knowledge search completed successfully', {
      organizationId: this.organizationId,
      resultCount: result.items.length,
      totalTimeMs: Date.now() - startTime,
      averageRelevanceScore: result.items.length > 0 
        ? result.items.reduce((sum, item) => sum + item.relevanceScore, 0) / result.items.length 
        : 0
    });
  }

  private async handleSearchError(error: unknown, context: KnowledgeRetrievalContext, startTime: number): Promise<never> {
    const errorTimeMs = Date.now() - startTime;
    
    // Enhanced application-level error logging
    if (context.sharedLogFile) {
      const errorLogger = this.loggingService.createSessionLogger(
        'orchestration-error',
        context.sharedLogFile,
        { 
          operation: 'knowledge-search-orchestration-error', 
          organizationId: this.organizationId 
        }
      );
      
      SearchMetricsLoggingService.logSearchError(
        errorLogger,
        error instanceof Error ? error : new Error('Unknown orchestration error'),
        {
          organizationId: this.organizationId,
          chatbotConfigId: this.chatbotConfigId,
          userQuery: context.userQuery
        }
      );
    }
    
    // Preserve domain errors, enhance others
    if (error instanceof BusinessRuleViolationError) {
      throw error;
    }
    
    throw new BusinessRuleViolationError(
      'Knowledge search orchestration failed',
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        context,
        organizationId: this.organizationId,
        chatbotConfigId: this.chatbotConfigId,
        searchTimeMs: errorTimeMs,
        layer: 'application-orchestration'
      }
    );
  }
}