export interface ContextWindowConfig {
  maxTokens: number;
  systemPromptTokens: number;
  responseReservedTokens: number;
  summaryTokens: number;
}

export interface ContextAllocation {
  systemPrompt: number;
  conversationSummary: number;
  recentMessages: number;
  responseReserved: number;
  total: number;
}

export class ConversationContextWindow {
  private readonly _config: ContextWindowConfig;

  private constructor(config: ContextWindowConfig) {
    this._config = config;
  }

  static create(config: Partial<ContextWindowConfig> = {}): ConversationContextWindow {
    const defaultConfig: ContextWindowConfig = {
      maxTokens: 12000, // Safe limit for most models
      systemPromptTokens: 500,
      responseReservedTokens: 3000,
      summaryTokens: 200
    };

    const finalConfig = { ...defaultConfig, ...config };

    // Validate configuration
    const totalReserved = finalConfig.systemPromptTokens + 
                         finalConfig.responseReservedTokens + 
                         finalConfig.summaryTokens;

    if (totalReserved > finalConfig.maxTokens) {
      throw new Error('Reserved tokens exceed maximum context window');
    }

    return new ConversationContextWindow(finalConfig);
  }

  /**
   * Calculate available tokens for recent messages
   */
  getAvailableTokensForMessages(): number {
    const reserved = this._config.systemPromptTokens + 
                    this._config.responseReservedTokens + 
                    this._config.summaryTokens;
    
    return Math.max(0, this._config.maxTokens - reserved);
  }

  /**
   * Get token allocation breakdown
   */
  getAllocation(): ContextAllocation {
    const availableForMessages = this.getAvailableTokensForMessages();
    
    return {
      systemPrompt: this._config.systemPromptTokens,
      conversationSummary: this._config.summaryTokens,
      recentMessages: availableForMessages,
      responseReserved: this._config.responseReservedTokens,
      total: this._config.maxTokens
    };
  }

  /**
   * Check if we need to summarize based on token usage
   */
  shouldSummarize(currentMessageTokens: number): boolean {
    const availableForMessages = this.getAvailableTokensForMessages();
    return currentMessageTokens > availableForMessages;
  }

  /**
   * Calculate how many tokens to remove via summarization
   */
  getTokensToSummarize(currentMessageTokens: number): number {
    const availableForMessages = this.getAvailableTokensForMessages();
    const excess = currentMessageTokens - availableForMessages;
    
    // Summarize 50% more than needed to avoid frequent summarization
    return Math.max(0, Math.floor(excess * 1.5));
  }

  get maxTokens(): number {
    return this._config.maxTokens;
  }

  get systemPromptTokens(): number {
    return this._config.systemPromptTokens;
  }

  get summaryTokens(): number {
    return this._config.summaryTokens;
  }
} 