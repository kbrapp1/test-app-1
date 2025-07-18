/**
 * Initialize Chat Session Use Case
 * 
 * AI INSTRUCTIONS:
 * - Initialize chat session with comprehensive background cache warming
 * - Trigger full vector cache initialization to eliminate 6+ second delays
 * - Validate chatbot config exists and is active
 * - Coordinate domain services without business logic
 * - Handle cache warming as part of session initialization
 * - Publish domain events for session lifecycle
 */

import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import type { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import type { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import type { IKnowledgeRetrievalService } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError, ResourceNotFoundError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { SessionInitializedEvent } from '../../domain/events/SessionInitializedEvent';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import type { ISessionLogger } from '../../domain/services/interfaces/IChatbotLoggingService';

export interface InitializeSessionRequest {
  chatbotConfigId: string;
  visitorId?: string;
  initialContext?: Record<string, unknown>;
  warmKnowledgeCache?: boolean; // Default: true
}

export interface InitializeSessionResponse {
  session: ChatSession;
  chatbotConfig: ChatbotConfig;
  cacheWarmed: boolean;
  cacheWarmingTimeMs?: number;
}

/**
 * InitializeChatSessionUseCase
 * 
 * AI INSTRUCTIONS:
 * - Coordinates session initialization without business logic
 * - Handles workflow coordination only
 * - Delegates all business logic to domain services
 * - Publishes domain events for cross-aggregate communication
 * - Maintains single responsibility principle
 */
export class InitializeChatSessionUseCase {
  constructor(
    private readonly sessionRepository: IChatSessionRepository,
    private readonly configRepository: IChatbotConfigRepository,
    private readonly knowledgeRetrievalService: IKnowledgeRetrievalService
  ) {}

  // Initialize new chat session with comprehensive cache warming
  async execute(request: InitializeSessionRequest): Promise<InitializeSessionResponse> {
    // 1. Validate chatbot configuration
    const chatbotConfig = await this.validateChatbotConfig(request.chatbotConfigId);

    // 2. Generate visitor ID if not provided
    const visitorId = request.visitorId || this.generateVisitorId();

    // 3. Create new chat session
    const session = ChatSession.create(
      chatbotConfig.id,
      visitorId,
      request.initialContext
    );

    // 4. Create session initialization log file for easy debugging
    // This ensures session initialization has its own dedicated log file
    const initTimestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    const sessionLogFile = `chatbot-init-${initTimestamp}.log`;
    
    // 5. Create unified logger for the entire session initialization process
    const loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
    const logger = loggingService.createSessionLogger(
      'session-init',
      sessionLogFile,
      {
        operation: 'initializeSession',
        metadata: { chatbotConfigId: chatbotConfig.id, visitorId }
      }
    );
    
    logger.logHeader('SESSION INITIALIZATION STARTED');
    
         // 6. Warm knowledge cache for optimal performance (serverless-optimized)
     let cacheWarmed = false;
     let cacheWarmingTimeMs = 0;
     
     if (request.warmKnowledgeCache !== false) {
       const cacheResult = await this.warmKnowledgeCache(chatbotConfig, sessionLogFile, logger);
       cacheWarmed = cacheResult.success;
       cacheWarmingTimeMs = cacheResult.timeMs;
     }

         // 7. Save session to repository using the same log file
     const savedSession = await this.sessionRepository.save(session, sessionLogFile);

     // 8. Publish domain event for session initialization
     this.publishSessionInitializedEvent(savedSession, chatbotConfig, cacheWarmed);

     logger.logMessage(`✅ Session initialization completed in ${cacheWarmingTimeMs}ms`);
     logger.logHeader('SESSION INITIALIZATION COMPLETE');

     return {
       session: savedSession,
       chatbotConfig,
       cacheWarmed,
       cacheWarmingTimeMs
     };
  }

  // Validate chatbot configuration exists and is active
  private async validateChatbotConfig(chatbotConfigId: string): Promise<ChatbotConfig> {
    if (!chatbotConfigId?.trim()) {
      throw new BusinessRuleViolationError(
        'Chatbot configuration ID is required',
        { chatbotConfigId }
      );
    }

    const config = await this.configRepository.findById(chatbotConfigId);
    
    if (!config) {
      throw new ResourceNotFoundError(
        'ChatbotConfig',
        chatbotConfigId,
        { operation: 'session_initialization' }
      );
    }

    if (!config.isActive) {
      throw new BusinessRuleViolationError(
        'Cannot create session for inactive chatbot configuration',
        { chatbotConfigId, configStatus: 'inactive' }
      );
    }

    return config;
  }

  // Generate unique visitor ID
  private generateVisitorId(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    return `visitor_${timestamp}_${randomSuffix}`;
  }

  // Warm knowledge cache for optimal performance (fallback)
  private async warmKnowledgeCache(
    chatbotConfig: ChatbotConfig,
    sessionLogFile: string,
    logger?: ISessionLogger // Accept existing logger to prevent duplicate log files
  ): Promise<{ success: boolean; timeMs: number }> {
    const startTime = Date.now();
    
    // Use existing logger or create new one if not provided
    const cacheLogger = logger || ChatbotWidgetCompositionRoot.getLoggingService().createSessionLogger(
      'cache-warming',
      sessionLogFile,
      {
        operation: 'warmKnowledgeCache',
        metadata: { chatbotConfigId: chatbotConfig.id }
      }
    );

    cacheLogger.logHeader('CACHE WARMING INITIALIZATION');
    
    try {
      // AI: Check if ALL caches are already ready to avoid redundant API calls
      const vectorService = this.knowledgeRetrievalService as unknown as {
        isVectorCacheReady?: () => boolean;
        getEmbeddingService?: () => { getCacheStats?: () => { size: number } };
        warmCache?: (logFile: string) => Promise<void>;
      };
      const isVectorCacheReady = vectorService.isVectorCacheReady?.() || false;
      
      // Check if embedding cache has substantial warming (not just dummy entries)
      const embeddingCacheStats = vectorService.getEmbeddingService?.()?.getCacheStats?.() || { size: 0 };
      const isEmbeddingCacheWarmed = embeddingCacheStats.size > 0; // Require at least one entry to indicate warmed

      cacheLogger.logMessage(`📊 Vector Cache Ready: ${isVectorCacheReady}`);
      cacheLogger.logMessage(`📊 Embedding Cache Stats: ${embeddingCacheStats.size} entries`);
      cacheLogger.logMessage(`📊 Embedding Cache Warmed: ${isEmbeddingCacheWarmed}`);
      
      if (isVectorCacheReady && isEmbeddingCacheWarmed) {
        const timeMs = Date.now() - startTime;
        cacheLogger.logMessage('✅ All caches already warmed - skipping redundant API calls');
        cacheLogger.logMessage(`⏱️ Cache check completed in ${timeMs}ms`);
        cacheLogger.logMetrics('cacheWarmingSkipped', { customMetrics: { timeMs, reason: 1 } });
        return { success: true, timeMs }; // All caches ready - no API calls needed
      }

      cacheLogger.logMessage('🔄 Cache warming required - initializing caches');
      
      // Only initialize vector cache if not ready (direct initialization)
      if (!isVectorCacheReady) {
        cacheLogger.logMessage('🔄 Initializing vector cache...');
        try {
          // AI: Direct vector cache initialization instead of unreliable dummy search
          await this.knowledgeRetrievalService.initializeVectorCacheForSession(sessionLogFile);
          cacheLogger.logMessage('✅ Vector cache initialized successfully');
        } catch (error) {
          cacheLogger.logMessage(`❌ Vector cache initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
          // Continue with session initialization even if cache fails
        }
      } else {
        cacheLogger.logMessage('✅ Vector cache already ready');
      }
      
      // Only warm embedding cache if not already warmed (avoids redundant API calls)
      if (!isEmbeddingCacheWarmed && vectorService.warmCache) {
        cacheLogger.logMessage('🔄 Warming embedding cache...');
        await vectorService.warmCache(sessionLogFile);
        cacheLogger.logMessage('✅ Embedding cache warmed');
      } else {
        cacheLogger.logMessage('✅ Embedding cache already warmed');
      }

      const timeMs = Date.now() - startTime;
      const finalVectorCacheReady = vectorService.isVectorCacheReady?.() || false;
      const finalEmbeddingCacheStats = vectorService.getEmbeddingService?.()?.getCacheStats?.() || { size: 0 };
      const finalEmbeddingCacheWarmed = finalEmbeddingCacheStats.size > 0;

      cacheLogger.logMessage(`📊 Final Status - Vector: ${finalVectorCacheReady}, Embedding: ${finalEmbeddingCacheWarmed}`);
      cacheLogger.logMessage(`⏱️ Total cache warming time: ${timeMs}ms`);
      cacheLogger.logMetrics('cacheWarmingCompleted', { 
        customMetrics: {
          timeMs, 
          vectorCacheReady: finalVectorCacheReady ? 1 : 0,
          embeddingCacheWarmed: finalEmbeddingCacheWarmed ? 1 : 0
        }
      });

      // Return actual success status based on final cache state
      const actualSuccess = finalVectorCacheReady && finalEmbeddingCacheWarmed;
      return { success: actualSuccess, timeMs };

    } catch (error) {
      const timeMs = Date.now() - startTime;
      cacheLogger.logMessage(`❌ Cache warming failed after ${timeMs}ms: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Log error for monitoring but don't throw - required by tests
      console.warn('Knowledge cache warming failed:', {
        chatbotConfigId: chatbotConfig.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timeMs
      });
      
      return { success: false, timeMs };
    }
  }

  // Publish session initialized domain event
  private publishSessionInitializedEvent(
    session: ChatSession,
    chatbotConfig: ChatbotConfig,
    cacheWarmed: boolean
  ): void {
    const event = new SessionInitializedEvent(
      session.id,
      session.chatbotConfigId,
      session.visitorId,
      {
        configName: chatbotConfig.name,
        cacheWarmed,
        timestamp: new Date()
      }
    );

    // Handle domain event at use case level
    this.handleSessionInitializedEvent(event);
  }

  // Handle session initialized domain event
  private handleSessionInitializedEvent(_event: SessionInitializedEvent): void {
    // Log the domain event for monitoring
    // Future: Replace with proper event bus integration
  }
} 