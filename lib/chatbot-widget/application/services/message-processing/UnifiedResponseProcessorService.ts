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
import { ChatSession } from '../../../domain/entities/ChatSession';
import { ChatbotConfig } from '../../../domain/entities/ChatbotConfig';
import { IChatMessageRepository } from '../../../domain/repositories/IChatMessageRepository';
import { ChatMessageFactoryService } from '../../../domain/services/utilities/ChatMessageFactoryService';
import { MessageCostCalculationService } from '../../../domain/services/utilities/MessageCostCalculationService';
import { ErrorTrackingFacade } from '../ErrorTrackingFacade';
import { WorkflowBoundaryMapper } from '../../mappers/WorkflowBoundaryMapper';

export class UnifiedResponseProcessorService {
  constructor(
    private readonly messageRepository: IChatMessageRepository,
    private readonly errorTrackingFacade: ErrorTrackingFacade
  ) {}

  // Create bot message from unified processing result
  async createBotMessageFromUnifiedResult(
    session: ChatSession,
    unifiedResult: Record<string, unknown>,
    logFileName: string,
    config: ChatbotConfig
  ): Promise<ChatMessage> {
    // Use boundary mapper for type-safe extraction
    const workflowResponse = WorkflowBoundaryMapper.toWorkflowResponse(unifiedResult);
    const unifiedAnalysis = WorkflowBoundaryMapper.toUnifiedAnalysis(unifiedResult);
    
    // Track fallback error if response content is using fallback
    if (workflowResponse.content.includes("I'm having trouble processing")) {
      await this.errorTrackingFacade.trackMessageProcessingError(
        'Response content extraction failed - using fallback response',
        {
          sessionId: session.id,
          organizationId: config.organizationId,
          metadata: {
            unifiedResult: JSON.stringify(unifiedResult),
            errorType: 'response_extraction_fallback',
            timestamp: new Date().toISOString()
          }
        }
      );
    }
    
    // Extract entities from analysis
    const entitiesExtracted = this.extractEntitiesFromUnified(unifiedAnalysis.entities);
    
    // Create bot message with full metadata using factory service
    let botMessage = ChatMessageFactoryService.createBotMessageWithFullMetadata(
      session.id,
      workflowResponse.content,
      workflowResponse.model || 'gpt-4o-mini',
      workflowResponse.tokenUsage.promptTokens,
      workflowResponse.tokenUsage.completionTokens,
      workflowResponse.confidence,
      unifiedAnalysis.primaryIntent,
      entitiesExtracted,
      0 // processingTime calculated by provider
    );

    // Add cost tracking using domain service
    if (workflowResponse.tokenUsage.promptTokens > 0 || workflowResponse.tokenUsage.completionTokens > 0) {
      const costBreakdown = MessageCostCalculationService.calculateCostBreakdown(
        workflowResponse.model || 'gpt-4o-mini',
        workflowResponse.tokenUsage.promptTokens,
        workflowResponse.tokenUsage.completionTokens
      );
      
      botMessage = botMessage.addCostTracking(costBreakdown.totalCents, costBreakdown);
    }

    // Save bot message with shared log file context
    await this.messageRepository.save(botMessage, logFileName);
    return botMessage;
  }

  // Extract token usage from unified API response
  private extractTokenUsage(unifiedResult: Record<string, unknown>): {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  } {
    const usage = unifiedResult.usage as { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined;
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    const totalTokens = usage?.total_tokens || promptTokens + completionTokens;

    return {
      promptTokens,
      completionTokens,
      totalTokens
    };
  }

  // Extract entities from unified API response into factory service format
  private extractEntitiesFromUnified(entities: unknown): Array<{
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
        start: undefined, // Position data not available
        end: undefined
      }));
  }
} 