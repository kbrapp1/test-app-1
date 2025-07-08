/**
 * Engagement Score Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Calculate message engagement scores
 * - Pure domain service with engagement focus
 * - Follow @golden-rule patterns exactly
 * - Focus on message substance over keywords
 * - Keep under 100 lines - focused implementation
 */

import { ChatMessage } from '../../entities/ChatMessage';

/**
 * Domain Service for calculating engagement scores
 * Scores messages based on engagement indicators and message characteristics
 */
export class EngagementScoreService {
  
  /** Message length scoring thresholds */
  private static readonly LENGTH_THRESHOLDS = {
    HIGH: 100,
    MEDIUM: 50,
    LOW: 20
  };
  
  /** Calculate engagement score based on message characteristics */
  static calculateEngagementScore(message: ChatMessage): number {
    const content = message.content;
    let engagementScore = 0.3; // Base engagement score
    
    // Message length scoring (detailed responses indicate engagement)
    if (content.length > this.LENGTH_THRESHOLDS.HIGH) {
      engagementScore += 0.4;
    } else if (content.length > this.LENGTH_THRESHOLDS.MEDIUM) {
      engagementScore += 0.3;
    } else if (content.length > this.LENGTH_THRESHOLDS.LOW) {
      engagementScore += 0.2;
    }
    
    // Question asking (indicates active engagement)
    const questionCount = (content.match(/\?/g) || []).length;
    engagementScore += Math.min(0.3, questionCount * 0.15);
    
    return Math.min(1.0, engagementScore);
  }
  
  /** Calculate message length score */
  static calculateLengthScore(messageLength: number): number {
    if (messageLength > this.LENGTH_THRESHOLDS.HIGH) {
      return 1.0;
    } else if (messageLength > this.LENGTH_THRESHOLDS.MEDIUM) {
      return 0.7;
    } else if (messageLength > this.LENGTH_THRESHOLDS.LOW) {
      return 0.4;
    }
    return 0.1;
  }
  
  /** Calculate question engagement score */
  static calculateQuestionScore(content: string): number {
    const questionCount = (content.match(/\?/g) || []).length;
    
    if (questionCount === 0) return 0.0;
    if (questionCount === 1) return 0.3;
    if (questionCount === 2) return 0.5;
    
    // Diminishing returns for excessive questions
    return Math.min(0.7, 0.5 + (questionCount - 2) * 0.1);
  }
  
  /** Calculate combined engagement score */
  static calculateCombinedEngagementScore(
    message: ChatMessage,
    customWeights?: { lengthWeight: number; questionWeight: number }
  ): number {
    const weights = customWeights || { lengthWeight: 0.7, questionWeight: 0.3 };
    
    const lengthScore = this.calculateLengthScore(message.content.length);
    const questionScore = this.calculateQuestionScore(message.content);
    
    return Math.min(1.0, 
      (lengthScore * weights.lengthWeight) + 
      (questionScore * weights.questionWeight)
    );
  }
} 