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
import { ChatMessage } from '../../../domain/entities/ChatMessage';

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
    context: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    // Transform context to match ProcessingContext interface
    const processingContext = {
      messageHistory: context.messageHistory as ChatMessage[] || [],
      sessionId: context.sessionId as string || '',
      organizationId: context.organizationId as string,
      userData: context.userData as Record<string, unknown>,
      systemPrompt: context.systemPrompt as string,
      sharedLogFile: context.sharedLogFile as string
    };
    return this.chatbotProcessingService.processChatbotInteractionComplete(message, processingContext);
  }
}