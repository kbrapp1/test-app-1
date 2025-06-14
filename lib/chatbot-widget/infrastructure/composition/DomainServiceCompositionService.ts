// Domain services
import { LeadScoringService } from '../../domain/services/LeadScoringService';
import { ConversationContextService } from '../../domain/services/ConversationContextService';
import { DynamicPromptService } from '../../domain/services/DynamicPromptService';
import { ITokenCountingService } from '../../domain/services/ITokenCountingService';
import { IIntentClassificationService } from '../../domain/services/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../domain/services/IKnowledgeRetrievalService';
import { IDebugInformationService } from '../../domain/services/IDebugInformationService';

// Infrastructure services
import { OpenAITokenCountingService } from '../providers/openai/OpenAITokenCountingService';
import { OpenAIIntentClassificationService } from '../providers/openai/OpenAIIntentClassificationService';
import { SimpleKnowledgeRetrievalService } from '../providers/SimpleKnowledgeRetrievalService';
import { DebugInformationService } from '../services/DebugInformationService';

/**
 * Domain Service Composition Service
 * Infrastructure Service: Manages domain service creation and lifecycle
 * Following DDD principles: Single responsibility for domain service management
 */
export class DomainServiceCompositionService {
  // Service singletons
  private static leadScoringService: LeadScoringService | null = null;
  private static conversationContextService: ConversationContextService | null = null;
  private static dynamicPromptService: DynamicPromptService | null = null;
  private static tokenCountingService: ITokenCountingService | null = null;
  private static debugInformationService: IDebugInformationService | null = null;

  /**
   * Get Lead Scoring Service
   */
  static getLeadScoringService(): LeadScoringService {
    if (!this.leadScoringService) {
      this.leadScoringService = new LeadScoringService();
    }
    return this.leadScoringService;
  }

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
   * Get Intent Classification Service with dynamic configuration
   */
  static async getIntentClassificationService(chatbotConfig?: any): Promise<IIntentClassificationService> {
    // For now, create a new instance each time to use the latest config
    // In production, you might want to cache based on config hash
    const aiConfig = chatbotConfig?.aiConfiguration;
    
    const config = {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: aiConfig?.openaiModel || 'gpt-4o-mini',
      temperature: aiConfig?.openaiTemperature || 0.3,
      maxTokens: 500 // Use fixed value for intent classification
    };

    if (!config.apiKey) {
      // OPENAI_API_KEY not found, intent classification will be limited
    }

    return new OpenAIIntentClassificationService(config, this.getDebugInformationService());
  }

  /**
   * Get Knowledge Retrieval Service
   */
  static getKnowledgeRetrievalService(chatbotConfig: any): IKnowledgeRetrievalService {
    // Create a new instance for each chatbot config to ensure proper knowledge base
    return new SimpleKnowledgeRetrievalService(chatbotConfig);
  }

  /**
   * Get Conversation Context Service
   */
  static async getConversationContextService(): Promise<ConversationContextService> {
    if (!this.conversationContextService) {
      const tokenCountingService = this.getTokenCountingService();
      const intentClassificationService = await this.getIntentClassificationService();
      
      this.conversationContextService = new ConversationContextService(
        tokenCountingService,
        intentClassificationService
        // Note: knowledgeRetrievalService is passed per-request since it depends on chatbot config
      );
    }
    return this.conversationContextService;
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
   * Get Debug Information Service
   */
  static getDebugInformationService(): IDebugInformationService {
    if (!this.debugInformationService) {
      this.debugInformationService = new DebugInformationService();
    }
    return this.debugInformationService;
  }

  /**
   * Reset all domain service singletons
   */
  static reset(): void {
    this.leadScoringService = null;
    this.conversationContextService = null;
    this.dynamicPromptService = null;
    this.tokenCountingService = null;
    this.debugInformationService = null;
  }
} 