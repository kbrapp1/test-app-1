/**
 * OpenAI Chatbot Processing Service
 * 
 * Infrastructure Layer: Pure OpenAI API integration service.
 * Refactored following DDD patterns - removed business logic and orchestration.
 * Handles only OpenAI API calls and response parsing.
 */

import OpenAI from 'openai';
import { OpenAIIntentConfig } from '../types/OpenAITypes';
import { OpenAIFunctionSchemaBuilder } from './OpenAIFunctionSchemaBuilder';
import { OpenAIMessageBuilder, MessageBuildingContext } from './OpenAIMessageBuilder';
import { SessionLogger } from '../../../../application/services/message-processing/ChatbotProcessingApplicationService';

// Function call arguments interface
export interface FunctionCallArguments {
  intent?: string;
  lead_data?: Record<string, unknown>;
  response?: {
    content?: string;
    capture_contact?: boolean;
    next_question?: string;
  };
}

// OpenAI API response interface
export interface OpenAIApiResponse {
  functionArgs: FunctionCallArguments;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model: string;
}


export class OpenAIChatbotProcessingService {
  private readonly config: OpenAIIntentConfig;
  private readonly client: OpenAI;
  private readonly messageBuilder: OpenAIMessageBuilder;

  constructor(config: OpenAIIntentConfig) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.messageBuilder = new OpenAIMessageBuilder();
  }

  /**
   * Infrastructure method: Pure OpenAI API call with function schema
   * No business logic - only API integration and response parsing
   */
  async executeOpenAIApiCall(
    message: string,
    context: MessageBuildingContext,
    sessionLogger: SessionLogger
  ): Promise<OpenAIApiResponse> {
    
    // SECURITY: Preserve organizationId for tenant isolation
    if (context.organizationId) {
      // organizationId is preserved for potential validation/logging
    }

    try {
      // Build function schema using existing infrastructure
      const schema = OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(
        undefined, // existingEntities - not used in simplified schema
        undefined, // conversationPhase - not used in simplified schema
        message    // userMessage - not used in simplified schema
      );
      
      // Validate system prompt is provided
      if (!context.systemPrompt) {
        throw new Error('System prompt is required for OpenAI API call');
      }
      
      // Use message builder for proper message construction
      const messages = this.messageBuilder.buildMessagesWithKnowledgeBase(
        message, context, schema, context.systemPrompt
      );
      
      // Validate messages before API call
      if (!this.messageBuilder.validateMessages(messages)) {
        throw new Error('Invalid message structure for OpenAI API');
      }
      
      // Prepare API request
      const apiRequest = {
        model: this.config.model,
        messages: messages,
        functions: [schema],
        function_call: { name: schema.name },
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      };
      
      // Execute API call with timing
      const startTime = Date.now();
      const response = await this.client.chat.completions.create(apiRequest);
      const duration = Date.now() - startTime;
      
      // Log API call
      sessionLogger.logApiCall(
        'https://api.openai.com/v1/chat/completions',
        apiRequest,
        response,
        duration
      );
      
      // Parse function call result
      const choice = response.choices[0];
      if (!choice.message.function_call) {
        throw new Error('No function call in OpenAI API response');
      }

      const functionArgs = JSON.parse(choice.message.function_call.arguments) as FunctionCallArguments;
      sessionLogger.logMessage('🔧 OpenAI API function arguments: ' + JSON.stringify(functionArgs));

      // Return parsed result for application layer processing
      return {
        functionArgs,
        usage: response.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        },
        model: response.model || 'gpt-4o-mini'
      };
      
    } catch (error) {
      sessionLogger.logError(error as Error, { context: 'OpenAI API call execution failed' });
      throw error;
    }
  }

  /**
   * Validates OpenAI configuration and connectivity
   */
  public async validateConfiguration(): Promise<boolean> {
    try {
      // Simple API validation call
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets available OpenAI models for configuration
   */
  public async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.models.list();
      return response.data
        .filter(model => model.id.includes('gpt'))
        .map(model => model.id)
        .sort();
    } catch {
      return [this.config.model]; // Fallback to configured model
    }
  }
} 