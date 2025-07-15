/**
 * AI INSTRUCTIONS:
 * - Orchestrate AI conversation capabilities within DDD application layer
 * - Coordinate domain services without containing business logic
 * - Handle AI provider responses, lead extraction, and sentiment analysis
 * - Maintain single responsibility and stay under 250 lines
 * - Use unified processing approach for consistency
 */

import { IAIConversationService, ConversationContext, AIResponse, LeadCaptureRequest } from '../../../domain/services/interfaces/IAIConversationService';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { SimplePromptService } from '../../../domain/services/ai-configuration/SimplePromptService';
import { PromptGenerationInput, PromptGenerationOptions } from '../../../domain/services/ai-configuration/types/SimplePromptTypes';
import { LeadExtractionService } from '../../../domain/services/lead-management/LeadExtractionService';
// ConversationSentimentService removed - using OpenAI API for sentiment analysis
import { OpenAIProvider } from '../../../infrastructure/providers/openai/OpenAIProvider';
import OpenAI from 'openai';
import { IIntentClassificationService, IntentClassificationContext as _IntentClassificationContext } from '../../../domain/services/interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';
import { ChatbotWidgetCompositionRoot } from '../../../infrastructure/composition/ChatbotWidgetCompositionRoot';
import { ErrorTrackingFacade } from '../ErrorTrackingFacade';

export class AiConversationService implements IAIConversationService {
  private readonly errorTrackingService: ErrorTrackingFacade;

  constructor(
    private readonly openAIProvider: OpenAIProvider,
    private readonly simplePromptService: SimplePromptService,
    private readonly intentClassificationService: IIntentClassificationService,
    private readonly knowledgeRetrievalService: IKnowledgeRetrievalService,
    private readonly leadExtractionService: LeadExtractionService
  ) {
    this.errorTrackingService = ChatbotWidgetCompositionRoot.getErrorTrackingFacade();
  }

  /**
   * Generate AI response using OpenAI API
   * Uses gpt-4o-mini model for cost efficiency while maintaining quality
   * 
   * AI INSTRUCTIONS:
   * - Handle token limits gracefully with truncation
   * - Use cost-effective model selection
   * - Maintain conversation context efficiently
   * - Follow @golden-rule error handling patterns
   */
  async generateResponse(
    userMessage: string,
    context: ConversationContext
  ): Promise<AIResponse> {
    // 1. Validate context using domain rules
    const isValidContext = await this.validateContext(context);
    if (!isValidContext) {
      throw new Error('Invalid conversation context - cannot generate response');
    }

    // 2. Build system prompt using simple prompt service (high performance)
    const promptInput: PromptGenerationInput = {
      chatbotConfig: context.chatbotConfig,
      session: context.session,
      messageHistory: context.messageHistory
    };
    
    const promptResult = await this.simplePromptService.generateSystemPrompt(
      promptInput,
      PromptGenerationOptions.default()
    );
    const systemPrompt = promptResult.content;

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
      'first'
    );

    // 7. Process and return response
    return this.processAIResponse(response, context.chatbotConfig.aiConfiguration);
  }

  // Build system prompt - delegates to simple prompt service (high performance)
  buildSystemPrompt(
    chatbotConfig: ChatbotConfig,
    session: ChatSession,
    messageHistory: ChatMessage[],
    _logger?: { logRaw: (message: string) => void; logMessage: (message: string) => void }
  ): string {
    const promptInput: PromptGenerationInput = {
      chatbotConfig,
      session,
      messageHistory
    };
    
    const promptResult = this.simplePromptService.generateSystemPromptSync(
      promptInput,
      PromptGenerationOptions.default()
    );
    
    return promptResult.content;
  }



  // Extract lead information - delegates to domain service
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

  // Validate context - delegates to domain rules
  async validateContext(context: ConversationContext): Promise<boolean> {
    if (!context.chatbotConfig.isActive) return false;
    if (!context.chatbotConfig.isWithinOperatingHours()) return false;
    if (context.session.isExpired()) return false;
    return true;
  }

  // Build conversation messages for AI provider
  private buildConversationMessages(
    systemPrompt: string,
    messageHistory: ChatMessage[],
    userMessage: string
  ): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
    // Safety check: Filter out any non-ChatMessage objects and current message to avoid duplication
    const validHistory = messageHistory.filter(msg => msg && typeof msg.isFromUser === 'function');
    const filteredHistory = validHistory.filter(msg => 
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

  // Configure provider for this specific request
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

  // Create lead capture function definition for OpenAI
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

  // Process AI provider response into domain format
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
      sentiment: this.extractSentimentFromResponse(response),
      processingTimeMs: 0,
      metadata: {
        model: response.model || aiConfig?.openaiModel || 'gpt-4o-mini',
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0,
        totalTokens: usage?.total_tokens || 0,
      }
    };
  }

  // Extract sentiment from OpenAI response (when function calling includes sentiment)
  private extractSentimentFromResponse(response: any): 'positive' | 'neutral' | 'negative' | undefined {
    try {
      // Check if response includes function call with sentiment analysis
      const choice = response.choices[0];
      if (choice?.message?.function_call?.arguments) {
        const functionArgs = JSON.parse(choice.message.function_call.arguments);
        if (functionArgs.analysis?.sentiment) {
          return functionArgs.analysis.sentiment;
        }
        if (functionArgs.sentiment) {
          return functionArgs.sentiment;
        }
      }
      return undefined;
    } catch (_error) {
      void _error;
      return undefined;
    }
  }
} 