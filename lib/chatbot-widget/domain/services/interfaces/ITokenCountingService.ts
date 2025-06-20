import { ChatMessage } from '../../entities/ChatMessage';

export interface TokenUsage {
  messageTokens: number;
  totalTokens: number;
  estimatedCost: number;
}

export interface ITokenCountingService {
  /**
   * Count tokens in a single message
   */
  countMessageTokens(message: ChatMessage): Promise<number>;

  /**
   * Count tokens in multiple messages
   */
  countMessagesTokens(messages: ChatMessage[]): Promise<number>;

  /**
   * Count tokens in text content
   */
  countTextTokens(text: string): Promise<number>;

  /**
   * Estimate tokens without API call (faster, less accurate)
   */
  estimateTextTokens(text: string): number;

  /**
   * Get detailed token usage for messages
   */
  getTokenUsage(messages: ChatMessage[]): Promise<TokenUsage>;
} 