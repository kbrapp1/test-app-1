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
  /** Classify the intent of a user message with context */
  classifyIntent(
    message: string,
    context: IntentClassificationContext
  ): Promise<IntentResult>;
} 