/**
 * Retention Strategy Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Generate retention strategies and compression recommendations
 * - Pure domain service with retention optimization focus
 * - Follow @golden-rule patterns exactly
 * - Provide actionable retention strategies
 * - Keep under 150 lines - focused implementation
 */

import { ChatMessage } from '../../entities/ChatMessage';
import { BusinessRuleViolationError } from '../../errors/ChatbotWidgetDomainErrors';
import { 
  CategorizedMessages, 
  RetentionRecommendation,
  ScoredMessage,
  PrioritizedMessages
} from './types/RelevanceTypes';

/**
 * Domain Service for retention strategy and compression recommendations
 * Provides intelligent retention decisions based on message prioritization
 */
export class RetentionStrategyService {
  
  /**
   * Generate retention recommendation based on prioritization
   * 
   * AI INSTRUCTIONS:
   * - Provide actionable retention strategy
   * - Prioritize critical and high-value messages
   * - Balance retention limits with business value
   */
  static generateRetentionRecommendation(
    categorized: CategorizedMessages,
    maxRetentionMessages: number
  ): RetentionRecommendation {
    this.validateRetentionInput(categorized, maxRetentionMessages);
    
    const allMessages = [
      ...categorized.critical,
      ...categorized.high,
      ...categorized.medium,
      ...categorized.low
    ];
    
    if (allMessages.length <= maxRetentionMessages) {
      return {
        shouldCompress: false,
        messagesToCompress: [],
        messagesToRetain: allMessages.map(s => s.message)
      };
    }
    
    // Retain based on priority, up to max limit
    const messagesToRetain = allMessages.slice(0, maxRetentionMessages);
    const messagesToCompress = allMessages.slice(maxRetentionMessages);
    
    return {
      shouldCompress: messagesToCompress.length > 0,
      messagesToCompress: messagesToCompress.map(s => s.message),
      messagesToRetain: messagesToRetain.map(s => s.message)
    };
  }
  
  /**
   * Generate prioritized messages structure
   * 
   * AI INSTRUCTIONS:
   * - Combine categorization with retention recommendations
   * - Calculate total relevance score for analytics
   * - Provide complete prioritization result
   */
  static generatePrioritizedMessages(
    categorized: CategorizedMessages,
    maxRetentionMessages: number
  ): PrioritizedMessages {
    this.validateRetentionInput(categorized, maxRetentionMessages);
    
    // Generate retention recommendation
    const retentionRecommendation = this.generateRetentionRecommendation(
      categorized,
      maxRetentionMessages
    );
    
    // Calculate total relevance score for analytics
    const allScoredMessages = [
      ...categorized.critical,
      ...categorized.high,
      ...categorized.medium,
      ...categorized.low
    ];
    
    const totalRelevanceScore = allScoredMessages.length > 0
      ? allScoredMessages.reduce((sum, scored) => sum + scored.score.overallScore, 0) / allScoredMessages.length
      : 0;
    
    return {
      criticalMessages: categorized.critical.map(s => s.message),
      highPriorityMessages: categorized.high.map(s => s.message),
      mediumPriorityMessages: categorized.medium.map(s => s.message),
      lowPriorityMessages: categorized.low.map(s => s.message),
      totalRelevanceScore,
      retentionRecommendation
    };
  }
  
  /**
   * Calculate retention statistics
   * 
   * AI INSTRUCTIONS:
   * - Provide retention analytics and insights
   * - Calculate distribution across priority levels
   * - Support retention optimization decisions
   */
  static calculateRetentionStatistics(categorized: CategorizedMessages): {
    totalMessages: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    averageScore: number;
    retentionDistribution: Record<string, number>;
  } {
    const allMessages = [
      ...categorized.critical,
      ...categorized.high,
      ...categorized.medium,
      ...categorized.low
    ];
    
    const totalMessages = allMessages.length;
    const averageScore = totalMessages > 0
      ? allMessages.reduce((sum, scored) => sum + scored.score.overallScore, 0) / totalMessages
      : 0;
    
    return {
      totalMessages,
      criticalCount: categorized.critical.length,
      highCount: categorized.high.length,
      mediumCount: categorized.medium.length,
      lowCount: categorized.low.length,
      averageScore,
      retentionDistribution: {
        critical: totalMessages > 0 ? categorized.critical.length / totalMessages : 0,
        high: totalMessages > 0 ? categorized.high.length / totalMessages : 0,
        medium: totalMessages > 0 ? categorized.medium.length / totalMessages : 0,
        low: totalMessages > 0 ? categorized.low.length / totalMessages : 0
      }
    };
  }
  
  /**
   * Optimize retention strategy based on context limits
   * 
   * AI INSTRUCTIONS:
   * - Apply intelligent retention optimization
   * - Balance business value with technical constraints
   * - Provide adaptive retention strategies
   */
  static optimizeRetentionStrategy(
    categorized: CategorizedMessages,
    maxRetentionMessages: number,
    contextLimits: { maxTokens?: number; maxMessages?: number }
  ): RetentionRecommendation {
    // Use the more restrictive limit
    const effectiveLimit = Math.min(
      maxRetentionMessages,
      contextLimits.maxMessages || maxRetentionMessages
    );
    
    // Always retain critical messages first
    const criticalMessages = categorized.critical.slice(0, effectiveLimit);
    let remainingSlots = effectiveLimit - criticalMessages.length;
    
    // Then high priority messages
    const highMessages = categorized.high.slice(0, remainingSlots);
    remainingSlots -= highMessages.length;
    
    // Then medium priority messages
    const mediumMessages = categorized.medium.slice(0, remainingSlots);
    remainingSlots -= mediumMessages.length;
    
    // Finally low priority messages if slots remain
    const lowMessages = categorized.low.slice(0, remainingSlots);
    
    const retainedMessages = [
      ...criticalMessages,
      ...highMessages,
      ...mediumMessages,
      ...lowMessages
    ];
    
    const allMessages = [
      ...categorized.critical,
      ...categorized.high,
      ...categorized.medium,
      ...categorized.low
    ];
    
    const compressedMessages = allMessages.filter(
      scored => !retainedMessages.includes(scored)
    );
    
    return {
      shouldCompress: compressedMessages.length > 0,
      messagesToCompress: compressedMessages.map(s => s.message),
      messagesToRetain: retainedMessages.map(s => s.message)
    };
  }
  
  /**
   * Validation for retention input
   * 
   * AI INSTRUCTIONS:
   * - Use domain-specific error handling
   * - Validate categorized messages and limits
   * - Provide clear error messages
   */
  private static validateRetentionInput(
    categorized: CategorizedMessages,
    maxRetentionMessages: number
  ): void {
    if (!categorized) {
      throw new BusinessRuleViolationError(
        'Categorized messages are required for retention strategy',
        { categorized: null }
      );
    }
    
    if (maxRetentionMessages < 1) {
      throw new BusinessRuleViolationError(
        'Maximum retention messages must be at least 1',
        { maxRetentionMessages }
      );
    }
  }
} 