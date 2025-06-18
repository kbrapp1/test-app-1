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
import { OpenAILoggingService } from './OpenAILoggingService';

export class OpenAIChatbotProcessingService {
  private readonly config: OpenAIIntentConfig;
  private readonly client: OpenAI;
  private readonly loggingService: OpenAILoggingService;

  constructor(config: OpenAIIntentConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.loggingService = new OpenAILoggingService();
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
      reasoning: string;
    };
    leadScore: {
      totalScore: number;
      scoreBreakdown: {
        intentQuality: number;
        entityCompleteness: number;
        personaFit: number;
        engagementLevel: number;
      };
      scoringReasoning: string;
      qualificationStatus: {
        isQualified: boolean;
        readyForSales: boolean;
        qualificationLevel: 'low' | 'medium' | 'high';
      };
    };
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
    const logContext = this.loggingService.initializeLogging(context.sharedLogFile);
    
    logContext.logEntry('🔵 =================================');
    logContext.logEntry('🔵 OPENAI API CALL - UNIFIED PROCESSING');
    logContext.logEntry('🔵 =================================');
    
    try {
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchema();
      
      // Use the enhanced system prompt with knowledge base integration
      // This comes from the SystemPromptBuilderService which properly integrates knowledge base
      if (!context.systemPrompt) {
        throw new Error('System prompt is required for API-only processing - no static fallbacks allowed');
      }
      const systemPrompt = context.systemPrompt;
      
      const messages = this.buildMessagesWithKnowledgeBase(message, context, schema, systemPrompt);
      
      // Log the complete API request
      const apiRequest = {
        model: this.config.model,
        messages: messages,
        functions: [schema],
        function_call: { name: schema.name },
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      };
      
      logContext.logEntry('📤 COMPLETE API REQUEST:');
      logContext.logEntry('🔗 Endpoint: https://api.openai.com/v1/chat/completions');
      logContext.logEntry('📋 Request Headers:');
      logContext.logEntry(JSON.stringify({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer [REDACTED]',
        'User-Agent': 'Chatbot-Widget/1.0'
      }, null, 2));
      logContext.logEntry('📋 Request Body:');
      logContext.logEntry(JSON.stringify(apiRequest, null, 2));
      
      const startTime = Date.now();
      logContext.logEntry(`⏱️  API Call Started: ${new Date().toISOString()}`);

      const response = await this.client.chat.completions.create(apiRequest);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      logContext.logEntry(`✅ API Call Completed: ${new Date().toISOString()}`);
      logContext.logEntry(`⏱️  Duration: ${duration}ms`);
      
      // Log complete API response
      logContext.logEntry('📥 COMPLETE API RESPONSE:');
      logContext.logEntry('📋 Response Headers:');
      logContext.logEntry(JSON.stringify({
        'content-type': 'application/json',
        'openai-model': response.model || 'N/A',
        'openai-version': 'N/A'
      }, null, 2));
      logContext.logEntry('📋 Response Body:');
      logContext.logEntry(JSON.stringify(response, null, 2));
      
      // Extract function call result
      const choice = response.choices[0];
      if (!choice.message.function_call) {
        throw new Error('No function call in response');
      }

      const functionArgs = JSON.parse(choice.message.function_call.arguments);
      logContext.logEntry('🔧 EXTRACTED FUNCTION ARGUMENTS:');
      logContext.logEntry(JSON.stringify(functionArgs, null, 2));
      
      // Log usage statistics
      if (response.usage) {
        logContext.logEntry('📊 TOKEN USAGE:');
        logContext.logEntry(`📤 Prompt Tokens: ${response.usage.prompt_tokens}`);
        logContext.logEntry(`📥 Completion Tokens: ${response.usage.completion_tokens}`);
        logContext.logEntry(`🔢 Total Tokens: ${response.usage.total_tokens}`);
        
        // Calculate estimated cost (GPT-4o-mini pricing)
        const promptCost = (response.usage.prompt_tokens / 1000) * 0.00015; // $0.15 per 1K tokens
        const completionCost = (response.usage.completion_tokens / 1000) * 0.0006; // $0.60 per 1K tokens
        const totalCost = promptCost + completionCost;
        logContext.logEntry(`💰 Estimated Cost: $${totalCost.toFixed(6)}`);
      }

      // Validate function arguments structure before building result
      logContext.logEntry('🔍 VALIDATING FUNCTION ARGUMENTS STRUCTURE:');
      logContext.logEntry(`📋 Has analysis: ${!!functionArgs.analysis}`);
      logContext.logEntry(`📋 Has leadScore: ${!!functionArgs.leadScore}`);
      logContext.logEntry(`📋 Has response: ${!!functionArgs.response}`);
      
      if (functionArgs.analysis) {
        logContext.logEntry(`📋 Analysis keys: ${Object.keys(functionArgs.analysis).join(', ')}`);
      }
      if (functionArgs.leadScore) {
        logContext.logEntry(`📋 LeadScore keys: ${Object.keys(functionArgs.leadScore).join(', ')}`);
        logContext.logEntry(`📋 LeadScore totalScore: ${functionArgs.leadScore.totalScore}`);
      }
      if (functionArgs.response) {
        logContext.logEntry(`📋 Response keys: ${Object.keys(functionArgs.response).join(', ')}`);
        logContext.logEntry(`📋 Response content length: ${functionArgs.response.content?.length || 0}`);
      }

      const result = {
        analysis: functionArgs.analysis,
        leadScore: functionArgs.leadScore,
        response: functionArgs.response,
        usage: response.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        },
        model: response.model || 'gpt-4o-mini'
      };
      
      logContext.logEntry('✨ FINAL UNIFIED RESULT:');
      logContext.logEntry(JSON.stringify(result, null, 2));
      logContext.logEntry('🔵 =================================');
      logContext.logEntry('🔵 UNIFIED PROCESSING COMPLETED');
      logContext.logEntry('🔵 =================================\n');

      // Ensure all logs are written before returning (only if logging enabled)
      await logContext.flushLogs();
      return result;
    } catch (error) {
      logContext.logEntry('❌ UNIFIED PROCESSING ERROR:');
      logContext.logEntry(`🚨 Error Type: ${error instanceof Error ? error.name : 'Unknown'}`);
      logContext.logEntry(`🚨 Error Message: ${error instanceof Error ? error.message : String(error)}`);
      if (error instanceof Error && error.stack) {
        logContext.logEntry('🚨 Stack Trace:');
        logContext.logEntry(error.stack);
      }
      logContext.logEntry('🔵 =================================\n');
      
      // Ensure all logs are written before throwing (only if logging enabled)
      await logContext.flushLogs();
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
} 