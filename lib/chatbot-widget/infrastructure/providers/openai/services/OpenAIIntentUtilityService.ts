/**
 * OpenAI Intent Utility Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Provide utility methods for intent classification
 * - Extracted from OpenAIIntentClassificationService to follow @golden-rule.mdc
 * - Only contains methods used by the unified processing workflow
 * - Legacy methods for quick classification and thresholds removed as dead code
 * - Follow DDD patterns: Infrastructure utility service
 */

import { IntentResult, IntentType } from '../../../../domain/value-objects/message-processing/IntentResult';
import { ChatMessage } from '../../../../domain/entities/ChatMessage';
import { OpenAIIntentConfig } from '../types/OpenAITypes';

export class OpenAIIntentUtilityService {
  
  /**
   * Handle classification errors - API only approach
   * 
   * AI INSTRUCTIONS:
   * - No rule-based fallback - only use OpenAI API
   * - Return unknown intent with error context when API fails
   * - Provide clear error reasoning for debugging
   */
  static handleClassificationError(
    error: any,
    message: string,
    messageHistory: ChatMessage[],
    config: OpenAIIntentConfig
  ): IntentResult {
    // Return unknown intent with error details instead of rule-based fallback
    const errorMessage = `OpenAI API error: ${error.message || 'Classification service unavailable'}. Error type: ${error.name || 'APIError'}`;
    
    return IntentResult.create(
      'unknown',
      0.0, // Zero confidence indicates API failure
      {},
      errorMessage,
      {
        model: config.model,
        processingTimeMs: 0,
        alternativeIntents: []
      }
    );
  }

  /**
   * Convert classification result to IntentResult
   * 
   * AI INSTRUCTIONS:
   * - Transform API result to domain IntentResult
   * - Provide consistent metadata structure
   * - Handle missing fields gracefully
   */
  static convertToIntentResult(
    result: any, 
    processingTime: number, 
    config: OpenAIIntentConfig
  ): IntentResult {
    return IntentResult.create(
      result.intent,
      result.confidence,
      result.entities,
      result.reasoning,
      {
        model: config.model,
        processingTimeMs: processingTime,
        alternativeIntents: result.alternativeIntents || []
      }
    );
  }

  /** Get valid intent types */
  static getValidIntents(): IntentType[] {
    return [
      'greeting', 'faq_general', 'faq_pricing', 'faq_features',
      'sales_inquiry', 'booking_request', 'demo_request', 'support_request',
      'objection_handling', 'qualification', 'closing', 'unknown'
    ];
  }

  /** Validate and map intent */
  static validateAndMapIntent(intentText: string): IntentType {
    const validIntents = this.getValidIntents();
    return validIntents.includes(intentText as IntentType) ? intentText as IntentType : 'unknown';
  }
} 