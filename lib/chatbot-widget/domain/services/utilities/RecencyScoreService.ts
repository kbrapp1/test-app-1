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
  
  /** Calculate recency score - more recent messages score higher */
  static calculateRecencyScore(position: number, totalMessages: number): number {
    if (totalMessages <= 1) return 1.0;
    
    // Position from end (0 = most recent, totalMessages-1 = oldest)
    const positionFromEnd = totalMessages - 1 - position;
    
    // Exponential decay: recent messages get higher scores
    const decayFactor = 0.1; // Adjust for steeper/gentler decay
    const normalizedPosition = positionFromEnd / (totalMessages - 1);
    
    return Math.exp(-decayFactor * normalizedPosition * 10);
  }
  
  /** Calculate decay factor based on conversation length */
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
  
  /** Calculate position-based score with adaptive decay */
  static calculateAdaptiveRecencyScore(position: number, totalMessages: number): number {
    if (totalMessages <= 1) return 1.0;
    
    const positionFromEnd = totalMessages - 1 - position;
    const decayFactor = this.calculateAdaptiveDecayFactor(totalMessages);
    const normalizedPosition = positionFromEnd / (totalMessages - 1);
    
    return Math.exp(-decayFactor * normalizedPosition * 10);
  }
} 