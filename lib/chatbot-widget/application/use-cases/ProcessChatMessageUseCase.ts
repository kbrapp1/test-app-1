/**
 * Process Chat Message Use Case
 * 
 * Application-specific business rules for chat message processing scenarios.
 * Orchestrates domain objects for message handling and response generation coordination.
 * 
 * Single Responsibility: Handles the complete message processing workflow
 */

import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IAIConversationService, ConversationContext } from '../../domain/services/IAIConversationService';
import { ConversationContextService } from '../../domain/services/ConversationContextService';
import { ConversationContextWindow } from '../../domain/value-objects/ConversationContextWindow';
import { ITokenCountingService } from '../../domain/services/ITokenCountingService';
import { IIntentClassificationService } from '../../domain/services/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../domain/services/IKnowledgeRetrievalService';
import { IDebugInformationService } from '../../domain/services/IDebugInformationService';

// Import focused services
import { MessageProcessingService, ProcessMessageRequest } from '../services/MessageProcessingService';
import { ConversationMetricsService, ConversationMetrics } from '../services/ConversationMetricsService';
import { LeadCaptureDecisionService } from '../services/LeadCaptureDecisionService';
import { SystemPromptBuilderService } from '../services/SystemPromptBuilderService';
import { SessionUpdateService } from '../services/SessionUpdateService';
import { ConversationContextManagementService } from '../services/ConversationContextManagementService';

export interface ProcessMessageResult {
  chatSession: ChatSession;
  userMessage: ChatMessage;
  botResponse: ChatMessage;
  shouldCaptureLeadInfo: boolean;
  suggestedNextActions: string[];
  conversationMetrics: ConversationMetrics;
  intentAnalysis?: {
    intent: string;
    confidence: number;
    entities: Record<string, any>;
    category: string;
  };
  journeyState?: {
    stage: string;
    confidence: number;
    isSalesReady: boolean;
    recommendedActions: string[];
  };
  relevantKnowledge?: Array<{
    title: string;
    content: string;
    relevanceScore: number;
  }>;
}

export class ProcessChatMessageUseCase {
  private readonly contextWindow: ConversationContextWindow;
  private readonly messageProcessingService: MessageProcessingService;
  private readonly conversationMetricsService: ConversationMetricsService;
  private readonly leadCaptureDecisionService: LeadCaptureDecisionService;
  private readonly systemPromptBuilderService: SystemPromptBuilderService;
  private readonly sessionUpdateService: SessionUpdateService;
  private readonly contextManagementService: ConversationContextManagementService;

  constructor(
    private readonly sessionRepository: IChatSessionRepository,
    private readonly messageRepository: IChatMessageRepository,
    private readonly chatbotConfigRepository: IChatbotConfigRepository,
    private readonly aiConversationService: IAIConversationService,
    private readonly conversationContextService: ConversationContextService,
    private readonly tokenCountingService: ITokenCountingService,
    private readonly intentClassificationService?: IIntentClassificationService,
    private readonly knowledgeRetrievalService?: IKnowledgeRetrievalService,
    private readonly debugInformationService?: IDebugInformationService
  ) {
    // Initialize context window with sensible defaults
    this.contextWindow = ConversationContextWindow.create({
      maxTokens: 12000, // Safe for most models
      systemPromptTokens: 500,
      responseReservedTokens: 3000,
      summaryTokens: 200
    });

    // Initialize focused services
    this.messageProcessingService = new MessageProcessingService(messageRepository);
    this.conversationMetricsService = new ConversationMetricsService();
    this.leadCaptureDecisionService = new LeadCaptureDecisionService();
    this.systemPromptBuilderService = new SystemPromptBuilderService(aiConversationService);
    this.sessionUpdateService = new SessionUpdateService(sessionRepository);
    this.contextManagementService = new ConversationContextManagementService(
      conversationContextService,
      tokenCountingService,
      sessionRepository,
      messageRepository
    );
  }

  /**
   * Execute the complete message processing workflow
   */
  async execute(request: ProcessMessageRequest): Promise<ProcessMessageResult> {
    const startTime = Date.now();
    
    // 1. Load and validate session
    const session = await this.loadAndValidateSession(request.sessionId);

    // 2. Load chatbot configuration
    const config = await this.loadChatbotConfig(session.chatbotConfigId);

    // 3. Validate operating hours
    this.validateOperatingHours(config);

    // 4. Create and save user message
    const userMessage = await this.messageProcessingService.createAndSaveUserMessage(session, request);

    // 5. Initialize debug session
    this.initializeDebugSession(session.id, userMessage.id);

    // 6. Update session activity
    let updatedSession = session.updateActivity();

    // 7. Get token-aware messages for context
    const contextResult = await this.contextManagementService.getTokenAwareContext(
      session.id, 
      userMessage, 
      this.contextWindow
    );

    // 8. Enhanced context analysis
    const enhancedContext = await this.conversationContextService.analyzeContextEnhanced(
      [...contextResult.messages, userMessage],
      config,
      updatedSession
    );

    // 9. Update session with journey state if available
    if (enhancedContext.journeyState) {
      updatedSession = this.sessionUpdateService.updateSessionWithJourneyState(
        updatedSession, 
        enhancedContext.journeyState
      );
    }

    // 10. Build conversation context with enhanced system prompt
    const conversationContext = this.buildConversationContext(
      config,
      updatedSession,
      contextResult.messages,
      userMessage,
      contextResult.summary,
      enhancedContext
    );

    // 11. Generate AI response
    const aiResponse = await this.aiConversationService.generateResponse(
      request.userMessage,
      conversationContext
    );

    // 12. Create and save bot response message
    const botMessage = await this.messageProcessingService.createAndSaveBotMessage(session, aiResponse);

    // 13. Update debug session with correct bot message ID
    this.updateDebugSession(session.id, botMessage.id);

    // 14. Update session with conversation context
    const allMessages = [...contextResult.messages, userMessage, botMessage];
    updatedSession = this.conversationContextService.updateSessionContext(
      updatedSession,
      botMessage,
      allMessages
    );

    // 15. Save updated session
    const finalSession = await this.sessionUpdateService.saveSession(updatedSession);

    // 16. Calculate metrics and determine actions
    const shouldCaptureLeadInfo = this.leadCaptureDecisionService.shouldTriggerLeadCapture(finalSession, config);
    const conversationMetrics = await this.conversationMetricsService.calculateConversationMetrics(finalSession, allMessages);
    const suggestedNextActions = this.leadCaptureDecisionService.generateSuggestedActions(
      finalSession,
      config,
      shouldCaptureLeadInfo
    );

    // 17. Update debug session with processing time
    const totalProcessingTime = Date.now() - startTime;
    this.updateDebugProcessingTime(session.id, totalProcessingTime);

    return this.buildResult(
      finalSession,
      userMessage,
      botMessage,
      shouldCaptureLeadInfo,
      suggestedNextActions,
      conversationMetrics,
      enhancedContext
    );
  }

  /**
   * Load and validate session
   */
  private async loadAndValidateSession(sessionId: string): Promise<ChatSession> {
    const session = await this.sessionRepository.findById(sessionId);
    if (!session) {
      throw new Error(`Chat session ${sessionId} not found`);
    }
    return session;
  }

  /**
   * Load chatbot configuration
   */
  private async loadChatbotConfig(configId: string): Promise<ChatbotConfig> {
    const config = await this.chatbotConfigRepository.findById(configId);
    if (!config) {
      throw new Error(`Chatbot configuration not found for config ${configId}`);
    }
    return config;
  }

  /**
   * Validate operating hours
   */
  private validateOperatingHours(config: ChatbotConfig): void {
    if (!config.isWithinOperatingHours()) {
      throw new Error('Chatbot is currently outside operating hours');
    }
  }

  /**
   * Initialize debug session
   */
  private initializeDebugSession(sessionId: string, userMessageId: string): void {
    if (this.debugInformationService) {
      this.debugInformationService.initializeSession(sessionId, userMessageId, 'temp');
    }
  }

  /**
   * Update debug session with bot message ID
   */
  private updateDebugSession(sessionId: string, botMessageId: string): void {
    if (this.debugInformationService) {
      this.debugInformationService.initializeSession(sessionId, '', botMessageId);
    }
  }

  /**
   * Update debug session with processing time
   */
  private updateDebugProcessingTime(sessionId: string, processingTime: number): void {
    if (this.debugInformationService) {
      this.debugInformationService.updateProcessingTime(sessionId, processingTime);
    }
  }

  /**
   * Build conversation context
   */
  private buildConversationContext(
    config: ChatbotConfig,
    session: ChatSession,
    messages: ChatMessage[],
    userMessage: ChatMessage,
    summary: string | undefined,
    enhancedContext: any
  ): ConversationContext {
    const systemPrompt = this.systemPromptBuilderService.buildEnhancedSystemPrompt(
      config,
      session,
      messages,
      enhancedContext
    );

    return {
      chatbotConfig: config,
      session,
      messageHistory: [...messages, userMessage],
      systemPrompt,
      conversationSummary: summary
    };
  }

  /**
   * Build final result
   */
  private buildResult(
    finalSession: ChatSession,
    userMessage: ChatMessage,
    botMessage: ChatMessage,
    shouldCaptureLeadInfo: boolean,
    suggestedNextActions: string[],
    conversationMetrics: ConversationMetrics,
    enhancedContext: any
  ): ProcessMessageResult {
    return {
      chatSession: finalSession,
      userMessage,
      botResponse: botMessage,
      shouldCaptureLeadInfo,
      suggestedNextActions,
      conversationMetrics,
      intentAnalysis: enhancedContext.intentResult ? {
        intent: enhancedContext.intentResult.intent,
        confidence: enhancedContext.intentResult.confidence,
        entities: enhancedContext.intentResult.entities,
        category: enhancedContext.intentResult.getCategory()
      } : undefined,
      journeyState: enhancedContext.journeyState ? {
        stage: enhancedContext.journeyState.stage,
        confidence: enhancedContext.journeyState.confidence,
        isSalesReady: enhancedContext.journeyState.isSalesReady(),
        recommendedActions: enhancedContext.journeyState.getRecommendedActions()
      } : undefined,
      relevantKnowledge: enhancedContext.relevantKnowledge
    };
  }
} 