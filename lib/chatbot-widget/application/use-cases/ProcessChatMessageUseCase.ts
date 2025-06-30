/**
 * Process Chat Message Use Case
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate chat message processing workflow
 * - Delegate specialized operations to focused services
 * - Keep under 200-250 lines by extracting workflow services
 * - Use composition pattern for complex operations
 * - Follow @golden-rule patterns exactly
 * - Log all API interactions and processing steps for debugging
 */

import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { IChatSessionRepository } from '../../domain/repositories/IChatSessionRepository';
import { IChatMessageRepository } from '../../domain/repositories/IChatMessageRepository';
import { IChatbotConfigRepository } from '../../domain/repositories/IChatbotConfigRepository';
import { IAIConversationService } from '../../domain/services/interfaces/IAIConversationService';
import { ConversationContextOrchestrator } from '../../domain/services/conversation/ConversationContextOrchestrator';
import { ITokenCountingService } from '../../domain/services/interfaces/ITokenCountingService';
import { IIntentClassificationService } from '../../domain/services/interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { IDebugInformationService } from '../../domain/services/interfaces/IDebugInformationService';


import { 
  MessageProcessingWorkflowService,
  ChatMessageProcessingService
} from '../services/message-processing';
import { ConversationMetrics } from '../services/conversation-management/ConversationMetricsService';
import { ConversationContextManagementService } from '../services/conversation-management/ConversationContextManagementService';
import { SessionUpdateService } from '../services/configuration-management/SessionUpdateService';
import { ConversationContextWindow } from '../../domain/value-objects/session-management/ConversationContextWindow';
import { DomainServiceCompositionService } from '../../infrastructure/composition/DomainServiceCompositionService';
import { IChatbotLoggingService, ISessionLogger } from '../../domain/services/interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';

export interface ProcessMessageRequest {
  userMessage: string;
  sessionId: string;
  organizationId?: string;
  metadata?: any;
}

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
  callToAction?: {
    type: string;
    message: string;
    priority: string;
  };
}

export class ProcessChatMessageUseCase {
  private readonly workflowService: MessageProcessingWorkflowService;
  private readonly contextManagementService: ConversationContextManagementService;
  private readonly processingService: ChatMessageProcessingService;
  private readonly sessionUpdateService: SessionUpdateService;
  private readonly contextWindow: ConversationContextWindow;
  private readonly loggingService: IChatbotLoggingService;
  private sharedLogFile?: string;

  constructor(
    private readonly sessionRepository: IChatSessionRepository,
    private readonly messageRepository: IChatMessageRepository,
    private readonly chatbotConfigRepository: IChatbotConfigRepository,
    private readonly aiConversationService: IAIConversationService,
    private readonly conversationContextOrchestrator: ConversationContextOrchestrator,
    private readonly tokenCountingService: ITokenCountingService,
    private readonly intentClassificationService?: IIntentClassificationService,
    private readonly knowledgeRetrievalService?: IKnowledgeRetrievalService,
    private readonly debugInformationService?: IDebugInformationService
  ) {
    this.workflowService = new MessageProcessingWorkflowService(
      sessionRepository,
      messageRepository,
      chatbotConfigRepository,
      aiConversationService,
      debugInformationService
    );

    this.processingService = new ChatMessageProcessingService(
      aiConversationService,
      messageRepository,
      conversationContextOrchestrator,
      intentClassificationService,
      knowledgeRetrievalService
    );

    // Initialize conversation management services
    this.contextManagementService = new ConversationContextManagementService(
      conversationContextOrchestrator,
      tokenCountingService,
      sessionRepository,
      messageRepository
    );

    this.sessionUpdateService = new SessionUpdateService(sessionRepository);

    // Initialize context window with 2025 optimization defaults
    this.contextWindow = ConversationContextWindow.create({
      maxTokens: 16000, // 2025 optimization: Enhanced context retention
      systemPromptTokens: 800,  // More room for business context injection
      responseReservedTokens: 3500, // Enhanced response capacity
      summaryTokens: 300 // Better conversation summarization
    });

    // Initialize centralized logging service
    this.loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
  }



  private async analyzeConversationContext(
    messageContext: any,
    logger: ISessionLogger
  ): Promise<any> {
    const { session, config, userMessage } = messageContext;

    // Create logging context for advanced context intelligence
    const loggingContext = {
      logEntry: (message: string) => logger.logMessage(message)
    };

    // Get token-aware messages for context with advanced logging
    const contextResult = await this.contextManagementService.getTokenAwareContext(
      session.id, 
      userMessage, 
      this.contextWindow,
      loggingContext,
      this.sharedLogFile
    );

    // AI INSTRUCTIONS: Get enhanced orchestrator with chatbot config to trigger vector embeddings pipeline
    // This enables ConversationEnhancedAnalysisService with knowledge retrieval
    const enhancedOrchestrator = await DomainServiceCompositionService.getConversationContextOrchestrator(config);
    
    // Use enhanced context analysis to trigger vector embeddings pipeline
    // This calls ConversationContextOrchestrator.analyzeContextEnhanced which:
    // 1. Calls ConversationEnhancedAnalysisService.enhanceAnalysis
    // 2. Triggers knowledge retrieval via SimpleKnowledgeRetrievalService
    // 3. Executes vector embeddings pipeline with comprehensive logging
    const enhancedContext = await enhancedOrchestrator.analyzeContextEnhanced(
      [...contextResult.messages, userMessage],
      config,
      session,
      this.sharedLogFile
    );

    return {
      session,
      userMessage,
      contextResult,
      config,
      enhancedContext
    };
  }

  async execute(request: ProcessMessageRequest): Promise<ProcessMessageResult> {
    const startTime = Date.now();
    
    // Create shared log file for this entire user prompt processing
    this.sharedLogFile = `chatbot-${new Date().toISOString().replace(/[:.]/g, '-').split('.')[0]}.log`;
    
    // Create session logger with context
    const logger = this.loggingService.createSessionLogger(
      request.sessionId,
      this.sharedLogFile,
      {
        sessionId: request.sessionId,
        operation: 'process-chat-message',
        organizationId: request.organizationId
      }
    );
    
    logger.logHeader(`CHATBOT PROCESSING LOG - ${new Date().toISOString()}`);
    
    logger.logMessage('🚀 STARTING CHAT MESSAGE PROCESSING');
    logger.logMessage('📥 INCOMING REQUEST', {
      sessionId: request.sessionId,
      userMessage: request.userMessage,
      timestamp: new Date().toISOString()
    });
    
    try {
      // 1. Initialize workflow and validate prerequisites
      logger.logRaw('');
      logger.logRaw('📋 STEP 1: Initialize workflow and validate prerequisites');
      const workflowContext = await this.workflowService.initializeWorkflow(request, this.sharedLogFile);
      
      logger.logMessage('🔧 WORKFLOW CONTEXT', {
        sessionId: workflowContext.session.id,
        sessionStatus: workflowContext.session.status,
        configId: workflowContext.config.id,
        userMessageId: workflowContext.userMessage.id,
        userMessageContent: workflowContext.userMessage.content
      });

      // 2. Process user message and update session
      logger.logRaw('');
      logger.logRaw('📝 STEP 2: Process user message and update session');
      const messageContext = await this.processingService.processUserMessage(
        workflowContext,
        request
      );
      
      logger.logMessage('💬 MESSAGE CONTEXT', {
        sessionId: messageContext.session.id,
        configId: messageContext.config.id,
        userMessageId: messageContext.userMessage.id,
        processingTimestamp: new Date().toISOString()
      });

      // 3. Analyze conversation context and generate enhanced context
      logger.logRaw('');
      logger.logRaw('🔍 STEP 3: Analyze conversation context');
      const analysisResult = await this.analyzeConversationContext(messageContext, logger);
      
      logger.logMessage('📊 ANALYSIS RESULT', {
        sessionId: analysisResult.session.id,
        contextWindowUsed: analysisResult.contextResult?.contextWindow || 'unknown',
        messagesInContext: analysisResult.contextResult?.messages?.length || 0,
        enhancedContextKeys: Object.keys(analysisResult.enhancedContext || {}),
        analysisTimestamp: new Date().toISOString()
      });

      // 4. Generate AI response with enhanced context
      logger.logRaw('');
      logger.logRaw('🤖 STEP 4: Generate AI response');
      const responseResult = await this.processingService.generateAIResponse(
        analysisResult,
        this.sharedLogFile
      );
      
      logger.logMessage('🎯 AI RESPONSE RESULT', {
        sessionId: responseResult.session.id,
        botMessageId: responseResult.botMessage.id,
        botMessageContent: responseResult.botMessage.content,
        totalMessagesInConversation: responseResult.allMessages.length,
        enhancedContextUsed: !!responseResult.enhancedContext,
        unifiedProcessingUsed: responseResult.enhancedContext?.unifiedAnalysis ? true : false,
        fallbackUsed: responseResult.enhancedContext?.fallbackUsed || false,
        fallbackReason: responseResult.enhancedContext?.fallbackReason,
        callToAction: responseResult.enhancedContext?.callToAction,
        responseTimestamp: new Date().toISOString()
        // REMOVED: leadScore - now calculated by domain service only
      });

      // Log API call details if available
      if (responseResult.enhancedContext?.unifiedAnalysis) {
        logger.logMessage('📡 UNIFIED API CALL DETAILS');
        logger.logMessage('🔄 UNIFIED PROCESSING', {
          analysis: responseResult.enhancedContext.unifiedAnalysis,
          apiCallType: 'unified-single-call'
          // REMOVED: leadScore - now calculated by domain service only
        });
      }

      // 5. Finalize workflow and calculate metrics
      logger.logRaw('');
      logger.logRaw('✅ STEP 5: Finalize workflow and calculate metrics');
      const finalResult = await this.workflowService.finalizeWorkflow(
        responseResult,
        startTime,
        this.sharedLogFile
      );

      const totalProcessingTime = Date.now() - startTime;
      
      logger.logMessage('🏁 FINAL RESULT', {
        sessionId: finalResult.session.id,
        userMessageId: finalResult.userMessage.id,
        botMessageId: finalResult.botMessage.id,
        shouldCaptureLeadInfo: finalResult.shouldCaptureLeadInfo,
        suggestedActionsCount: finalResult.suggestedNextActions.length,
        conversationMetrics: finalResult.conversationMetrics,
        intentAnalysis: finalResult.intentAnalysis,
        journeyState: finalResult.journeyState,
        relevantKnowledgeCount: finalResult.relevantKnowledge?.length || 0,
        totalProcessingTimeMs: totalProcessingTime,
        finalTimestamp: new Date().toISOString()
      });

      logger.logMessage('✨ CHAT MESSAGE PROCESSING COMPLETED SUCCESSFULLY');
      logger.logMetrics('Total Processing Time', { duration: totalProcessingTime });
      logger.logSeparator();

      return this.buildProcessMessageResult(finalResult);
      
    } catch (error) {
      const totalProcessingTime = Date.now() - startTime;
      
      logger.logMessage('❌ ERROR IN CHAT MESSAGE PROCESSING');
      logger.logError(
        error instanceof Error ? error : new Error(String(error)),
        {
          processingTimeMs: totalProcessingTime,
          errorTimestamp: new Date().toISOString()
        }
      );
      
      throw error;
    }
  }

  private buildProcessMessageResult(finalResult: any): ProcessMessageResult {
    return {
      chatSession: finalResult.session,
      userMessage: finalResult.userMessage,
      botResponse: finalResult.botMessage,
      shouldCaptureLeadInfo: finalResult.shouldCaptureLeadInfo,
      suggestedNextActions: finalResult.suggestedNextActions,
      conversationMetrics: finalResult.conversationMetrics,
      intentAnalysis: finalResult.intentAnalysis,
      journeyState: finalResult.journeyState,
      relevantKnowledge: finalResult.relevantKnowledge,
      callToAction: finalResult.callToAction
    };
  }
} 