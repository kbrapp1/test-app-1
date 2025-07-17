/**
 * OpenAI Intent Classification Service
 * 
 * AI INSTRUCTIONS:
 * - Uses OpenAI's structured outputs for intent classification
 * - Implements processChatbotInteractionComplete for unified processing
 * - Follow @golden-rule patterns exactly
 * - Check for existing similar logic before creating new
 * - Never exceed 200-250 lines
 */

import { IIntentClassificationService } from '../../../domain/services/interfaces/IIntentClassificationService';
import { OpenAIChatbotProcessingService } from './services/OpenAIChatbotProcessingService';
import { OpenAIIntentConfig } from './types/OpenAITypes';

/**
 * OpenAI Intent Classification Service
 * 
 * AI INSTRUCTIONS:
 * - Uses OpenAI's structured outputs for intent classification
 * - Implements processChatbotInteractionComplete for unified processing
 * - Follow @golden-rule patterns exactly
 * - Check for existing similar logic before creating new
 * - Never exceed 200-250 lines
 */
export class OpenAIIntentClassificationService implements IIntentClassificationService {
  private chatbotProcessingService: OpenAIChatbotProcessingService;

  constructor(
    private config: OpenAIIntentConfig
  ) {
    // Initialize unified processing service
    this.chatbotProcessingService = new OpenAIChatbotProcessingService(config);
  }

  /** Unified processing method for complete chatbot interaction */
  async processChatbotInteractionComplete(
    message: string,
    context: any
  ): Promise<any> {
    return this.chatbotProcessingService.processChatbotInteractionComplete(message, context);
  }
}