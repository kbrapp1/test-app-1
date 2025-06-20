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
import { LeadExtractionService } from '../../domain/services/lead-management/LeadExtractionService';
import { ConversationFlowService } from '../../domain/services/conversation-management/ConversationFlowService';
import { ConversationMetricsService } from '../../application/services/conversation-management/ConversationMetricsService';
import { AIConversationFlowDecision } from '../../domain/services/conversation-management/ConversationFlowService';

// Interfaces
import { ITokenCountingService } from '../../domain/services/interfaces/ITokenCountingService';
import { IIntentClassificationService } from '../../domain/services/interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { IDebugInformationService } from '../../domain/services/interfaces/IDebugInformationService';

// Infrastructure services for interfaces
import { OpenAITokenCountingService } from '../providers/openai/OpenAITokenCountingService';
import { OpenAIIntentClassificationService } from '../providers/openai/OpenAIIntentClassificationService';
import { SimpleKnowledgeRetrievalService } from '../providers/SimpleKnowledgeRetrievalService';
import { DebugInformationService } from '../services/DebugInformationService';

/**
 * Domain Service Composition Service
 * 
 * AI INSTRUCTIONS:
 * - Provide centralized service instantiation for domain services
 * - Use singleton pattern for stateless services
 * - Wire dependencies through composition root
 * - Follow @golden-rule patterns exactly
 * - UPDATED: Replaced ConversationStageService with AI-driven ConversationFlowService
 */
export class DomainServiceCompositionService {
  // Singleton instances for stateless services
  private static conversationContextOrchestrator: ConversationContextOrchestrator | null = null;
  private static conversationMetricsService: ConversationMetricsService | null = null;
  
  // Additional domain services
  private static sessionContextService: SessionContextService | null = null;
  private static sessionStateService: SessionStateService | null = null;
  private static contextWindowService: ContextWindowService | null = null;
  private static dynamicPromptService: DynamicPromptService | null = null;
  private static leadExtractionService: LeadExtractionService | null = null;

  // Infrastructure service singletons for interfaces
  private static tokenCountingService: ITokenCountingService | null = null;
  private static intentClassificationService: IIntentClassificationService | null = null;
  private static knowledgeRetrievalService: IKnowledgeRetrievalService | null = null;
  private static debugInformationService: IDebugInformationService | null = null;

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
   * Get Knowledge Retrieval Service
   */
  static getKnowledgeRetrievalService(chatbotConfig: any): IKnowledgeRetrievalService {
    // Create new instance each time as it requires config
    return new SimpleKnowledgeRetrievalService(chatbotConfig);
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
    if (!this.dynamicPromptService) {
      this.dynamicPromptService = new DynamicPromptService();
    }
    return this.dynamicPromptService;
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
   * AI INSTRUCTIONS: Main orchestrator - now purely API-driven, no manual analysis dependencies
   */
  static getConversationContextOrchestrator(): ConversationContextOrchestrator {
    if (!this.conversationContextOrchestrator) {
      const tokenCountingService = this.getTokenCountingService();
      this.conversationContextOrchestrator = new ConversationContextOrchestrator(
        tokenCountingService
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
  static getRecommendedActions(decision: AIConversationFlowDecision): string[] {
    return ConversationFlowService.getRecommendedActions(decision);
  }

  /**
   * Calculate readiness score from AI indicators
   */
  static calculateReadinessScore(indicators: AIConversationFlowDecision['readinessIndicators']): number {
    return ConversationFlowService.calculateReadinessScore(indicators);
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
  }
} 