/**
 * AI INSTRUCTIONS:
 * - Orchestrate complete chat message processing workflow
 * - Handle user input, context analysis, AI response generation
 * - Maintain session state and conversation metrics
 * - Apply proper error handling and logging throughout
 * - Keep orchestration clean - delegate complex logic to services
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
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { IChatbotLoggingService, ISessionLogger } from '../../domain/services/interfaces/IChatbotLoggingService';
import { PerformanceProfiler, perf } from '../../../performance-profiler';

export interface ProcessMessageRequest {
  userMessage: string;
  sessionId: string;
  organizationId: string; // Required - should never be undefined
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

    // Get error tracking service from composition root
    const errorTrackingService = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
    
    this.processingService = new ChatMessageProcessingService(
      aiConversationService,
      messageRepository,
      conversationContextOrchestrator,
      errorTrackingService,
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

    // Initialize context window with enhanced defaults
    this.contextWindow = ConversationContextWindow.create({
      maxTokens: 16000, // Enhanced context retention
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

    // Create logging context for context intelligence
    const loggingContext = {
      logEntry: (message: string) => logger.logMessage(message)
    };

    // Get token-aware messages for context with logging
    const { result: contextResult, duration: contextDuration } = await perf.measureAsync(
      'GetTokenAwareContext',
      () => this.contextManagementService.getTokenAwareContext(
        session.id, 
        userMessage, 
        this.contextWindow,
        loggingContext,
        this.sharedLogFile!
      ),
      { substep: '3.1' }
    );

    // Create enhanced orchestrator with proper dependency injection
    const tokenCountingService = DomainServiceCompositionService.getTokenCountingService();
    const intentClassificationService = await DomainServiceCompositionService.getIntentClassificationService();
    
    // Create knowledge retrieval service if not provided in constructor
    const knowledgeRetrievalService: IKnowledgeRetrievalService | undefined = 
      this.knowledgeRetrievalService || 
      DomainServiceCompositionService.getKnowledgeRetrievalService(
        config,
        ChatbotWidgetCompositionRoot.getVectorKnowledgeRepository(),
        ChatbotWidgetCompositionRoot.getEmbeddingService()
      );
    
    const enhancedOrchestrator = new ConversationContextOrchestrator(
      tokenCountingService,
      intentClassificationService,
      knowledgeRetrievalService
    );
    
    // Use enhanced context analysis to trigger vector embeddings pipeline
    const { result: enhancedContext, duration: enhancedDuration } = await perf.measureAsync(
      'AnalyzeContextEnhanced',
      () => enhancedOrchestrator.analyzeContextEnhanced(
        [...contextResult.messages, userMessage],
        config,
        session,
        this.sharedLogFile!
      ),
      { substep: '3.2' }
    );

    // Ensure all internal logging operations complete before returning
    await new Promise(resolve => setTimeout(resolve, 10));

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
    
    // Clear performance profiler for fresh metrics per request
    PerformanceProfiler.clear();
    
    const mainTimerId = perf.start('ProcessChatMessage', { 
      sessionId: request.sessionId, 
      organizationId: request.organizationId 
    });
    
    // Validate required parameters upfront
    if (!request.organizationId?.trim()) {
      throw new Error('Organization ID is required and cannot be empty');
    }
    
    // Create shared log file for this session (reuse same file for all messages in session)
    const sessionTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
    this.sharedLogFile = `chatbot-${sessionTimestamp}.log`;
    
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
      const { result: workflowContext, duration: step1Duration } = await perf.measureAsync(
        'InitializeWorkflow',
        () => this.workflowService.initializeWorkflow(request, this.sharedLogFile!),
        { step: 1 }
      );
      
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
      const { result: messageContext, duration: step2Duration } = await perf.measureAsync(
        'ProcessUserMessage',
        () => this.processingService.processUserMessage(workflowContext, request),
        { step: 2 }
      );
      
      // Log MESSAGE CONTEXT immediately after STEP 2 completes
      logger.logMessage('💬 MESSAGE CONTEXT', {
        sessionId: messageContext.session.id,
        configId: messageContext.config.id,
        userMessageId: messageContext.userMessage.id,
        processingTimestamp: new Date().toISOString()
      });

      // 3. Analyze conversation context and generate enhanced context
      logger.logRaw('');
      logger.logRaw('🔍 STEP 3: Analyze conversation context');
      
      const { result: analysisResult, duration: step3Duration } = await perf.measureAsync(
        'AnalyzeConversationContext',
        () => this.analyzeConversationContext(messageContext, logger),
        { step: 3 }
      );
      
      // Log ANALYSIS RESULT immediately after context analysis completes
      if (typeof (logger as any).logMessageSync === 'function') {
        (logger as any).logMessageSync('📊 ANALYSIS RESULT', {
          sessionId: analysisResult.session.id,
          contextWindowUsed: analysisResult.contextResult?.contextWindow || 'unknown',
          messagesInContext: analysisResult.contextResult?.messages?.length || 0,
          enhancedContextKeys: Object.keys(analysisResult.enhancedContext || {}),
          analysisTimestamp: new Date().toISOString()
        });
      } else {
        logger.logMessage('📊 ANALYSIS RESULT', {
          sessionId: analysisResult.session.id,
          contextWindowUsed: analysisResult.contextResult?.contextWindow || 'unknown',
          messagesInContext: analysisResult.contextResult?.messages?.length || 0,
          enhancedContextKeys: Object.keys(analysisResult.enhancedContext || {}),
          analysisTimestamp: new Date().toISOString()
        });
      }

      // Ensure all pending logging operations complete before proceeding to STEP 4
      await logger.flush();

      // 4. Generate AI response with enhanced context
      logger.logRaw('');
      logger.logRaw('🤖 STEP 4: Generate AI response');
      const { result: responseResult, duration: step4Duration } = await perf.measureAsync(
        'GenerateAIResponse',
        () => this.processingService.generateAIResponse(analysisResult, this.sharedLogFile!),
        { step: 4 }
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
        // leadScore now calculated by domain service only
      });

      // Log API call details if available
      if (responseResult.enhancedContext?.unifiedAnalysis) {
        logger.logMessage('📡 UNIFIED API CALL DETAILS');
        logger.logMessage('🔄 UNIFIED PROCESSING', {
          analysis: responseResult.enhancedContext.unifiedAnalysis,
          apiCallType: 'unified-single-call'
          // leadScore now calculated by domain service only
        });
      }

      // 5. Finalize workflow and calculate metrics
      logger.logRaw('');
      logger.logRaw('✅ STEP 5: Finalize workflow and calculate metrics');
      const { result: finalResult, duration: step5Duration } = await perf.measureAsync(
        'FinalizeWorkflow',
        () => this.workflowService.finalizeWorkflow(responseResult, startTime, this.sharedLogFile!),
        { step: 5 }
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

      // Complete performance profiling
      perf.end(mainTimerId);
      
      // Print performance report if enabled
      if (process.env.CHATBOT_PERFORMANCE_PROFILING === 'true') {
        perf.report();
      }

      return this.buildProcessMessageResult(finalResult);
      
    } catch (error) {
      const totalProcessingTime = Date.now() - startTime;
      
      // Complete performance profiling even on error
      perf.end(mainTimerId);
      
      logger.logMessage('❌ ERROR IN CHAT MESSAGE PROCESSING');
      logger.logError(
        error instanceof Error ? error : new Error(String(error)),
        {
          processingTimeMs: totalProcessingTime,
          errorTimestamp: new Date().toISOString()
        }
      );
      
      // Track error using ErrorTrackingFacade for proper database persistence
      try {
        // organizationId is now required, so we can use it directly
        const errorTrackingFacade = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
        await errorTrackingFacade.trackMessageProcessingError(
          error instanceof Error ? error.message : String(error),
          {
            sessionId: request.sessionId,
            organizationId: request.organizationId,
            userId: request.metadata?.userId,
            conversationId: request.sessionId,
            performanceMetrics: {
              responseTime: totalProcessingTime,
              memoryUsage: 0,
              cpuUsage: 0
            },
            metadata: {
              userMessage: request.userMessage,
              ...request.metadata
            }
          }
        );
      } catch (trackingError) {
        // Don't fail the main request if error tracking fails
        logger.logMessage('⚠️  Error tracking failed', { trackingError: trackingError instanceof Error ? trackingError.message : String(trackingError) });
      }
      
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