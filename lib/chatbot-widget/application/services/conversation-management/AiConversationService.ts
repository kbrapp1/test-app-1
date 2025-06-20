/**
 * AI Conversation Application Service
 * 
 * Coordinates AI-powered conversation capabilities following DDD principles.
 * Application services orchestrate domain objects without containing business logic.
 * Following @golden-rule.mdc: Single responsibility, coordination only, under 250 lines.
 * 
 * AI INSTRUCTIONS:
 * - UPDATED: Removed LeadScoringService dependency - using API-only approach
 * - Lead scoring now handled by OpenAI API in unified processing
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
import { AIResponseGenerationService } from './AIResponseGenerationService';
import OpenAI from 'openai';
import { IIntentClassificationService, IntentClassificationContext } from '../../../domain/services/interfaces/IIntentClassificationService';
import { IKnowledgeRetrievalService } from '../../../domain/services/interfaces/IKnowledgeRetrievalService';

export class AiConversationService implements IAIConversationService {
  private readonly responseGenerationService: AIResponseGenerationService;

  constructor(
    private readonly openAIProvider: OpenAIProvider,
    private readonly dynamicPromptService: DynamicPromptService,
    private readonly intentClassificationService: IIntentClassificationService,
    private readonly knowledgeRetrievalService: IKnowledgeRetrievalService,
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
} 