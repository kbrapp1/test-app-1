import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { ITokenCountingService, TokenUsage } from '../../../domain/services/interfaces/ITokenCountingService';
import { perf } from '../../../../performance-profiler';

type SupportedOpenAIModel = 'gpt-4o' | 'gpt-4o-mini';

export class OpenAITokenCountingService implements ITokenCountingService {
  private readonly DEFAULT_MODEL: SupportedOpenAIModel = 'gpt-4o-mini';
  private static readonly CACHE_KEY = 'OpenAITokenCountingService_tiktokenCache';

  // Simple pricing data (per 1K tokens)
  private readonly MODEL_PRICING = {
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 }
  } as const;

  /**
   * Count tokens in a single message
   */
  async countMessageTokens(message: ChatMessage): Promise<number> {
    // Format message as it would be sent to OpenAI
    const formattedMessage = {
      role: message.isFromUser() ? 'user' : 'assistant',
      content: message.content
    };

    return this.countTextTokens(JSON.stringify(formattedMessage));
  }

  /**
   * Count tokens in multiple messages
   */
  async countMessagesTokens(messages: ChatMessage[]): Promise<number> {
    let totalTokens = 0;
    
    for (const message of messages) {
      totalTokens += await this.countMessageTokens(message);
    }

    // Add overhead for message formatting (approximately 4 tokens per message)
    totalTokens += messages.length * 4;

    return totalTokens;
  }

  /**
   * Count tokens in text content using tiktoken (if available) or estimation
   */
  async countTextTokens(text: string): Promise<number> {
    try {
      // Cache the tiktoken import to avoid repeated dynamic imports
      if (!(globalThis as any)[OpenAITokenCountingService.CACHE_KEY]) {
        const { result: tiktokenModule } = await perf.measureAsync(
          'ImportTiktoken',
          () => import('tiktoken'),
          { library: 'tiktoken', operation: 'dynamic-import' }
        );
        (globalThis as any)[OpenAITokenCountingService.CACHE_KEY] = tiktokenModule;
      }
      
      const tiktoken = (globalThis as any)[OpenAITokenCountingService.CACHE_KEY];
      const encoding = tiktoken.encoding_for_model(this.DEFAULT_MODEL as any);
      const tokens = encoding.encode(text);
      encoding.free();
      return tokens.length;
    } catch (error) {
      // Fallback to estimation if tiktoken is not available
      return this.estimateTextTokens(text);
    }
  }

  /**
   * Estimate tokens without API call (faster, less accurate)
   * Rule of thumb: ~4 characters per token for English text
   */
  estimateTextTokens(text: string): number {
    // More sophisticated estimation
    const words = text.split(/\s+/).length;
    const characters = text.length;
    
    // Different estimation based on content type
    if (text.includes('{') || text.includes('[')) {
      // JSON/structured content - more tokens per character
      return Math.ceil(characters / 3);
    } else {
      // Regular text - approximately 0.75 tokens per word
      return Math.ceil(words * 0.75);
    }
  }

  /**
   * Get detailed token usage for messages
   */
  async getTokenUsage(messages: ChatMessage[]): Promise<TokenUsage> {
    const messageTokens = await this.countMessagesTokens(messages);
    const totalTokens = messageTokens;
    
    // Calculate estimated cost using simple pricing
    // Assume 70% input tokens (user messages + context) and 30% output tokens (bot responses)
    const modelConfig = this.MODEL_PRICING[this.DEFAULT_MODEL];
    const inputTokens = Math.ceil(totalTokens * 0.7);
    const outputTokens = Math.ceil(totalTokens * 0.3);
    const estimatedCost = (modelConfig.input * inputTokens / 1000) + (modelConfig.output * outputTokens / 1000);

    return {
      messageTokens,
      totalTokens,
      estimatedCost
    };
  }

  /**
   * Get token count for a complete prompt (system + messages)
   */
  async getPromptTokenCount(
    systemPrompt: string,
    messages: ChatMessage[]
  ): Promise<number> {
    const systemTokens = await this.countTextTokens(systemPrompt);
    const messageTokens = await this.countMessagesTokens(messages);
    
    // Add overhead for prompt structure
    return systemTokens + messageTokens + 10;
  }

  /**
   * Check if messages fit within token limit
   */
  async checkTokenLimit(
    messages: ChatMessage[],
    maxTokens: number,
    systemPromptTokens: number = 0
  ): Promise<{ fits: boolean; actualTokens: number; excess: number }> {
    const messageTokens = await this.countMessagesTokens(messages);
    const totalTokens = messageTokens + systemPromptTokens;
    const excess = Math.max(0, totalTokens - maxTokens);

    return {
      fits: totalTokens <= maxTokens,
      actualTokens: totalTokens,
      excess
    };
  }
} 