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
import { OpenAIIntentConfig, PersonaInference } from '../types/OpenAITypes';
import { ExtractedEntities } from '../../../../domain/value-objects/message-processing/IntentResult';
import { OpenAIFunctionSchemaBuilder } from './OpenAIFunctionSchemaBuilder';

// Context interface for processing
interface ProcessingContext {
  messageHistory: ChatMessage[];
  sessionId: string;
  organizationId?: string;
  userData?: Record<string, unknown>;
  systemPrompt?: string;
  sharedLogFile?: string;
}

// Function call schema interface
interface FunctionSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

// OpenAI message interface
interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Function call arguments interface
interface FunctionCallArguments {
  intent?: string;
  lead_data?: Record<string, unknown>;
  response?: {
    content?: string;
    capture_contact?: boolean;
    next_question?: string;
  };
}

// OpenAI API request interface
interface OpenAIApiRequest {
  model: string;
  messages: OpenAIMessage[];
  functions: FunctionSchema[];
  function_call: { name: string };
  temperature: number;
  max_tokens: number;
}

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

  // Process complete chatbot interaction in single API call
  async processChatbotInteractionComplete(
    message: string,
    context: ProcessingContext
  ): Promise<{
    analysis: {
      primaryIntent: string;
      primaryConfidence: number;
      entities: ExtractedEntities;
      personaInference?: PersonaInference;
      corrections?: Record<string, unknown>;
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
    if (!(globalThis as Record<string, unknown>)[OpenAIChatbotProcessingService.LOGGING_CACHE_KEY]) {
      (globalThis as Record<string, unknown>)[OpenAIChatbotProcessingService.LOGGING_CACHE_KEY] = await import('../../../providers/logging/ChatbotFileLoggingService');
    }
    const LoggingServiceClass = (globalThis as Record<string, unknown>)[OpenAIChatbotProcessingService.LOGGING_CACHE_KEY] as { ChatbotFileLoggingService: new () => { createSessionLogger: (sessionId: string, logFile: string, metadata: Record<string, unknown>) => { logApiCall: Function; logMessage: Function; logError: Function; flush: Function } } };
    const loggingService = new LoggingServiceClass.ChatbotFileLoggingService();
    
    const sessionLogger = loggingService.createSessionLogger(
      context.sessionId,
      context.sharedLogFile || `chatbot-${new Date().toISOString().split('T')[0]}.log`,
      { operation: 'openai-api-call' }
    );
    
    try {
      // Build simplified lead qualification schema
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(
        undefined, // existingEntities - not used in simplified schema
        undefined, // conversationPhase - not used in simplified schema
        message    // userMessage - not used in simplified schema
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

      const functionArgs = JSON.parse(choice.message.function_call.arguments) as FunctionCallArguments;
      sessionLogger.logMessage('🔧 EXTRACTED FUNCTION ARGUMENTS:', functionArgs);

      // AI: Map simplified schema response to expected format
      const result = {
        analysis: {
          primaryIntent: functionArgs.intent || 'inquiry',
          primaryConfidence: 0.8, // Default confidence for simplified schema
          entities: this.mapFunctionCallEntitiesToExpectedFormat(functionArgs.lead_data || {}),
          reasoning: `Intent: ${functionArgs.intent}, Lead data extracted`
        },
        conversationFlow: {
          shouldCaptureLeadNow: functionArgs.response?.capture_contact || false,
          shouldAskQualificationQuestions: functionArgs.response?.next_question ? true : false,
          shouldEscalateToHuman: false, // Default for simplified schema
          nextBestAction: functionArgs.response?.capture_contact ? 'capture_contact' : 'continue_conversation',
          conversationPhase: this.mapIntentToPhase(functionArgs.intent || 'unknown'),
          engagementLevel: this.mapIntentToEngagement(functionArgs.intent || 'unknown')
        },
        // leadScore: Intentionally excluded - calculated by domain service
        response: {
          content: functionArgs.response?.content || '',
          tone: 'professional', // Default tone for simplified schema
          shouldTriggerLeadCapture: functionArgs.response?.capture_contact || false
        },
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

  // Build messages with proper knowledge base integration
  private buildMessagesWithKnowledgeBase(
    userMessage: string,
    context: ProcessingContext,
    schema: FunctionSchema,
    systemPrompt: string
  ): OpenAIMessage[] {
    const messages: OpenAIMessage[] = [
      {
        role: 'system',
        content: systemPrompt // This now includes full knowledge base integration
      }
    ];

    // Add conversation history (filter out current message to prevent duplication)
    if (context.messageHistory && context.messageHistory.length > 0) {
      const filteredHistory = context.messageHistory.filter((msg: ChatMessage) => 
        !(msg.messageType === 'user' && msg.content.trim() === userMessage.trim())
      );
      
      filteredHistory.forEach((msg: ChatMessage) => {
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

  // Map intent to conversation phase
  private mapIntentToPhase(intent: string): string {
    switch (intent) {
      case 'demo':
      case 'pricing': return 'demonstration';
      case 'qualification': return 'qualification';
      case 'objection': return 'objection_handling';
      default: return 'discovery';
    }
  }

  // Map intent to engagement level
  private mapIntentToEngagement(intent: string): string {
    switch (intent) {
      case 'demo':
      case 'pricing': return 'high';
      case 'qualification': return 'medium';
      default: return 'low';
    }
  }

  // Map function call entities to expected format
  private mapFunctionCallEntitiesToExpectedFormat(leadData: Record<string, unknown>): ExtractedEntities {
    const mappedEntities: Record<string, unknown> = { ...leadData };
    
    // Map snake_case to camelCase for array entities
    if (leadData.pain_points) {
      mappedEntities.painPoints = leadData.pain_points;
      delete mappedEntities.pain_points;
    }
    
    // Goals already uses correct camelCase name
    // Other fields like name, company, role, budget, timeline, urgency are already correct
    
    return mappedEntities as ExtractedEntities;
  }

  // AI: Phase-based entity extraction removed in favor of simplified schema approach
} 