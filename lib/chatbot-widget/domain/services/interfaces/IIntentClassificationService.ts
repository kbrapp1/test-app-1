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

export interface IIntentClassificationService {
  /**
   * Classify the intent of a user message with context
   * 
   * AI INSTRUCTIONS:
   * - This is the only method used by the unified processing workflow
   * - All other methods were legacy and have been removed as dead code
   * - Keep this implementation focused and efficient
   */
  classifyIntent(
    message: string,
    context: IntentClassificationContext
  ): Promise<IntentResult>;
} 