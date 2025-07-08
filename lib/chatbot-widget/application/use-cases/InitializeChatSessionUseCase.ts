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
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IKnowledgeRetrievalService } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { BusinessRuleViolationError, ResourceNotFoundError } from '../../domain/errors/ChatbotWidgetDomainErrors';
import { SessionInitializedEvent } from '../../domain/events/SessionInitializedEvent';

export interface InitializeSessionRequest {
  chatbotConfigId: string;
  visitorId?: string;
  initialContext?: Record<string, any>;
  warmKnowledgeCache?: boolean; // Default: true
}

export interface InitializeSessionResponse {
  session: ChatSession;
  chatbotConfig: ChatbotConfig;
  cacheWarmed: boolean;
  cacheWarmingTimeMs?: number;
}

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
    
         // 5. Warm knowledge cache for optimal performance (serverless-optimized)
     let cacheWarmed = false;
     let cacheWarmingTimeMs = 0;
     
     if (request.warmKnowledgeCache !== false) {
       const cacheResult = await this.warmKnowledgeCache(chatbotConfig, sessionLogFile);
       cacheWarmed = cacheResult.success;
       cacheWarmingTimeMs = cacheResult.timeMs;
     }

         // 6. Save session to repository using the same log file
     const savedSession = await this.sessionRepository.save(session, sessionLogFile);

     // 7. Publish domain event for session initialization
     this.publishSessionInitializedEvent(savedSession, chatbotConfig, cacheWarmed);

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
    sessionLogFile: string
  ): Promise<{ success: boolean; timeMs: number }> {
    const startTime = Date.now();
    
    try {
      // AI: Check if ALL caches are already ready to avoid redundant API calls
      const vectorService = this.knowledgeRetrievalService as any;
      const isVectorCacheReady = vectorService.isVectorCacheReady?.() || false;
      
      // Check if embedding cache has substantial warming (not just dummy entries)
      const embeddingCacheStats = vectorService.getEmbeddingService?.()?.getCacheStats?.() || { size: 0 };
      const isEmbeddingCacheWarmed = embeddingCacheStats.size > 5; // Require more than just dummy entries
      
      if (isVectorCacheReady && isEmbeddingCacheWarmed) {
        const timeMs = Date.now() - startTime;
        return { success: true, timeMs }; // All caches ready - no API calls needed
      }
      
      // Only initialize vector cache if not ready (avoids redundant API calls)
      if (!isVectorCacheReady) {
        try {
          await this.knowledgeRetrievalService.searchKnowledge({
            userQuery: 'initialization dummy query',
            sharedLogFile: sessionLogFile,
            maxResults: 1,
            minRelevanceScore: 0.15
          });
        } catch (error) {
          // Expected to fail, but should initialize cache
        }
      }
      
      // Only warm embedding cache if not already warmed (avoids redundant API calls)
      if (!isEmbeddingCacheWarmed && 'warmCache' in this.knowledgeRetrievalService) {
        await (this.knowledgeRetrievalService as any).warmCache(sessionLogFile);
      }

      const timeMs = Date.now() - startTime;
      const finalVectorCacheReady = vectorService.isVectorCacheReady?.() || false;
      const finalEmbeddingCacheStats = vectorService.getEmbeddingService?.()?.getCacheStats?.() || { size: 0 };
      const finalEmbeddingCacheWarmed = finalEmbeddingCacheStats.size > 0;

      return { success: finalVectorCacheReady && finalEmbeddingCacheWarmed, timeMs };
      
    } catch (error) {
      // Cache warming failure should not prevent session creation
      const timeMs = Date.now() - startTime;
      
      // Log error for monitoring but don't throw
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
  private handleSessionInitializedEvent(event: SessionInitializedEvent): void {
    // Log the domain event for monitoring
    // Future: Replace with proper event bus integration
  }
} 