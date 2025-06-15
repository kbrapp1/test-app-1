/**
 * AI Conversation Application Service
 * 
 * Coordinates AI-powered conversation capabilities following DDD principles.
 * Application services orchestrate domain objects without containing business logic.
 * Following @golden-rule.mdc: Single responsibility, coordination only, under 250 lines.
 */

import { ConversationContext, AIResponse, LeadCaptureRequest, IAIConversationService } from '../../domain/services/interfaces/IAIConversationService';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { DynamicPromptService } from '../../domain/services/ai-configuration/DynamicPromptService';
import { ConversationIntentService, IntentDetectionResult } from '../../domain/services/conversation/ConversationIntentService';
import { ConversationSentimentService, SentimentAnalysisResult } from '../../domain/services/conversation/ConversationSentimentService';
import { LeadExtractionService, ExtractedLeadInfo } from '../../domain/services/lead-management/LeadExtractionService';
import { ConversationFallbackService, FallbackResponse } from '../../domain/services/conversation/ConversationFallbackService';
import { OpenAIProvider } from '../../infrastructure/providers/openai/OpenAIProvider';
import OpenAI from 'openai';

export class AiConversationService implements IAIConversationService {
  constructor(
    private readonly openAIProvider: OpenAIProvider,
    private readonly dynamicPromptService: DynamicPromptService,
    private readonly intentService: ConversationIntentService,
    private readonly sentimentService: ConversationSentimentService,
    private readonly leadExtractionService: LeadExtractionService,
    private readonly fallbackService: ConversationFallbackService
  ) {}

  /**
   * Generate AI response - coordinates domain services and infrastructure
   */
  async generateResponse(userMessage: string, context: ConversationContext): Promise<AIResponse> {
    try {
      // 1. Validate context using domain rules
      const isValidContext = await this.validateContext(context);
      if (!isValidContext) {
        return this.createFallbackResponse(context.chatbotConfig, userMessage);
      }

      // 2. Build system prompt using domain service
      const systemPrompt = this.dynamicPromptService.generateSystemPrompt(
        context.chatbotConfig,
        context.session
      );

      // 3. Prepare conversation messages
      const messages = this.buildConversationMessages(systemPrompt, context.messageHistory, userMessage);

      // 4. Configure provider for this request
      await this.configureProviderForRequest(context.chatbotConfig.aiConfiguration);

      // 5. Create lead capture function definition
      const leadCaptureFunction = this.createLeadCaptureFunction();

      // 6. Call AI provider
      const response = await this.openAIProvider.createChatCompletion(
        messages,
        [leadCaptureFunction],
        'auto',
        context.session.id,
        'second'
      );

      // 7. Process and return response
      return this.processAIResponse(response, context.chatbotConfig.aiConfiguration);

    } catch (error) {
      return this.createFallbackResponse(context.chatbotConfig, userMessage);
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
   * Detect intent - delegates to domain service
   */
  async detectIntent(userMessage: string, context: ConversationContext): Promise<string> {
    const result = this.intentService.detectIntent(userMessage);
    return result.intent;
  }

  /**
   * Analyze sentiment - delegates to domain service
   */
  async analyzeSentiment(userMessage: string): Promise<'positive' | 'neutral' | 'negative'> {
    const result = this.sentimentService.analyzeSentiment(userMessage);
    return result.sentiment;
  }

  /**
   * Check if should trigger lead capture - delegates to domain service
   */
  async shouldTriggerLeadCapture(userMessage: string, context: ConversationContext): Promise<boolean> {
    return this.intentService.shouldTriggerLeadCapture(userMessage);
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

  /**
   * Create lead capture function definition for OpenAI
   */
  private createLeadCaptureFunction(): OpenAI.Chat.Completions.ChatCompletionCreateParams.Function {
    return {
      name: 'capture_lead',
      description: 'Capture lead information when visitor shows genuine interest in our services',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Full name of the potential lead' },
          email: { type: 'string', description: 'Email address of the potential lead' },
          company: { type: 'string', description: 'Company name of the potential lead' },
          phone: { type: 'string', description: 'Phone number of the potential lead (optional)' },
          interests: {
            type: 'array',
            items: { type: 'string' },
            description: 'Specific services or products they are interested in'
          },
          qualification_answers: {
            type: 'object',
            description: 'Answers to any qualification questions that were asked'
          }
        },
        required: ['name', 'email']
      }
    };
  }

  /**
   * Process AI provider response into domain format
   */
  private processAIResponse(response: any, aiConfig: any): AIResponse {
    const choice = response.choices[0];
    const usage = response.usage;
    
    // Handle function calls (lead capture)
    if (choice.message.function_call && choice.message.function_call.name === 'capture_lead') {
      const leadData = JSON.parse(choice.message.function_call.arguments);
      
      return {
        content: choice.message.content || 'Thank you for your interest! I\'ll make sure someone follows up with you soon.',
        confidence: 0.9,
        processingTimeMs: 0,
        metadata: {
          model: response.model || aiConfig?.openaiModel || 'gpt-4o-mini',
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
        },
        functionCall: {
          name: 'capture_lead',
          arguments: leadData
        }
      };
    }

    // Return regular response
    return {
      content: choice.message.content || 'I apologize, but I\'m having trouble generating a response right now.',
      confidence: 0.8,
      processingTimeMs: 0,
      metadata: {
        model: response.model || aiConfig?.openaiModel || 'gpt-4o-mini',
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
      }
    };
  }

  /**
   * Create fallback response using domain service
   */
  private createFallbackResponse(chatbotConfig: ChatbotConfig, userMessage?: string): AIResponse {
    const fallbackResponse = this.fallbackService.generateFallbackResponse(
      chatbotConfig,
      userMessage
    );

    return {
      content: fallbackResponse.content,
      confidence: 0.1,
      processingTimeMs: 0,
      metadata: {
        model: 'fallback',
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      }
    };
  }

  /**
   * Configure provider for this specific request
   */
  private async configureProviderForRequest(aiConfig: any): Promise<void> {
    if (this.openAIProvider && aiConfig) {
      (this.openAIProvider as any).config = {
        ...(this.openAIProvider as any).config,
        model: aiConfig.openaiModel || 'gpt-4o-mini',
        temperature: aiConfig.temperature || 0.7,
        maxTokens: aiConfig.maxTokens || 1000
      };
    }
  }
} 