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

import { WorkflowContext } from './MessageProcessingWorkflowService';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { IntentResult } from '../../../domain/value-objects/message-processing/IntentResult';
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
    _request: ProcessMessageRequest
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

    // AI: Convert plain message objects to ChatMessage entities using repository
    // This follows @golden-rule.mdc by maintaining proper domain boundaries
    const contextMessages = await this.convertPlainMessagesToEntities(contextResult.messages as Record<string, unknown>[], sharedLogFile);
    
    // Check if userMessage is already in context messages to avoid duplication
    const isUserMessageInContext = contextMessages.some((msg: ChatMessage) => msg.id === userMessage.id);
    const allMessages = isUserMessageInContext 
      ? contextMessages 
      : [...contextMessages, userMessage];

    // Use the required shared log file for all logging
    const logFileName = sharedLogFile;

    // Build conversation context with compression and entity injection
    const processingConfig: ProcessingConfig = {
      organizationId: config.organizationId,
      name: config.name
    };
    const processingSession: ProcessingSession = {
      id: (session as Record<string, unknown>).id as string,
      conversationId: (session as Record<string, unknown>).conversationId as string,
      contextData: (session as Record<string, unknown>).contextData as Record<string, unknown>
    };
    const conversationContext = await this.conversationContextBuilder.buildConversationContext(
      processingConfig,
      processingSession,
      contextMessages, // Use converted entities
      userMessage,
      contextResult.summary as string | undefined,
      enhancedContext,
      logFileName
    );

    // Add shared log file to context for downstream services
    (conversationContext as unknown as Record<string, unknown>).sharedLogFile = logFileName;

    // Process unified AI interaction
    const unifiedResult = await (this.intentClassificationService as IIntentClassificationService & { processChatbotInteractionComplete: (content: string, context: unknown) => Promise<unknown> }).processChatbotInteractionComplete(
      userMessage.content,
      conversationContext
    );

    // AI INSTRUCTIONS: Extract sentiment, urgency, engagement from unified response
    // This replaces the 3 separate API calls that were causing 2.8s delay
    // while preserving exact same data format for downstream processes
    let updatedUserMessage = userMessage;
    try {
      // Extract analysis data directly without requiring MessageProcessingWorkflowService
      const sentiment = this.extractSentimentFromUnified(unifiedResult as Record<string, unknown>);
      const urgency = this.extractUrgencyFromUnified(unifiedResult as Record<string, unknown>);
      const engagement = this.extractEngagementFromUnified(unifiedResult as Record<string, unknown>);
      
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
      session as unknown as ChatSession,
      unifiedResult as Record<string, unknown>,
      logFileName,
      config
    );

    // Update allMessages array with the updated user message
    const finalAllMessages = allMessages.map((msg: ChatMessage) => 
      updatedUserMessage && msg.id === updatedUserMessage.id ? updatedUserMessage : msg
    );

    // Update session context with unified results
    const updatedSession = this.sessionContextUpdater.updateSessionWithUnifiedResults(
      session as unknown as ChatSession,
      botMessage,
      finalAllMessages,
      unifiedResult as Record<string, unknown>,
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
        unifiedAnalysis: (unifiedResult as Record<string, unknown>)?.analysis as Record<string, unknown> || { primaryIntent: 'unknown', primaryConfidence: 0 },
        conversationFlow: null, // Will be set after session update
        callToAction: ((unifiedResult as Record<string, unknown>)?.response as Record<string, unknown>)?.callToAction as Record<string, unknown> || { type: 'none', priority: 'low' }
      }
    };
  }

  /** Retrieve knowledge for query context */
  async retrieveKnowledge(query: string, context?: Record<string, unknown>): Promise<unknown> {
    if (!this.knowledgeRetrievalService) {
      return null;
    }

    const searchContext = {
      userQuery: query,
      intentResult: context?.intentResult as IntentResult,
      conversationHistory: context?.conversationHistory as string[],
      userPreferences: context?.userPreferences as Record<string, unknown>,
      maxResults: (context?.maxResults as number) || 5,
      minRelevanceScore: (context?.minRelevanceScore as number) || 0.5
    };

    const result = await this.knowledgeRetrievalService.searchKnowledge(searchContext);
    return result.items;
  }

  /** Extract sentiment from unified API response */
  private extractSentimentFromUnified(unifiedResult: Record<string, unknown>): 'positive' | 'neutral' | 'negative' {
    // Try multiple paths in unified response
    const analysis = unifiedResult?.analysis as Record<string, unknown>;
    const response = unifiedResult?.response as Record<string, unknown>;
    const sentiment = analysis?.sentiment ||
                     response?.sentiment ||
                     'neutral'; // Default fallback
    
    // Validate and normalize sentiment value
    if (sentiment === 'positive' || sentiment === 'negative' || sentiment === 'neutral') {
      return sentiment;
    }
    
    return 'neutral'; // Safe fallback
  }

  /** Extract urgency from unified API response */
  private extractUrgencyFromUnified(unifiedResult: Record<string, unknown>): 'low' | 'medium' | 'high' {
    // Try multiple paths in unified response
    const analysis = unifiedResult?.analysis as Record<string, unknown>;
    const entities = analysis?.entities as Record<string, unknown>;
    const conversationFlow = unifiedResult?.conversationFlow as Record<string, unknown>;
    const urgency = entities?.urgency ||
                   conversationFlow?.urgency ||
                   'low'; // Default fallback
    
    // Validate and normalize urgency value
    if (urgency === 'high' || urgency === 'medium' || urgency === 'low') {
      return urgency;
    }
    
    return 'low'; // Safe fallback
  }

  /** Extract engagement from unified API response */
  private extractEngagementFromUnified(unifiedResult: Record<string, unknown>): 'low' | 'medium' | 'high' {
    // Try multiple paths in unified response
    const conversationFlow = unifiedResult?.conversationFlow as Record<string, unknown>;
    const analysis = unifiedResult?.analysis as Record<string, unknown>;
    const engagement = conversationFlow?.engagementLevel ||
                      analysis?.engagementLevel ||
                      'low'; // Default fallback
    
    // Validate and normalize engagement value
    if (engagement === 'high' || engagement === 'medium' || engagement === 'low') {
      return engagement;
    }
    
    return 'low'; // Safe fallback
  }

  /**
   * Converts an array of plain message objects to ChatMessage entities using the repository.
   * This ensures proper domain boundaries and consistency.
   * 
   * AI INSTRUCTIONS:
   * - Uses repository to fetch existing entities when possible
   * - Follows @golden-rule.mdc domain boundary patterns
   * - Maintains type safety between application and domain layers
   */
  private async convertPlainMessagesToEntities(messages: Record<string, unknown>[], _logFileName: string): Promise<ChatMessage[]> {
    const chatMessages: ChatMessage[] = [];
    
    for (const msg of messages) {
      if (!msg.id) {
        console.warn('Skipping message with missing ID:', msg);
        continue;
      }
      
      try {
        // First try to get the entity from repository (preferred approach)
        const existingMessage = await this.messageRepository.findById(msg.id as string);
        if (existingMessage) {
          chatMessages.push(existingMessage);
          continue;
        }
        
        // If not found in repository, check if it's already a ChatMessage entity
        if (msg.isFromUser && typeof msg.isFromUser === 'function') {
          chatMessages.push(msg as unknown as ChatMessage);
          continue;
        }
        
        // Log warning for missing messages that should exist
        console.warn(`Message ${msg.id} not found in repository and not a valid ChatMessage entity`);
        
      } catch (error) {
        console.error(`Error converting message ${msg.id}:`, error);
      }
    }
    
    return chatMessages;
  }
} 