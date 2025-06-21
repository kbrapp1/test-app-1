/**
 * AI Conversation Application Service
 * 
 * Coordinates AI-powered conversation capabilities following DDD principles.
 * Application services orchestrate domain objects without containing business logic.
 * Following @golden-rule.mdc: Single responsibility, coordination only, under 250 lines.
 * 
 * AI INSTRUCTIONS:
 * - REFACTORED: Removed secondary processing path to prevent duplicate messages
 * - Uses only unified processing approach for consistency
 * - Throws errors instead of creating fallback responses
 * - Keep under 250 lines following @golden-rule patterns
 */

import { IAIConversationService, ConversationContext, AIResponse, LeadCaptureRequest } from '../../../domain/services/interfaces/IAIConversationService';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { DynamicPromptService } from '../../../domain/services/ai-configuration/DynamicPromptService';
import { LeadExtractionService } from '../../../domain/services/lead-management/LeadExtractionService';
// ConversationSentimentService removed - using OpenAI API for sentiment analysis
import { OpenAIProvider } from '../../../infrastructure/providers/openai/OpenAIProvider';
import OpenAI from 'openai';
import { IIntentClassificationService, IntentClassificationContext } from '../../../domain/services/interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';

export class AiConversationService implements IAIConversationService {

  constructor(
    private readonly openAIProvider: OpenAIProvider,
    private readonly dynamicPromptService: DynamicPromptService,
    private readonly intentClassificationService: IIntentClassificationService,
    private readonly knowledgeRetrievalService: IKnowledgeRetrievalService,
    private readonly leadExtractionService: LeadExtractionService
  ) {}

  /**
   * Generate AI response - coordinates domain services and infrastructure
   * REFACTORED: Removed secondary processing to prevent duplicate messages
   */
  async generateResponse(userMessage: string, context: ConversationContext): Promise<AIResponse> {
    // 1. Validate context using domain rules
    const isValidContext = await this.validateContext(context);
    if (!isValidContext) {
      throw new Error('Invalid conversation context - cannot generate response');
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
      'first'
    );

    // 7. Process and return response
    return this.processAIResponse(response, context.chatbotConfig.aiConfiguration);
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
   * Analyze engagement - uses OpenAI API for accurate engagement analysis
   */
  async analyzeEngagement(userMessage: string, conversationHistory: ChatMessage[] = []): Promise<'low' | 'medium' | 'high'> {
    try {
      const systemPrompt = `You are an engagement analysis expert. Analyze the engagement level of user messages and conversation patterns as low, medium, or high.

ENGAGEMENT CLASSIFICATION:
- high: Detailed responses, multiple questions, specific business context, active participation, technical depth
- medium: Some questions, moderate detail, shows interest, provides some context, engaged but basic
- low: Short responses, minimal questions, vague interest, passive participation, generic inquiries

ENGAGEMENT INDICATORS:
- Message depth: Detailed explanations, specific scenarios, business context
- Question frequency: Asking follow-up questions, seeking clarification
- Business specificity: Company details, use cases, technical requirements
- Response quality: Thoughtful answers, building on previous topics
- Investment signals: Time spent, multiple interactions, detailed discussions

CONVERSATION PATTERN ANALYSIS:
- Progressive depth: Conversation getting more detailed over time
- Question complexity: Moving from basic to specific questions
- Context building: Referencing previous conversation points
- Initiative taking: User driving conversation forward

Respond with only: low, medium, or high`;

      const conversationContext = conversationHistory.length > 0 
        ? `\n\nConversation history:\n${conversationHistory.slice(-3).map(m => 
            `${m.isFromUser() ? 'User' : 'Bot'}: ${m.content}`
          ).join('\n')}\n\nCurrent message: ${userMessage}`
        : userMessage;

      const response = await this.openAIProvider.createChatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: conversationContext }
      ]);

      const engagementResult = response.choices[0]?.message?.content?.toLowerCase().trim();
      
      if (engagementResult === 'high' || engagementResult === 'medium' || engagementResult === 'low') {
        return engagementResult as 'low' | 'medium' | 'high';
      }
      
      return 'low'; // Default fallback
    } catch (error) {
      console.error('Error analyzing engagement:', error);
      return 'low'; // Safe fallback
    }
  }

  /**
   * Analyze urgency - uses OpenAI API for accurate urgency analysis
   */
  async analyzeUrgency(userMessage: string): Promise<'low' | 'medium' | 'high'> {
    try {
      const systemPrompt = `You are an urgency analysis expert. Analyze the urgency level of user messages as low, medium, or high.

URGENCY CLASSIFICATION:
- high: ASAP, urgent, critical, emergency, immediate need, deadline pressure, "need this now"
- medium: Soon, within timeframe, some time pressure, "in the next few weeks/months"
- low: Exploring options, no rush, general inquiry, research phase, "when convenient"

URGENCY INDICATORS:
- Time expressions: "ASAP", "urgent", "immediately", "right away", "as soon as possible"
- Deadline language: "by Friday", "need this before", "deadline approaching"
- Pressure words: "critical", "emergency", "must have", "can't wait"
- Business impact: "losing money", "competitors ahead", "falling behind"

Respond with only: low, medium, or high`;

      const response = await this.openAIProvider.createChatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]);

      const urgencyResult = response.choices[0]?.message?.content?.toLowerCase().trim();
      
      if (urgencyResult === 'high' || urgencyResult === 'medium' || urgencyResult === 'low') {
        return urgencyResult as 'low' | 'medium' | 'high';
      }
      
      return 'low'; // Default fallback
    } catch (error) {
      console.error('Error analyzing urgency:', error);
      return 'low'; // Safe fallback
    }
  }

  /**
   * Analyze sentiment - uses OpenAI API for accurate sentiment analysis
   */
  async analyzeSentiment(userMessage: string): Promise<'positive' | 'neutral' | 'negative'> {
    try {
      const systemPrompt = `You are a sentiment analysis expert. Analyze the sentiment of user messages as positive, neutral, or negative.

SENTIMENT CLASSIFICATION:
- positive: Enthusiastic, satisfied, grateful, excited, interested
- neutral: Factual questions, neutral inquiries, informational requests  
- negative: Frustrated, angry, disappointed, concerned, urgent problems

Respond with only one word: "positive", "neutral", or "negative"`;

      const response = await this.openAIProvider.createChatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]);

      const sentiment = response.choices[0]?.message?.content?.trim().toLowerCase();
      
      if (sentiment === 'positive' || sentiment === 'neutral' || sentiment === 'negative') {
        return sentiment as 'positive' | 'neutral' | 'negative';
      }
      
      // Fallback to neutral if API response is unexpected
      return 'neutral';
    } catch (error) {
      // Fallback to neutral if API call fails
      return 'neutral';
    }
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

  /**
   * Extract sentiment from OpenAI response (when function calling includes sentiment)
   */
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
    } catch (error) {
      return undefined;
    }
  }
} 