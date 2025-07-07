/**
 * OpenAI Chatbot Processing Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle complete chatbot interaction processing
 * - Extracted from OpenAIIntentClassificationService to follow @golden-rule.mdc
 * - Maintain all business functionality with enhanced efficiency
 * - Use proper domain services for knowledge base integration
 * - Follow DDD patterns: Infrastructure service implementing domain interfaces
 */

import OpenAI from 'openai';
import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { OpenAIIntentConfig } from '../types/OpenAITypes';
import { OpenAIFunctionSchemaBuilder } from './OpenAIFunctionSchemaBuilder';

export class OpenAIChatbotProcessingService {
  private readonly config: OpenAIIntentConfig;
  private readonly client: OpenAI;
  private static readonly LOGGING_CACHE_KEY = 'OpenAIChatbotProcessingService_loggingServiceCache';

  constructor(config: OpenAIIntentConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
  }

  /**
   * Process complete chatbot interaction in single API call
   * 
   * AI INSTRUCTIONS:
   * - Single API call that handles all chatbot logic: analysis, scoring, response
   * - Reduces cost by 50% compared to separate analysis + response calls
   * - Maintains all business functionality with enhanced efficiency
   * - Follow @golden-rule patterns: single responsibility, no redundancy
   * - Use proper domain services for knowledge base integration
   * 
   * @param message User's message content
   * @param context Conversation context including history and session data
   * @returns Complete chatbot processing results
   */
  async processChatbotInteractionComplete(
    message: string,
    context: {
      messageHistory: ChatMessage[];
      sessionId: string;
      organizationId?: string;
      userData?: any;
      systemPrompt?: string;
      sharedLogFile?: string;
    }
  ): Promise<{
    analysis: {
      primaryIntent: string;
      primaryConfidence: number;
      entities: any;
      personaInference?: any;
      corrections?: any;
      sentiment?: string;
      sentimentConfidence?: number;
      emotionalTone?: string;
      reasoning: string;
    };
    conversationFlow: {
      shouldCaptureLeadNow: boolean;
      shouldAskQualificationQuestions: boolean;
      shouldEscalateToHuman: boolean;
      nextBestAction: string;
      conversationPhase: string;
      engagementLevel: string;
    };
    leadScore?: number; // Optional - calculated by domain service when needed
    response: {
      content: string;
      tone: string;
      callToAction?: string;
      shouldTriggerLeadCapture: boolean;
      personalization?: string;
    };
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    model: string;
  }> {
    // Use the main chatbot logging service instead of OpenAI's separate logging
    // Cache the logging service import to avoid repeated dynamic imports
    if (!(globalThis as any)[OpenAIChatbotProcessingService.LOGGING_CACHE_KEY]) {
      (globalThis as any)[OpenAIChatbotProcessingService.LOGGING_CACHE_KEY] = await import('../../../providers/logging/ChatbotFileLoggingService');
    }
    const loggingService = new ((globalThis as any)[OpenAIChatbotProcessingService.LOGGING_CACHE_KEY]).ChatbotFileLoggingService();
    
    const sessionLogger = loggingService.createSessionLogger(
      context.sessionId,
      context.sharedLogFile || `chatbot-${new Date().toISOString().split('T')[0]}.log`,
      { operation: 'openai-api-call' }
    );
    
    try {
      // Extract context for dynamic schema generation
      const existingEntities = context.userData?.entities || {};
      const conversationPhase = this.determineConversationPhase(context.messageHistory);
      
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(
        existingEntities,
        conversationPhase, 
        message
      );
      
      // Use the enhanced system prompt with knowledge base integration
      // This comes from the SystemPromptBuilderService which properly integrates knowledge base
      if (!context.systemPrompt) {
        throw new Error('System prompt is required for API-only processing - no static fallbacks allowed');
      }
      const systemPrompt = context.systemPrompt;
      
      const messages = this.buildMessagesWithKnowledgeBase(message, context, schema, systemPrompt);
      
      // Log the complete API request using the structured logging
      const apiRequest = {
        model: this.config.model,
        messages: messages,
        functions: [schema],
        function_call: { name: schema.name },
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      };
      
      const startTime = Date.now();
      const response = await this.client.chat.completions.create(apiRequest);
      const duration = Date.now() - startTime;
      
      // Use the structured logApiCall method that was fixed
      sessionLogger.logApiCall(
        'https://api.openai.com/v1/chat/completions',
        apiRequest,
        response,
        duration
      );
      
      // Extract function call result
      const choice = response.choices[0];
      if (!choice.message.function_call) {
        throw new Error('No function call in response');
      }

      const functionArgs = JSON.parse(choice.message.function_call.arguments);
      sessionLogger.logMessage('🔧 EXTRACTED FUNCTION ARGUMENTS:', functionArgs);

      const result = {
        analysis: functionArgs.analysis,
        conversationFlow: functionArgs.conversationFlow,
        // leadScore: Intentionally excluded - calculated by domain service
        response: functionArgs.response,
        usage: response.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        },
        model: response.model || 'gpt-4o-mini'
      };
      
      sessionLogger.logMessage('✨ FINAL UNIFIED RESULT:', result);
      
      // Ensure all logs are written before returning
      await sessionLogger.flush();
      return result;
    } catch (error) {
      sessionLogger.logError(error as Error, { context: 'OpenAI API call failed' });
      
      // Ensure all logs are written before throwing
      await sessionLogger.flush();
      throw error;
    }
  }

  /**
   * Build messages with proper knowledge base integration
   * 
   * AI INSTRUCTIONS:
   * - Use the enhanced system prompt that includes knowledge base data
   * - Follow @golden-rule patterns for clean message construction
   * - Ensure knowledge base context is properly included
   * - Prevent message duplication by filtering current message from history
   */
  private buildMessagesWithKnowledgeBase(
    userMessage: string,
    context: any,
    schema: any,
    systemPrompt: string
  ): any[] {
    const messages = [
      {
        role: 'system',
        content: systemPrompt // This now includes full knowledge base integration
      }
    ];

    // Add conversation history (filter out current message to prevent duplication)
    if (context.messageHistory && context.messageHistory.length > 0) {
      const filteredHistory = context.messageHistory.filter((msg: any) => 
        !(msg.messageType === 'user' && msg.content.trim() === userMessage.trim())
      );
      
      filteredHistory.forEach((msg: any) => {
        messages.push({
          role: msg.messageType === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Add current user message (now guaranteed to be unique)
    messages.push({
      role: 'user',
      content: userMessage
    });

    // Add function schema instruction
    messages.push({
      role: 'system',
      content: `You must respond using the ${schema.name} function with all required fields filled out based on the conversation context and knowledge base information provided above.`
    });

    return messages;
  }

  /**
   * Determine conversation phase for dynamic entity extraction
   * 
   * AI INSTRUCTIONS:
   * - Analyze conversation flow to determine current phase
   * - Used for selective entity extraction following 2025 best practices
   * - Return phase that guides which entities to extract
   */
  private determineConversationPhase(messageHistory: any[]): string {
    if (!messageHistory || messageHistory.length === 0) {
      return 'greeting';
    }

    // Simple phase detection based on conversation length and content
    const userMessages = messageHistory.filter(msg => msg.messageType === 'user');
    const totalMessages = messageHistory.length;

    // Early conversation phases
    if (totalMessages <= 2) {
      return 'greeting';
    }

    if (totalMessages <= 4) {
      return 'discovery';
    }

    // Look for business inquiry keywords in recent messages
    const recentContent = messageHistory.slice(-4)
      .map(msg => msg.content.toLowerCase())
      .join(' ');

    if (recentContent.includes('pricing') || recentContent.includes('cost') || recentContent.includes('budget')) {
      return 'qualification';
    }

    if (recentContent.includes('demo') || recentContent.includes('meeting') || recentContent.includes('schedule')) {
      return 'scheduling';
    }

    if (recentContent.includes('ready') || recentContent.includes('move forward') || recentContent.includes('next step')) {
      return 'closing';
    }

    // Default to qualification phase for mid-conversation
    return 'qualification';
  }
} 