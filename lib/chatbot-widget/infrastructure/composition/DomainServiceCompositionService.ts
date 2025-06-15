// Domain services
import { LeadScoringService } from '../../domain/services/lead-management/LeadScoringService';
import { ConversationContextOrchestrator } from '../../domain/services/conversation/ConversationContextOrchestrator';
import { DynamicPromptService } from '../../domain/services/ai-configuration/DynamicPromptService';
import { ITokenCountingService } from '../../domain/services/interfaces/ITokenCountingService';
import { IIntentClassificationService } from '../../domain/services/interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { IDebugInformationService } from '../../domain/services/interfaces/IDebugInformationService';

// New focused domain services
import { ConversationIntentService } from '../../domain/services/conversation/ConversationIntentService';
import { ConversationSentimentService } from '../../domain/services/conversation/ConversationSentimentService';
import { LeadExtractionService } from '../../domain/services/lead-management/LeadExtractionService';
import { ConversationFallbackService } from '../../domain/services/conversation/ConversationFallbackService';

// Message processing services
import { MessageAnalysisOrchestrator } from '../../domain/services/message-processing/MessageAnalysisOrchestrator';
import { MessageContentAnalysisService } from '../../domain/services/message-processing/MessageContentAnalysisService';
import { MessageSentimentAnalysisService } from '../../domain/services/message-processing/MessageSentimentAnalysisService';
import { MessageIntentAnalysisService } from '../../domain/services/message-processing/MessageIntentAnalysisService';

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
  private static conversationContextOrchestrator: ConversationContextOrchestrator | null = null;
  private static dynamicPromptService: DynamicPromptService | null = null;
  private static tokenCountingService: ITokenCountingService | null = null;
  private static debugInformationService: IDebugInformationService | null = null;
  
  // New focused service singletons
  private static conversationIntentService: ConversationIntentService | null = null;
  private static conversationSentimentService: ConversationSentimentService | null = null;
  private static leadExtractionService: LeadExtractionService | null = null;
  private static conversationFallbackService: ConversationFallbackService | null = null;

  // Message processing service singletons
  private static messageAnalysisOrchestrator: MessageAnalysisOrchestrator | null = null;
  private static messageContentAnalysisService: MessageContentAnalysisService | null = null;
  private static messageSentimentAnalysisService: MessageSentimentAnalysisService | null = null;
  private static messageIntentAnalysisService: MessageIntentAnalysisService | null = null;

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
   * Get Conversation Context Orchestrator
   */
  static async getConversationContextOrchestrator(): Promise<ConversationContextOrchestrator> {
    if (!this.conversationContextOrchestrator) {
      const tokenCountingService = this.getTokenCountingService();
      const intentClassificationService = await this.getIntentClassificationService();
      
      this.conversationContextOrchestrator = new ConversationContextOrchestrator(
        tokenCountingService,
        intentClassificationService
        // Note: knowledgeRetrievalService is passed per-request since it depends on chatbot config
      );
    }
    return this.conversationContextOrchestrator;
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
   * Get Conversation Intent Service
   */
  static getConversationIntentService(): ConversationIntentService {
    if (!this.conversationIntentService) {
      this.conversationIntentService = new ConversationIntentService();
    }
    return this.conversationIntentService;
  }

  /**
   * Get Conversation Sentiment Service
   */
  static getConversationSentimentService(): ConversationSentimentService {
    if (!this.conversationSentimentService) {
      this.conversationSentimentService = new ConversationSentimentService();
    }
    return this.conversationSentimentService;
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

  /**
   * Get Conversation Fallback Service
   */
  static getConversationFallbackService(): ConversationFallbackService {
    if (!this.conversationFallbackService) {
      this.conversationFallbackService = new ConversationFallbackService();
    }
    return this.conversationFallbackService;
  }

  /**
   * Get Message Analysis Orchestrator
   */
  static getMessageAnalysisOrchestrator(): MessageAnalysisOrchestrator {
    if (!this.messageAnalysisOrchestrator) {
      this.messageAnalysisOrchestrator = new MessageAnalysisOrchestrator();
    }
    return this.messageAnalysisOrchestrator;
  }

  /**
   * Get Message Content Analysis Service
   */
  static getMessageContentAnalysisService(): MessageContentAnalysisService {
    if (!this.messageContentAnalysisService) {
      this.messageContentAnalysisService = new MessageContentAnalysisService();
    }
    return this.messageContentAnalysisService;
  }

  /**
   * Get Message Sentiment Analysis Service
   */
  static getMessageSentimentAnalysisService(): MessageSentimentAnalysisService {
    if (!this.messageSentimentAnalysisService) {
      this.messageSentimentAnalysisService = new MessageSentimentAnalysisService();
    }
    return this.messageSentimentAnalysisService;
  }

  /**
   * Get Message Intent Analysis Service
   */
  static getMessageIntentAnalysisService(): MessageIntentAnalysisService {
    if (!this.messageIntentAnalysisService) {
      this.messageIntentAnalysisService = new MessageIntentAnalysisService();
    }
    return this.messageIntentAnalysisService;
  }

  /**
   * Reset all domain service singletons
   */
  static reset(): void {
    this.leadScoringService = null;
    this.conversationContextOrchestrator = null;
    this.dynamicPromptService = null;
    this.tokenCountingService = null;
    this.debugInformationService = null;
    
    // Reset new focused services
    this.conversationIntentService = null;
    this.conversationSentimentService = null;
    this.leadExtractionService = null;
    this.conversationFallbackService = null;

    // Reset message processing services
    this.messageAnalysisOrchestrator = null;
    this.messageContentAnalysisService = null;
    this.messageSentimentAnalysisService = null;
    this.messageIntentAnalysisService = null;
  }
} 