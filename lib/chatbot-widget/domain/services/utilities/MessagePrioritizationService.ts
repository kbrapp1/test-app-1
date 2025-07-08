/**
 * Message Prioritization Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Prioritize and categorize messages
 * - Pure domain service with message organization focus
 * - Follow @golden-rule patterns exactly
 * - Orchestrate scoring and categorization logic
 * - Keep under 200 lines - focused implementation
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';
import { 
  RelevanceScore, 
  RelevanceContext, 
  ScoredMessage, 
  CategorizedMessages,
  ComponentScores
} from './types/RelevanceTypes';
import { RecencyScoreService } from './RecencyScoreService';
import { EntityRelevanceScoreService } from './EntityRelevanceScoreService';
import { IntentAlignmentScoreService } from './IntentAlignmentScoreService';
import { BusinessContextScoreService } from './BusinessContextScoreService';
import { EngagementScoreService } from './EngagementScoreService';

/**
 * Domain Service for message prioritization and categorization
 * Orchestrates scoring services to provide message relevance assessment
 */
export class MessagePrioritizationService {
  
  /** Scoring weights for overall relevance calculation */
  private static readonly SCORING_WEIGHTS = {
    recency: 0.2,           // Reduced from traditional 0.4
    entityRelevance: 0.25,  // High weight for business entities
    intentAlignment: 0.2,   // Important for conversation flow
    businessContext: 0.25,  // High weight for qualification signals
    engagement: 0.1         // Moderate weight for engagement
  };
  
  /** Score message relevance for intelligent context management */
  static scoreMessageRelevance(
    message: ChatMessage,
    context: RelevanceContext,
    messagePosition: number,
    totalMessages: number
  ): RelevanceScore {
    this.validateRelevanceInput(message, context);
    
    // Calculate component scores using specialized services
    const componentScores: ComponentScores = {
      recencyScore: RecencyScoreService.calculateRecencyScore(messagePosition, totalMessages),
      entityRelevanceScore: EntityRelevanceScoreService.calculateEntityRelevanceScore(
        message, 
        context.businessEntities
      ),
      intentAlignmentScore: IntentAlignmentScoreService.calculateIntentAlignmentScore(
        message, 
        context.currentIntent
      ),
      businessContextScore: BusinessContextScoreService.calculateBusinessContextScore(
        message, 
        context.leadScore, 
        context.conversationPhase
      ),
      engagementScore: EngagementScoreService.calculateEngagementScore(message)
    };
    
    // Calculate weighted overall score
    const overallScore = this.calculateWeightedOverallScore(componentScores);
    
    // Determine retention priority and reasons
    const retentionPriority = this.determineRetentionPriority(overallScore);
    const reasonsForRetention = this.generateRetentionReasons(componentScores);
    
    return {
      messageId: message.id,
      overallScore,
      componentScores,
      retentionPriority,
      reasonsForRetention
    };
  }
  
  /** Score all messages in a conversation */
  static scoreAllMessages(
    messages: ChatMessage[],
    context: RelevanceContext
  ): ScoredMessage[] {
    this.validatePrioritizationInput(messages, context);
    
    // Score all messages
    const scoredMessages = messages.map((message, index) => ({
      message,
      score: this.scoreMessageRelevance(message, context, index, messages.length)
    }));
    
    // Sort by overall relevance score (descending)
    scoredMessages.sort((a, b) => b.score.overallScore - a.score.overallScore);
    
    return scoredMessages;
  }
  
  /** Categorize messages by priority levels */
  static categorizeMessagesByPriority(scoredMessages: ScoredMessage[]): CategorizedMessages {
    return {
      critical: scoredMessages.filter(s => s.score.retentionPriority === 'critical'),
      high: scoredMessages.filter(s => s.score.retentionPriority === 'high'),
      medium: scoredMessages.filter(s => s.score.retentionPriority === 'medium'),
      low: scoredMessages.filter(s => s.score.retentionPriority === 'low')
    };
  }
  
  /** Calculate weighted overall score from component scores */
  private static calculateWeightedOverallScore(componentScores: ComponentScores): number {
    return (
      componentScores.recencyScore * this.SCORING_WEIGHTS.recency +
      componentScores.entityRelevanceScore * this.SCORING_WEIGHTS.entityRelevance +
      componentScores.intentAlignmentScore * this.SCORING_WEIGHTS.intentAlignment +
      componentScores.businessContextScore * this.SCORING_WEIGHTS.businessContext +
      componentScores.engagementScore * this.SCORING_WEIGHTS.engagement
    );
  }
  
  /** Determine retention priority based on overall score */
  private static determineRetentionPriority(overallScore: number): 'critical' | 'high' | 'medium' | 'low' {
    if (overallScore >= 0.8) return 'critical';
    if (overallScore >= 0.6) return 'high';
    if (overallScore >= 0.4) return 'medium';
    return 'low';
  }
  
  /**
   * Generate human-readable reasons for retention
   * 
   * AI INSTRUCTIONS:
   * - Provide clear explanations for debugging and optimization
   * - Use component scores to determine reasons
   * - Return meaningful retention justifications
   */
  private static generateRetentionReasons(componentScores: ComponentScores): string[] {
    const reasons: string[] = [];
    
    if (componentScores.recencyScore > 0.8) reasons.push('Recent message');
    if (componentScores.entityRelevanceScore > 0.5) reasons.push('Contains business entities');
    if (componentScores.intentAlignmentScore > 0.6) reasons.push('Aligns with current intent');
    if (componentScores.businessContextScore > 0.5) reasons.push('High business value');
    if (componentScores.engagementScore > 0.5) reasons.push('High engagement indicators');
    
    return reasons.length > 0 ? reasons : ['Low overall relevance'];
  }
  
  /**
   * Validation for relevance scoring input
   * 
   * AI INSTRUCTIONS:
   * - Use domain-specific error handling
   * - Validate required parameters
   * - Provide clear error messages
   */
  private static validateRelevanceInput(message: ChatMessage, context: RelevanceContext): void {
    if (!message) {
      throw new BusinessRuleViolationError(
        'Cannot score relevance of null message',
        { messageId: 'unknown' }
      );
    }
    
    if (!context) {
      throw new BusinessRuleViolationError(
        'Relevance context is required for scoring',
        { messageId: message.id }
      );
    }
  }
  
  /**
   * Validation for message prioritization input
   * 
   * AI INSTRUCTIONS:
   * - Ensure valid input for prioritization process
   * - Check message list and context validity
   * - Provide specific error context
   */
  private static validatePrioritizationInput(messages: ChatMessage[], context: RelevanceContext): void {
    if (!messages || messages.length === 0) {
      throw new BusinessRuleViolationError(
        'Cannot prioritize empty message list',
        { messageCount: messages?.length || 0 }
      );
    }
    
    if (context.maxRetentionMessages < 1) {
      throw new BusinessRuleViolationError(
        'Maximum retention messages must be at least 1',
        { maxRetentionMessages: context.maxRetentionMessages }
      );
    }
  }
} 