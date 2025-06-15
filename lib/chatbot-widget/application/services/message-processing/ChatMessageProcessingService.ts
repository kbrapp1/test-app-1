/**
 * Chat Message Processing Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle AI response generation and message processing
 * - Coordinate AI services and message creation
 * - Keep under 200-250 lines
 * - Focus on message processing operations only
 * - Follow @golden-rule patterns exactly
 */

import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { IAIConversationService, ConversationContext } from '../../../domain/services/interfaces/IAIConversationService';
import { IIntentClassificationService } from '../../../domain/services/interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { ConversationContextOrchestrator } from '../../../domain/services/conversation/ConversationContextOrchestrator';
import { SystemPromptBuilderService } from '../conversation-management/SystemPromptBuilderService';
import { MessageProcessingService } from '../conversation-management/MessageProcessingService';
import { WorkflowContext } from './MessageProcessingWorkflowService';
import { AnalysisResult } from './ConversationAnalysisService';
import { ProcessMessageRequest } from '../conversation-management/MessageProcessingService';

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
  private readonly systemPromptBuilderService: SystemPromptBuilderService;
  private readonly messageProcessingService: MessageProcessingService;

  constructor(
    private readonly aiConversationService: IAIConversationService,
    private readonly messageRepository: IChatMessageRepository,
    private readonly conversationContextOrchestrator: ConversationContextOrchestrator,
    private readonly intentClassificationService?: IIntentClassificationService,
    private readonly knowledgeRetrievalService?: IKnowledgeRetrievalService
  ) {
    this.systemPromptBuilderService = new SystemPromptBuilderService(aiConversationService);
    this.messageProcessingService = new MessageProcessingService(
      // Note: This will need to be injected properly in the composition root
      {} as any // Temporary placeholder
    );
  }

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

  async generateAIResponse(analysisResult: AnalysisResult): Promise<ResponseResult> {
    const { session, config, userMessage, contextResult, enhancedContext } = analysisResult;

    // Build conversation context with enhanced system prompt
    const conversationContext = this.buildConversationContext(
      config,
      session,
      contextResult.messages,
      userMessage,
      contextResult.summary,
      enhancedContext
    );

    // Generate AI response
    const aiResponse = await this.aiConversationService.generateResponse(
      userMessage.content,
      conversationContext
    );

    // Create and save bot response message
    const botMessage = await this.createBotMessage(session, aiResponse);

    // Update session with conversation context
    // contextResult.messages already contains all messages including the current userMessage
    // We only need to add the bot response
    const allMessages = [...contextResult.messages, botMessage];
    const updatedSession = this.updateSessionContext(session, botMessage, allMessages, enhancedContext);

    return {
      session: updatedSession,
      userMessage,
      botMessage,
      allMessages,
      config,
      enhancedContext
    };
  }

  private buildConversationContext(
    config: any,
    session: any,
    messages: ChatMessage[],
    userMessage: ChatMessage,
    summary: string | undefined,
    enhancedContext: any
  ): ConversationContext {
    const systemPrompt = this.systemPromptBuilderService.buildEnhancedSystemPrompt(
      config,
      session,
      messages,
      enhancedContext
    );

    return {
      chatbotConfig: config,
      session,
      messageHistory: [...messages, userMessage],
      systemPrompt,
      conversationSummary: summary
    };
  }

  private async createBotMessage(session: any, aiResponse: any): Promise<ChatMessage> {
    // Create bot message with enhanced metadata
    let botMessage = ChatMessage.createBotMessage(
      session.id,
      aiResponse.content,
      {
        model: aiResponse.metadata?.model || 'unknown',
        promptTokens: aiResponse.metadata?.promptTokens || 0,
        completionTokens: aiResponse.metadata?.completionTokens || 0,
        confidence: aiResponse.confidence || 0,
        intentDetected: aiResponse.intentDetected || false,
        processingTime: aiResponse.processingTimeMs || 0
      }
    );

    // Add cost tracking if available
    if (aiResponse.metadata?.cost) {
      botMessage = botMessage.addCostTracking(
        aiResponse.metadata.cost.totalCents,
        aiResponse.metadata.cost
      );
    }

    // Add sentiment if provided
    if (aiResponse.sentiment) {
      botMessage = botMessage.updateSentiment(aiResponse.sentiment);
    }

    // Save bot message to database
    return await this.messageRepository.save(botMessage);
  }

  private updateSessionContext(
    session: any,
    botMessage: ChatMessage,
    allMessages: ChatMessage[],
    enhancedContext: any
  ): any {
    // Use ConversationContextOrchestrator to update session with conversation summary
    return this.conversationContextOrchestrator.updateSessionContext(
      session,
      botMessage,
      allMessages
    );
  }

  async classifyIntent(message: string, context: any): Promise<any> {
    if (!this.intentClassificationService) {
      return null;
    }

    return await this.intentClassificationService.classifyIntent(message, context);
  }

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