/**
 * Chat Message Processing Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate message processing workflow
 * - Delegate to specialized services for specific concerns
 * - Keep under 150 lines following @golden-rule patterns
 * - Focus on coordination, not implementation
 * - Follow DDD application service patterns
 */

import { WorkflowContext } from './MessageProcessingWorkflowService';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { ProcessingConfig, ProcessingSession } from './types/UnifiedResultTypes';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { ConversationContextOrchestrator } from '../../../domain/services/conversation/ConversationContextOrchestrator';
import { IAIConversationService } from '../../../domain/services/interfaces/IAIConversationService';
import { IIntentClassificationService } from '../../../domain/services/interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { ConversationContextBuilderService } from './ConversationContextBuilderService';
import { UnifiedResponseProcessorService } from './UnifiedResponseProcessorService';
import { SessionContextUpdateService } from './SessionContextUpdateService';
import { EntityMergeProcessorService } from './EntityMergeProcessorService';
import { LeadScoreCalculatorService } from './LeadScoreCalculatorService';
import { ConversationFlowAnalyzerService } from './ConversationFlowAnalyzerService';
import { ErrorTrackingFacade } from '../ErrorTrackingFacade';
import { MessageAnalysisExtractorService } from './MessageAnalysisExtractorService';
import { MessageEntityConverterService } from './MessageEntityConverterService';
import { KnowledgeRetrievalCoordinatorService } from './KnowledgeRetrievalCoordinatorService';

export interface ProcessMessageRequest {
  userMessage: string;
  sessionId: string;
  organizationId?: string;
  metadata?: Record<string, unknown>;
}

export interface AnalysisResult {
  session: Record<string, unknown>;
  userMessage: ChatMessage;
  contextResult: Record<string, unknown>;
  config: ChatbotConfig;
  enhancedContext: Record<string, unknown>;
}

export interface MessageProcessingContext {
  session: ChatSession;
  config: ChatbotConfig;
  userMessage: ChatMessage;
}

export interface ResponseResult {
  session: ChatSession;
  userMessage: ChatMessage;
  botMessage: ChatMessage;
  allMessages: ChatMessage[];
  config: ChatbotConfig;
  enhancedContext: Record<string, unknown>;
}

export class ChatMessageProcessingService {
  private readonly conversationContextBuilder: ConversationContextBuilderService;
  private readonly unifiedResponseProcessor: UnifiedResponseProcessorService;
  private readonly sessionContextUpdater: SessionContextUpdateService;
  private readonly messageAnalysisExtractor: MessageAnalysisExtractorService;
  private readonly messageEntityConverter: MessageEntityConverterService;
  private readonly knowledgeRetrievalCoordinator: KnowledgeRetrievalCoordinatorService;

  constructor(
    private readonly aiConversationService: IAIConversationService,
    private readonly messageRepository: IChatMessageRepository,
    private readonly conversationContextOrchestrator: ConversationContextOrchestrator,
    private readonly errorTrackingFacade: ErrorTrackingFacade,
    private readonly intentClassificationService?: IIntentClassificationService,
    private readonly knowledgeRetrievalService?: IKnowledgeRetrievalService
  ) {
    // Initialize specialized services with composition pattern
    this.conversationContextBuilder = new ConversationContextBuilderService(aiConversationService);
    this.unifiedResponseProcessor = new UnifiedResponseProcessorService(messageRepository, errorTrackingFacade);
    this.messageAnalysisExtractor = new MessageAnalysisExtractorService(messageRepository);
    this.messageEntityConverter = new MessageEntityConverterService(messageRepository);
    this.knowledgeRetrievalCoordinator = new KnowledgeRetrievalCoordinatorService(knowledgeRetrievalService);
    
    // Initialize specialized services for SessionContextUpdateService
    const entityMergeProcessor = new EntityMergeProcessorService();
    const leadScoreCalculator = new LeadScoreCalculatorService();
    const conversationFlowAnalyzer = new ConversationFlowAnalyzerService();
    
    this.sessionContextUpdater = new SessionContextUpdateService(
      conversationContextOrchestrator,
      entityMergeProcessor,
      leadScoreCalculator,
      conversationFlowAnalyzer
    );
  }

  /** Process user message through workflow */
  async processUserMessage(
    workflowContext: WorkflowContext,
    _request: ProcessMessageRequest
  ): Promise<MessageProcessingContext> {
    const { session, config, userMessage } = workflowContext;

    return {
      session,
      config,
      userMessage
    };
  }

  /** Generate AI response using unified processing with specialized service coordination */
  async generateAIResponse(analysisResult: AnalysisResult, sharedLogFile: string): Promise<ResponseResult> {
    const { session, userMessage, contextResult, config, enhancedContext } = analysisResult;
    
    // Validate unified processing service availability
    if (!this.intentClassificationService || !('processChatbotInteractionComplete' in this.intentClassificationService)) {
      throw new Error('Unified processing service not available - chatbot cannot process messages without unified intent classification service');
    }

    // Convert plain message objects to ChatMessage entities using specialized service
    const contextMessages = await this.messageEntityConverter.convertPlainMessagesToEntities(
      contextResult.messages as Record<string, unknown>[], 
      sharedLogFile
    );
    
    // Merge context messages with user message avoiding duplication
    const allMessages = this.messageEntityConverter.mergeMessagesWithUserMessage(contextMessages, userMessage);

    // Build conversation context through specialized service
    const conversationContext = await this.buildConversationContext(
      config, session, contextMessages, userMessage, contextResult, enhancedContext, sharedLogFile
    );

    // Process unified AI interaction
    const unifiedResult = await this.processUnifiedAIInteraction(userMessage.content, conversationContext);

    // Extract analysis data from unified response using specialized service
    const updatedUserMessage = await this.messageAnalysisExtractor.extractAndApplyAnalysis(
      userMessage, 
      unifiedResult as Record<string, unknown>, 
      sharedLogFile
    );

    // Process unified response and create bot message
    const botMessage = await this.unifiedResponseProcessor.createBotMessageFromUnifiedResult(
      session as unknown as ChatSession,
      unifiedResult as Record<string, unknown>,
      sharedLogFile,
      config
    );

    // Update message array with analyzed user message
    const finalAllMessages = this.messageEntityConverter.updateMessagesWithAnalyzedMessage(
      allMessages, 
      updatedUserMessage
    );

    // Update session context with unified results
    const updatedSession = this.sessionContextUpdater.updateSessionWithUnifiedResults(
      session as unknown as ChatSession,
      botMessage,
      finalAllMessages,
      unifiedResult as Record<string, unknown>,
      sharedLogFile
    );

    return {
      session: updatedSession,
      userMessage: updatedUserMessage,
      botMessage,
      allMessages: finalAllMessages,
      config,
      enhancedContext: this.buildEnhancedContextResult(enhancedContext, unifiedResult as Record<string, unknown>)
    };
  }

  /** Retrieve knowledge for query context - delegated to knowledge coordinator */
  async retrieveKnowledge(query: string, context?: Record<string, unknown>): Promise<unknown> {
    return this.knowledgeRetrievalCoordinator.retrieveKnowledge(query, context);
  }

  /** Helper: Build conversation context for unified processing */
  private async buildConversationContext(
    config: ChatbotConfig,
    session: Record<string, unknown>,
    contextMessages: ChatMessage[],
    userMessage: ChatMessage,
    contextResult: Record<string, unknown>,
    enhancedContext: Record<string, unknown>,
    logFileName: string
  ): Promise<unknown> {
    const processingConfig: ProcessingConfig = {
      organizationId: config.organizationId,
      name: config.name
    };
    const processingSession: ProcessingSession = {
      id: session.id as string,
      conversationId: session.conversationId as string,
      contextData: session.contextData as Record<string, unknown>
    };

    const conversationContext = await this.conversationContextBuilder.buildConversationContext(
      processingConfig,
      processingSession,
      contextMessages,
      userMessage,
      contextResult.summary as string | undefined,
      enhancedContext,
      logFileName
    );

    // Add shared log file to context for downstream services
    (conversationContext as unknown as Record<string, unknown>).sharedLogFile = logFileName;
    return conversationContext;
  }

  /** Helper: Process unified AI interaction with proper typing */
  private async processUnifiedAIInteraction(content: string, context: unknown): Promise<unknown> {
    const unifiedService = this.intentClassificationService as IIntentClassificationService & { 
      processChatbotInteractionComplete: (content: string, context: unknown) => Promise<unknown> 
    };
    
    return await unifiedService.processChatbotInteractionComplete(content, context);
  }

  /** Helper: Build enhanced context result with unified analysis data */
  private buildEnhancedContextResult(
    enhancedContext: Record<string, unknown>, 
    unifiedResult: Record<string, unknown>
  ): Record<string, unknown> {
    return {
      ...enhancedContext,
      unifiedAnalysis: unifiedResult?.analysis as Record<string, unknown> || { 
        primaryIntent: 'unknown', 
        primaryConfidence: 0 
      },
      conversationFlow: null, // Will be set after session update
      callToAction: ((unifiedResult?.response as Record<string, unknown>)?.callToAction as Record<string, unknown>) || { 
        type: 'none', 
        priority: 'low' 
      }
    };
  }
} 