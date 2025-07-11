/**
 * OpenAI Analysis Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle message analysis operations
 * - Extracted from OpenAIIntentClassificationService to follow @golden-rule.mdc
 * - Unified message analysis - Intent classification with entity extraction
 * - Follow @golden-rule patterns: single responsibility, no redundancy
 * - Handle errors gracefully with proper error propagation
 */

import OpenAI from 'openai';
import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { OpenAIIntentConfig, OpenAIRequestData, OpenAIResponseData, PersonaInference } from '../types/OpenAITypes';
import { ExtractedEntities } from '../../../../domain/value-objects/message-processing/IntentResult';
import { OpenAIFunctionSchemaBuilder } from './OpenAIFunctionSchemaBuilder';
// AI: OpenAIPromptBuilder removed - prompt building now handled by SimplePromptService
import { OpenAIMessageFormatter } from './OpenAIMessageFormatter';
import { IDebugInformationService } from '../../../../domain/services/interfaces/IDebugInformationService';

export class OpenAIAnalysisService {
  private readonly config: OpenAIIntentConfig;
  private readonly client: OpenAI;
  private readonly debugService: IDebugInformationService | null;

  constructor(config: OpenAIIntentConfig, debugService?: IDebugInformationService) {
    this.config = config;
    this.client = new OpenAI({
      apiKey: config.apiKey,
    });
    this.debugService = debugService || null;
  }

  /** Unified message analysis - Intent classification with entity extraction and corrections */
  async analyzeMessageComplete(
    message: string,
    sessionId: string,
    messageId: string,
    context?: {
      messageHistory?: ChatMessage[];
      defaultConfidence?: number;
    }
  ): Promise<{
    intent: {
      primaryIntent: string;
      primaryConfidence: number;
      reasoning: string;
      alternativeIntents?: Array<{ intent: string; confidence: number }>;
    };
    entities: ExtractedEntities;
    corrections: Record<string, unknown>;
    persona: PersonaInference;
    processingTime: number;
  }> {
    try {
      const startTime = Date.now();

      // Build simplified lead qualification schema
      const functions = [OpenAIFunctionSchemaBuilder.buildUnifiedChatbotSchemaWithContext(
        undefined,  // existingEntities - not used in simplified schema
        'discovery', // conversationPhase - not used in simplified schema
        message     // userMessage - not used in simplified schema
      )];
      
      // Build enhanced system prompt (simplified since OpenAIPromptBuilder removed)
      const systemPrompt = 'You are a helpful assistant that analyzes user messages and extracts relevant information.';

      // Build message array
      const openAIMessages = OpenAIMessageFormatter.buildMessageArray(
        systemPrompt,
        context?.messageHistory || [],
        message,
        true
      );

      // Prepare request payload
      const requestPayload = {
        model: this.config.model,
        messages: openAIMessages,
        functions: functions,
        function_call: { name: "lead_qualification_response" },
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
        conversationHistoryLength: context?.messageHistory?.length || 0,
        userMessage: message
      };

      // Make API call
      const response = await this.client.chat.completions.create(requestPayload);
      const processingTime = Date.now() - startTime;

      // Prepare response debug data
      const responseData: OpenAIResponseData = {
        timestamp: new Date().toISOString(),
        processingTime: `${processingTime}ms`,
        response: response as unknown as Record<string, unknown>,
        responseSize: `${JSON.stringify(response).length} characters`
      };

      // Capture debug information
      if (sessionId) {
        this.captureApiCall(sessionId, requestData, responseData, processingTime);
      }

      // Parse function call response
      const functionCall = response.choices[0]?.message?.function_call;
      if (!functionCall || !functionCall.arguments) {
        throw new Error('No function call response received from OpenAI');
      }

      const analysisResult = JSON.parse(functionCall.arguments);

      return {
        intent: {
          primaryIntent: analysisResult.primaryIntent,
          primaryConfidence: analysisResult.primaryConfidence,
          reasoning: analysisResult.reasoning,
          alternativeIntents: analysisResult.alternativeIntents
        },
        entities: analysisResult.entities || {},
        corrections: analysisResult.corrections || null,
        persona: analysisResult.personaInference || null,
        processingTime
      };

    } catch (error) {
      throw error; // Let caller handle the error according to their needs
    }
  }

  /**
   * Capture API call for debugging
   * 
   * AI INSTRUCTIONS:
   * - Only capture debug info if debug service is available
   * - Follow proper error handling patterns
   * - Don't let debug failures affect main operation
   */
  private captureApiCall(
    sessionId: string,
    requestData: OpenAIRequestData,
    responseData: OpenAIResponseData,
    processingTime: number
  ): void {
    if (this.debugService) {
      try {
        const apiCallInfo = this.debugService.captureApiCall(
          'first',
          requestData,
          responseData,
          processingTime
        );
        this.debugService.addApiCallToSession(sessionId, 'first', apiCallInfo);
      } catch (error) {
        // Don't let debug failures affect main operation
        console.error('Failed to capture API call debug info:', error);
      }
    }
  }
} 