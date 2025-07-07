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
import { MessageCostCalculationService } from '../../../domain/services/utilities/MessageCostCalculationService';
import { ErrorTrackingFacade } from '../ErrorTrackingFacade';

export class UnifiedResponseProcessorService {
  constructor(
    private readonly messageRepository: IChatMessageRepository,
    private readonly errorTrackingFacade: ErrorTrackingFacade
  ) {}

  /**
   * Create bot message from unified processing result
   * 
   * AI INSTRUCTIONS:
   * - Extract response content and metadata from unified result
   * - Include token usage and cost tracking
   * - Handle entity extraction and validation
   * - Save message to repository with logging context
   * - Pass proper context for error tracking RLS compliance
   */
  async createBotMessageFromUnifiedResult(
    session: any,
    unifiedResult: any,
    logFileName: string,
    config: any
  ): Promise<ChatMessage> {
    // Safely extract response content with multiple fallback paths
    let responseContent = unifiedResult?.response?.content || 
                         unifiedResult?.analysis?.response?.content ||
                         unifiedResult?.choices?.[0]?.message?.function_call?.arguments?.response?.content;
    
    // Parse function_call arguments if needed
    if (!responseContent && unifiedResult?.choices?.[0]?.message?.function_call?.arguments) {
      try {
        const functionArgs = JSON.parse(unifiedResult.choices[0].message.function_call.arguments);
        responseContent = functionArgs?.response?.content;
      } catch (parseError) {
        // Continue to fallback if parsing fails
      }
    }
    
    // Track fallback error if response content is missing
    if (!responseContent) {
      await this.errorTrackingFacade.trackResponseExtractionFallback(
        unifiedResult,
        session.id,
        null, // Chatbot widget visitors are not authenticated users, so user_id should be null
        config.organizationId // Use organizationId from chatbot config (always available)
      );
      
      responseContent = "I'm having trouble processing your message right now, but I'm here to help! Please try again in a moment.";
    }
    
    // Safely extract confidence with fallback from multiple paths
    let confidence = unifiedResult?.analysis?.primaryConfidence || 0;
    
    // Try parsing from function call if not in direct path
    if (confidence === 0 && unifiedResult?.choices?.[0]?.message?.function_call?.arguments) {
      try {
        const functionArgs = JSON.parse(unifiedResult.choices[0].message.function_call.arguments);
        confidence = functionArgs?.analysis?.primaryConfidence || 0;
      } catch (parseError) {
        // Use default confidence
      }
    }

    // Extract token usage from unified result
    const tokenUsage = this.extractTokenUsage(unifiedResult);
    
    // Extract entity data from unified analysis with multiple paths
    let entities = unifiedResult?.analysis?.entities || {};
    if (Object.keys(entities).length === 0 && unifiedResult?.choices?.[0]?.message?.function_call?.arguments) {
      try {
        const functionArgs = JSON.parse(unifiedResult.choices[0].message.function_call.arguments);
        entities = functionArgs?.analysis?.entities || {};
      } catch (parseError) {
        // Use empty entities
      }
    }
    const entitiesExtracted = this.extractEntitiesFromUnified(entities);
    
    // Extract primary intent with multiple paths
    let primaryIntent = unifiedResult?.analysis?.primaryIntent || 'unified_processing';
    if (primaryIntent === 'unified_processing' && unifiedResult?.choices?.[0]?.message?.function_call?.arguments) {
      try {
        const functionArgs = JSON.parse(unifiedResult.choices[0].message.function_call.arguments);
        primaryIntent = functionArgs?.analysis?.primaryIntent || 'unified_processing';
      } catch (parseError) {
        // Use default intent
      }
    }
    
    // Create bot message with full metadata using factory service
    let botMessage = ChatMessageFactoryService.createBotMessageWithFullMetadata(
      session.id,
      responseContent,
      unifiedResult?.model || 'gpt-4o-mini',
      tokenUsage.promptTokens,
      tokenUsage.completionTokens,
      confidence,
      primaryIntent,
      entitiesExtracted,
      0 // processingTime - will be calculated by provider
    );

    // Add cost tracking using domain service
    if (tokenUsage.promptTokens > 0 || tokenUsage.completionTokens > 0) {
      const model = unifiedResult?.model || 'gpt-4o-mini';
      const costBreakdown = MessageCostCalculationService.calculateCostBreakdown(
        model,
        tokenUsage.promptTokens,
        tokenUsage.completionTokens
      );
      
      botMessage = botMessage.addCostTracking(costBreakdown.totalCents, costBreakdown);
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

    return Object.entries(entities)
      .filter(([type, value]) => {
        // Filter out entries with empty or invalid types/values
        return type && type.trim() && 
               value && 
               String(value).trim() && 
               String(value).trim() !== 'null' && 
               String(value).trim() !== 'undefined';
      })
      .map(([type, value]) => ({
        type: type.trim(),
        value: String(value).trim(),
        confidence: 0.9, // Unified API doesn't provide per-entity confidence
        start: undefined, // Position data not available from unified API
        end: undefined
      }));
  }
} 