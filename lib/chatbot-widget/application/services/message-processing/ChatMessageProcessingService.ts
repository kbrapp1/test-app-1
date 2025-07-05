/**
 * Chat Message Processing Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Orchestrate message processing workflow
 * - Delegate to specialized services for specific concerns
 * - Keep under 200-250 lines following @golden-rule patterns
 * - Focus on coordination, not implementation
 * - Follow DDD application service patterns
 */

import { MessageProcessingWorkflowService, WorkflowContext } from './MessageProcessingWorkflowService';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { ConversationContextOrchestrator } from '../../../domain/services/conversation/ConversationContextOrchestrator';
import { IAIConversationService, ConversationContext } from '../../../domain/services/interfaces/IAIConversationService';
import { IIntentClassificationService } from '../../../domain/services/interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { ConversationContextBuilderService } from './ConversationContextBuilderService';
import { UnifiedResponseProcessorService } from './UnifiedResponseProcessorService';
import { SessionContextUpdateService } from './SessionContextUpdateService';
import { EntityMergeProcessorService } from './EntityMergeProcessorService';
import { LeadScoreCalculatorService } from './LeadScoreCalculatorService';
import { ConversationFlowAnalyzerService } from './ConversationFlowAnalyzerService';
import { ErrorTrackingFacade } from '../ErrorTrackingFacade';

export interface ProcessMessageRequest {
  userMessage: string;
  sessionId: string;
  organizationId?: string;
  metadata?: any;
}

export interface AnalysisResult {
  session: any;
  userMessage: ChatMessage;
  contextResult: any;
  config: any;
  enhancedContext: any;
}

export interface MessageProcessingContext {
  session: any;
  config: any;
  userMessage: ChatMessage;
}

export interface ResponseResult {
  session: any;
  userMessage: ChatMessage;
  botMessage: ChatMessage;
  allMessages: ChatMessage[];
  config: any;
  enhancedContext: any;
}

export class ChatMessageProcessingService {
  private readonly conversationContextBuilder: ConversationContextBuilderService;
  private readonly unifiedResponseProcessor: UnifiedResponseProcessorService;
  private readonly sessionContextUpdater: SessionContextUpdateService;

  constructor(
    private readonly aiConversationService: IAIConversationService,
    private readonly messageRepository: IChatMessageRepository,
    private readonly conversationContextOrchestrator: ConversationContextOrchestrator,
    private readonly errorTrackingFacade: ErrorTrackingFacade,
    private readonly intentClassificationService?: IIntentClassificationService,
    private readonly knowledgeRetrievalService?: IKnowledgeRetrievalService
  ) {
    /**
     * AI INSTRUCTIONS:
     * - Initialize specialized services for focused responsibilities
     * - Follow composition over inheritance patterns
     * - Delegate complex operations to domain services
     */
    this.conversationContextBuilder = new ConversationContextBuilderService(aiConversationService);
    this.unifiedResponseProcessor = new UnifiedResponseProcessorService(messageRepository, errorTrackingFacade);
    
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

  /**
   * Process user message through workflow
   * 
   * AI INSTRUCTIONS:
   * - Simple delegation to workflow context
   * - No business logic in application service
   * - Return structured context for next steps
   */
  async processUserMessage(
    workflowContext: WorkflowContext,
    request: ProcessMessageRequest
  ): Promise<MessageProcessingContext> {
    const { session, config, userMessage } = workflowContext;

    return {
      session,
      config,
      userMessage
    };
  }

  /**
   * Generate AI response using unified processing
   * 
   * AI INSTRUCTIONS:
   * - Orchestrate unified AI processing workflow
   * - Delegate to specialized services for each concern
   * - Handle errors gracefully without exposing internals
   * - Follow @golden-rule single responsibility principle
   */
  async generateAIResponse(analysisResult: AnalysisResult, sharedLogFile: string): Promise<ResponseResult> {
    const { session, userMessage, contextResult, config, enhancedContext } = analysisResult;
    
    // Validate unified processing service availability
    if (!this.intentClassificationService || !('processChatbotInteractionComplete' in this.intentClassificationService)) {
      throw new Error('Unified processing service not available - chatbot cannot process messages without unified intent classification service');
    }

    // Check if userMessage is already in contextResult.messages to avoid duplication
    const isUserMessageInContext = contextResult.messages.some((msg: ChatMessage) => msg.id === userMessage.id);
    const allMessages = isUserMessageInContext 
      ? contextResult.messages 
      : [...contextResult.messages, userMessage];

    // Use the required shared log file for all logging
    const logFileName = sharedLogFile;

    // Build conversation context with compression and entity injection
    const conversationContext = await this.conversationContextBuilder.buildConversationContext(
      config,
      session,
      contextResult.messages,
      userMessage,
      contextResult.summary,
      enhancedContext,
      logFileName
    );

    // Add shared log file to context for downstream services
    (conversationContext as any).sharedLogFile = logFileName;

    // Process unified AI interaction
    const unifiedResult = await (this.intentClassificationService as any).processChatbotInteractionComplete(
      userMessage.content,
      conversationContext
    );

    // Process unified response and create bot message
    const botMessage = await this.unifiedResponseProcessor.createBotMessageFromUnifiedResult(
      session,
      unifiedResult,
      logFileName,
      config
    );

    // Update session context with unified results
    const updatedSession = this.sessionContextUpdater.updateSessionWithUnifiedResults(
      session,
      botMessage,
      allMessages,
      unifiedResult,
      logFileName
    );

    return {
      session: updatedSession,
      userMessage,
      botMessage,
      allMessages,
      config,
      enhancedContext: {
        ...enhancedContext,
        unifiedAnalysis: unifiedResult?.analysis || { primaryIntent: 'unknown', primaryConfidence: 0 },
        conversationFlow: null, // Will be set after session update
        callToAction: unifiedResult?.response?.callToAction || { type: 'none', priority: 'low' }
      }
    };
  }

  /**
   * Retrieve knowledge for query context
   * 
   * AI INSTRUCTIONS:
   * - Simple delegation to knowledge retrieval service
   * - Handle missing service gracefully
   * - Return null if service unavailable
   */
  async retrieveKnowledge(query: string, context?: any): Promise<any> {
    if (!this.knowledgeRetrievalService) {
      return null;
    }

    const searchContext = {
      userQuery: query,
      intentResult: context?.intentResult,
      conversationHistory: context?.conversationHistory,
      userPreferences: context?.userPreferences,
      maxResults: context?.maxResults || 5,
      minRelevanceScore: context?.minRelevanceScore || 0.5
    };

    const result = await this.knowledgeRetrievalService.searchKnowledge(searchContext);
    return result.items;
  }
} 