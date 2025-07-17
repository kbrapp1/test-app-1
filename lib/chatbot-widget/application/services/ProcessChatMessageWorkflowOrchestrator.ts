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
import { MessageProcessingWorkflowService, WorkflowContext } from './message-processing/MessageProcessingWorkflowService';
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
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';

// Enhanced interfaces for workflow context
interface ContextResultData {
  messages: ChatMessage[];
  contextWindow: number;
  summary?: string;
  tokenUsage: {
    messagesTokens: number;
    summaryTokens: number;
    totalTokens: number;
  };
  wasCompressed: boolean;
}

interface EnhancedContextData {
  intentAnalysis: {
    intent?: string;
    confidence?: number;
    entities?: Record<string, unknown>;
  };
  relevantKnowledge: Array<{
    id: string;
    title: string;
    content: string;
    relevanceScore: number;
  }>;
}

interface WorkflowSession {
  id: string;
  status: string;
}

interface WorkflowConfig {
  id: string;
  organizationId?: string;
}

interface WorkflowUserMessage {
  id: string;
  content?: string;
  messageType?: string;
}

interface WorkflowBotMessage {
  id: string;
  content?: string;
}

interface ConversationMetricsData {
  messageCount?: number;
  sessionDuration?: number;
  engagementScore?: number;
  leadQualificationProgress?: number;
}

interface JourneyStateData {
  stage?: string;
  phase?: string;
  progress?: number;
}

interface IntentAnalysisData {
  intent?: string;
  confidence?: number;
  entities?: Record<string, unknown>;
}

interface SuggestedActionsData {
  action?: string;
  priority?: number;
  description?: string;
}

interface CallToActionData {
  text?: string;
  type?: string;
  priority?: number;
}

// AI: Internal workflow result interfaces for type safety

interface MessageContext {
  session: WorkflowSession;
  config: WorkflowConfig;
  userMessage: WorkflowUserMessage;
}

interface AnalysisContext {
  session: WorkflowSession;
  config: WorkflowConfig;
  userMessage: WorkflowUserMessage;
  contextResult: ContextResultData;
  enhancedContext: EnhancedContextData;
}

interface ResponseContext {
  session: WorkflowSession;
  config: WorkflowConfig;
  userMessage: WorkflowUserMessage;
  botMessage: WorkflowBotMessage;
}

interface FinalWorkflowResult {
  session: WorkflowSession;
  config: WorkflowConfig;
  userMessage: WorkflowUserMessage;
  botMessage: WorkflowBotMessage;
  shouldCaptureLeadInfo: boolean;
  suggestedNextActions: SuggestedActionsData[];
  conversationMetrics: ConversationMetricsData;
  intentAnalysis: IntentAnalysisData;
  journeyState: JourneyStateData;
  relevantKnowledge: Array<{
    id: string;
    title: string;
    content: string;
    relevanceScore: number;
  }>;
  callToAction: CallToActionData;
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
      const { result: workflowContext } = await perf.measureAsync('workflow-initialization', 
        () => this.initializeWorkflow(request, logger)
      );
      
      // AI: Step 2 - Process user message
      const { result: messageContext } = await perf.measureAsync('user-message-processing', 
        () => this.processUserMessage(workflowContext, request, logger)
      );
      
      // AI: Step 3 - Analyze conversation context
      const { result: analysisResult } = await perf.measureAsync('conversation-context-analysis', 
        () => this.analyzeConversationContext(messageContext, logger)
      );
      
      // AI: Step 4 - Generate AI response
      const { result: responseResult } = await perf.measureAsync('ai-response-generation', 
        () => this.generateAIResponse(analysisResult, logger)
      );
      
      // AI: Step 5 - Finalize workflow
      const { result: finalResult } = await perf.measureAsync('workflow-finalization', 
        () => this.finalizeWorkflow(responseResult, startTime, logger)
      );

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

  private async initializeWorkflow(request: ProcessChatMessageRequest, logger: ISessionLogger): Promise<MessageContext> {
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

  private async processUserMessage(workflowContext: MessageContext, request: ProcessChatMessageRequest, logger: ISessionLogger): Promise<MessageContext> {
    logger.logRaw('📝 STEP 2: Process user message and update session');
    
    const result = await this.processingService.processUserMessage(workflowContext as unknown as WorkflowContext, request);
    
    logger.logMessage('💬 MESSAGE CONTEXT', {
      sessionId: result.session.id,
      userMessageId: result.userMessage.id
    });
    
    return result as unknown as MessageContext;
  }

  private async analyzeConversationContext(messageContext: MessageContext, logger: ISessionLogger): Promise<AnalysisContext> {
    logger.logRaw('🔍 STEP 3: Analyze conversation context');
    
    const result = await this.performContextAnalysis(messageContext, logger);
    
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
    
    const result = await this.processingService.generateAIResponse(analysisResult as unknown as import('./message-processing/ChatMessageProcessingService').AnalysisResult, this.sharedLogFile!);
    
    logger.logMessage('🎯 AI RESPONSE RESULT', {
      sessionId: result.session.id,
      botMessageId: result.botMessage.id
    });
    
    return result as unknown as ResponseContext;
  }

  private async finalizeWorkflow(responseResult: ResponseContext, startTime: number, logger: ISessionLogger): Promise<FinalWorkflowResult> {
    logger.logRaw('✅ STEP 5: Finalize workflow and calculate metrics');
    
    const result = await this.workflowService.finalizeWorkflow(responseResult as unknown, startTime, this.sharedLogFile!);
    
    logger.logMessage('🏁 FINAL RESULT', {
      sessionId: result.session.id,
      processingTimeMs: Date.now() - startTime
    });
    
    const finalWorkflowResult = result as import('./message-processing/MessageProcessingWorkflowService').WorkflowFinalResult;
    return {
      session: finalWorkflowResult.session as WorkflowSession,
      config: { id: 'unknown' } as WorkflowConfig, // WorkflowFinalResult doesn't have config
      userMessage: finalWorkflowResult.userMessage as WorkflowUserMessage,
      botMessage: finalWorkflowResult.botMessage as WorkflowBotMessage,
      shouldCaptureLeadInfo: finalWorkflowResult.shouldCaptureLeadInfo as boolean || false,
      suggestedNextActions: finalWorkflowResult.suggestedNextActions as unknown as SuggestedActionsData[] || [],
      conversationMetrics: finalWorkflowResult.conversationMetrics as ConversationMetricsData || {},
      intentAnalysis: finalWorkflowResult.intentAnalysis as IntentAnalysisData || {},
      journeyState: finalWorkflowResult.journeyState as JourneyStateData || {},
      relevantKnowledge: finalWorkflowResult.relevantKnowledge as Array<{ id: string; title: string; content: string; relevanceScore: number; }> || [],
      callToAction: finalWorkflowResult.callToAction ? {
        type: finalWorkflowResult.callToAction.type || 'none',
        text: finalWorkflowResult.callToAction.message || '',
        priority: parseInt(finalWorkflowResult.callToAction.priority || '0') || 0
      } as CallToActionData : {} as CallToActionData
    } as FinalWorkflowResult;
  }

  private async performContextAnalysis(messageContext: MessageContext, logger: ISessionLogger): Promise<AnalysisContext> {
    const { session, config, userMessage } = messageContext;

    // AI: Get token-aware context
    const contextResult = await this.contextManagementService.getTokenAwareContext(
      session.id,
      userMessage as unknown as ChatMessage,
      this.contextWindow,
      { logEntry: (message: string) => logger.logMessage(message) },
      this.sharedLogFile!
    ) as unknown as ContextResultData;

    // AI: Create enhanced orchestrator with proper dependencies
    const knowledgeRetrievalService = this.getKnowledgeRetrievalService(config);
    const enhancedOrchestrator = await this.createEnhancedOrchestrator(knowledgeRetrievalService);
    
    // AI: Analyze enhanced context
    const enhancedContext = await enhancedOrchestrator.analyzeContextEnhanced(
      [...contextResult.messages, userMessage] as ChatMessage[],
      config as ChatbotConfig,
      session as ChatSession,
      this.sharedLogFile!
    ) as EnhancedContextData;

    return { 
      session: session as WorkflowSession, 
      userMessage: userMessage as WorkflowUserMessage, 
      contextResult: {
        messages: contextResult.messages,
        contextWindow: contextResult.contextWindow || 0,
        summary: contextResult.summary,
        tokenUsage: contextResult.tokenUsage || {
          messagesTokens: 0,
          summaryTokens: 0,
          totalTokens: 0
        },
        wasCompressed: contextResult.wasCompressed || false
      }, 
      config: config as WorkflowConfig, 
      enhancedContext 
    };
  }

  private getKnowledgeRetrievalService(config: WorkflowConfig): IKnowledgeRetrievalService | undefined {
    return DomainServiceCompositionService.getKnowledgeRetrievalService(
      config as ChatbotConfig,
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
    return new ProcessChatMessageResultBuilder()
      .withChatSession(finalResult.session as ChatSession)
      .withUserMessage(finalResult.userMessage as ChatMessage)
      .withBotResponse(finalResult.botMessage as ChatMessage)
      .withLeadCapture(finalResult.shouldCaptureLeadInfo)
      .withSuggestedActions((finalResult.suggestedNextActions || []).map((action: string | SuggestedActionsData) => typeof action === 'string' ? action : action.action || action.description || String(action)))
      .withConversationMetrics({
        messageCount: finalResult.conversationMetrics?.messageCount || 0,
        sessionDuration: finalResult.conversationMetrics?.sessionDuration || 0,
        engagementScore: finalResult.conversationMetrics?.engagementScore || 0,
        leadQualificationProgress: finalResult.conversationMetrics?.leadQualificationProgress || 0
      })
      .withIntentAnalysis(finalResult.intentAnalysis ? {
        intent: finalResult.intentAnalysis.intent || 'unknown',
        confidence: finalResult.intentAnalysis.confidence || 0,
        entities: finalResult.intentAnalysis.entities || {},
        category: 'general'
      } : undefined)
      .withJourneyState(finalResult.journeyState ? {
        stage: finalResult.journeyState.stage || 'initial',
        confidence: 0.5,
        isSalesReady: false,
        recommendedActions: []
      } : undefined)
      .withRelevantKnowledge(finalResult.relevantKnowledge)
      .withCallToAction(finalResult.callToAction ? {
        type: finalResult.callToAction.type || 'none',
        message: finalResult.callToAction.text || '',
        priority: String(finalResult.callToAction.priority || 'low')
      } : undefined)
      .build();
  }

  private publishDomainEvent(_event: MessageProcessingStartedEvent | MessageProcessingCompletedEvent | MessageProcessingFailedEvent | ConversationContextAnalyzedEvent): void {
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