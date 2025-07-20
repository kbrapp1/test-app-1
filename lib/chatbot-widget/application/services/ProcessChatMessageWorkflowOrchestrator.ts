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

import { perf } from '../../../performance-profiler';
import { IChatbotLoggingService, ISessionLogger } from '../../domain/services/interfaces/IChatbotLoggingService';
import { ChatbotWidgetCompositionRoot } from '../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { ProcessChatMessageRequest } from '../dto/ProcessChatMessageRequest';
import { ProcessChatMessageResult } from '../dto/ProcessChatMessageResult';
import {
    AnalysisContext,
    FinalWorkflowResult,
    MessageContext,
    ResponseContext,
    WorkflowResponseResult
} from '../types/WorkflowOrchestrationTypes';
import { ConversationContextManagementService } from './conversation-management/ConversationContextManagementService';
import { ChatMessageProcessingService } from './message-processing/ChatMessageProcessingService';
import { MessageProcessingWorkflowService, ProcessMessageRequest, WorkflowContext } from './message-processing/MessageProcessingWorkflowService';
import { WorkflowContextAnalysisService } from './workflow/WorkflowContextAnalysisService';
import { WorkflowErrorTrackingService } from './workflow/WorkflowErrorTrackingService';
import { WorkflowResultBuilderService } from './workflow/WorkflowResultBuilderService';

export class ProcessChatMessageWorkflowOrchestrator {
  private readonly loggingService: IChatbotLoggingService;
  private readonly contextAnalysisService: WorkflowContextAnalysisService;
  private readonly resultBuilderService: WorkflowResultBuilderService;
  private readonly errorTrackingService: WorkflowErrorTrackingService;
  private sharedLogFile?: string;

  constructor(
    private readonly workflowService: MessageProcessingWorkflowService,
    private readonly processingService: ChatMessageProcessingService,
    private readonly contextManagementService: ConversationContextManagementService
  ) {
    this.loggingService = ChatbotWidgetCompositionRoot.getLoggingService();
    this.contextAnalysisService = new WorkflowContextAnalysisService(contextManagementService);
    this.resultBuilderService = new WorkflowResultBuilderService();
    this.errorTrackingService = new WorkflowErrorTrackingService();
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

      const _processingTime = Date.now() - startTime;
      

      logger.logMessage('✨ CHAT MESSAGE PROCESSING COMPLETED SUCCESSFULLY');
      
      return this.resultBuilderService.buildResult(finalResult);
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      

      logger.logMessage('❌ ERROR IN CHAT MESSAGE PROCESSING');
      logger.logError(error instanceof Error ? error : new Error(String(error)));
      
      await this.errorTrackingService.trackError(error, request, processingTime, logger);
      throw error;
    }
  }

  private async initializeWorkflow(request: ProcessChatMessageRequest, logger: ISessionLogger): Promise<MessageContext> {
    logger.logRaw('📋 STEP 1: Initialize workflow and validate prerequisites');
    
    const processMessageRequest: ProcessMessageRequest = {
      userMessage: request.userMessage,
      sessionId: request.sessionId,
      organizationId: request.organizationId || '',
      metadata: request.metadata ? {
        userId: request.metadata.userId,
        timestamp: request.metadata.timestamp ? new Date(request.metadata.timestamp) : undefined,
        clientInfo: request.metadata.clientInfo
      } : undefined
    };
    
    const { result, duration: _duration } = await perf.measureAsync(
      'InitializeWorkflow',
      () => this.workflowService.initializeWorkflow(processMessageRequest, this.sharedLogFile!),
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
      userMessageId: result.userMessage.id,
      userPrompt: request.userMessage
    });
    
    return result as unknown as MessageContext;
  }

  private async analyzeConversationContext(messageContext: MessageContext, logger: ISessionLogger): Promise<AnalysisContext> {
    logger.logRaw('🔍 STEP 3: Analyze conversation context');
    
    const result = await this.contextAnalysisService.analyzeContext(messageContext, logger, this.sharedLogFile);
    
    
    logger.logMessage('📊 ANALYSIS RESULT', {
      sessionId: result.session.id,
      messagesInContext: result.contextResult?.messages?.length || 0
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
    
    const result = await this.workflowService.finalizeWorkflow(responseResult as unknown as WorkflowResponseResult, startTime, this.sharedLogFile!);
    
    logger.logMessage('🏁 FINAL RESULT', {
      sessionId: result.session.id,
      processingTimeMs: Date.now() - startTime
    });
    
    return result as unknown as FinalWorkflowResult;
  }
} 