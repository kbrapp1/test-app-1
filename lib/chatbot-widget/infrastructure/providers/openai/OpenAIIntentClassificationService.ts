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
import { 
  ChatbotProcessingApplicationService, 
  ProcessingContext,
  ChatbotProcessingResult 
} from '../../../application/services/message-processing/ChatbotProcessingApplicationService';

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
  private applicationService: ChatbotProcessingApplicationService;

  constructor(
    private config: OpenAIIntentConfig
  ) {
    // Initialize unified processing service
    this.chatbotProcessingService = new OpenAIChatbotProcessingService(config);
    this.applicationService = new ChatbotProcessingApplicationService();
  }

  /** Unified processing method for complete chatbot interaction */
  async processChatbotInteractionComplete(
    message: string,
    context: Record<string, unknown>
  ): Promise<ChatbotProcessingResult> {
    // Transform context to match ProcessingContext interface
    const processingContext: ProcessingContext = {
      messageHistory: (context.messageHistory as ChatMessage[]) || [],
      sessionId: (context.sessionId as string) || '',
      organizationId: context.organizationId as string,
      userData: context.userData as Record<string, unknown>,
      systemPrompt: context.systemPrompt as string,
      sharedLogFile: context.sharedLogFile as string
    };

    // Use application service to orchestrate the complete processing workflow
    return await this.applicationService.orchestrateChatbotProcessing(
      message,
      processingContext,
      // Bind the OpenAI API call method with proper context mapping
      (msg, ctx, logger) => this.chatbotProcessingService.executeOpenAIApiCall(
        msg, 
        ctx, // ProcessingContext and MessageBuildingContext have same structure
        logger
      )
    );
  }
}