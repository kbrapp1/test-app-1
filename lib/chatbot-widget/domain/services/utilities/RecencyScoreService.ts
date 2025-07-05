/**
 * Recency Score Domain Service
 * 
 * AI INSTRUCTIONS:
 * - Single responsibility: Calculate message recency scores
 * - Pure domain service with no external dependencies
 * - Follow @golden-rule patterns exactly
 * - Use exponential decay for recency scoring
 * - Keep under 100 lines - focused implementation
 */

/**
 * Domain Service for calculating message recency scores
 * Implements exponential decay algorithm for time-based relevance
 */
export class RecencyScoreService {
  
  /**
   * Calculate recency score - more recent messages score higher
   * 
   * AI INSTRUCTIONS:
   * - Implement exponential decay for recency scoring
   * - Position 0 = most recent, higher positions = older
   * - Return score between 0.0 and 1.0
   */
  static calculateRecencyScore(position: number, totalMessages: number): number {
    if (totalMessages <= 1) return 1.0;
    
    // Position from end (0 = most recent, totalMessages-1 = oldest)
    const positionFromEnd = totalMessages - 1 - position;
    
    // Exponential decay: recent messages get higher scores
    const decayFactor = 0.1; // Adjust for steeper/gentler decay
    const normalizedPosition = positionFromEnd / (totalMessages - 1);
    
    return Math.exp(-decayFactor * normalizedPosition * 10);
  }
  
  /**
   * Calculate decay factor based on conversation length
   * 
   * AI INSTRUCTIONS:
   * - Adjust decay rate based on conversation context
   * - Longer conversations need more aggressive decay
   * - Shorter conversations preserve more history
   */
  static calculateAdaptiveDecayFactor(totalMessages: number): number {
    // Base decay factor
    let decayFactor = 0.1;
    
    // Increase decay for very long conversations
    if (totalMessages > 50) {
      decayFactor = 0.15;
    } else if (totalMessages > 100) {
      decayFactor = 0.2;
    }
    
    return decayFactor;
  }
  
  /**
   * Calculate position-based score with adaptive decay
   * 
   * AI INSTRUCTIONS:
   * - Combine position scoring with adaptive decay
   * - Optimize for different conversation lengths
   * - Maintain score distribution between 0.0 and 1.0
   */
  static calculateAdaptiveRecencyScore(position: number, totalMessages: number): number {
    if (totalMessages <= 1) return 1.0;
    
    const positionFromEnd = totalMessages - 1 - position;
    const decayFactor = this.calculateAdaptiveDecayFactor(totalMessages);
    const normalizedPosition = positionFromEnd / (totalMessages - 1);
    
    return Math.exp(-decayFactor * normalizedPosition * 10);
  }
} 