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
import fs from 'fs';
import path from 'path';

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
  private readonly processingService: ChatMessageProcessingService;
  private readonly contextManagementService: ConversationContextManagementService;
  private readonly sessionUpdateService: SessionUpdateService;
  private readonly contextWindow: ConversationContextWindow;
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
      debugInformationService
    );

    this.processingService = new ChatMessageProcessingService(
      aiConversationService,
      messageRepository,
      conversationContextOrchestrator,
      intentClassificationService,
      knowledgeRetrievalService
    );

    // Initialize the services that were in ConversationAnalysisService
    this.contextManagementService = new ConversationContextManagementService(
      conversationContextOrchestrator,
      tokenCountingService,
      sessionRepository,
      messageRepository
    );

    this.sessionUpdateService = new SessionUpdateService(sessionRepository);

    // Initialize context window with sensible defaults
    this.contextWindow = ConversationContextWindow.create({
      maxTokens: 12000, // Safe for most models
      systemPromptTokens: 500,
      responseReservedTokens: 3000,
      summaryTokens: 200
    });

    // Create logs directory if it doesn't exist
    const logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
  }

  private writeLog(message: string): void {
    // Check if file logging is disabled via environment variable
    const fileLoggingEnabled = process.env.CHATBOT_FILE_LOGGING !== 'false';
    if (!fileLoggingEnabled || !this.sharedLogFile) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;
    const logDir = path.join(process.cwd(), 'logs');
    const logFilePath = path.join(logDir, this.sharedLogFile);
    
    try {
      fs.appendFileSync(logFilePath, logEntry);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  private logObject(label: string, obj: any): void {
    this.writeLog(`${label}:`);
    this.writeLog(JSON.stringify(obj, null, 2));
    this.writeLog('-'.repeat(40));
  }

  private async analyzeConversationContext(messageContext: any): Promise<any> {
    const { session, config, userMessage } = messageContext;

    // Get token-aware messages for context
    const contextResult = await this.contextManagementService.getTokenAwareContext(
      session.id, 
      userMessage, 
      this.contextWindow
    );

    // Enhanced context analysis (now unified - no redundant API calls)
    const enhancedContext = this.conversationContextOrchestrator.analyzeContext(
      [...contextResult.messages, userMessage],
      session
    );

    // Session remains unchanged since we only have basic context analysis
    // Journey state updates will happen in the ChatMessageProcessingService when unified results are available
    
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
    
    // Initialize the shared log file
    this.writeLog('='.repeat(80));
    this.writeLog(`CHATBOT PROCESSING LOG - ${new Date().toISOString()}`);
    this.writeLog('='.repeat(80));
    
    this.writeLog(`\n🚀 STARTING CHAT MESSAGE PROCESSING`);
    this.logObject('📥 INCOMING REQUEST', {
      sessionId: request.sessionId,
      userMessage: request.userMessage,
      timestamp: new Date().toISOString()
    });
    
    try {
      // 1. Initialize workflow and validate prerequisites
      this.writeLog('\n📋 STEP 1: Initialize workflow and validate prerequisites');
      const workflowContext = await this.workflowService.initializeWorkflow(request, this.sharedLogFile);
      
      this.logObject('🔧 WORKFLOW CONTEXT', {
        sessionId: workflowContext.session.id,
        sessionStatus: workflowContext.session.status,
        configId: workflowContext.config.id,
        userMessageId: workflowContext.userMessage.id,
        userMessageContent: workflowContext.userMessage.content
      });

      // 2. Process user message and update session
      this.writeLog('\n📝 STEP 2: Process user message and update session');
      const messageContext = await this.processingService.processUserMessage(
        workflowContext,
        request
      );
      
      this.logObject('💬 MESSAGE CONTEXT', {
        sessionId: messageContext.session.id,
        configId: messageContext.config.id,
        userMessageId: messageContext.userMessage.id,
        processingTimestamp: new Date().toISOString()
      });

      // 3. Analyze conversation context and generate enhanced context
      this.writeLog('\n🔍 STEP 3: Analyze conversation context');
      const analysisResult = await this.analyzeConversationContext(messageContext);
      
      this.logObject('📊 ANALYSIS RESULT', {
        sessionId: analysisResult.session.id,
        contextWindowUsed: analysisResult.contextResult?.contextWindow || 'unknown',
        messagesInContext: analysisResult.contextResult?.messages?.length || 0,
        enhancedContextKeys: Object.keys(analysisResult.enhancedContext || {}),
        analysisTimestamp: new Date().toISOString()
      });

      // 4. Generate AI response with enhanced context
      this.writeLog('\n🤖 STEP 4: Generate AI response');
      const responseResult = await this.processingService.generateAIResponse(
        analysisResult,
        this.sharedLogFile
      );
      
      this.logObject('🎯 AI RESPONSE RESULT', {
        sessionId: responseResult.session.id,
        botMessageId: responseResult.botMessage.id,
        botMessageContent: responseResult.botMessage.content,
        totalMessagesInConversation: responseResult.allMessages.length,
        enhancedContextUsed: !!responseResult.enhancedContext,
        unifiedProcessingUsed: responseResult.enhancedContext?.unifiedAnalysis ? true : false,
        fallbackUsed: responseResult.enhancedContext?.fallbackUsed || false,
        fallbackReason: responseResult.enhancedContext?.fallbackReason,
        leadScore: responseResult.enhancedContext?.leadScore?.totalScore,
        callToAction: responseResult.enhancedContext?.callToAction,
        responseTimestamp: new Date().toISOString()
      });

      // Log API call details if available
      if (responseResult.enhancedContext?.unifiedAnalysis) {
        this.writeLog('\n📡 UNIFIED API CALL DETAILS:');
        this.logObject('🔄 UNIFIED PROCESSING', {
          analysis: responseResult.enhancedContext.unifiedAnalysis,
          leadScore: responseResult.enhancedContext.leadScore,
          apiCallType: 'unified-single-call'
        });
      }

      // 5. Finalize workflow and calculate metrics
      this.writeLog('\n✅ STEP 5: Finalize workflow and calculate metrics');
      const finalResult = await this.workflowService.finalizeWorkflow(
        responseResult,
        startTime,
        this.sharedLogFile
      );

      const totalProcessingTime = Date.now() - startTime;
      
      this.logObject('🏁 FINAL RESULT', {
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

      this.writeLog('\n✨ CHAT MESSAGE PROCESSING COMPLETED SUCCESSFULLY');
      this.writeLog(`⏱️  Total Processing Time: ${totalProcessingTime}ms`);
      this.writeLog('='.repeat(80));

      return this.buildProcessMessageResult(finalResult);
      
    } catch (error) {
      const totalProcessingTime = Date.now() - startTime;
      
      this.writeLog('\n❌ ERROR IN CHAT MESSAGE PROCESSING');
      this.logObject('🚨 ERROR DETAILS', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        processingTimeMs: totalProcessingTime,
        errorTimestamp: new Date().toISOString()
      });
      this.writeLog('='.repeat(80));
      
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