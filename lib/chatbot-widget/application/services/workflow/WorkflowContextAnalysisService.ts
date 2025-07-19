/**
 * Workflow Context Analysis Service
 * 
 * AI INSTRUCTIONS:
 * - Handle conversation context analysis for workflow orchestration
 * - Coordinate context management and enhanced analysis
 * - Maintain single responsibility for context processing
 * - Delegate to domain services for business logic
 * - Keep under 200 lines following SRP
 */

import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { ConversationContextOrchestrator } from '../../../domain/services/conversation/ConversationContextOrchestrator';
import { IChatbotLoggingService, ISessionLogger } from '../../../domain/services/interfaces/IChatbotLoggingService';
import { IKnowledgeRetrievalService } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { ConversationContextWindow } from '../../../domain/value-objects/session-management/ConversationContextWindow';
import { ChatbotWidgetCompositionRoot } from '../../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { DomainServiceCompositionService } from '../../../infrastructure/composition/DomainServiceCompositionService';
import {
    AnalysisContext,
    ContextResultData,
    EnhancedContextData,
    MessageContext,
    WorkflowConfig,
    WorkflowSession,
    WorkflowUserMessage
} from '../../types/WorkflowOrchestrationTypes';
import { ConversationContextManagementService } from '../conversation-management/ConversationContextManagementService';

export class WorkflowContextAnalysisService {
  private readonly contextWindow: ConversationContextWindow;
  private readonly loggingService: IChatbotLoggingService;

  constructor(
    private readonly contextManagementService: ConversationContextManagementService
  ) {
    // AI: Initialize context window with enhanced defaults
    this.contextWindow = ConversationContextWindow.create({
      maxTokens: 16000,
      systemPromptTokens: 800,
      responseReservedTokens: 3500,
      summaryTokens: 300
    });

    this.loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
  }

  /**
   * Analyze conversation context for workflow processing
   */
  async analyzeContext(
    messageContext: MessageContext, 
    logger: ISessionLogger,
    sharedLogFile?: string
  ): Promise<AnalysisContext> {
    const { session, config, userMessage } = messageContext;

    logger.logRaw('🔍 Analyzing conversation context');

    // AI: Get token-aware context
    const contextResult = await this.getTokenAwareContext(
      session.id,
      userMessage as unknown as ChatMessage,
      logger,
      sharedLogFile
    );

    // AI: Create enhanced orchestrator with proper dependencies
    const knowledgeRetrievalService = this.getKnowledgeRetrievalService(config);
    const enhancedOrchestrator = await this.createEnhancedOrchestrator(knowledgeRetrievalService);
    
    // AI: Analyze enhanced context
    const enhancedContext = await this.analyzeEnhancedContext(
      enhancedOrchestrator,
      contextResult,
      userMessage,
      config,
      session,
      sharedLogFile
    );

    logger.logMessage('📊 Context analysis completed', {
      sessionId: session.id,
      messagesInContext: contextResult.messages.length
    });

    return { 
      session: session as WorkflowSession, 
      userMessage: userMessage as WorkflowUserMessage, 
      contextResult,
      config: config as WorkflowConfig, 
      enhancedContext 
    };
  }

  /**
   * Get token-aware conversation context
   */
  private async getTokenAwareContext(
    sessionId: string,
    userMessage: ChatMessage,
    logger: ISessionLogger,
    sharedLogFile?: string
  ): Promise<ContextResultData> {
    return await this.contextManagementService.getTokenAwareContext(
      sessionId,
      userMessage,
      this.contextWindow,
      { logEntry: (message: string) => logger.logMessage(message) },
      sharedLogFile
    ) as unknown as ContextResultData;
  }

  /**
   * Get knowledge retrieval service for enhanced analysis
   */
  private getKnowledgeRetrievalService(config: WorkflowConfig): IKnowledgeRetrievalService | undefined {
    return DomainServiceCompositionService.getKnowledgeRetrievalService(
      config as ChatbotConfig,
      ChatbotWidgetCompositionRoot.getVectorKnowledgeRepository(),
      ChatbotWidgetCompositionRoot.getEmbeddingService()
    );
  }

  /**
   * Create enhanced orchestrator with proper dependencies
   */
  private async createEnhancedOrchestrator(knowledgeService?: IKnowledgeRetrievalService): Promise<ConversationContextOrchestrator> {
    const tokenCountingService = DomainServiceCompositionService.getTokenCountingService();
    const intentClassificationService = await DomainServiceCompositionService.getIntentClassificationService();
    
    return new ConversationContextOrchestrator(
      tokenCountingService,
      intentClassificationService,
      knowledgeService
    );
  }

  /**
   * Analyze enhanced context using domain orchestrator
   */
  private async analyzeEnhancedContext(
    enhancedOrchestrator: ConversationContextOrchestrator,
    contextResult: ContextResultData,
    userMessage: WorkflowUserMessage,
    config: WorkflowConfig,
    session: WorkflowSession,
    sharedLogFile?: string
  ): Promise<EnhancedContextData> {
    return await enhancedOrchestrator.analyzeContextEnhanced(
      [...contextResult.messages, userMessage] as ChatMessage[],
      config as ChatbotConfig,
      session as ChatSession,
      sharedLogFile
    ) as EnhancedContextData;
  }
} 