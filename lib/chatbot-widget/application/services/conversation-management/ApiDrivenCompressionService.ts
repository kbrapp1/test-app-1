/**
 * API-Driven Compression Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Handle conversation compression using API intelligence
 * - Replace complex domain compression with simple API-driven summarization
 * - Follow @golden-rule patterns: Keep under 250 lines, delegate operations
 * - Use 85% token utilization threshold for compression trigger
 * - Preserve business entities and recent context during compression
 * - Implement 2025 best practice: API handles summarization, not domain logic
 */

import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { BusinessRuleViolationError } from '../../../domain/errors/ChatbotWidgetDomainErrors';

export interface CompressionConfig {
  tokenThresholdPercentage: number;  // Default: 85%
  maxTokenLimit: number;             // Model-specific limit
  recentTurnsToPreserve: number;     // Default: 6 turns (12 messages)
  summaryInstructionPrompt: string;  // Custom summarization instruction
}

export interface CompressionResult {
  conversationSummary: string;
  recentMessages: ChatMessage[];
  originalTokenCount: number;
  compressedTokenCount: number;
  compressionRatio: number;
  wasCompressed: boolean;
}

export interface TokenAnalysis {
  currentTokens: number;
  maxTokens: number;
  utilizationPercentage: number;
  needsCompression: boolean;
  tokensToSave: number;
}

/**
 * Simple API-driven compression service
 * Leverages AI intelligence instead of complex domain rules
 */
export class ApiDrivenCompressionService {
  private static readonly DEFAULT_CONFIG: CompressionConfig = {
    tokenThresholdPercentage: 85,
    maxTokenLimit: 16000,          // GPT-4o default
    recentTurnsToPreserve: 6,      // 6 turns = 12 messages  
    summaryInstructionPrompt: `Summarize this conversation preserving:
- All business entities (company, role, budget, timeline, pain points)
- Key decisions made and commitments given
- Important context for lead qualification
- Main topics discussed and user intentions
- Current conversation flow and next steps needed

Focus on business-critical information that affects future responses.`
  };

  /** Analyze current token usage and determine if compression is needed */
  static analyzeTokenUsage(
    messages: ChatMessage[],
    config: Partial<CompressionConfig> = {}
  ): TokenAnalysis {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    // Simple token estimation: ~4 characters per token
    const currentTokens = this.estimateTokenCount(messages);
    const utilizationPercentage = (currentTokens / fullConfig.maxTokenLimit) * 100;
    const needsCompression = utilizationPercentage >= fullConfig.tokenThresholdPercentage;
    
    const tokensToSave = needsCompression 
      ? Math.ceil(currentTokens - (fullConfig.maxTokenLimit * 0.6)) // Target 60% utilization
      : 0;

    return {
      currentTokens,
      maxTokens: fullConfig.maxTokenLimit,
      utilizationPercentage,
      needsCompression,
      tokensToSave
    };
  }

  /** Compress conversation using API summarization */
  static async compressConversation(
    messages: ChatMessage[],
    aiSummarizationFunction: (messages: ChatMessage[], instruction: string) => Promise<string>,
    config: Partial<CompressionConfig> = {}
  ): Promise<CompressionResult> {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    const analysis = this.analyzeTokenUsage(messages, fullConfig);

    // Validate input first (before checking compression need)
    this.validateCompressionInput(messages, fullConfig);

    // If no compression needed, return original messages
    if (!analysis.needsCompression) {
      return {
        conversationSummary: '',
        recentMessages: messages,
        originalTokenCount: analysis.currentTokens,
        compressedTokenCount: analysis.currentTokens,
        compressionRatio: 1.0,
        wasCompressed: false
      };
    }

    // Calculate preservation boundary
    const messagesToPreserve = fullConfig.recentTurnsToPreserve * 2; // 2 messages per turn
    
    if (messages.length <= messagesToPreserve) {
      // Not enough messages to compress meaningfully
      return {
        conversationSummary: '',
        recentMessages: messages,
        originalTokenCount: analysis.currentTokens,
        compressedTokenCount: analysis.currentTokens,
        compressionRatio: 1.0,
        wasCompressed: false
      };
    }

    // Split messages: older (compress) + recent (preserve)
    const messagesToCompress = messages.slice(0, -messagesToPreserve);
    const recentMessages = messages.slice(-messagesToPreserve);

    // Generate API-driven summary
    const conversationSummary = await aiSummarizationFunction(
      messagesToCompress,
      fullConfig.summaryInstructionPrompt
    );

    // Calculate compression metrics
    const originalTokenCount = analysis.currentTokens;
    const recentTokenCount = this.estimateTokenCount(recentMessages);
    const summaryTokenCount = this.estimateTokenCount([{ content: conversationSummary } as ChatMessage]);
    const compressedTokenCount = recentTokenCount + summaryTokenCount;
    const compressionRatio = compressedTokenCount / originalTokenCount;

    return {
      conversationSummary,
      recentMessages,
      originalTokenCount,
      compressedTokenCount,
      compressionRatio,
      wasCompressed: true
    };
  }

  /**
   * Build conversation context with compression applied
   * 
   * AI INSTRUCTIONS:
   * - Create final message array for API consumption
   * - Include summary as system context if compression occurred
   * - Maintain proper message structure for OpenAI format
   */
  static buildCompressedContext(
    compressionResult: CompressionResult,
    systemPrompt: string
  ): Array<{ role: string; content: string }> {
    const messages: Array<{ role: string; content: string }> = [];

    // Add system prompt (enhanced with summary if compressed)
    if (compressionResult.wasCompressed && compressionResult.conversationSummary) {
      const enhancedSystemPrompt = `${systemPrompt}

CONVERSATION CONTEXT SUMMARY:
${compressionResult.conversationSummary}

This summary contains earlier conversation context. Use it to maintain context continuity while focusing on the recent messages below.`;
      
      messages.push({ role: 'system', content: enhancedSystemPrompt });
    } else {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // Add recent messages (never compressed)
    compressionResult.recentMessages.forEach(msg => {
      messages.push({
        role: msg.messageType === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    });

    return messages;
  }

  /**
   * Simple token estimation
   * AI INSTRUCTIONS: Use rough 4-character-per-token estimation for simplicity
   */
  private static estimateTokenCount(messages: ChatMessage[]): number {
    const totalChars = messages.reduce((sum, msg) => sum + msg.content.length, 0);
    return Math.ceil(totalChars / 4); // Rough estimation: 4 chars per token
  }

  /**
   * Validate compression input
   * AI INSTRUCTIONS: Use domain error types for business rule violations
   */
  private static validateCompressionInput(
    messages: ChatMessage[],
    config: CompressionConfig
  ): void {
    if (!messages || messages.length === 0) {
      throw new BusinessRuleViolationError(
        'Cannot compress empty conversation',
        { messageCount: messages?.length || 0 }
      );
    }

    if (config.recentTurnsToPreserve < 1) {
      throw new BusinessRuleViolationError(
        'Must preserve at least 1 recent conversation turn',
        { recentTurnsToPreserve: config.recentTurnsToPreserve }
      );
    }

    if (config.tokenThresholdPercentage < 50 || config.tokenThresholdPercentage > 95) {
      throw new BusinessRuleViolationError(
        'Token threshold must be between 50% and 95%',
        { tokenThresholdPercentage: config.tokenThresholdPercentage }
      );
    }
  }
} 