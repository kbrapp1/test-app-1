/**
 * Initialize Chat Session Use Case
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Initialize chat session with knowledge cache warming
 * - Follow @golden-rule DDD patterns exactly
 * - Coordinate domain services without business logic
 * - Handle cache warming as part of session initialization
 * - Use composition root for all dependencies
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

  /**
   * Initialize new chat session with knowledge cache warming
   * 
   * AI INSTRUCTIONS:
   * - Orchestrate session creation and cache warming
   * - Validate chatbot config exists and is active
   * - Warm knowledge cache for optimal performance
   * - Handle errors gracefully with domain-specific errors
   * - Publish session initialization event
   */
  async execute(request: InitializeSessionRequest): Promise<InitializeSessionResponse> {
    const { chatbotConfigId, visitorId, initialContext, warmKnowledgeCache = true } = request;

    // Step 1: Validate and retrieve chatbot configuration
    const chatbotConfig = await this.validateChatbotConfig(chatbotConfigId);

    // Step 2: Generate visitor ID if not provided
    const sessionVisitorId = visitorId || this.generateVisitorId();

    // Step 3: Create new chat session using domain entity
    const session = ChatSession.create(
      chatbotConfigId,
      sessionVisitorId,
      initialContext
    );

    // Step 4: Warm knowledge cache if requested
    let cacheWarmed = false;
    let cacheWarmingTimeMs: number | undefined;
    
    if (warmKnowledgeCache) {
      const cacheResult = await this.warmKnowledgeCache(chatbotConfig);
      cacheWarmed = cacheResult.success;
      cacheWarmingTimeMs = cacheResult.timeMs;
    }

    // Step 5: Save session to repository
    // Create initialization-specific log file for session creation
    const initLogFile = `session-init-${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}.log`;
    const savedSession = await this.sessionRepository.save(session, initLogFile);

    // Step 6: Publish domain event for session initialization
    this.publishSessionInitializedEvent(savedSession, chatbotConfig, cacheWarmed);

    return {
      session: savedSession,
      chatbotConfig,
      cacheWarmed,
      cacheWarmingTimeMs
    };
  }

  /**
   * Validate chatbot configuration exists and is active
   * 
   * AI INSTRUCTIONS:
   * - Use domain-specific error types
   * - Follow single responsibility principle
   * - Validate business rules (config must be active)
   */
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

  /**
   * Generate unique visitor ID
   * 
   * AI INSTRUCTIONS:
   * - Create unique, traceable visitor identifiers
   * - Use timestamp and random components for uniqueness
   * - Follow consistent naming patterns
   */
  private generateVisitorId(): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substr(2, 9);
    return `visitor_${timestamp}_${randomSuffix}`;
  }

  /**
   * Warm knowledge cache for optimal performance
   * 
   * AI INSTRUCTIONS:
   * - Initialize in-memory vector cache for fast similarity search
   * - Handle cache warming errors gracefully
   * - Measure performance for monitoring
   * - Don't fail session creation if cache warming fails
   */
  private async warmKnowledgeCache(
    chatbotConfig: ChatbotConfig
  ): Promise<{ success: boolean; timeMs: number }> {
    const startTime = Date.now();
    
    try {
      // Create cache warming specific log file for session initialization
      const cacheWarmingLogFile = `cache-warming-${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}.log`;
      
      // Check if vector cache is already initialized
      const vectorCacheReady = 'isVectorCacheReady' in this.knowledgeRetrievalService 
        ? (this.knowledgeRetrievalService as any).isVectorCacheReady() 
        : false;

      if (!vectorCacheReady) {
        // Initialize vector cache by triggering a dummy search
        // This will load all vectors into memory during the first search
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
      
      // Trigger embedding cache warming with proper shared log file
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

  /**
   * Publish session initialized domain event
   * 
   * AI INSTRUCTIONS:
   * - Create and publish domain events for session lifecycle
   * - Include relevant context for event handlers
   * - Follow domain event patterns
   * - Handle events at use case level when entity doesn't support domain events
   */
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

    // Handle domain event at use case level since ChatSession entity 
    // doesn't extend AggregateRoot in current architecture
    // In a full DDD implementation, this would go through an event bus
    this.handleSessionInitializedEvent(event);
  }

  /**
   * Handle session initialized domain event
   * 
   * AI INSTRUCTIONS:
   * - Process domain events synchronously at use case level
   * - Log event for monitoring and debugging
   * - In production, this would publish to event bus for async handlers
   */
  private handleSessionInitializedEvent(event: SessionInitializedEvent): void {
    // Log the domain event for monitoring
    // Domain event logged for session initialization tracking

    // In a full implementation, this would:
    // 1. Publish to event bus for async processing
    // 2. Trigger event handlers (analytics, notifications, etc.)
    // 3. Update read models or projections
    // 4. Send events to external systems
    
    // For now, we handle it synchronously for immediate needs
    // Future: Replace with proper event bus integration
  }
} 