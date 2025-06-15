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
   */
  classifyIntent(
    message: string,
    context: IntentClassificationContext
  ): Promise<IntentResult>;

  /**
   * Classify intent with minimal context (faster, less accurate)
   */
  classifyIntentQuick(message: string): Promise<IntentResult>;

  /**
   * Batch classify multiple messages
   */
  classifyIntentsBatch(
    messages: string[],
    context: IntentClassificationContext
  ): Promise<IntentResult[]>;

  /**
   * Get confidence threshold for different intent types
   */
  getConfidenceThreshold(intentType: string): number;

  /**
   * Check if the service is available and healthy
   */
  healthCheck(): Promise<boolean>;
} 