/**
 * OpenAI Intent Classification Service
 * 
 * Infrastructure service implementing intent classification using OpenAI API.
 * Refactored following DDD principles with single responsibility components.
 * 
 * Single responsibility: Orchestrate OpenAI API calls for intent classification.
 */

import { IIntentClassificationService, IntentClassificationContext } from '../../../domain/services/interfaces/IIntentClassificationService';
import { IntentResult, IntentType } from '../../../domain/value-objects/message-processing/IntentResult';
import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { IDebugInformationService } from '../../../domain/services/interfaces/IDebugInformationService';
import OpenAI from 'openai';

// Import refactored components
import { OpenAIIntentConfig, OpenAIRequestData, OpenAIResponseData } from './types/OpenAITypes';
import { OpenAIFunctionSchemaBuilder } from './services/OpenAIFunctionSchemaBuilder';
import { OpenAIPromptBuilder } from './services/OpenAIPromptBuilder';
import { OpenAIRuleBasedClassifier } from './services/OpenAIRuleBasedClassifier';
import { OpenAIMessageFormatter } from './services/OpenAIMessageFormatter';

export class OpenAIIntentClassificationService implements IIntentClassificationService {
  private readonly config: OpenAIIntentConfig;
  private readonly client: OpenAI;
  private readonly debugService: IDebugInformationService | null = null;

  constructor(config: OpenAIIntentConfig, debugService?: IDebugInformationService) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.debugService = debugService || null;
  }

  /**
   * Main intent classification method
   */
  async classifyIntent(
    message: string,
    context: IntentClassificationContext
  ): Promise<IntentResult> {
    return this.classifyIntentEnhanced(message, context.messageHistory, context.session?.id);
  }

  /**
   * Enhanced intent classification with full context
   */
  async classifyIntentEnhanced(
    message: string,
    messageHistory: ChatMessage[],
    sessionId?: string
  ): Promise<IntentResult> {
    try {
      const startTime = Date.now();

      // Build function schema and system prompt
      const functions = [OpenAIFunctionSchemaBuilder.buildIntentClassificationSchema()];
      const systemPrompt = OpenAIPromptBuilder.buildEnhancedSystemPrompt(messageHistory);

      // Build message array
      const openAIMessages = OpenAIMessageFormatter.buildMessageArray(
        systemPrompt,
        messageHistory,
        message,
        true // Exclude current message from history to avoid duplication
      );

      // Prepare request payload
      const requestPayload = {
        model: this.config.model,
        messages: openAIMessages,
        functions: functions,
        function_call: { name: "classify_intent_and_persona" },
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens
      };

      // Prepare debug data
      const requestData: OpenAIRequestData = {
        endpoint: 'https://api.openai.com/v1/chat/completions',
        method: 'POST',
        timestamp: new Date().toISOString(),
        payload: requestPayload,
        payloadSize: `${JSON.stringify(requestPayload).length} characters`,
        messageCount: openAIMessages.length,
        conversationHistoryLength: messageHistory.length,
        userMessage: message
      };

      // Make API call
      const response = await this.client.chat.completions.create(requestPayload);
      const processingTime = Date.now() - startTime;

      // Prepare response debug data
      const responseData: OpenAIResponseData = {
        timestamp: new Date().toISOString(),
        processingTime: `${processingTime}ms`,
        response: response,
        responseSize: `${JSON.stringify(response).length} characters`
      };

      // Capture debug information
      if (sessionId) {
        this.captureApiCall(sessionId, requestData, responseData, processingTime);
      }

      // Parse and return result
      return this.parseOpenAIResponse(response, processingTime);

    } catch (error) {
      // Fallback to rule-based classification
      return this.handleClassificationError(error, message, messageHistory);
    }
  }

  /**
   * Quick classification without full context
   */
  async classifyIntentQuick(message: string): Promise<IntentResult> {
    const startTime = Date.now();

    try {
      const systemPrompt = OpenAIPromptBuilder.buildQuickSystemPrompt();
      const quickMessages = OpenAIMessageFormatter.buildQuickMessageArray(systemPrompt, message);

      const quickRequestPayload = {
        model: this.config.model,
        messages: quickMessages,
        temperature: 0.1,
        max_tokens: 50
      };

      const response = await this.client.chat.completions.create(quickRequestPayload);
      const intentText = response.choices[0]?.message?.content?.trim().toLowerCase() || 'unknown';
      
      return this.createQuickIntentResult(intentText, Date.now() - startTime);

    } catch (error) {
      const fallbackResult = OpenAIRuleBasedClassifier.classifyQuick(message);
      return this.convertToIntentResult(fallbackResult, Date.now() - startTime);
    }
  }

  /**
   * Batch classify multiple messages
   */
  async classifyIntentsBatch(
    messages: string[],
    context: IntentClassificationContext
  ): Promise<IntentResult[]> {
    const results: IntentResult[] = [];
    
    for (const message of messages) {
      const result = await this.classifyIntent(message, context);
      results.push(result);
    }

    return results;
  }

  /**
   * Health check for the service
   */
  async healthCheck(): Promise<boolean> {
    try {
      const healthCheckPayload = {
        model: this.config.model,
        messages: OpenAIMessageFormatter.buildHealthCheckMessageArray(),
        max_tokens: 5,
        temperature: 0
      };

      const response = await this.client.chat.completions.create(healthCheckPayload);
      return !!response.choices[0]?.message?.content;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get confidence threshold for intent type
   */
  getConfidenceThreshold(intentType: string): number {
    return OpenAIRuleBasedClassifier.getConfidenceThreshold(intentType);
  }

  /**
   * Parse OpenAI API response
   */
  private parseOpenAIResponse(response: any, processingTime: number): IntentResult {
    const functionCall = response.choices[0]?.message?.function_call;

    if (!functionCall || !functionCall.arguments) {
      throw new Error('No function call response received from OpenAI');
    }

    const result = JSON.parse(functionCall.arguments);

    return IntentResult.create(
      result.primaryIntent,
      result.primaryConfidence,
      result.entities || {},
      result.reasoning,
      {
        model: this.config.model,
        processingTimeMs: processingTime,
        alternativeIntents: result.alternativeIntents || []
      }
    );
  }

  /**
   * Handle classification errors with fallback
   */
  private handleClassificationError(
    error: any,
    message: string,
    messageHistory: ChatMessage[]
  ): IntentResult {
    const fallbackResult = OpenAIRuleBasedClassifier.classifyWithContext(message, {
      chatbotConfig: {} as any,
      session: {} as any,
      messageHistory,
      currentMessage: message
    });

    return this.convertToIntentResult(fallbackResult, 0);
  }

  /**
   * Convert classification result to IntentResult
   */
  private convertToIntentResult(result: any, processingTime: number): IntentResult {
    return IntentResult.create(
      result.intent,
      result.confidence,
      result.entities,
      result.reasoning,
      {
        model: this.config.model,
        processingTimeMs: processingTime,
        alternativeIntents: result.alternativeIntents
      }
    );
  }

  /**
   * Create quick intent result
   */
  private createQuickIntentResult(intentText: string, processingTime: number): IntentResult {
    const validIntents: IntentType[] = [
      'greeting', 'faq_general', 'faq_pricing', 'faq_features',
      'sales_inquiry', 'booking_request', 'demo_request', 'support_request',
      'objection_handling', 'qualification', 'closing', 'unknown'
    ];

    const intent = validIntents.includes(intentText as IntentType) ? intentText as IntentType : 'unknown';

    return IntentResult.create(
      intent,
      intent === 'unknown' ? 0.1 : 0.8,
      {},
      `Quick classification: ${intent}`,
      {
        model: this.config.model,
        processingTimeMs: processingTime,
        alternativeIntents: []
      }
    );
  }

  /**
   * Capture API call for debugging
   */
  private captureApiCall(
    sessionId: string,
    requestData: OpenAIRequestData,
    responseData: OpenAIResponseData,
    processingTime: number
  ): void {
    if (this.debugService) {
      const apiCallInfo = this.debugService.captureApiCall(
        'first',
        requestData,
        responseData,
        processingTime
      );
      this.debugService.addApiCallToSession(sessionId, 'first', apiCallInfo);
    }
  }
} 