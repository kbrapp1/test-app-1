/**
 * Unified Response Processor Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Process unified AI results into bot messages
 * - Handle token usage extraction and cost calculation
 * - Keep under 200-250 lines following @golden-rule patterns
 * - Focus on response processing only
 * - Follow DDD application service patterns
 */

import { ChatMessage } from '../../../domain/entities/ChatMessage';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { ChatMessageFactoryService } from '../../../domain/services/utilities/ChatMessageFactoryService';

export class UnifiedResponseProcessorService {
  constructor(
    private readonly messageRepository: IChatMessageRepository
  ) {}

  /**
   * Create bot message from unified processing result
   * 
   * AI INSTRUCTIONS:
   * - Extract response content and metadata from unified result
   * - Include token usage and cost tracking
   * - Handle entity extraction and validation
   * - Save message to repository with logging context
   */
  async createBotMessageFromUnifiedResult(
    session: any,
    unifiedResult: any,
    logFileName: string
  ): Promise<ChatMessage> {
    // Safely extract response content with fallback
    const responseContent = unifiedResult?.response?.content || 
      "I'm having trouble processing your message right now, but I'm here to help! Please try again in a moment.";
    
    // Safely extract confidence with fallback
    const confidence = unifiedResult?.analysis?.primaryConfidence || 0;

    // Extract token usage from unified result
    const tokenUsage = this.extractTokenUsage(unifiedResult);
    
    // Extract entity data from unified analysis
    const entitiesExtracted = this.extractEntitiesFromUnified(unifiedResult?.analysis?.entities);
    
    // Create bot message with full metadata using factory service
    let botMessage = ChatMessageFactoryService.createBotMessageWithFullMetadata(
      session.id,
      responseContent,
      unifiedResult?.model || 'gpt-4o-mini',
      tokenUsage.promptTokens,
      tokenUsage.completionTokens,
      confidence,
      unifiedResult?.analysis?.primaryIntent || 'unified_processing',
      entitiesExtracted,
      0 // processingTime - will be calculated by provider
    );

    // Add cost tracking using token usage
    if (tokenUsage.promptTokens > 0 || tokenUsage.completionTokens > 0) {
      const costCents = this.calculateCostFromTokens(
        tokenUsage.promptTokens,
        tokenUsage.completionTokens,
        unifiedResult?.model || 'gpt-4o-mini'
      );
      
      botMessage = botMessage.addCostTracking(costCents, {
        promptTokensCents: (tokenUsage.promptTokens / 1000) * 0.00015 * 100,
        completionTokensCents: (tokenUsage.completionTokens / 1000) * 0.0006 * 100,
        totalCents: costCents,
        displayCents: Math.round(costCents * 10000) / 10000,
        modelRate: 0.00015
      });
    }

    // Save bot message to database with shared log file context
    await this.messageRepository.save(botMessage, logFileName);
    return botMessage;
  }

  /**
   * Extract token usage from unified API response
   * 
   * AI INSTRUCTIONS:
   * - Extract prompt and completion tokens safely
   * - Provide fallback values if usage data missing
   * - Return structured token usage object
   */
  private extractTokenUsage(unifiedResult: any): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } {
    const promptTokens = unifiedResult?.usage?.prompt_tokens || 0;
    const completionTokens = unifiedResult?.usage?.completion_tokens || 0;
    const totalTokens = unifiedResult?.usage?.total_tokens || promptTokens + completionTokens;

    return {
      promptTokens,
      completionTokens,
      totalTokens
    };
  }

  /**
   * Extract entities from unified API response into factory service format
   * 
   * AI INSTRUCTIONS:
   * - Transform unified API entity structure to factory service format
   * - Handle missing or malformed entity data gracefully
   * - Follow @golden-rule patterns for data transformation
   * - Use the format expected by ChatMessageFactoryService
   */
  private extractEntitiesFromUnified(entities: any): Array<{
    type: string;
    value: string;
    confidence: number;
    start?: number;
    end?: number;
  }> {
    if (!entities || typeof entities !== 'object') {
      return [];
    }

    return Object.entries(entities).map(([type, value]) => ({
      type,
      value: String(value),
      confidence: 0.9, // Unified API doesn't provide per-entity confidence
      start: undefined, // Position data not available from unified API
      end: undefined
    }));
  }

  /**
   * Calculate cost from token usage using GPT-4o-mini pricing
   * 
   * AI INSTRUCTIONS:
   * - Use correct GPT-4o-mini pricing rates
   * - Return cost in cents for precision
   * - Handle different model pricing if needed
   */
  private calculateCostFromTokens(
    promptTokens: number,
    completionTokens: number,
    model: string
  ): number {
    // GPT-4o-mini pricing (per 1K tokens)
    const promptRate = 0.00015; // $0.15 per 1K tokens
    const completionRate = 0.0006; // $0.60 per 1K tokens
    
    const promptCost = (promptTokens / 1000) * promptRate;
    const completionCost = (completionTokens / 1000) * completionRate;
    const totalCostDollars = promptCost + completionCost;
    
    return totalCostDollars * 100; // Convert to cents
  }
} 