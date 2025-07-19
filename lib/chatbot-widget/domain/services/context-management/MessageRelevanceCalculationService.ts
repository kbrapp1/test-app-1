/**
 * Message Relevance Calculation Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Pure business logic for calculating message relevance scores
 * - Keep business logic pure, no external dependencies
 * - Maintain single responsibility principle  
 * - Never exceed 100 lines - focused on relevance calculations only
 * - Follow @golden-rule patterns exactly
 * - Always validate inputs using value objects
 * - Handle domain errors with specific error types
 */

import { 
  MessageRelevanceCalculationError
} from '../../errors/ChatbotWidgetDomainErrors';

export interface MessageRelevanceScore {
  readonly messageId: string;
  readonly overallScore: number;
  readonly components: {
    readonly recencyScore: number;
    readonly businessEntityRelevance: number;
    readonly conversationFlowRelevance: number;
    readonly userEngagementScore: number;
  };
  readonly retentionPriority: 'high' | 'medium' | 'low';
  readonly calculatedAt: Date;
}

export class MessageRelevanceCalculationService {
  
  /**
   * Calculate relevance score for a message using simplified AI-first approach
   * Removes hardcoded keyword matching in favor of business context
   */
  static calculateMessageRelevance(
    messageId: string,
    messagePosition: number,
    totalMessages: number,
    businessEntityCount: number,
    conversationPhase: string,
    userEngagementLevel: 'high' | 'medium' | 'low'
  ): MessageRelevanceScore {
    try {
      // Simplified scoring focused on business value, not keyword matching
      const recencyScore = this.calculateRecencyScore(messagePosition, totalMessages);
      const businessEntityRelevance = this.calculateBusinessEntityRelevance(businessEntityCount);
      const conversationFlowRelevance = this.calculateConversationFlowRelevance(conversationPhase);
      const userEngagementScore = this.calculateUserEngagementScore(userEngagementLevel);

      // Weighted scoring prioritizing business context over artificial complexity
      const overallScore = (
        recencyScore * 0.3 +
        businessEntityRelevance * 0.35 +
        conversationFlowRelevance * 0.25 +
        userEngagementScore * 0.1
      );

      const retentionPriority = this.determineRetentionPriority(overallScore);

      return {
        messageId,
        overallScore,
        components: {
          recencyScore,
          businessEntityRelevance,
          conversationFlowRelevance,
          userEngagementScore
        },
        retentionPriority,
        calculatedAt: new Date()
      };
    } catch (error) {
      throw new MessageRelevanceCalculationError(
        messageId,
        error instanceof Error ? error.message : 'Unknown calculation error',
        { messagePosition, totalMessages, businessEntityCount, conversationPhase }
      );
    }
  }

  private static calculateRecencyScore(position: number, total: number): number {
    if (total <= 1) return 1.0;
    
    // Linear decay from most recent (1.0) to oldest (0.1)
    const relativePosition = position / (total - 1);
    return Math.max(0.1, 1.0 - (relativePosition * 0.9));
  }

  private static calculateBusinessEntityRelevance(entityCount: number): number {
    // Business entities indicate valuable lead qualification data
    if (entityCount === 0) return 0.1;
    if (entityCount >= 3) return 1.0;
    
    // Scale between 0.3 and 1.0 based on entity richness
    return 0.3 + (entityCount / 3) * 0.7;
  }

  private static calculateConversationFlowRelevance(phase: string): number {
    // Phase-based relevance without hardcoded keywords
    const phaseScores: Record<string, number> = {
      'discovery': 0.8,      // High value for understanding needs
      'qualification': 1.0,   // Critical for lead assessment
      'demo': 0.9,           // Important product interaction
      'objection_handling': 0.95, // Key sales moments
      'closing': 1.0,        // Critical business outcome
      'unknown': 0.3         // Low but not zero for flexibility
    };

    return phaseScores[phase] || 0.5;
  }

  private static calculateUserEngagementScore(level: 'high' | 'medium' | 'low'): number {
    const engagementScores = {
      'high': 1.0,
      'medium': 0.6,
      'low': 0.3
    };

    return engagementScores[level];
  }

  private static determineRetentionPriority(score: number): 'high' | 'medium' | 'low' {
    if (score >= 0.7) return 'high';
    if (score >= 0.4) return 'medium';
    return 'low';
  }
}