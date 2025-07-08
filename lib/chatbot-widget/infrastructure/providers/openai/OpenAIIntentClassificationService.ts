/**
 * OpenAI Intent Classification Service
 * 
 * AI INSTRUCTIONS:
 * - Implements classifyIntent method for interface compliance 
 * - Delegates unified processing to OpenAIChatbotProcessingService
 * - Maintains interface compatibility while providing unified processing
 * - Follows @golden-rule patterns: orchestration only
 */

import OpenAI from 'openai';
import { IIntentClassificationService, IntentClassificationContext } from '../../../domain/services/interfaces/IIntentClassificationService';
import { IntentResult } from '../../../domain/value-objects/message-processing/IntentResult';
import { OpenAIAnalysisService } from './services/OpenAIAnalysisService';
import { OpenAIIntentUtilityService } from './services/OpenAIIntentUtilityService';
import { OpenAIChatbotProcessingService } from './services/OpenAIChatbotProcessingService';
import { OpenAIIntentConfig } from './types/OpenAITypes';

/**
 * OpenAI Intent Classification Service
 * 
 * AI INSTRUCTIONS:
 * - Implements classifyIntent method for interface compliance 
 * - Delegates unified processing to OpenAIChatbotProcessingService
 * - Maintains interface compatibility while providing unified processing
 * - Follows @golden-rule patterns: orchestration only
 */
export class OpenAIIntentClassificationService implements IIntentClassificationService {
  private client: OpenAI;
  private analysisService: OpenAIAnalysisService;
  private chatbotProcessingService: OpenAIChatbotProcessingService;

  constructor(
    private config: OpenAIIntentConfig
  ) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      timeout: 30000
    });
    
    this.analysisService = new OpenAIAnalysisService(config);
    this.chatbotProcessingService = new OpenAIChatbotProcessingService(config);
  }

  /**
   * Main intent classification method (interface compliance)
   * 
   * AI INSTRUCTIONS:
   * - Delegate to analysis service for processing
   * - Transform result to IntentResult format using utility
   * - Handle errors with utility fallback classification
   * - Follow @golden-rule patterns: orchestration only
   */
  async classifyIntent(
    message: string,
    context: IntentClassificationContext
  ): Promise<IntentResult> {
    try {
      // Delegate to analysis service
      const analysisResult = await this.analysisService.analyzeMessageComplete(
        message,
        context.session?.id || 'unknown',
        'temp-message-id',
        {
          messageHistory: context.messageHistory,
          defaultConfidence: 0.8
        }
      );

      // Transform analysis result to IntentResult using utility
      const intent = OpenAIIntentUtilityService.validateAndMapIntent(
        analysisResult.intent.primaryIntent
      );

      return IntentResult.create(
        intent,
        analysisResult.intent.primaryConfidence,
        analysisResult.entities,
        analysisResult.intent.reasoning,
        {
          model: this.config.model,
          processingTimeMs: analysisResult.processingTime,
          alternativeIntents: analysisResult.intent.alternativeIntents || []
        }
      );

    } catch (error) {
      // Use utility for error handling
      return OpenAIIntentUtilityService.handleClassificationError(
        error, 
        message, 
        context.messageHistory, 
        this.config
      );
    }
  }

  /** Unified processing method for complete chatbot interaction */
  async processChatbotInteractionComplete(
    message: string,
    context: any
  ): Promise<any> {
    return this.chatbotProcessingService.processChatbotInteractionComplete(message, context);
  }
}