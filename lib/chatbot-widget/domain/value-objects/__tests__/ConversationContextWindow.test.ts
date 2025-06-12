import { ConversationContextWindow } from '../ConversationContextWindow';

describe('ConversationContextWindow', () => {
  describe('create', () => {
    it('should create with default configuration', () => {
      const contextWindow = ConversationContextWindow.create();
      
      expect(contextWindow.maxTokens).toBe(12000);
      expect(contextWindow.systemPromptTokens).toBe(500);
      expect(contextWindow.summaryTokens).toBe(200);
    });

    it('should create with custom configuration', () => {
      const contextWindow = ConversationContextWindow.create({
        maxTokens: 8000,
        systemPromptTokens: 300,
        responseReservedTokens: 2000,
        summaryTokens: 150
      });
      
      expect(contextWindow.maxTokens).toBe(8000);
      expect(contextWindow.systemPromptTokens).toBe(300);
      expect(contextWindow.summaryTokens).toBe(150);
    });

    it('should throw error if reserved tokens exceed maximum', () => {
      expect(() => {
        ConversationContextWindow.create({
          maxTokens: 1000,
          systemPromptTokens: 500,
          responseReservedTokens: 400,
          summaryTokens: 200 // Total: 1100 > 1000
        });
      }).toThrow('Reserved tokens exceed maximum context window');
    });
  });

  describe('getAvailableTokensForMessages', () => {
    it('should calculate available tokens correctly', () => {
      const contextWindow = ConversationContextWindow.create({
        maxTokens: 10000,
        systemPromptTokens: 500,
        responseReservedTokens: 2000,
        summaryTokens: 200
      });

      const available = contextWindow.getAvailableTokensForMessages();
      expect(available).toBe(7300); // 10000 - 500 - 2000 - 200
    });

    it('should return minimal tokens when close to limit', () => {
      const contextWindow = ConversationContextWindow.create({
        maxTokens: 1000,
        systemPromptTokens: 300,
        responseReservedTokens: 400,
        summaryTokens: 200
      });

      const available = contextWindow.getAvailableTokensForMessages();
      expect(available).toBe(100); // 1000 - 300 - 400 - 200 = 100
    });

    it('should return 0 when exactly at limit', () => {
      const contextWindow = ConversationContextWindow.create({
        maxTokens: 1000,
        systemPromptTokens: 300,
        responseReservedTokens: 500,
        summaryTokens: 200
      });

      const available = contextWindow.getAvailableTokensForMessages();
      expect(available).toBe(0); // 1000 - 300 - 500 - 200 = 0
    });
  });

  describe('getAllocation', () => {
    it('should return correct token allocation breakdown', () => {
      const contextWindow = ConversationContextWindow.create({
        maxTokens: 10000,
        systemPromptTokens: 500,
        responseReservedTokens: 2000,
        summaryTokens: 200
      });

      const allocation = contextWindow.getAllocation();
      
      expect(allocation).toEqual({
        systemPrompt: 500,
        conversationSummary: 200,
        recentMessages: 7300,
        responseReserved: 2000,
        total: 10000
      });
    });
  });

  describe('shouldSummarize', () => {
    it('should return true when current tokens exceed available', () => {
      const contextWindow = ConversationContextWindow.create({
        maxTokens: 5000,
        systemPromptTokens: 500,
        responseReservedTokens: 1500,
        summaryTokens: 200
      });

      const shouldSummarize = contextWindow.shouldSummarize(3000); // Available: 2800
      expect(shouldSummarize).toBe(true);
    });

    it('should return false when current tokens fit within available', () => {
      const contextWindow = ConversationContextWindow.create({
        maxTokens: 5000,
        systemPromptTokens: 500,
        responseReservedTokens: 1500,
        summaryTokens: 200
      });

      const shouldSummarize = contextWindow.shouldSummarize(2000); // Available: 2800
      expect(shouldSummarize).toBe(false);
    });
  });

  describe('getTokensToSummarize', () => {
    it('should calculate tokens to summarize with 50% buffer', () => {
      const contextWindow = ConversationContextWindow.create({
        maxTokens: 5000,
        systemPromptTokens: 500,
        responseReservedTokens: 1500,
        summaryTokens: 200
      });

      // Available: 2800, Current: 3800, Excess: 1000
      const tokensToSummarize = contextWindow.getTokensToSummarize(3800);
      expect(tokensToSummarize).toBe(1500); // 1000 * 1.5
    });

    it('should return 0 when no summarization needed', () => {
      const contextWindow = ConversationContextWindow.create({
        maxTokens: 5000,
        systemPromptTokens: 500,
        responseReservedTokens: 1500,
        summaryTokens: 200
      });

      const tokensToSummarize = contextWindow.getTokensToSummarize(2000);
      expect(tokensToSummarize).toBe(0);
    });
  });
}); 