// Domain services
import { ConversationContextOrchestrator } from '../../domain/services/conversation/ConversationContextOrchestrator';
import { ConversationSessionUpdateService } from '../../domain/services/conversation/ConversationSessionUpdateService';
// ConversationSentimentService removed - using OpenAI API for sentiment analysis
import { SessionContextService } from '../../domain/services/session-management/SessionContextService';
import { SessionStateService } from '../../domain/services/session-management/SessionStateService';
import { ChatSessionValidationService } from '../../domain/services/session-management/ChatSessionValidationService';
import { SessionLeadQualificationService } from '../../domain/services/session-management/SessionLeadQualificationService';
import { ContextWindowService } from '../../domain/services/utilities/ContextWindowService';
import { EntityAccumulationService } from '../../domain/services/context/EntityAccumulationService';
import { DynamicPromptService } from '../../domain/services/ai-configuration/DynamicPromptService';
import { AIConfigurationCompositionService } from './AIConfigurationCompositionService';
import { LeadExtractionService } from '../../domain/services/lead-management/LeadExtractionService';
import { ConversationFlowService, AIConversationFlowDecision } from '../../domain/services/conversation-management/ConversationFlowService';
import { ConversationMetricsService } from '../../application/services/conversation-management/ConversationMetricsService';
import { ReadinessIndicatorDomainService } from '../../domain/services/conversation-management/ReadinessIndicatorDomainService';
import { LeadCaptureDecisionService } from '../../application/services/lead-management/LeadCaptureDecisionService';

// Interfaces
import { ITokenCountingService } from '../../domain/services/interfaces/ITokenCountingService';
import { IIntentClassificationService } from '../../domain/services/interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { IDebugInformationService } from '../../domain/services/interfaces/IDebugInformationService';

// Infrastructure services for interfaces
import { OpenAITokenCountingService } from '../providers/openai/OpenAITokenCountingService';
import { OpenAIIntentClassificationService } from '../providers/openai/OpenAIIntentClassificationService';
// SimpleKnowledgeRetrievalService removed - using vector-based service instead
import { DebugInformationService } from '../services/DebugInformationService';
import { VectorKnowledgeRetrievalService } from '../../domain/services/VectorKnowledgeRetrievalService';
import { ChatbotWidgetCompositionRoot } from './ChatbotWidgetCompositionRoot';

/**
 * Domain Service Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Provide centralized service instantiation for domain services
 * - Use singleton pattern for stateless services
 * - Wire dependencies through composition root
 * - Follow @golden-rule patterns exactly
 * - UPDATED: Replaced ConversationStageService with AI-driven ConversationFlowService
 * - CACHE OPTIMIZATION: Cache knowledge retrieval services per chatbot config
 */
export class DomainServiceCompositionService {
  // Singleton instances for stateless services
  private static conversationContextOrchestrator: ConversationContextOrchestrator | null = null;
  private static conversationMetricsService: ConversationMetricsService | null = null;
  
  // Additional domain services
  private static sessionContextService: SessionContextService | null = null;
  private static sessionStateService: SessionStateService | null = null;
  private static contextWindowService: ContextWindowService | null = null;
  private static leadExtractionService: LeadExtractionService | null = null;

  // Infrastructure service singletons for interfaces
  private static tokenCountingService: ITokenCountingService | null = null;
  private static intentClassificationService: IIntentClassificationService | null = null;
  private static knowledgeRetrievalService: IKnowledgeRetrievalService | null = null;
  private static debugInformationService: IDebugInformationService | null = null;

  // Cache for knowledge retrieval services per chatbot configuration
  // AI INSTRUCTIONS: Follow @golden-rule memory/cache efficient patterns
  private static knowledgeRetrievalServiceCache = new Map<string, IKnowledgeRetrievalService>();

  /**
   * Get Token Counting Service
   */
  static getTokenCountingService(): ITokenCountingService {
    if (!this.tokenCountingService) {
      this.tokenCountingService = new OpenAITokenCountingService();
    }
    return this.tokenCountingService;
  }

  /**
   * Get Intent Classification Service
   */
  static async getIntentClassificationService(): Promise<IIntentClassificationService> {
    // Create new instance each time as it requires config
    const config = {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: 'gpt-4o-mini',
      temperature: 0.7,
      maxTokens: 1000
    };
    return new OpenAIIntentClassificationService(config);
  }

  /**
   * Get Knowledge Retrieval Service with Smart Caching
   * 
   * AI INSTRUCTIONS:
   * - Use singleton pattern for stateless infrastructure services per @golden-rule
   * - Cache embeddings per chatbot configuration for performance
   * - Memory/cache efficient, API efficient, network efficient
   * - Follow @golden-rule patterns exactly
   * - Single responsibility: Provide cached knowledge retrieval services
   */
  static getKnowledgeRetrievalService(chatbotConfig: any): IKnowledgeRetrievalService {
    // Create cache key based on chatbot config and knowledge base version
    const configId = chatbotConfig?.id || 'default';
    const organizationId = chatbotConfig?.organizationId || 'default';
    const lastUpdated = chatbotConfig?.lastUpdated?.getTime() || 'default';
    const configKey = `${organizationId}_${configId}_${lastUpdated}`;
    
    // Check if we have a cached service for this configuration
    if (!this.knowledgeRetrievalServiceCache.has(configKey)) {
      // Create new vector-based knowledge retrieval service
      const vectorRepository = ChatbotWidgetCompositionRoot.getVectorKnowledgeRepository();
      const embeddingService = ChatbotWidgetCompositionRoot.getEmbeddingService();
      
      const service = new VectorKnowledgeRetrievalService(
        vectorRepository,
        embeddingService,
        organizationId,
        configId
      );
      
      this.knowledgeRetrievalServiceCache.set(configKey, service);
      
      // Optional: Clean up old cache entries to prevent memory leaks
      if (this.knowledgeRetrievalServiceCache.size > 10) {
        const oldestKey = this.knowledgeRetrievalServiceCache.keys().next().value;
        if (oldestKey) {
          this.knowledgeRetrievalServiceCache.delete(oldestKey);
        }
      }
    }
    
    return this.knowledgeRetrievalServiceCache.get(configKey)!;
  }

  /**
   * Get Debug Information Service
   */
  static getDebugInformationService(): IDebugInformationService {
    if (!this.debugInformationService) {
      this.debugInformationService = new DebugInformationService();
    }
    return this.debugInformationService;
  }

  /**
   * Get Dynamic Prompt Service
   */
  static getDynamicPromptService(): DynamicPromptService {
    // Delegate to AIConfigurationCompositionService for proper dependency injection
    return AIConfigurationCompositionService.getDynamicPromptService();
  }

  /**
   * Get Lead Extraction Service
   */
  static getLeadExtractionService(): LeadExtractionService {
    if (!this.leadExtractionService) {
      this.leadExtractionService = new LeadExtractionService();
    }
    return this.leadExtractionService;
  }

  // getConversationSentimentService removed - using OpenAI API for sentiment analysis

  /**
   * Get Conversation Context Orchestrator
   * AI INSTRUCTIONS: Main orchestrator - includes enhanced services for vector embeddings pipeline
   * FIXED: Create new instance when chatbot config provided to enable vector embeddings
   */
  static async getConversationContextOrchestrator(chatbotConfig?: any): Promise<ConversationContextOrchestrator> {
    // If chatbot config is provided, create a new instance with enhanced services
    // This ensures vector embeddings pipeline is available
    if (chatbotConfig) {
      const tokenCountingService = this.getTokenCountingService();
      const intentClassificationService = await this.getIntentClassificationService();
      const knowledgeRetrievalService = this.getKnowledgeRetrievalService(chatbotConfig);
      
      return new ConversationContextOrchestrator(
        tokenCountingService,
        intentClassificationService,
        knowledgeRetrievalService
      );
    }
    
    // For basic usage without chatbot config, use singleton pattern
    if (!this.conversationContextOrchestrator) {
      const tokenCountingService = this.getTokenCountingService();
      const intentClassificationService = await this.getIntentClassificationService();
      
      this.conversationContextOrchestrator = new ConversationContextOrchestrator(
        tokenCountingService,
        intentClassificationService,
        undefined // No knowledge retrieval service for basic usage
      );
    }
    return this.conversationContextOrchestrator;
  }

  /**
   * Get Conversation Metrics Service
   */
  static getConversationMetricsService(): ConversationMetricsService {
    if (!this.conversationMetricsService) {
      this.conversationMetricsService = new ConversationMetricsService();
    }
    return this.conversationMetricsService;
  }

  /**
   * Get Conversation Session Update Service
   * This service is stateful and should not be singleton
   */
  static getConversationSessionUpdateService(): ConversationSessionUpdateService {
    // Create new instance with AI-driven flow service
    return new ConversationSessionUpdateService();
  }

  /**
   * Get Session Context Service
   */
  static getSessionContextService(): SessionContextService {
    if (!this.sessionContextService) {
      this.sessionContextService = new SessionContextService();
    }
    return this.sessionContextService;
  }

  /**
   * Get Session State Service
   */
  static getSessionStateService(): SessionStateService {
    if (!this.sessionStateService) {
      this.sessionStateService = new SessionStateService();
    }
    return this.sessionStateService;
  }

  /**
   * Get Context Window Service
   */
  static getContextWindowService(tokenCountingService: ITokenCountingService): ContextWindowService {
    if (!this.contextWindowService) {
      this.contextWindowService = new ContextWindowService(tokenCountingService);
    }
    return this.contextWindowService;
  }

  /**
   * Get Chat Session Validation Service
   */
  static getChatSessionValidationService(): typeof ChatSessionValidationService {
    return ChatSessionValidationService;
  }

  /**
   * Get Session Lead Qualification Service
   */
  static getSessionLeadQualificationService(): typeof SessionLeadQualificationService {
    return SessionLeadQualificationService;
  }

  /**
   * Get Entity Accumulation Service
   */
  static getEntityAccumulationService(): typeof EntityAccumulationService {
    return EntityAccumulationService;
  }

  /**
   * Process AI conversation flow decision
   * Static method since ConversationFlowService is purely functional
   */
  static processAIFlowDecision(
    decision: AIConversationFlowDecision,
    currentState: any
  ): any {
    return ConversationFlowService.processAIFlowDecision(decision, currentState);
  }

  /**
   * Check if lead capture should be triggered using AI decision
   */
  static shouldTriggerLeadCapture(decision: AIConversationFlowDecision): boolean {
    return ConversationFlowService.shouldTriggerLeadCapture(decision);
  }

  /**
   * Get recommended actions from AI decision
   */
  /**
   * Get next best action from AI flow decision
   * 
   * AI INSTRUCTIONS:
   * - Replaced getRecommendedActions with more specific methods
   * - Uses individual decision methods from ConversationFlowService
   * - Follows @golden-rule.mdc single responsibility pattern
   */
  static getNextBestAction(decision: AIConversationFlowDecision): string {
    return ConversationFlowService.getNextBestAction(decision);
  }

  /**
   * Calculate readiness score using AI flow decision
   * 
   * AI INSTRUCTIONS:
   * - Uses ConversationFlowService with proper DDD pattern
   * - No longer expects readinessIndicators parameter
   * - Delegates to domain service for calculation
   */
  static calculateReadinessScore(flowDecision: AIConversationFlowDecision): number {
    return ConversationFlowService.calculateReadinessScore(flowDecision);
  }

  /**
   * Get derived readiness indicators from AI flow decision
   * 
   * AI INSTRUCTIONS:
   * - New method to expose readiness indicators
   * - Uses domain service for consistent calculation
   * - Returns proper ReadinessIndicators interface
   */
  static getReadinessIndicators(flowDecision: AIConversationFlowDecision): any {
    return ConversationFlowService.getReadinessIndicators(flowDecision);
  }

  /**
   * Clear Knowledge Cache for Specific Chatbot
   * 
   * AI INSTRUCTIONS:
   * - Clear cache when knowledge base is updated
   * - Follow @golden-rule cache invalidation patterns
   * - Prevent memory leaks and stale data
   */
     static clearKnowledgeCache(chatbotConfigId?: string): void {
     if (!chatbotConfigId) {
       // Clear all cache if no specific ID provided
       this.knowledgeRetrievalServiceCache.clear();
       return;
     }
     
     // Remove only affected caches to maintain other chatbot caches
     for (const [key, service] of Array.from(this.knowledgeRetrievalServiceCache.entries())) {
       if (key.startsWith(chatbotConfigId)) {
         this.knowledgeRetrievalServiceCache.delete(key);
       }
     }
   }

  /**
   * Clear all cached instances (for testing or cleanup)
   */
  static clearCache(): void {
    this.conversationContextOrchestrator = null;
    this.conversationMetricsService = null;
    this.tokenCountingService = null;
    this.intentClassificationService = null;
    this.knowledgeRetrievalService = null;
    this.debugInformationService = null;
    
    // Clear knowledge retrieval service cache
    this.knowledgeRetrievalServiceCache.clear();
  }

  /**
   * Warm Knowledge Cache for Better Performance
   * 
   * AI INSTRUCTIONS:
   * - Follow @golden-rule performance optimization patterns
   * - Proactively initialize embeddings for better UX
   * - Single responsibility: Preload commonly used services
   * - Use for application startup or background processing
   */
  static async warmKnowledgeCache(chatbotConfigs: any[]): Promise<void> {
    // Preload knowledge retrieval services for common configurations
    const warmupPromises = chatbotConfigs.map(async (config) => {
      try {
        const service = this.getKnowledgeRetrievalService(config);
        // Trigger initialization by calling healthCheck
        await service.healthCheck();
      } catch (error) {
        // Silent fail for warmup - service will initialize when actually needed
      }
    });

    await Promise.allSettled(warmupPromises);
  }

  /**
   * Get Cache Statistics
   * 
   * AI INSTRUCTIONS:
   * - Follow @golden-rule monitoring and observability patterns
   * - Provide insights into cache performance
   * - Help with debugging and optimization
   */
  static getCacheStatistics(): {
    knowledgeCacheSize: number;
    cacheKeys: string[];
    memoryUsage: string;
  } {
    const cacheKeys = Array.from(this.knowledgeRetrievalServiceCache.keys());
    
    return {
      knowledgeCacheSize: this.knowledgeRetrievalServiceCache.size,
      cacheKeys,
      memoryUsage: `~${(this.knowledgeRetrievalServiceCache.size * 0.5).toFixed(1)}MB estimated`
    };
  }
} 