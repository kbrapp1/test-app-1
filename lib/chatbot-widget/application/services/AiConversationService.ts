/**
 * AI Conversation Application Service
 * 
 * Orchestrates AI-powered conversation capabilities.
 * Following DDD principles: Application services coordinate domain objects
 * without containing business logic, delegating to domain services and use cases.
 */

import { ConversationContext, AIResponse, LeadCaptureRequest, IAIConversationService } from '../../domain/services/IAIConversationService';
import { ChatMessage } from '../../domain/entities/ChatMessage';
import { ChatSession } from '../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../domain/entities/ChatbotConfig';
import { DynamicPromptService } from '../../domain/services/DynamicPromptService';
import { ConversationContextService } from '../../domain/services/ConversationContextService';
import { OpenAIProvider } from '../../infrastructure/providers/openai/OpenAIProvider';
import OpenAI from 'openai';

export class AiConversationService implements IAIConversationService {
  private readonly openAIProvider: OpenAIProvider;
  private readonly dynamicPromptService: DynamicPromptService;
  private readonly conversationContextService: ConversationContextService;

  constructor(
    openAIProvider: OpenAIProvider,
    dynamicPromptService: DynamicPromptService,
    conversationContextService: ConversationContextService
  ) {
    this.openAIProvider = openAIProvider;
    this.dynamicPromptService = dynamicPromptService;
    this.conversationContextService = conversationContextService;
  }

  /**
   * Generate AI response for user message with conversation context
   */
  async generateResponse(userMessage: string, context: ConversationContext): Promise<AIResponse> {
    try {
      // 1. Build dynamic system prompt from knowledge base
      const systemPrompt = this.dynamicPromptService.generateSystemPrompt(
        context.chatbotConfig,
        context.session
      );

      // 2. Get conversation history (using existing method from context service)
      const messageHistory = context.messageHistory;

      // 3. Convert to OpenAI message format
      const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...messageHistory.map(msg => ({
          role: msg.isFromBot() ? 'assistant' as const : 'user' as const,
          content: msg.content
        })),
        { role: 'user', content: userMessage }
      ];

      // 4. Define lead capture function for OpenAI
      const leadCaptureFunction: OpenAI.Chat.Completions.ChatCompletionCreateParams.Function = {
        name: 'capture_lead',
        description: 'Capture lead information when visitor shows genuine interest in our services',
        parameters: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Full name of the potential lead'
            },
            email: {
              type: 'string',
              description: 'Email address of the potential lead'
            },
            company: {
              type: 'string',
              description: 'Company name of the potential lead'
            },
            phone: {
              type: 'string',
              description: 'Phone number of the potential lead (optional)'
            },
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

      // 5. Generate response with function calling capability
      const response = await this.openAIProvider.createChatCompletion(
        messages,
        [leadCaptureFunction],
        'auto'
      );

      const choice = response.choices[0];
      const usage = response.usage;
      
      // 6. Handle function calls (lead capture)
      if (choice.message.function_call && choice.message.function_call.name === 'capture_lead') {
        const leadData = JSON.parse(choice.message.function_call.arguments);
        
        return {
          content: choice.message.content || 'Thank you for your interest! I\'ll make sure someone follows up with you soon.',
          confidence: 0.9,
          processingTimeMs: 0, // Will be calculated by caller
          metadata: {
            model: 'gpt-4',
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

      // 7. Return regular response
      return {
        content: choice.message.content || 'I apologize, but I\'m having trouble generating a response right now.',
        confidence: 0.8,
        processingTimeMs: 0, // Will be calculated by caller
        metadata: {
          model: 'gpt-4',
          promptTokens: usage?.prompt_tokens || 0,
          completionTokens: usage?.completion_tokens || 0,
          totalTokens: usage?.total_tokens || 0,
        }
      };

    } catch (error) {
      // Fallback response for AI failures
      return {
        content: this.getFallbackResponse(context.chatbotConfig),
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
  }

  /**
   * Generate system prompt from chatbot configuration and context
   */
  buildSystemPrompt(
    chatbotConfig: ChatbotConfig,
    session: ChatSession,
    messageHistory: ChatMessage[]
  ): string {
    return this.dynamicPromptService.generateSystemPrompt(chatbotConfig, session);
  }

  /**
   * Detect if user message should trigger lead capture
   */
  async shouldTriggerLeadCapture(
    userMessage: string,
    context: ConversationContext
  ): Promise<boolean> {
    // Simple heuristic for MVP - look for intent indicators
    const leadTriggerWords = [
      'interested', 'want to know more', 'contact', 'call me', 'email me',
      'pricing', 'quote', 'demo', 'trial', 'sign up', 'get started',
      'my email is', 'my phone is', 'my company is'
    ];

    const messageText = userMessage.toLowerCase();
    return leadTriggerWords.some(trigger => messageText.includes(trigger));
  }

  /**
   * Extract lead information from conversation
   */
  async extractLeadInformation(
    messageHistory: ChatMessage[],
    context: ConversationContext
  ): Promise<Partial<LeadCaptureRequest>> {
    // Basic extraction for MVP
    const userMessages = messageHistory.filter(msg => !msg.isFromBot());
    const allText = userMessages.map(msg => msg.content).join(' ').toLowerCase();

    // Simple regex patterns for extraction
    const emailMatch = allText.match(/[\w\.-]+@[\w\.-]+\.\w+/);
    const phoneMatch = allText.match(/(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/);
    
    // Look for name patterns (very basic)
    const namePatterns = [
      /my name is (\w+(?:\s+\w+)*)/i,
      /i'm (\w+(?:\s+\w+)*)/i,
      /this is (\w+(?:\s+\w+)*)/i
    ];
    
    let nameMatch: RegExpMatchArray | null = null;
    for (const pattern of namePatterns) {
      nameMatch = allText.match(pattern);
      if (nameMatch) break;
    }

    return {
      sessionId: context.session.id,
      contactInfo: {
        email: emailMatch ? emailMatch[0] : undefined,
        phone: phoneMatch ? phoneMatch[0] : undefined,
        name: nameMatch ? nameMatch[1] : undefined,
      },
      qualificationData: {}
    };
  }

  /**
   * Determine conversation intent
   */
  async detectIntent(
    userMessage: string,
    context: ConversationContext
  ): Promise<string> {
    const message = userMessage.toLowerCase();
    
    // Basic intent detection patterns
    if (message.includes('price') || message.includes('cost') || message.includes('pricing')) {
      return 'pricing_inquiry';
    }
    if (message.includes('demo') || message.includes('trial') || message.includes('test')) {
      return 'demo_request';
    }
    if (message.includes('contact') || message.includes('call') || message.includes('email')) {
      return 'contact_request';
    }
    if (message.includes('help') || message.includes('support') || message.includes('problem')) {
      return 'support_request';
    }
    if (message.includes('feature') || message.includes('how does') || message.includes('can you')) {
      return 'feature_inquiry';
    }
    
    return 'general_inquiry';
  }

  /**
   * Analyze conversation sentiment
   */
  async analyzeSentiment(userMessage: string): Promise<'positive' | 'neutral' | 'negative'> {
    const message = userMessage.toLowerCase();
    
    const positiveWords = [
      'great', 'good', 'excellent', 'amazing', 'love', 'like', 'perfect',
      'awesome', 'fantastic', 'wonderful', 'yes', 'definitely', 'absolutely',
      'interested', 'excited', 'impressed'
    ];
    
    const negativeWords = [
      'bad', 'terrible', 'hate', 'dislike', 'awful', 'horrible', 'no',
      'never', 'disappointed', 'frustrated', 'angry', 'problem', 'issue',
      'expensive', 'complicated', 'difficult'
    ];

    let positiveCount = 0;
    let negativeCount = 0;

    positiveWords.forEach(word => {
      if (message.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (message.includes(word)) negativeCount++;
    });

    if (positiveCount > negativeCount) {
      return 'positive';
    } else if (negativeCount > positiveCount) {
      return 'negative';
    } else {
      return 'neutral';
    }
  }

  /**
   * Validate conversation context before processing
   */
  async validateContext(context: ConversationContext): Promise<boolean> {
    // Ensure chatbot is active and within operating hours
    if (!context.chatbotConfig.isActive) {
      return false;
    }

    if (!context.chatbotConfig.isWithinOperatingHours()) {
      return false;
    }

    // Ensure session is valid and not expired
    if (context.session.isExpired()) {
      return false;
    }

    return true;
  }

  /**
   * Calculate estimated cost for OpenAI usage
   */
  private calculateCost(usage?: OpenAI.Completions.CompletionUsage): number {
    if (!usage) return 0;
    
    return this.openAIProvider.estimateCost(
      usage.prompt_tokens,
      usage.completion_tokens
    );
  }

  /**
   * Get fallback response when AI fails
   */
  private getFallbackResponse(chatbotConfig: ChatbotConfig): string {
    const fallbackMessages = [
      `I'm ${chatbotConfig.name} and I'm here to help! However, I'm experiencing some technical difficulties right now.`,
      'Thank you for your interest! Please feel free to contact us directly for immediate assistance.',
      'I apologize for the inconvenience. You can reach out to our team directly for help with your questions.'
    ];

    return fallbackMessages[0]; // Use first fallback for consistency
  }
} 