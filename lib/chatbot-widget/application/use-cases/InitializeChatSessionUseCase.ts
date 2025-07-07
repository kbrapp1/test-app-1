/**
 * Initialize Chat Session Use Case
 * 
 * AI Instructions:
 * - Initialize chat session with knowledge cache warming
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

  // Initialize new chat session with knowledge cache warming
  async execute(request: InitializeSessionRequest): Promise<InitializeSessionResponse> {
    const { chatbotConfigId, visitorId, initialContext, warmKnowledgeCache = true } = request;

    // 1. Validate and retrieve chatbot configuration
    const chatbotConfig = await this.validateChatbotConfig(chatbotConfigId);

    // 2. Generate visitor ID if not provided
    const sessionVisitorId = visitorId || this.generateVisitorId();

    // 3. Create new chat session using domain entity
    const session = ChatSession.create(
      chatbotConfigId,
      sessionVisitorId,
      initialContext
    );

    // 4. Warm knowledge cache if requested
    let cacheWarmed = false;
    let cacheWarmingTimeMs: number | undefined;
    
    if (warmKnowledgeCache) {
      const cacheResult = await this.warmKnowledgeCache(chatbotConfig);
      cacheWarmed = cacheResult.success;
      cacheWarmingTimeMs = cacheResult.timeMs;
    }

    // 5. Save session to repository
    const initLogFile = `session-init-${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}.log`;
    const savedSession = await this.sessionRepository.save(session, initLogFile);

    // 6. Publish domain event for session initialization
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

  // Warm knowledge cache for optimal performance
  private async warmKnowledgeCache(
    chatbotConfig: ChatbotConfig
  ): Promise<{ success: boolean; timeMs: number }> {
    const startTime = Date.now();
    
    try {
      // Create cache warming specific log file
      const cacheWarmingLogFile = `cache-warming-${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}.log`;
      
      // Check if vector cache is already initialized
      const vectorCacheReady = 'isVectorCacheReady' in this.knowledgeRetrievalService 
        ? (this.knowledgeRetrievalService as any).isVectorCacheReady() 
        : false;

      if (!vectorCacheReady) {
        // Initialize vector cache by triggering a dummy search
        try {
          await this.knowledgeRetrievalService.searchKnowledge({
            userQuery: 'initialization dummy query',
            sharedLogFile: cacheWarmingLogFile,
            maxResults: 1,
            minRelevanceScore: 0.1
          });
        } catch (error) {
          // Expected to fail, but should initialize cache
        }
      }
      
      // Trigger embedding cache warming
      if ('warmCache' in this.knowledgeRetrievalService) {
        await (this.knowledgeRetrievalService as any).warmCache(cacheWarmingLogFile);
      }

      const timeMs = Date.now() - startTime;
      const isReady = 'isVectorCacheReady' in this.knowledgeRetrievalService 
        ? (this.knowledgeRetrievalService as any).isVectorCacheReady() 
        : true;

      return { success: isReady, timeMs };
      
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