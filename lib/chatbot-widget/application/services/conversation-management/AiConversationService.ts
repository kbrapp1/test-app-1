/**
 * AI Conversation Application Service
 * 
 * Coordinates AI-powered conversation capabilities following DDD principles.
 * Application services orchestrate domain objects without containing business logic.
 * Following @golden-rule.mdc: Single responsibility, coordination only, under 250 lines.
 */

import { IAIConversationService, ConversationContext, AIResponse, LeadCaptureRequest } from '../../../domain/services/interfaces/IAIConversationService';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { DynamicPromptService } from '../../../domain/services/ai-configuration/DynamicPromptService';
import { LeadExtractionService } from '../../../domain/services/lead-management/LeadExtractionService';
import { ConversationSentimentService } from '../../../domain/services/conversation/ConversationSentimentService';
import { OpenAIProvider } from '../../../infrastructure/providers/openai/OpenAIProvider';
import { AIResponseGenerationService } from './AIResponseGenerationService';
import OpenAI from 'openai';
import { IIntentClassificationService, IntentClassificationContext } from '../../../domain/services/interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { LeadScoringService } from '../../../domain/services/lead-management/LeadScoringService';

export class AiConversationService implements IAIConversationService {
  private readonly responseGenerationService: AIResponseGenerationService;

  constructor(
    private readonly openAIProvider: OpenAIProvider,
    private readonly dynamicPromptService: DynamicPromptService,
    private readonly intentClassificationService: IIntentClassificationService,
    private readonly knowledgeRetrievalService: IKnowledgeRetrievalService,
    private readonly leadScoringService: LeadScoringService,
    private readonly sentimentService: ConversationSentimentService,
    private readonly leadExtractionService: LeadExtractionService
  ) {
    this.responseGenerationService = new AIResponseGenerationService(openAIProvider);
  }

  /**
   * Generate AI response - coordinates domain services and infrastructure
   */
  async generateResponse(userMessage: string, context: ConversationContext): Promise<AIResponse> {
    try {
      // 1. Validate context using domain rules
      const isValidContext = await this.validateContext(context);
      if (!isValidContext) {
        // Use OpenAI to generate appropriate response for invalid context
        return await this.responseGenerationService.generateContextErrorResponse(userMessage, context);
      }

      // 2. Build system prompt using domain service
      const systemPrompt = this.dynamicPromptService.generateSystemPrompt(
        context.chatbotConfig,
        context.session
      );

      // 3. Prepare conversation messages
      const messages = this.buildConversationMessages(systemPrompt, context.messageHistory, userMessage);

      // 4. Configure provider for this request
      await this.responseGenerationService.configureProviderForRequest(context.chatbotConfig.aiConfiguration);

      // 5. Create lead capture function definition
      const leadCaptureFunction = this.responseGenerationService.createLeadCaptureFunction();

      // 6. Call AI provider
      const response = await this.openAIProvider.createChatCompletion(
        messages,
        [leadCaptureFunction],
        'auto',
        context.session.id,
        'first'
      );

      // 7. Process and return response
      return this.responseGenerationService.processAIResponse(response, context.chatbotConfig.aiConfiguration);

    } catch (error) {
      // Use OpenAI to generate appropriate error response instead of static fallback
      return await this.responseGenerationService.generateAPIErrorResponse(userMessage, context, error);
    }
  }

  /**
   * Build system prompt - delegates to domain service
   */
  buildSystemPrompt(
    chatbotConfig: ChatbotConfig,
    session: ChatSession,
    messageHistory: ChatMessage[]
  ): string {
    return this.dynamicPromptService.generateSystemPrompt(chatbotConfig, session);
  }

  /**
   * Analyze sentiment - delegates to domain service
   */
  async analyzeSentiment(userMessage: string): Promise<'positive' | 'neutral' | 'negative'> {
    const result = this.sentimentService.analyzeSentiment(userMessage);
    return result.sentiment;
  }

  /**
   * Extract lead information - delegates to domain service
   */
  async extractLeadInformation(
    messageHistory: ChatMessage[],
    context: ConversationContext
  ): Promise<Partial<LeadCaptureRequest>> {
    const extractedInfo = this.leadExtractionService.extractLeadInformation(messageHistory);
    
    return {
      sessionId: context.session.id,
      contactInfo: {
        email: extractedInfo.email,
        phone: extractedInfo.phone,
        name: extractedInfo.name,
        company: extractedInfo.company
      },
      qualificationData: {
        interests: extractedInfo.interests,
        confidence: extractedInfo.confidence
      }
    };
  }

  /**
   * Validate context - delegates to domain rules
   */
  async validateContext(context: ConversationContext): Promise<boolean> {
    if (!context.chatbotConfig.isActive) return false;
    if (!context.chatbotConfig.isWithinOperatingHours()) return false;
    if (context.session.isExpired()) return false;
    return true;
  }

  /**
   * Build conversation messages for AI provider
   */
  private buildConversationMessages(
    systemPrompt: string,
    messageHistory: ChatMessage[],
    userMessage: string
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    // Filter out current message to avoid duplication
    const filteredHistory = messageHistory.filter(msg => 
      !(msg.isFromUser() && msg.content.trim() === userMessage.trim())
    );
    
    return [
      { role: 'system', content: systemPrompt },
      ...filteredHistory.map(msg => ({
        role: msg.isFromBot() ? 'assistant' as const : 'user' as const,
        content: msg.content
      })),
      { role: 'user', content: userMessage }
    ];
  }
} 