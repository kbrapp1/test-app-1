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
    // Initialize specialized services with composition pattern
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

  /** Process user message through workflow */
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

  /** Generate AI response using unified processing */
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

    // AI INSTRUCTIONS: Extract sentiment, urgency, engagement from unified response
    // This replaces the 3 separate API calls that were causing 2.8s delay
    // while preserving exact same data format for downstream processes
    let updatedUserMessage = userMessage;
    try {
      // Extract analysis data directly without requiring MessageProcessingWorkflowService
      const sentiment = this.extractSentimentFromUnified(unifiedResult);
      const urgency = this.extractUrgencyFromUnified(unifiedResult);
      const engagement = this.extractEngagementFromUnified(unifiedResult);
      
      // Update user message with extracted data (same as before)
      const messageWithSentiment = userMessage.updateSentiment(sentiment);
      const messageWithUrgency = messageWithSentiment.updateUrgency(urgency);
      const messageWithEngagement = messageWithUrgency.updateEngagement(engagement);
      
      // Save updated message with analysis data
      updatedUserMessage = await this.messageRepository.save(messageWithEngagement, logFileName);
      
      // Fallback to original message if save failed
      if (!updatedUserMessage) {
        updatedUserMessage = userMessage;
      }
    } catch (error) {
      // If extraction fails, continue with original message
      console.error('Failed to extract analysis from unified response:', error);
      updatedUserMessage = userMessage; // Ensure we have a valid message object
    }

    // Process unified response and create bot message
    const botMessage = await this.unifiedResponseProcessor.createBotMessageFromUnifiedResult(
      session,
      unifiedResult,
      logFileName,
      config
    );

    // Update allMessages array with the updated user message
    const finalAllMessages = allMessages.map((msg: ChatMessage) => 
      updatedUserMessage && msg.id === updatedUserMessage.id ? updatedUserMessage : msg
    );

    // Update session context with unified results
    const updatedSession = this.sessionContextUpdater.updateSessionWithUnifiedResults(
      session,
      botMessage,
      finalAllMessages,
      unifiedResult,
      logFileName
    );

    return {
      session: updatedSession,
      userMessage: updatedUserMessage, // Return updated user message with analysis
      botMessage,
      allMessages: finalAllMessages,
      config,
      enhancedContext: {
        ...enhancedContext,
        unifiedAnalysis: unifiedResult?.analysis || { primaryIntent: 'unknown', primaryConfidence: 0 },
        conversationFlow: null, // Will be set after session update
        callToAction: unifiedResult?.response?.callToAction || { type: 'none', priority: 'low' }
      }
    };
  }

  /** Retrieve knowledge for query context */
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

  /** Extract sentiment from unified API response */
  private extractSentimentFromUnified(unifiedResult: any): 'positive' | 'neutral' | 'negative' {
    // Try multiple paths in unified response
    const sentiment = unifiedResult?.analysis?.sentiment ||
                     unifiedResult?.response?.sentiment ||
                     'neutral'; // Default fallback
    
    // Validate and normalize sentiment value
    if (sentiment === 'positive' || sentiment === 'negative' || sentiment === 'neutral') {
      return sentiment;
    }
    
    return 'neutral'; // Safe fallback
  }

  /** Extract urgency from unified API response */
  private extractUrgencyFromUnified(unifiedResult: any): 'low' | 'medium' | 'high' {
    // Try multiple paths in unified response
    const urgency = unifiedResult?.analysis?.entities?.urgency ||
                   unifiedResult?.conversationFlow?.urgency ||
                   'low'; // Default fallback
    
    // Validate and normalize urgency value
    if (urgency === 'high' || urgency === 'medium' || urgency === 'low') {
      return urgency;
    }
    
    return 'low'; // Safe fallback
  }

  /** Extract engagement from unified API response */
  private extractEngagementFromUnified(unifiedResult: any): 'low' | 'medium' | 'high' {
    // Try multiple paths in unified response
    const engagement = unifiedResult?.conversationFlow?.engagementLevel ||
                      unifiedResult?.analysis?.engagementLevel ||
                      'low'; // Default fallback
    
    // Validate and normalize engagement value
    if (engagement === 'high' || engagement === 'medium' || engagement === 'low') {
      return engagement;
    }
    
    return 'low'; // Safe fallback
  }
} 