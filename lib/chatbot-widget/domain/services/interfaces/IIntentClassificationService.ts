import { ChatMessage } from '../../entities/ChatMessage';
import { ChatSession } from '../../entities/ChatSession';
import { ChatbotConfig } from '../../entities/ChatbotConfig';
import { IntentResult } from '../../value-objects/message-processing/IntentResult';

export interface IntentClassificationContext {
  chatbotConfig: ChatbotConfig;
  session: ChatSession;
  messageHistory: ChatMessage[];
  currentMessage: string;
}

/**
 * Intent Classification Service Interface
 * 
 * AI INSTRUCTIONS:
 * - Keep interface lean with only essential methods
 * - All implementations must use unified processing approach
 * - Follow @golden-rule patterns exactly
 */
export interface IIntentClassificationService {
  /** Unified processing method for complete chatbot interaction */
  processChatbotInteractionComplete(
    message: string,
    context: any
  ): Promise<any>;
} 