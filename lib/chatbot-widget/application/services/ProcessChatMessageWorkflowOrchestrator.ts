/**
 * Process Chat Message Workflow Orchestrator
 * 
 * AI INSTRUCTIONS:
 * - Application service for workflow coordination only
 * - Orchestrate domain objects without business logic
 * - Handle domain event management
 * - Coordinate between specialized services
 * - Maintain clean error handling with domain errors
 * - Keep under 250 lines following SRP
 */

import { ProcessChatMessageRequest } from '../dto/ProcessChatMessageRequest';
import { ProcessChatMessageResult, ProcessChatMessageResultBuilder } from '../dto/ProcessChatMessageResult';
import { MessageProcessingWorkflowService } from './message-processing/MessageProcessingWorkflowService';
import { ChatMessageProcessingService } from './message-processing/ChatMessageProcessingService';
import { ConversationContextManagementService } from './conversation-management/ConversationContextManagementService';
import { ConversationContextWindow } from '../../domain/value-objects/session-management/ConversationContextWindow';
import { IChatbotLoggingService, ISessionLogger } from '../../domain/services/interfaces/IChatbotLoggingService';
import { ConversationContextOrchestrator } from '../../domain/services/conversation/ConversationContextOrchestrator';
import { DomainServiceCompositionService } from '../../infrastructure/composition/DomainServiceCompositionService';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { IKnowledgeRetrievalService } from '../../domain/services/interfaces/IKnowledgeRetrievalService';
import { perf } from '../../../performance-profiler';
import { 
  MessageProcessingStartedEvent, 
  MessageProcessingCompletedEvent, 
  MessageProcessingFailedEvent,
  ConversationContextAnalyzedEvent
} from '../../domain/events/ChatMessageProcessingEvents';
import { DomainError as _DomainError } from '../../domain/errors/ChatMessageProcessingErrors';

// AI: Internal workflow result interfaces for type safety
interface WorkflowContext {
  session: { id: string; status: string };
  config: { id: string };
}

interface MessageContext extends WorkflowContext {
  userMessage: { id: string };
}

interface AnalysisContext extends MessageContext {
  contextResult: {
    messages: unknown[];
    contextWindow: number;
  };
  enhancedContext: {
    intentAnalysis: { intent?: string };
    relevantKnowledge: unknown[];
  };
}

interface ResponseContext extends MessageContext {
  botMessage: { id: string };
}

interface FinalWorkflowResult extends ResponseContext {
  shouldCaptureLeadInfo: boolean;
  suggestedNextActions: unknown[];
  conversationMetrics: unknown;
  intentAnalysis: unknown;
  journeyState: unknown;
  relevantKnowledge: unknown[];
  callToAction: unknown;
}

export class ProcessChatMessageWorkflowOrchestrator {
  private readonly contextWindow: ConversationContextWindow;
  private readonly loggingService: IChatbotLoggingService;
  private sharedLogFile?: string;

  constructor(
    private readonly workflowService: MessageProcessingWorkflowService,
    private readonly processingService: ChatMessageProcessingService,
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

  async orchestrate(request: ProcessChatMessageRequest): Promise<ProcessChatMessageResult> {
    const startTime = Date.now();
    
    // AI: Create turn-based log file for debugging
    const turnTimestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
    this.sharedLogFile = `chatbot-${turnTimestamp}.log`;
    
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

    try {
      // AI: Publish domain event for processing start
      this.publishDomainEvent(new MessageProcessingStartedEvent(
        request.sessionId,
        'pending', // Will be updated after user message creation
        request.organizationId
      ));

      // AI: Step 1 - Initialize workflow
      const workflowContext = await this.initializeWorkflow(request, logger);
      
      // AI: Step 2 - Process user message
      const messageContext = await this.processUserMessage(workflowContext, request, logger);
      
      // AI: Step 3 - Analyze conversation context
      const analysisResult = await this.analyzeConversationContext(messageContext, logger);
      
      // AI: Step 4 - Generate AI response
      const responseResult = await this.generateAIResponse(analysisResult, logger);
      
      // AI: Step 5 - Finalize workflow
      const finalResult = await this.finalizeWorkflow(responseResult, startTime, logger);

      const processingTime = Date.now() - startTime;
      
      // AI: Publish success event
      const result = finalResult as FinalWorkflowResult;
      this.publishDomainEvent(new MessageProcessingCompletedEvent(
        result.session.id,
        result.userMessage.id,
        result.botMessage.id,
        processingTime,
        request.organizationId
      ));

      logger.logMessage('✨ CHAT MESSAGE PROCESSING COMPLETED SUCCESSFULLY');
      
      return this.buildResult(finalResult);
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // AI: Publish failure event
      this.publishDomainEvent(new MessageProcessingFailedEvent(
        request.sessionId,
        'unknown', // May not have user message ID if early failure
        error instanceof Error ? error.message : String(error),
        processingTime,
        request.organizationId
      ));

      logger.logMessage('❌ ERROR IN CHAT MESSAGE PROCESSING');
      logger.logError(error instanceof Error ? error : new Error(String(error)));
      
      await this.trackError(error, request, processingTime, logger);
      throw error;
    }
  }

  private async initializeWorkflow(request: ProcessChatMessageRequest, logger: ISessionLogger): Promise<WorkflowContext> {
    logger.logRaw('📋 STEP 1: Initialize workflow and validate prerequisites');
    
    const { result, duration: _duration } = await perf.measureAsync(
      'InitializeWorkflow',
      () => this.workflowService.initializeWorkflow(request, this.sharedLogFile!),
      { step: 1 }
    );
    
    logger.logMessage('🔧 WORKFLOW CONTEXT', {
      sessionId: result.session.id,
      sessionStatus: result.session.status,
      configId: result.config.id
    });
    
    return result;
  }

  private async processUserMessage(workflowContext: WorkflowContext, request: ProcessChatMessageRequest, logger: ISessionLogger): Promise<MessageContext> {
    logger.logRaw('📝 STEP 2: Process user message and update session');
    
    const { result, duration: _duration } = await perf.measureAsync(
      'ProcessUserMessage',
      () => this.processingService.processUserMessage(workflowContext as any, request),
      { step: 2 }
    );
    
    logger.logMessage('💬 MESSAGE CONTEXT', {
      sessionId: result.session.id,
      userMessageId: result.userMessage.id
    });
    
    return result;
  }

  private async analyzeConversationContext(messageContext: MessageContext, logger: ISessionLogger): Promise<AnalysisContext> {
    logger.logRaw('🔍 STEP 3: Analyze conversation context');
    
    const { result, duration: _duration } = await perf.measureAsync(
      'AnalyzeConversationContext',
      () => this.performContextAnalysis(messageContext, logger),
      { step: 3 }
    );
    
    // AI: Publish context analysis event
    const resultData = result as AnalysisContext;
    this.publishDomainEvent(new ConversationContextAnalyzedEvent(
      resultData.session.id,
      resultData.contextResult?.messages?.length || 0,
      resultData.contextResult?.contextWindow || 0,
      resultData.enhancedContext?.intentAnalysis?.intent,
      resultData.enhancedContext?.relevantKnowledge?.length
    ));
    
    logger.logMessage('📊 ANALYSIS RESULT', {
      sessionId: resultData.session.id,
      messagesInContext: resultData.contextResult?.messages?.length || 0
    });
    
    return result;
  }

  private async generateAIResponse(analysisResult: AnalysisContext, logger: ISessionLogger): Promise<ResponseContext> {
    logger.logRaw('🤖 STEP 4: Generate AI response');
    
    const { result, duration: _duration } = await perf.measureAsync(
      'GenerateAIResponse',
      () => this.processingService.generateAIResponse(analysisResult as any, this.sharedLogFile!),
      { step: 4 }
    );
    
    logger.logMessage('🎯 AI RESPONSE RESULT', {
      sessionId: result.session.id,
      botMessageId: result.botMessage.id
    });
    
    return result;
  }

  private async finalizeWorkflow(responseResult: ResponseContext, startTime: number, logger: ISessionLogger): Promise<FinalWorkflowResult> {
    logger.logRaw('✅ STEP 5: Finalize workflow and calculate metrics');
    
    const { result, duration: _duration } = await perf.measureAsync(
      'FinalizeWorkflow',
      () => this.workflowService.finalizeWorkflow(responseResult, startTime, this.sharedLogFile!),
      { step: 5 }
    );
    
    logger.logMessage('🏁 FINAL RESULT', {
      sessionId: result.session.id,
      processingTimeMs: Date.now() - startTime
    });
    
    return {...result, config: responseResult.config || { id: 'unknown' }, intentAnalysis: result.intentAnalysis || undefined} as FinalWorkflowResult;
  }

  private async performContextAnalysis(messageContext: MessageContext, logger: ISessionLogger): Promise<AnalysisContext> {
    const { session, config, userMessage } = messageContext;

    // AI: Get token-aware context
    const contextResult = await this.contextManagementService.getTokenAwareContext(
      session.id,
      userMessage as any,
      this.contextWindow,
      { logEntry: (message: string) => logger.logMessage(message) },
      this.sharedLogFile!
    );

    // AI: Create enhanced orchestrator with proper dependencies
    const knowledgeRetrievalService = this.getKnowledgeRetrievalService(config);
    const enhancedOrchestrator = await this.createEnhancedOrchestrator(knowledgeRetrievalService);
    
    // AI: Analyze enhanced context
    const enhancedContext = await enhancedOrchestrator.analyzeContextEnhanced(
      [...contextResult.messages, userMessage] as any,
      config,
      session as any,
      this.sharedLogFile!
    );

    return { session, userMessage, contextResult: {...contextResult, contextWindow: 0}, config, enhancedContext };
  }

  private getKnowledgeRetrievalService(config: { id: string }): IKnowledgeRetrievalService | undefined {
    return DomainServiceCompositionService.getKnowledgeRetrievalService(
      config as any,
      ChatbotWidgetCompositionRoot.getVectorKnowledgeRepository(),
      ChatbotWidgetCompositionRoot.getEmbeddingService()
    );
  }

  private async createEnhancedOrchestrator(knowledgeService?: IKnowledgeRetrievalService): Promise<ConversationContextOrchestrator> {
    const tokenCountingService = DomainServiceCompositionService.getTokenCountingService();
    const intentClassificationService = await DomainServiceCompositionService.getIntentClassificationService();
    
    return new ConversationContextOrchestrator(
      tokenCountingService,
      intentClassificationService,
      knowledgeService
    );
  }

  private buildResult(finalResult: FinalWorkflowResult): ProcessChatMessageResult {
    const result = finalResult;
    return new ProcessChatMessageResultBuilder()
      .withChatSession(result.session as any)
      .withUserMessage(result.userMessage as any)
      .withBotResponse(result.botMessage as any)
      .withLeadCapture(result.shouldCaptureLeadInfo)
      .withSuggestedActions(result.suggestedNextActions as any)
      .withConversationMetrics(result.conversationMetrics as any)
      .withIntentAnalysis(result.intentAnalysis as any)
      .withJourneyState(result.journeyState as any)
      .withRelevantKnowledge(result.relevantKnowledge as any)
      .withCallToAction(result.callToAction as any)
      .build();
  }

  private publishDomainEvent(_event: unknown): void {
    // AI: Domain event publishing - implement based on your event bus
    // For now, just log the event
  }

  private async trackError(error: unknown, request: ProcessChatMessageRequest, processingTime: number, logger: ISessionLogger): Promise<void> {
    try {
      const errorTrackingFacade = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
      await errorTrackingFacade.trackMessageProcessingError(
        error instanceof Error ? error.message : String(error),
        {
          sessionId: request.sessionId,
          organizationId: request.organizationId,
          performanceMetrics: { responseTime: processingTime, memoryUsage: 0, cpuUsage: 0 },
          metadata: { userMessage: request.userMessage, ...request.metadata }
        }
      );
    } catch (trackingError) {
      logger.logMessage('⚠️ Error tracking failed', { 
        trackingError: trackingError instanceof Error ? trackingError.message : String(trackingError) 
      });
    }
  }
} 